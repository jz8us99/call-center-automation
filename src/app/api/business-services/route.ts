import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createAuthenticatedClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please provide a valid JWT token' },
        { status: 401 }
      );
    }

    // Get JWT token
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '') || '';

    // Create a client with user authentication
    const supabaseWithAuth = await createAuthenticatedClient(token);

    const { searchParams } = new URL(request.url);
    const businessType = searchParams.get('business_type');
    const id = searchParams.get('id');

    if (id) {
      // Get specific service - RLS will ensure user can only see their own services
      const { data: service, error } = await supabaseWithAuth
        .from('business_services')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching service:', error);
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ service });
    }

    // Build query - RLS will automatically restrict users to only see their own data
    let query = supabaseWithAuth
      .from('business_services')
      .select('*')
      .order('service_name', { ascending: true });

    // Add business type filter if provided
    if (businessType) {
      query = query.eq('business_type', businessType);
    }

    const { data: services, error } = await query;

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    return NextResponse.json({ services: services || [] });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please provide a valid JWT token' },
        { status: 401 }
      );
    }

    // Get JWT token
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '') || '';

    // Create a client with user authentication
    const supabaseWithAuth = await createAuthenticatedClient(token);

    const body = await request.json();
    const { service_name, service_description, business_type } = body;

    if (!service_name || !business_type) {
      return NextResponse.json(
        { error: 'service_name and business_type are required' },
        { status: 400 }
      );
    }

    // Insert service - user_id will be automatically set by RLS
    const { data: service, error } = await supabaseWithAuth
      .from('business_services')
      .insert({
        service_name,
        service_description,
        business_type,
        user_id: user.id, // Explicitly set user_id from authenticated user
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service:', error);
      return NextResponse.json(
        { error: 'Failed to create service' },
        { status: 500 }
      );
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please provide a valid JWT token' },
        { status: 401 }
      );
    }

    // Get JWT token
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '') || '';

    // Create a client with user authentication
    const supabaseWithAuth = await createAuthenticatedClient(token);

    const body = await request.json();
    const { id, service_name, service_description } = body;

    if (!id || !service_name) {
      return NextResponse.json(
        { error: 'id and service_name are required' },
        { status: 400 }
      );
    }

    // Update service - RLS will ensure user can only update their own services
    const { data: service, error } = await supabaseWithAuth
      .from('business_services')
      .update({
        service_name,
        service_description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating service:', error);
      return NextResponse.json(
        { error: 'Failed to update service' },
        { status: 500 }
      );
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please provide a valid JWT token' },
        { status: 401 }
      );
    }

    // Get JWT token
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '') || '';

    // Create a client with user authentication
    const supabaseWithAuth = await createAuthenticatedClient(token);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Delete service - RLS will ensure user can only delete their own services
    const { error } = await supabaseWithAuth
      .from('business_services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service:', error);
      return NextResponse.json(
        { error: 'Failed to delete service' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
