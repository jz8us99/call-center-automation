import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch staff calendars for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const user_id = searchParams.get('user_id');
    const staff_id = searchParams.get('staff_id');
    const year = searchParams.get('year');

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('staff_calendars')
      .select(
        `
        *,
        staff_availability (
          id,
          date,
          start_time,
          end_time,
          is_available,
          is_override,
          reason,
          notes
        )
      `
      )
      .eq('user_id', user_id);

    if (staff_id) {
      query = query.eq('staff_id', staff_id);
    }

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    const { data, error } = await query.order('year', { ascending: true });

    if (error) {
      console.error('Error fetching staff calendars:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ calendars: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or generate staff calendar
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const { user_id, staff_id, year, generate_default } = body;

    if (!user_id || !staff_id || !year) {
      return NextResponse.json(
        {
          error: 'User ID, staff ID, and year are required',
        },
        { status: 400 }
      );
    }

    if (generate_default) {
      // Call the stored procedure to generate default availability
      const { data, error } = await supabase.rpc(
        'generate_default_staff_availability',
        {
          p_staff_id: staff_id,
          p_user_id: user_id,
          p_year: year,
        }
      );

      if (error) {
        console.error('Error generating default availability:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Fetch the created calendar with availability data
      const { data: calendar, error: fetchError } = await supabase
        .from('staff_calendars')
        .select(
          `
          *,
          staff_availability (
            id,
            date,
            start_time,
            end_time,
            is_available,
            is_override,
            reason,
            notes
          )
        `
        )
        .eq('id', data)
        .single();

      if (fetchError) {
        console.error('Error fetching created calendar:', fetchError);
        return NextResponse.json(
          { error: fetchError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ calendar });
    } else {
      // Just create an empty calendar
      const { data, error } = await supabase
        .from('staff_calendars')
        .insert({
          staff_id,
          user_id,
          year,
          default_generated: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating staff calendar:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ calendar: data });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update staff calendar
export async function PUT(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const { id, staff_id, year, user_id } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Calendar ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('staff_calendars')
      .update({
        staff_id,
        year,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating staff calendar:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ calendar: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete staff calendar
export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Calendar ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('staff_calendars')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error deleting staff calendar:', error);
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
