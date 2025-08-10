import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch staff calendar configurations
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const user_id = searchParams.get('user_id');
    const staff_id = searchParams.get('staff_id');

    if (!user_id) {
      return NextResponse.json(
        {
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    let query = supabase
      .from('staff_calendar_configs')
      .select('*')
      .eq('user_id', user_id);

    if (staff_id) {
      query = query.eq('staff_id', staff_id);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error fetching staff calendar configs:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({ configs: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create staff calendar configuration
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const {
      staff_id,
      user_id,
      default_start_time,
      default_end_time,
      working_days,
      lunch_break_start,
      lunch_break_end,
      buffer_minutes,
      max_advance_days,
      is_configured,
    } = body;

    if (!staff_id || !user_id) {
      return NextResponse.json(
        {
          error: 'Staff ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('staff_calendar_configs')
      .insert({
        staff_id,
        user_id,
        default_start_time: default_start_time || '09:00:00',
        default_end_time: default_end_time || '17:00:00',
        working_days: working_days !== undefined ? working_days : 31, // Mon-Fri default
        lunch_break_start: lunch_break_start || null,
        lunch_break_end: lunch_break_end || null,
        buffer_minutes: buffer_minutes || 15,
        max_advance_days: max_advance_days || 90,
        is_configured: is_configured || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating staff calendar config:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({ config: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update staff calendar configuration
export async function PUT(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const {
      id,
      staff_id,
      user_id,
      default_start_time,
      default_end_time,
      working_days,
      lunch_break_start,
      lunch_break_end,
      buffer_minutes,
      max_advance_days,
      is_configured,
    } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Config ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (staff_id !== undefined) updateData.staff_id = staff_id;
    if (default_start_time !== undefined)
      updateData.default_start_time = default_start_time;
    if (default_end_time !== undefined)
      updateData.default_end_time = default_end_time;
    if (working_days !== undefined) updateData.working_days = working_days;
    if (lunch_break_start !== undefined)
      updateData.lunch_break_start = lunch_break_start;
    if (lunch_break_end !== undefined)
      updateData.lunch_break_end = lunch_break_end;
    if (buffer_minutes !== undefined)
      updateData.buffer_minutes = buffer_minutes;
    if (max_advance_days !== undefined)
      updateData.max_advance_days = max_advance_days;
    if (is_configured !== undefined) updateData.is_configured = is_configured;

    const { data, error } = await supabase
      .from('staff_calendar_configs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating staff calendar config:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({ config: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete staff calendar configuration
export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Config ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('staff_calendar_configs')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error deleting staff calendar config:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
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
