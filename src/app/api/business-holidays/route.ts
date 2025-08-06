import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch business holidays
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const user_id = searchParams.get('user_id');
    const business_id = searchParams.get('business_id');
    const year = searchParams.get('year');

    if (!user_id && !business_id) {
      return NextResponse.json(
        {
          error: 'Either user_id or business_id is required',
        },
        { status: 400 }
      );
    }

    let query = supabase.from('business_holidays').select('*');

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (business_id) {
      query = query.eq('business_id', business_id);
    }

    if (year) {
      query = query
        .gte('holiday_date', `${year}-01-01`)
        .lte('holiday_date', `${year}-12-31`);
    }

    const { data, error } = await query.order('holiday_date', {
      ascending: true,
    });

    if (error) {
      console.error('Error fetching business holidays:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ holidays: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create business holiday
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const {
      business_id,
      user_id,
      holiday_date,
      holiday_name,
      description,
      is_recurring,
    } = body;

    if (!business_id || !user_id || !holiday_date || !holiday_name) {
      return NextResponse.json(
        {
          error:
            'Business ID, user ID, holiday date, and holiday name are required',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('business_holidays')
      .insert({
        business_id,
        user_id,
        holiday_date,
        holiday_name,
        description: description || null,
        is_recurring: is_recurring || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating business holiday:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ holiday: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update business holiday
export async function PUT(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const {
      id,
      holiday_date,
      holiday_name,
      description,
      is_recurring,
      user_id,
    } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Holiday ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('business_holidays')
      .update({
        holiday_date,
        holiday_name,
        description,
        is_recurring,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating business holiday:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ holiday: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete business holiday
export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Holiday ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('business_holidays')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error deleting business holiday:', error);
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
