import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const serviceTypeCode = searchParams.get('service_type_code');
    if (!serviceTypeCode) {
      return NextResponse.json(
        { error: 'service_type_code is required' },
        { status: 400 }
      );
    }

    // Get job categories for the specified service type
    const query = supabase
      .from('job_categories')
      .select('*')
      .eq('service_type_code', serviceTypeCode)
      .eq('is_active', true)
      .order('category_name', { ascending: true });

    const { data: categories, error } = await query;

    if (error) {
      console.error('Error fetching job categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      categories: categories || [],
    });
  } catch (error) {
    console.error('Error in job-categories GET:', error);
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

    const { service_type_code, category_name, description } = body;

    if (!service_type_code || !category_name) {
      return NextResponse.json(
        { error: 'service_type_code and category_name are required' },
        { status: 400 }
      );
    }

    // Create new job category
    const { data: category, error } = await supabase
      .from('job_categories')
      .insert({
        service_type_code,
        category_name: category_name.trim(),
        description: description?.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          {
            error:
              'A job category with this name already exists for this service type',
          },
          { status: 409 }
        );
      }
      console.error('Error creating job category:', error);
      return NextResponse.json(
        { error: 'Failed to create job category', details: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      category,
      message: 'Job category created successfully',
    });
  } catch (error) {
    console.error('Error in job-categories POST:', error);
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

    const { id, category_name, description, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Category id is required' },
        { status: 400 }
      );
    }

    // Update job category
    const { data: category, error } = await supabase
      .from('job_categories')
      .update({
        category_name: category_name?.trim(),
        description: description?.trim() || null,
        is_active: is_active !== undefined ? is_active : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating job category:', error);
      return NextResponse.json(
        { error: 'Failed to update job category', details: (error as Error).message },
        { status: 500 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Job category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      category,
      message: 'Job category updated successfully',
    });
  } catch (error) {
    console.error('Error in job-categories PUT:', error);
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

    if (!id) {
      return NextResponse.json(
        { error: 'Category id is required' },
        { status: 400 }
      );
    }

    // Check if any job types are using this category
    const { data: jobTypes, error: checkError } = await supabase
      .from('job_types')
      .select('id')
      .eq('category_id', id)
      .eq('is_active', true);

    if (checkError) {
      console.error('Error checking job types:', checkError);
      return NextResponse.json(
        { error: 'Failed to check job types usage' },
        { status: 500 }
      );
    }

    if (jobTypes && jobTypes.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that has job types assigned to it' },
        { status: 409 }
      );
    }

    // Soft delete (set is_active to false)
    const { data: category, error } = await supabase
      .from('job_categories')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting job category:', error);
      return NextResponse.json(
        { error: 'Failed to delete job category', details: (error as Error).message },
        { status: 500 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Job category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Job category deleted successfully',
    });
  } catch (error) {
    console.error('Error in job-categories DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
