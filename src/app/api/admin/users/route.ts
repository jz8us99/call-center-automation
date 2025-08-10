'use server';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/admin/users - Fetch users with search functionality
export async function GET(request: NextRequest) {
  try {
    // Permission verification handled by middleware
    const { searchParams } = new URL(request.url);

    // Get search parameters
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '4'); // Default show 4 users

    // Build query
    let query = supabaseAdmin.from('profiles').select(
      `
        id,
        user_id,
        email,
        full_name,
        phone_number,
        role,
        pricing_tier,
        agent_types_allowed,
        is_active,
        created_at,
        updated_at,
        business_name,
        business_type
      `
    );

    // If search parameters exist, add LIKE query conditions
    if (search.trim()) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Set sorting and limit
    query = query.order('created_at', { ascending: false }).limit(limit);

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      search: search,
      limit: limit,
      total: (users || []).length,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      full_name,
      phone_number,
      role,
      pricing_tier,
      agent_types_allowed,
      business_name,
      business_type,
      is_active,
    } = body;

    // Permission verification handled by middleware

    // Use existing admin client that bypasses RLS

    // Create new user in auth.users first (this would typically be done through Supabase Auth)
    // For now, we'll create a profile entry without auth user
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({
        email,
        full_name,
        phone_number,
        role: role || 'user',
        pricing_tier: pricing_tier || 'basic',
        agent_types_allowed: agent_types_allowed || ['inbound_call'],
        business_name,
        business_type,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
