import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const staffId = searchParams.get('staff_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Build query for staff members
    let query = supabase
      .from('staff_members')
      .select('*')
      .eq('user_id', userId)
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
    console.error('Error in staff GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const {
      user_id,
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

    if (!user_id || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'user_id, first_name, and last_name are required' },
        { status: 400 }
      );
    }

    // Insert new staff member
    const { data: staff, error } = await supabase
      .from('staff_members')
      .insert({
        user_id,
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
        { error: 'Failed to create staff member', details: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      staff: staff,
      message: 'Staff member created successfully',
    });
  } catch (error) {
    console.error('Error in staff POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const {
      id,
      user_id,
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

    // Update staff member
    const { data: staff, error } = await supabase
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
      .eq('user_id', user_id) // Ensure user can only update their own staff
      .select('*')
      .single();

    if (error) {
      console.error('Error updating staff member:', error);
      return NextResponse.json(
        { error: 'Failed to update staff member', details: (error as Error).message },
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
    console.error('Error in staff PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

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

    // Soft delete (set is_active to false)
    const { data: staff, error } = await supabase
      .from('staff_members')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only delete their own staff
      .select()
      .single();

    if (error) {
      console.error('Error deleting staff member:', error);
      return NextResponse.json(
        { error: 'Failed to delete staff member', details: (error as Error).message },
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
    console.error('Error in staff DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
