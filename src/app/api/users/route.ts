import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth } = authResult;

    // Only admins can fetch user list
    if (user.role !== 'admin' && !user.is_super_admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all users from profiles table
    const { data, error } = await supabaseWithAuth
      .from('profiles')
      .select('user_id, full_name, email, role, is_super_admin, created_at')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Filter out null/empty names and format response
    const users = (data || []).map(profile => ({
      user_id: profile.user_id,
      full_name: profile.full_name || profile.email || 'Unknown User',
      email: profile.email,
      role: profile.role || 'user',
      is_super_admin: profile.is_super_admin || false,
      created_at: profile.created_at,
    }));

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
