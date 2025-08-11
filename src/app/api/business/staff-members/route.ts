import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth } = authResult;

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staff_id');

    // Build query for staff members - RLS will automatically restrict to user's data
    let query = supabaseWithAuth
      .from('staff_members')
      .select('*')
      .eq('is_active', true);

    // If staff_id is provided, filter for specific staff member
    if (staffId) {
      query = query.eq('id', staffId);
    }

    query = query.order('created_at', { ascending: true });

    const { data: staff, error } = await query;

    if (error) {
      console.error('Error fetching staff:', error);
      return NextResponse.json(
        { error: 'Failed to fetch staff members' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      staff: staff || [],
    });
  } catch (error) {
    console.error('Error in staff-members GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth } = authResult;

    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      gender,
      job_title,
      job_category_ids,
      selected_job_types,
      schedule,
      specialties,
    } = body;

    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: 'first_name and last_name are required' },
        { status: 400 }
      );
    }

    // Insert new staff member with authenticated user's ID
    const { data: staff, error } = await supabaseWithAuth
      .from('staff_members')
      .insert({
        user_id: user.id, // Use authenticated user's ID
        first_name,
        last_name,
        email,
        phone,
        gender,
        title: job_title,
        job_categories: job_category_ids || [],
        job_types: selected_job_types || [],
        schedule: schedule || {},
        specialties: specialties || [],
        is_active: true,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating staff member:', error);
      return NextResponse.json(
        {
          error: 'Failed to create staff member',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      staff: staff,
      message: 'Staff member created successfully',
    });
  } catch (error) {
    console.error('Error in staff-members POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth } = authResult;

    const body = await request.json();
    const {
      id,
      first_name,
      last_name,
      email,
      phone,
      gender,
      job_title,
      job_category_ids,
      selected_job_types,
      schedule,
      specialties,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Staff member id is required' },
        { status: 400 }
      );
    }

    // Update staff member - RLS will ensure user can only update their own staff
    const { data: staff, error } = await supabaseWithAuth
      .from('staff_members')
      .update({
        first_name,
        last_name,
        email,
        phone,
        gender,
        title: job_title,
        job_categories: job_category_ids || [],
        job_types: selected_job_types || [],
        schedule: schedule || {},
        specialties: specialties || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating staff member:', error);
      return NextResponse.json(
        {
          error: 'Failed to update staff member',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      staff: staff,
      message: 'Staff member updated successfully',
    });
  } catch (error) {
    console.error('Error in staff-members PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Soft delete (set is_active to false) - RLS will ensure user can only delete their own staff
    const { data: staff, error } = await supabaseWithAuth
      .from('staff_members')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting staff member:', error);
      return NextResponse.json(
        {
          error: 'Failed to delete staff member',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Staff member deleted successfully',
    });
  } catch (error) {
    console.error('Error in staff-members DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
