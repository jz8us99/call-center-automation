import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

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
