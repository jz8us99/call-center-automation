import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Check if agent_configurations_scoped table exists
    const { data: configTable, error: configError } = await supabase
      .from('agent_configurations_scoped')
      .select('*')
      .limit(1);

    console.log('Config table check:', { configTable, configError });

    // Check if business_profiles table exists
    const { data: businessTable, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .limit(1);

    console.log('Business table check:', { businessTable, businessError });

    // Try to create a test business profile
    const testUserId = 'test-user-123';
    const { data: testProfile, error: testProfileError } = await supabase
      .from('business_profiles')
      .upsert({
        user_id: testUserId,
        business_name: 'Test Business',
        business_type: 'Test',
        business_description: 'Test Description'
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    console.log('Test profile:', { testProfile, testProfileError });

    return NextResponse.json({
      success: true,
      agent_configurations_table: {
        exists: !configError,
        error: configError?.message || null,
        sample: configTable
      },
      business_profiles_table: {
        exists: !businessError,
        error: businessError?.message || null,
        sample: businessTable
      },
      test_profile: {
        data: testProfile,
        error: testProfileError?.message || null
      }
    });

  } catch (error) {
    console.error('Debug tables error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}