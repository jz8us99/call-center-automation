import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth: supabase } = authResult;

    const { businessId } = await request.json();

    console.log('Test deploy endpoint called:', {
      userId: user?.id,
      businessId
    });

    // Test environment variables
    const environment = {
      retell_api_key: !!process.env.RETELL_API_KEY,
      retell_llm_id: !!process.env.RETELL_LLM_ID,
      base_url: !!process.env.NEXT_PUBLIC_BASE_URL
    };

    console.log('Environment check:', environment);

    // Test database query
    const { data: agentConfigs, error: configError } = await supabase
      .from('agent_configurations_scoped')
      .select(`
        *,
        agent_types!inner (
          id,
          type_code,
          name
        )
      `)
      .eq('client_id', businessId)
      .eq('is_active', true)
      .not('agent_type_id', 'is', null);

    console.log('Database query result:', {
      configsFound: agentConfigs?.length || 0,
      error: configError?.message
    });

    // Test table existence
    const { error: tableError } = await supabase
      .from('retell_agents')
      .select('id')
      .limit(1);

    console.log('Retell agents table check:', {
      exists: !tableError,
      error: tableError?.message
    });

    return NextResponse.json({
      success: true,
      environment,
      database: {
        agent_configs_found: agentConfigs?.length || 0,
        config_error: configError?.message,
        retell_table_exists: !tableError,
        retell_table_error: tableError?.message
      },
      user: {
        id: user?.id,
        email: user?.email
      }
    });

  } catch (error) {
    console.error('Test deploy error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}