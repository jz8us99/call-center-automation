'use server';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/admin/calls - Fetch call logs with optional user filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id'); // Optional user filter
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset') || '0')
      : (page - 1) * limit;

    // Additional filter parameters
    const startTimeFrom = searchParams.get('start_time_from');
    const startTimeTo = searchParams.get('start_time_to');
    const callType = searchParams.get('type');
    const phoneNumber = searchParams.get('phone_number');

    // Permission verification handled by middleware
    // Use existing admin client that bypasses RLS

    // Build the query for call logs with manual join using service role
    let query = supabaseAdmin
      .from('customer_call_logs')
      .select('*')
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

    // Manually fetch user profiles for the calls
    let callsWithProfiles = calls || [];

    if (calls && calls.length > 0) {
      // Get unique user IDs from calls
      const userIds = [
        ...new Set(calls.map(call => call.user_id).filter(Boolean)),
      ];

      if (userIds.length > 0) {
        // Fetch profiles for these users using service role
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id, user_id, full_name, email, business_name')
          .in('user_id', userIds);

        if (!profilesError && profiles) {
          // Create a map for quick lookup
          const profileMap = new Map();
          profiles.forEach(profile => {
            profileMap.set(profile.user_id, profile);
          });

          // Add profile data to each call
          callsWithProfiles = calls.map(call => ({
            ...call,
            profiles: profileMap.get(call.user_id) || null,
          }));
        }
      }
    }

    // Also get total count for pagination using service role
    let countQuery = supabaseAdmin
      .from('customer_call_logs')
      .select('*', { count: 'exact', head: true });

    // Apply same filters to count query
    if (userId && userId !== 'all') {
      countQuery = countQuery.eq('user_id', userId);
    }
    if (startTimeFrom) {
      countQuery = countQuery.gte('start_timestamp', startTimeFrom);
    }
    if (startTimeTo) {
      countQuery = countQuery.lte('start_timestamp', startTimeTo);
    }
    if (callType && callType !== 'all') {
      countQuery = countQuery.or(
        `direction.eq.${callType},call_type.eq.${callType}`
      );
    }
    if (phoneNumber) {
      countQuery = countQuery.or(
        `from_number.ilike.%${phoneNumber}%,to_number.ilike.%${phoneNumber}%`
      );
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting call count:', countError);
    }

    return NextResponse.json({
      calls: callsWithProfiles,
      totalCount: count || 0,
      pagination: {
        page: page,
        limit: limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
