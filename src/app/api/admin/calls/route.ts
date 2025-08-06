'use server';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/calls - Fetch call logs with optional user filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Optional user filter
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .single();

    if (
      profileError ||
      !profile?.role ||
      (profile.role !== 'admin' && !profile.is_super_admin)
    ) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Build the query for call logs
    let query = supabase
      .from('customer_call_logs')
      .select(
        `
        *,
        profiles!customer_call_logs_user_id_fkey (
          id,
          full_name,
          email,
          business_name
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply user filter if specified
    if (userId && userId !== 'all') {
      query = query.eq('user_id', userId);
    }

    const { data: calls, error: callsError } = await query;

    if (callsError) {
      console.error('Error fetching calls:', callsError);
      return NextResponse.json(
        { error: 'Failed to fetch calls' },
        { status: 500 }
      );
    }

    // Also get total count for pagination
    let countQuery = supabase
      .from('customer_call_logs')
      .select('*', { count: 'exact', head: true });

    if (userId && userId !== 'all') {
      countQuery = countQuery.eq('user_id', userId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting call count:', countError);
    }

    return NextResponse.json({
      calls: calls || [],
      totalCount: count || 0,
      currentOffset: offset,
      limit: limit,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
