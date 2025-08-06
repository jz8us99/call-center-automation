import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get all available business service types
    const { data: serviceTypes, error } = await supabase
      .from('business_service_types')
      .select('*')
      .eq('is_active', true)
      .order('service_type_name', { ascending: true });

    if (error) {
      console.error('Error fetching business service types:', error);
      return NextResponse.json(
        { error: 'Failed to fetch business service types' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      service_types: serviceTypes || [],
    });
  } catch (error) {
    console.error('Error in business-service-types GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
