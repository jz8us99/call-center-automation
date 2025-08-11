import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staff_id');
    const userId = searchParams.get('user_id');

    if (!staffId || !userId) {
      return NextResponse.json(
        { error: 'staff_id and user_id are required' },
        { status: 400 }
      );
    }

    // Get staff job assignments with job type details
    const { data: assignments, error } = await supabase
      .from('staff_job_assignments')
      .select(
        `
        *,
        job_types (
          id,
          job_name,
          job_description,
          default_duration_minutes,
          default_price,
          job_categories (
            category_name
          )
        ),
        staff_members!inner (
          id,
          user_id
        )
      `
      )
      .eq('staff_id', staffId)
      .eq('staff_members.user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching staff job assignments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch staff job assignments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      assignments: assignments || [],
    });
  } catch (error) {
    console.error('Error in staff-job-assignments GET:', error);
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
    const { supabaseWithAuth: supabase } = authResult;
    const body = await request.json();

    const {
      staff_id,
      job_type_id,
      custom_duration_minutes,
      custom_price,
      proficiency_level,
      notes,
      user_id, // for authorization
    } = body;

    if (!staff_id || !job_type_id || !user_id) {
      return NextResponse.json(
        { error: 'staff_id, job_type_id, and user_id are required' },
        { status: 400 }
      );
    }

    // Verify the staff member belongs to the user
    const { data: staffMember, error: staffError } = await supabase
      .from('staff_members')
      .select('id')
      .eq('id', staff_id)
      .eq('user_id', user_id)
      .single();

    if (staffError || !staffMember) {
      return NextResponse.json(
        { error: 'Staff member not found or access denied' },
        { status: 404 }
      );
    }

    // Create the assignment
    const { data: assignment, error } = await supabase
      .from('staff_job_assignments')
      .insert({
        staff_id,
        job_type_id,
        custom_duration_minutes: custom_duration_minutes || null,
        custom_price: custom_price || null,
        proficiency_level: proficiency_level || 'intermediate',
        notes: notes || null,
        is_active: true,
      })
      .select(
        `
        *,
        job_types (
          id,
          job_name,
          job_description,
          default_duration_minutes,
          default_price,
          job_categories (
            category_name
          )
        )
      `
      )
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          { error: 'This staff member is already assigned to this job type' },
          { status: 409 }
        );
      }
      console.error('Error creating staff job assignment:', error);
      return NextResponse.json(
        {
          error: 'Failed to create staff job assignment',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      assignment: assignment,
      message: 'Staff job assignment created successfully',
    });
  } catch (error) {
    console.error('Error in staff-job-assignments POST:', error);
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
    const { supabaseWithAuth: supabase } = authResult;
    const body = await request.json();

    const {
      id,
      custom_duration_minutes,
      custom_price,
      proficiency_level,
      notes,
      user_id, // for authorization
    } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        { error: 'Assignment id and user_id are required' },
        { status: 400 }
      );
    }

    // Update the assignment (with authorization check)
    const { data: assignment, error } = await supabase
      .from('staff_job_assignments')
      .update({
        custom_duration_minutes: custom_duration_minutes || null,
        custom_price: custom_price || null,
        proficiency_level: proficiency_level || 'intermediate',
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('staff_members.user_id', user_id) // Authorization check through join
      .select(
        `
        *,
        job_types (
          id,
          job_name,
          job_description,
          default_duration_minutes,
          default_price,
          job_categories (
            category_name
          )
        )
      `
      )
      .single();

    if (error) {
      console.error('Error updating staff job assignment:', error);
      return NextResponse.json(
        {
          error: 'Failed to update staff job assignment',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      assignment: assignment,
      message: 'Staff job assignment updated successfully',
    });
  } catch (error) {
    console.error('Error in staff-job-assignments PUT:', error);
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
    const { supabaseWithAuth: supabase } = authResult;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('user_id');

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Assignment id and user_id are required' },
        { status: 400 }
      );
    }

    // Soft delete the assignment (with authorization check)
    const { data: assignment, error } = await supabase
      .from('staff_job_assignments')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('staff_members.user_id', userId) // Authorization check through join
      .select()
      .single();

    if (error) {
      console.error('Error deleting staff job assignment:', error);
      return NextResponse.json(
        {
          error: 'Failed to delete staff job assignment',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Staff job assignment deleted successfully',
    });
  } catch (error) {
    console.error('Error in staff-job-assignments DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
