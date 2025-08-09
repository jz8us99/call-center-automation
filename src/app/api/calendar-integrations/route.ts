import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch calendar integrations for a staff member
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const staff_id = searchParams.get('staff_id');
    const user_id = searchParams.get('user_id');
    const provider = searchParams.get('provider');

    if (!user_id) {
      return NextResponse.json(
        {
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    let query = supabase
      .from('calendar_integrations')
      .select(
        'id, staff_id, provider, sync_enabled, last_synced_at, settings, created_at, updated_at'
      )
      .eq('user_id', user_id);

    if (staff_id) {
      query = query.eq('staff_id', staff_id);
    }

    if (provider) {
      query = query.eq('provider', provider);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error fetching calendar integrations:', error);
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ integrations: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create calendar integration
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const {
      staff_id,
      user_id,
      provider,
      access_token,
      refresh_token,
      token_expires_at,
      settings,
    } = body;

    if (!staff_id || !user_id || !provider) {
      return NextResponse.json(
        {
          error: 'Staff ID, user ID, and provider are required',
        },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = ['google', 'outlook', 'calendly'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        {
          error: 'Provider must be one of: google, outlook, calendly',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('calendar_integrations')
      .insert({
        staff_id,
        user_id,
        provider,
        access_token,
        refresh_token,
        token_expires_at,
        sync_enabled: true,
        settings: settings || {},
        last_synced_at: new Date().toISOString(),
      })
      .select(
        'id, staff_id, provider, sync_enabled, last_synced_at, settings, created_at, updated_at'
      )
      .single();

    if (error) {
      console.error('Error creating calendar integration:', error);
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ integration: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update calendar integration
export async function PUT(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const {
      id,
      user_id,
      access_token,
      refresh_token,
      token_expires_at,
      sync_enabled,
      settings,
      last_synced_at,
    } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Integration ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (access_token !== undefined) updateData.access_token = access_token;
    if (refresh_token !== undefined) updateData.refresh_token = refresh_token;
    if (token_expires_at !== undefined)
      updateData.token_expires_at = token_expires_at;
    if (sync_enabled !== undefined) updateData.sync_enabled = sync_enabled;
    if (settings !== undefined) updateData.settings = settings;
    if (last_synced_at !== undefined)
      updateData.last_synced_at = last_synced_at;

    const { data, error } = await supabase
      .from('calendar_integrations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select(
        'id, staff_id, provider, sync_enabled, last_synced_at, settings, created_at, updated_at'
      )
      .single();

    if (error) {
      console.error('Error updating calendar integration:', error);
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ integration: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete calendar integration
export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Integration ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('calendar_integrations')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error deleting calendar integration:', error);
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
