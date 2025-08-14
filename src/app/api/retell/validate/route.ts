import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth: supabase } = authResult;

    const validation = {
      environment: {
        retell_api_key: !!process.env.RETELL_API_KEY,
        retell_llm_id: !!process.env.RETELL_LLM_ID,
        base_url: !!process.env.NEXT_PUBLIC_BASE_URL
      },
      database: {
        agent_configurations_scoped: false,
        retell_agents: false,
        agent_deployments: false,
        phone_assignments: false,
        agent_types: false,
        business_profiles: false
      },
      errors: [] as string[]
    };

    // Check environment variables
    if (!process.env.RETELL_API_KEY) {
      validation.errors.push('RETELL_API_KEY environment variable is missing');
    }

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      validation.errors.push('NEXT_PUBLIC_BASE_URL environment variable is missing');
    }

    // Check database tables
    const tables = [
      'agent_configurations_scoped',
      'retell_agents', 
      'agent_deployments',
      'phone_assignments',
      'agent_types',
      'business_profiles'
    ];

    for (const tableName of tables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);
        
        validation.database[tableName as keyof typeof validation.database] = !error;
        
        if (error && error.code === '42P01') {
          validation.errors.push(`Table '${tableName}' does not exist`);
        }
      } catch (err) {
        validation.database[tableName as keyof typeof validation.database] = false;
        validation.errors.push(`Error checking table '${tableName}': ${err}`);
      }
    }

    // Check if user has agent configurations
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    
    let agentConfigs = [];
    if (businessId) {
      const { data, error } = await supabase
        .from('agent_configurations_scoped')
        .select(`
          *,
          agent_types (
            type_code,
            name
          )
        `)
        .eq('client_id', businessId)
        .eq('is_active', true);

      if (!error && data) {
        agentConfigs = data;
      }
    }

    const isReady = validation.errors.length === 0 && 
      validation.environment.retell_api_key &&
      validation.database.agent_configurations_scoped &&
      validation.database.retell_agents;

    return NextResponse.json({
      success: true,
      ready_for_deployment: isReady,
      validation,
      agent_configurations: agentConfigs,
      summary: {
        total_errors: validation.errors.length,
        environment_ok: validation.environment.retell_api_key && validation.environment.base_url,
        database_ok: Object.values(validation.database).every(v => v),
        agent_configs_found: agentConfigs.length
      }
    });
  } catch (error) {
    console.error('Error in validation endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}