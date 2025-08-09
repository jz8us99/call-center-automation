'use server';

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createAuthenticatedClient } from '@/lib/supabase';

// GET /api/admin/users - Fetch all users
export async function GET(request: NextRequest) {
  try {
    // Authenticate user using the proper method
    const user = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    if (!user.is_super_admin && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get JWT token from authorization header
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '') || '';

    // Create authenticated Supabase client with user's JWT token
    const supabaseWithAuth = await createAuthenticatedClient(token);

    // Fetch all users from profiles table using authenticated client
    // Start with basic columns that should exist
    let { data: users, error: usersError } = await supabaseWithAuth
      .from('profiles')
      .select(
        `
        id,
        email,
        full_name,
        created_at
      `
      )
      .order('created_at', { ascending: false });

    // If basic query fails, try with just essential columns
    if (usersError) {
      const { data: basicUsers, error: basicError } = await supabaseWithAuth
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      users = basicUsers;
      usersError = basicError;
    }

    if (usersError) {
      console.error('Error fetching users:', usersError);
      // Return empty result instead of error to prevent 500
      return NextResponse.json({
        users: [],
        warning: 'Could not fetch users: ' + usersError.message,
      });
    }

    return NextResponse.json({ users: users || [] });
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

    // Authenticate user using the proper method
    const user = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    if (!user.is_super_admin && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get JWT token from authorization header
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '') || '';

    // Create authenticated Supabase client with user's JWT token
    const supabaseWithAuth = await createAuthenticatedClient(token);

    // Create new user in auth.users first (this would typically be done through Supabase Auth)
    // For now, we'll create a profile entry without auth user
    const { data: newUser, error: createError } = await supabaseWithAuth
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
