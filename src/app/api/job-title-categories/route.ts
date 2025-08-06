import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const jobTitleId = searchParams.get('job_title_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('job_title_categories')
      .select(
        `
        *,
        job_titles (
          id,
          title_name,
          description
        ),
        job_categories (
          id,
          service_type_code,
          category_name,
          description,
          display_order
        )
      `
      )
      .eq('user_id', userId);

    if (jobTitleId) {
      query = query.eq('job_title_id', jobTitleId);
    }

    const { data: mappings, error } = await query.order('created_at', {
      ascending: true,
    });

    if (error) {
      console.error('Error fetching job title categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job title categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mappings: mappings || [],
    });
  } catch (error) {
    console.error('Error in job-title-categories GET:', error);
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
      job_title_id,
      category_id,
      selected_job_types = [],
    } = body;

    if (!user_id || !job_title_id || !category_id) {
      return NextResponse.json(
        { error: 'user_id, job_title_id, and category_id are required' },
        { status: 400 }
      );
    }

    // Create or update mapping
    const { data: mapping, error } = await supabase
      .from('job_title_categories')
      .upsert({
        user_id,
        job_title_id,
        category_id,
        selected_job_types,
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        job_titles (
          id,
          title_name,
          description
        ),
        job_categories (
          id,
          service_type_code,
          category_name,
          description
        )
      `
      )
      .single();

    if (error) {
      console.error('Error creating job title category mapping:', error);
      return NextResponse.json(
        { error: 'Failed to create mapping', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mapping,
      message: 'Job title category mapping created successfully',
    });
  } catch (error) {
    console.error('Error in job-title-categories POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { id, selected_job_types } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Mapping id is required' },
        { status: 400 }
      );
    }

    // Update selected job types for this mapping
    const { data: mapping, error } = await supabase
      .from('job_title_categories')
      .update({
        selected_job_types: selected_job_types || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        job_titles (
          id,
          title_name,
          description
        ),
        job_categories (
          id,
          service_type_code,
          category_name,
          description
        )
      `
      )
      .single();

    if (error) {
      console.error('Error updating job title category mapping:', error);
      return NextResponse.json(
        { error: 'Failed to update mapping', details: error.message },
        { status: 500 }
      );
    }

    if (!mapping) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
    }

    return NextResponse.json({
      mapping,
      message: 'Job title category mapping updated successfully',
    });
  } catch (error) {
    console.error('Error in job-title-categories PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
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
        { error: 'Mapping id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('job_title_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting job title category mapping:', error);
      return NextResponse.json(
        { error: 'Failed to delete mapping', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Job title category mapping deleted successfully',
    });
  } catch (error) {
    console.error('Error in job-title-categories DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
