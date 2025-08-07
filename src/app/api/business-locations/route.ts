import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

// GET - Fetch business locations
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const businessId = searchParams.get('business_id');

    if (!userId && !businessId) {
      return NextResponse.json(
        { error: 'user_id or business_id is required' },
        { status: 400 }
      );
    }

    let query = supabase.from('business_locations').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { data: locations, error } = await query
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching business locations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch business locations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ locations: locations || [] });
  } catch (error) {
    console.error('Error in business-locations GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new business location
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const {
      business_id,
      user_id,
      location_name,
      is_primary = false,
      street_address,
      city,
      state,
      postal_code,
      country = 'US',
      phone,
      email,
      website,
      timezone = 'America/New_York',
      business_hours,
    } = body;

    if (!business_id || !user_id || !location_name) {
      return NextResponse.json(
        { error: 'business_id, user_id, and location_name are required' },
        { status: 400 }
      );
    }

    // If this is being set as primary, unset other primary locations
    if (is_primary) {
      await supabase
        .from('business_locations')
        .update({ is_primary: false })
        .eq('business_id', business_id);
    }

    // Create the location
    const { data: location, error } = await supabase
      .from('business_locations')
      .insert({
        business_id,
        user_id,
        location_name,
        is_primary,
        street_address,
        city,
        state,
        postal_code,
        country,
        phone,
        email,
        website,
        timezone,
        business_hours: business_hours ? JSON.stringify(business_hours) : '{}',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating business location:', error);
      return NextResponse.json(
        { error: 'Failed to create business location', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ location });
  } catch (error) {
    console.error('Error in business-locations POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update business location
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const {
      id,
      user_id,
      location_name,
      is_primary,
      street_address,
      city,
      state,
      postal_code,
      country,
      phone,
      email,
      website,
      timezone,
      business_hours,
      is_active,
    } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        { error: 'id and user_id are required' },
        { status: 400 }
      );
    }

    // Get current location to check business_id
    const { data: currentLocation } = await supabase
      .from('business_locations')
      .select('business_id')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (!currentLocation) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // If this is being set as primary, unset other primary locations
    if (is_primary) {
      await supabase
        .from('business_locations')
        .update({ is_primary: false })
        .eq('business_id', currentLocation.business_id);
    }

    // Update the location
    const { data: location, error } = await supabase
      .from('business_locations')
      .update({
        location_name,
        is_primary,
        street_address,
        city,
        state,
        postal_code,
        country,
        phone,
        email,
        website,
        timezone,
        business_hours: business_hours ? JSON.stringify(business_hours) : undefined,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating business location:', error);
      return NextResponse.json(
        { error: 'Failed to update business location', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ location });
  } catch (error) {
    console.error('Error in business-locations PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete business location
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('user_id');

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id and user_id are required' },
        { status: 400 }
      );
    }

    // Check if this is the primary location
    const { data: location } = await supabase
      .from('business_locations')
      .select('is_primary, business_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Don't allow deletion of primary location if there are other locations
    if (location.is_primary) {
      const { data: otherLocations } = await supabase
        .from('business_locations')
        .select('id')
        .eq('business_id', location.business_id)
        .neq('id', id)
        .eq('is_active', true);

      if (otherLocations && otherLocations.length > 0) {
        return NextResponse.json(
          { error: 'Cannot delete primary location. Set another location as primary first.' },
          { status: 400 }
        );
      }
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('business_locations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting business location:', error);
      return NextResponse.json(
        { error: 'Failed to delete business location' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in business-locations DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}