'use server';

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createAuthenticatedClient } from '@/lib/supabase';

// GET /api/admin/calls - Fetch call logs with optional user filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Optional user filter
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify user authentication using the app's authentication system
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please provide a valid JWT token' },
        { status: 401 }
      );
    }

    // Check if user is admin or super admin
    if (user.role !== 'admin' && !user.is_super_admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get JWT token from authorization header
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '') || '';

    // Create authenticated Supabase client with user's JWT token
    // This allows RLS policies to work correctly for admin users
    const supabaseWithAuth = await createAuthenticatedClient(token);

    // Build the query for call logs using the authenticated client
    // Try to fetch from call_logs table first, then fallback to customer_call_logs
    let query = supabaseWithAuth
      .from('call_logs')
      .select(
        `
        id,
        user_id,
        phone_number,
        call_status,
        started_at,
        ended_at,
        duration,
        call_summary,
        created_at
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply user filter if specified
    if (userId && userId !== 'all') {
      query = query.eq('user_id', userId);
    }

    let { data: calls, error: callsError, count } = await query;

    // If call_logs table doesn't exist, try customer_call_logs
    if (callsError && callsError.code === 'PGRST116') {
      query = supabaseWithAuth
        .from('customer_call_logs')
        .select(
          `
          id,
          user_id,
          phone_number,
          call_status,
          started_at,
          ended_at,
          duration,
          call_summary,
          created_at
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply user filter if specified
      if (userId && userId !== 'all') {
        query = query.eq('user_id', userId);
      }

      const result = await query;
      calls = result.data;
      callsError = result.error;
      count = result.count;
    }

    if (callsError) {
      console.error('Error fetching calls:', callsError);
      // Return empty result instead of error to prevent 500
      return NextResponse.json({
        calls: [],
        totalCount: 0,
        currentOffset: offset,
        limit: limit,
        warning: 'Could not fetch calls: ' + callsError.message,
      });
    }

    // For now, return calls without profile data to test basic functionality
    return NextResponse.json({
      calls: calls || [],
      totalCount: count || 0,
      currentOffset: offset,
      limit: limit,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
