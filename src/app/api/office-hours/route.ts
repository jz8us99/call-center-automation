import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch office hours for a business
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const user_id = searchParams.get('user_id');
    const business_id = searchParams.get('business_id');

    if (!user_id) {
      return NextResponse.json(
        {
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('office_hours')
      .select('*')
      .eq('user_id', user_id)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Error fetching office hours:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ office_hours: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update office hours
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const { user_id, business_id, office_hours } = body;

    if (!user_id || !business_id || !Array.isArray(office_hours)) {
      return NextResponse.json(
        {
          error: 'User ID, business ID, and office hours array are required',
        },
        { status: 400 }
      );
    }

    // Validate office hours format
    for (const hour of office_hours) {
      if (
        typeof hour.day_of_week !== 'number' ||
        hour.day_of_week < 0 ||
        hour.day_of_week > 6
      ) {
        return NextResponse.json(
          {
            error: 'Invalid day_of_week. Must be 0-6 (Sunday-Saturday)',
          },
          { status: 400 }
        );
      }

      // Only validate times for active days
      if (hour.is_active && (!hour.start_time || !hour.end_time)) {
        return NextResponse.json(
          {
            error: 'Start time and end time are required for active days',
          },
          { status: 400 }
        );
      }
    }

    // Delete existing office hours for this business
    const { error: deleteError } = await supabase
      .from('office_hours')
      .delete()
      .eq('user_id', user_id)
      .eq('business_id', business_id);

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error('Error deleting existing office hours:', deleteError);
    }

    // Insert new office hours
    const insertData = office_hours.map(hour => ({
      user_id,
      business_id,
      day_of_week: hour.day_of_week,
      start_time: hour.start_time,
      end_time: hour.end_time,
      is_active: hour.is_active !== false,
    }));

    console.log('Attempting to insert office hours:', insertData);

    const { data, error } = await supabase
      .from('office_hours')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Error creating office hours:', error);

      if (error.code === '42P01') {
        return NextResponse.json(
          {
            error:
              'office_hours table does not exist. Please create the table first using the office-hours-schema.sql file.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: `Database error: ${error.message} (Code: ${error.code})`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ office_hours: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update specific office hours
export async function PUT(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const { id, user_id, day_of_week, start_time, end_time, is_active } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Office hours ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (day_of_week !== undefined) updateData.day_of_week = day_of_week;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('office_hours')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating office hours:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ office_hours: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete office hours
export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Office hours ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('office_hours')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error deleting office hours:', error);
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
