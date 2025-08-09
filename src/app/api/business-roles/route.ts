import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Get all available business roles
    const { data: roles, error } = await supabase
      .from('business_roles')
      .select('*')
      .eq('is_active', true)
      .order('hierarchy_level', { ascending: true });

    if (error) {
      console.error('Error fetching business roles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch business roles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      roles: roles || [],
    });
  } catch (error) {
    console.error('Error in business-roles GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
