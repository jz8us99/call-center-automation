import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

// GET - Fetch holidays for a business
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const { searchParams } = new URL(request.url);

    const user_id = searchParams.get('user_id');
    const business_id = searchParams.get('business_id');
    const year = searchParams.get('year');

    if (!user_id) {
      return NextResponse.json(
        {
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    let query = supabase.from('holidays').select('*').eq('user_id', user_id);

    if (business_id) {
      query = query.eq('business_id', business_id);
    }

    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte('holiday_date', startDate).lte('holiday_date', endDate);
    }

    const { data, error } = await query.order('holiday_date', {
      ascending: true,
    });

    if (error) {
      console.error('Error fetching holidays:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
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

// POST - Create holiday
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const body = await request.json();

    const {
      user_id,
      business_id,
      holiday_date,
      holiday_name,
      description,
      is_recurring,
    } = body;

    if (!user_id || !business_id || !holiday_date || !holiday_name) {
      return NextResponse.json(
        {
          error:
            'User ID, business ID, holiday date, and holiday name are required',
        },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(holiday_date)) {
      return NextResponse.json(
        {
          error: 'Holiday date must be in YYYY-MM-DD format',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('holidays')
      .insert({
        user_id,
        business_id,
        holiday_date,
        holiday_name,
        description: description || null,
        is_recurring: is_recurring || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating holiday:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
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

// PUT - Update holiday
export async function PUT(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const body = await request.json();

    const {
      id,
      user_id,
      holiday_date,
      holiday_name,
      description,
      is_recurring,
    } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Holiday ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (holiday_date !== undefined) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(holiday_date)) {
        return NextResponse.json(
          {
            error: 'Holiday date must be in YYYY-MM-DD format',
          },
          { status: 400 }
        );
      }
      updateData.holiday_date = holiday_date;
    }

    if (holiday_name !== undefined) updateData.holiday_name = holiday_name;
    if (description !== undefined) updateData.description = description;
    if (is_recurring !== undefined) updateData.is_recurring = is_recurring;

    const { data, error } = await supabase
      .from('holidays')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating holiday:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
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

// DELETE - Delete holiday
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
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
      .from('holidays')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error deleting holiday:', error);
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
