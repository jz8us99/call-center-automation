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
    const serviceTypeCode = searchParams.get('service_type_code');
    const userId = searchParams.get('user_id');
    const categoryId = searchParams.get('category_id');

    if (!serviceTypeCode) {
      return NextResponse.json(
        { error: 'service_type_code is required' },
        { status: 400 }
      );
    }

    // Build query for job types with categories
    let query = supabase
      .from('job_types')
      .select(
        `
        *,
        job_categories (
          id,
          category_name,
          description
        )
      `
      )
      .eq('service_type_code', serviceTypeCode)
      .eq('is_active', true);

    // Filter by category if specified
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Filter by user ownership or system defaults
    if (userId) {
      query = query.or(`is_system_default.eq.true,user_id.eq.${userId}`);
    } else {
      query = query.eq('is_system_default', true);
    }

    // Order by job name
    query = query.order('job_name', { ascending: true });

    const { data: jobTypes, error } = await query;

    if (error) {
      console.error('Error fetching job types:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job types' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      job_types: jobTypes || [],
    });
  } catch (error) {
    console.error('Error in job-types GET:', error);
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
      service_type_code,
      category_id,
      user_id,
      job_name,
      job_description,
      default_duration_minutes,
      default_price,
      price_currency,
    } = body;

    if (!service_type_code || !job_name || !user_id) {
      return NextResponse.json(
        { error: 'service_type_code, job_name, and user_id are required' },
        { status: 400 }
      );
    }

    // Insert new custom job type
    const { data: jobType, error } = await supabase
      .from('job_types')
      .insert({
        service_type_code,
        category_id: category_id || null,
        user_id,
        job_name,
        job_description: job_description || null,
        default_duration_minutes: default_duration_minutes || 30,
        default_price: default_price || null,
        price_currency: price_currency || 'USD',
        is_system_default: false, // Custom job type
        is_active: true,
      })
      .select(
        `
        *,
        job_categories (
          id,
          category_name,
          description
        )
      `
      )
      .single();

    if (error) {
      console.error('Error creating job type:', error);
      return NextResponse.json(
        {
          error: 'Failed to create job type',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      job_type: jobType,
      message: 'Job type created successfully',
    });
  } catch (error) {
    console.error('Error in job-types POST:', error);
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
      job_name,
      job_description,
      default_duration_minutes,
      default_price,
      price_currency,
      category_id,
      is_active,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Job type id is required' },
        { status: 400 }
      );
    }

    // Update job type
    const { data: jobType, error } = await supabase
      .from('job_types')
      .update({
        job_name: job_name || null,
        job_description: job_description || null,
        default_duration_minutes: default_duration_minutes || 30,
        default_price: default_price || null,
        price_currency: price_currency || 'USD',
        category_id: category_id || null,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        job_categories (
          id,
          category_name,
          description
        )
      `
      )
      .single();

    if (error) {
      console.error('Error updating job type:', error);
      return NextResponse.json(
        {
          error: 'Failed to update job type',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }

    if (!jobType) {
      return NextResponse.json(
        { error: 'Job type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      job_type: jobType,
      message: 'Job type updated successfully',
    });
  } catch (error) {
    console.error('Error in job-types PUT:', error);
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

    if (!id) {
      return NextResponse.json(
        { error: 'Job type id is required' },
        { status: 400 }
      );
    }

    // Soft delete (set is_active to false)
    const { data: jobType, error } = await supabase
      .from('job_types')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting job type:', error);
      return NextResponse.json(
        {
          error: 'Failed to delete job type',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }

    if (!jobType) {
      return NextResponse.json(
        { error: 'Job type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Job type deleted successfully',
    });
  } catch (error) {
    console.error('Error in job-types DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
