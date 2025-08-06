import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateRequest,
  createAuthenticatedClient,
  checkPermission,
} from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please provide a valid JWT token' },
        { status: 401 }
      );
    }

    // Get JWT token
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '') || '';

    // Create a client with user authentication
    const supabaseWithAuth = await createAuthenticatedClient(token);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const userId = searchParams.get('user_id');

    // Get search filter parameters
    const startTimeFrom = searchParams.get('start_time_from');
    const startTimeTo = searchParams.get('start_time_to');
    const type = searchParams.get('type');
    const phoneNumber = searchParams.get('phone_number');

    const offset = (page - 1) * limit;

    // Build query - RLS will automatically restrict users to only see their own data
    let query = supabaseWithAuth
      .from('customer_call_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Add search filter
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Add time range filter
    if (startTimeFrom) {
      query = query.gte('start_timestamp', startTimeFrom);
    }
    if (startTimeTo) {
      query = query.lte('start_timestamp', startTimeTo);
    }

    // Add type filter
    if (type && type !== 'all') {
      query = query.or(`direction.eq.${type},call_type.eq.${type}`);
    }

    // Add phone number filter
    if (phoneNumber) {
      query = query.or(
        `from_number.ilike.%${phoneNumber}%,to_number.ilike.%${phoneNumber}%`
      );
    }

    // Admins can filter by user ID
    if (userId && (user.role === 'admin' || user.is_super_admin)) {
      query = query.eq('user_id', userId);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customer call logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
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

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please provide a valid JWT token' },
        { status: 401 }
      );
    }

    // Get JWT token
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '') || '';

    // Create a client with user authentication
    const supabaseWithAuth = await createAuthenticatedClient(token);

    const body = await request.json();
    const { user_id, customer_id } = body;

    // Ensure users can only create records for themselves (unless admin)
    const targetUserId = user_id || user.id;
    if (!checkPermission(user, 'write', targetUserId)) {
      return NextResponse.json(
        { error: 'Forbidden: You can only create records for yourself' },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseWithAuth
      .from('customer_call_logs')
      .insert({
        user_id: targetUserId,
        customer_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);

      // Handle unique constraint error
      if (error.code === '23505') {
        return NextResponse.json(
          {
            error:
              'A customer with this phone and email combination already exists',
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create customer call log' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please provide a valid JWT token' },
        { status: 401 }
      );
    }

    // Get JWT token
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '') || '';

    // Create a client with user authentication
    const supabaseWithAuth = await createAuthenticatedClient(token);

    // Get record ID
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {} = body;

    // First check if the record exists and belongs to the current user
    const { data: existingRecord, error: fetchError } = await supabaseWithAuth
      .from('customer_call_logs')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json(
        { error: 'Record not found or access denied' },
        { status: 404 }
      );
    }

    // Check permissions
    if (!checkPermission(user, 'write', existingRecord.user_id)) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own records' },
        { status: 403 }
      );
    }

    // Update record
    const { data, error } = await supabaseWithAuth
      .from('customer_call_logs')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);

      return NextResponse.json(
        { error: 'Failed to update customer call log' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please provide a valid JWT token' },
        { status: 401 }
      );
    }

    // Get JWT token
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '') || '';

    // Create a client with user authentication
    const supabaseWithAuth = await createAuthenticatedClient(token);

    // Get record ID
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // First check if the record exists and belongs to the current user
    const { data: existingRecord, error: fetchError } = await supabaseWithAuth
      .from('customer_call_logs')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json(
        { error: 'Record not found or access denied' },
        { status: 404 }
      );
    }

    // Check permissions
    if (!checkPermission(user, 'delete', existingRecord.user_id)) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own records' },
        { status: 403 }
      );
    }

    // Delete record
    const { error } = await supabaseWithAuth
      .from('customer_call_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete customer call log' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Customer call log deleted successfully',
      deletedRecord: existingRecord,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
