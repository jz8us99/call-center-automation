import { NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

export async function GET() {
  try {
    // Note: This endpoint doesn't require authentication as it returns public business types
    // But we'll use withAuth for consistency
    const authResult = await withAuth();
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;

    const { data: businessTypes, error } = await supabase
      .from('business_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching business types:', error);
      return NextResponse.json(
        { error: 'Failed to fetch business types' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      business_types: businessTypes,
    });
  } catch (error) {
    console.error('Error in business-types GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
