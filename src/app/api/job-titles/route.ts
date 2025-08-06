import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Get user-specific job titles
    const { data: jobTitles, error } = await supabase
      .from('job_titles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching job titles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job titles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      job_titles: jobTitles || [],
    });
  } catch (error) {
    console.error('Error in job-titles GET:', error);
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

    const { user_id, title_name, description } = body;

    if (!user_id || !title_name) {
      return NextResponse.json(
        { error: 'user_id and title_name are required' },
        { status: 400 }
      );
    }

    // Create new job title
    const { data: jobTitle, error } = await supabase
      .from('job_titles')
      .insert({
        user_id,
        title_name: title_name.trim(),
        description: description?.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          { error: 'A job title with this name already exists' },
          { status: 409 }
        );
      }
      console.error('Error creating job title:', error);
      return NextResponse.json(
        { error: 'Failed to create job title', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      job_title: jobTitle,
      message: 'Job title created successfully',
    });
  } catch (error) {
    console.error('Error in job-titles POST:', error);
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

    const { id, title_name, description, required_qualifications, is_active } =
      body;

    if (!id) {
      return NextResponse.json(
        { error: 'Job title id is required' },
        { status: 400 }
      );
    }

    // Update job title
    const { data: jobTitle, error } = await supabase
      .from('job_titles')
      .update({
        title_name: title_name?.trim(),
        description: description?.trim() || null,
        required_qualifications: required_qualifications || [],
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating job title:', error);
      return NextResponse.json(
        { error: 'Failed to update job title', details: error.message },
        { status: 500 }
      );
    }

    if (!jobTitle) {
      return NextResponse.json(
        { error: 'Job title not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      job_title: jobTitle,
      message: 'Job title updated successfully',
    });
  } catch (error) {
    console.error('Error in job-titles PUT:', error);
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
        { error: 'Job title id is required' },
        { status: 400 }
      );
    }

    // Soft delete (set is_active to false)
    const { data: jobTitle, error } = await supabase
      .from('job_titles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting job title:', error);
      return NextResponse.json(
        { error: 'Failed to delete job title', details: error.message },
        { status: 500 }
      );
    }

    if (!jobTitle) {
      return NextResponse.json(
        { error: 'Job title not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Job title deleted successfully',
    });
  } catch (error) {
    console.error('Error in job-titles DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
