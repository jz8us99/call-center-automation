import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch staff availability for a date range
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const staff_id = searchParams.get('staff_id');
    const user_id = searchParams.get('user_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    if (!staff_id || !user_id) {
      return NextResponse.json(
        {
          error: 'Staff ID and user ID are required',
        },
        { status: 400 }
      );
    }

    let query = supabase
      .from('staff_availability')
      .select('*')
      .eq('staff_id', staff_id)
      .eq('user_id', user_id);

    if (start_date) {
      query = query.gte('date', start_date);
    }

    if (end_date) {
      query = query.lte('date', end_date);
    }

    const { data, error } = await query.order('date', {
      ascending: true,
    });

    if (error) {
      console.error('Error fetching staff availability:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ availability: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create staff availability record
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const {
      staff_id,
      user_id,
      availability_date,
      start_time,
      end_time,
      is_available,
      is_override,
      reason,
      notes,
      source,
    } = body;

    if (!staff_id || !user_id || !availability_date) {
      return NextResponse.json(
        {
          error: 'Staff ID, user ID, and availability date are required',
        },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(availability_date)) {
      return NextResponse.json(
        {
          error: 'Availability date must be in YYYY-MM-DD format',
        },
        { status: 400 }
      );
    }

    // If available, start_time and end_time are required
    if (is_available !== false && (!start_time || !end_time)) {
      return NextResponse.json(
        {
          error: 'Start time and end time are required when available',
        },
        { status: 400 }
      );
    }

    // First, find the calendar_id for this staff member and year
    const year = new Date(availability_date).getFullYear();
    const { data: calendar, error: calendarError } = await supabase
      .from('staff_calendars')
      .select('id')
      .eq('staff_id', staff_id)
      .eq('user_id', user_id)
      .eq('year', year)
      .single();

    let calendarId = calendar?.id;

    // If no calendar exists, try to create one
    if (!calendarId) {
      const { data: newCalendar, error: createError } = await supabase
        .from('staff_calendars')
        .insert({
          staff_id,
          user_id,
          year,
          default_generated: false,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating staff calendar:', createError);
        return NextResponse.json(
          {
            error: 'Could not create staff calendar for this year.',
          },
          { status: 500 }
        );
      }

      calendarId = newCalendar.id;
    }

    const { data, error } = await supabase
      .from('staff_availability')
      .insert({
        calendar_id: calendarId,
        staff_id,
        date: availability_date, // Map to the new column name
        start_time: start_time || null,
        end_time: end_time || null,
        is_available: is_available !== false,
        is_override: is_override || false,
        reason: reason || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating staff availability:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ availability: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update staff availability record
export async function PUT(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const {
      id,
      user_id,
      start_time,
      end_time,
      is_available,
      is_override,
      reason,
      notes,
      source,
    } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Availability ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (is_available !== undefined) updateData.is_available = is_available;
    if (is_override !== undefined) updateData.is_override = is_override;
    if (reason !== undefined) updateData.reason = reason;
    if (notes !== undefined) updateData.notes = notes;
    if (source !== undefined) updateData.source = source;

    const { data, error } = await supabase
      .from('staff_availability')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating staff availability:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ availability: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete staff availability record
export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Availability ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('staff_availability')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error deleting staff availability:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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
