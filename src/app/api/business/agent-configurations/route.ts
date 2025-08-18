import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';
import Retell from 'retell-sdk';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const agentTypeId = searchParams.get('agent_type_id');
    const userId = searchParams.get('user_id');

    // Build the query
    let query = supabase.from('agent_configurations_scoped').select(`
        *,
        agent_types (
          id,
          type_code,
          name,
          description,
          icon
        )
      `);

    if (clientId && agentTypeId) {
      // Get specific configuration
      query = query.eq('client_id', clientId).eq('agent_type_id', agentTypeId);

      const { data: config, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching configuration:', error);
        return NextResponse.json(
          { error: 'Failed to fetch configuration' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        configuration: config || null,
      });
    }

    if (userId) {
      // Get user's business profile first
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        return NextResponse.json({ configurations: [] });
      }

      query = query.eq('client_id', profile.id);
    } else if (clientId) {
      query = query.eq('client_id', clientId);
    } else {
      return NextResponse.json(
        { error: 'client_id, agent_type_id, or user_id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await query.order('updated_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error fetching configurations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch configurations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      configurations: data || [],
    });
  } catch (error) {
    console.error('Error in agent-configurations GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const body = await request.json();

    const {
      client_id,
      agent_type_id,
      agent_type,
      agent_name,
      basic_info_prompt,
      call_scripts_prompt,
      call_scripts,
      voice_settings,
      call_routing,
      custom_settings,
      greeting_message,
      agent_personality,
      custom_instructions,
      based_on_template_id,
    } = body;

    if (!client_id) {
      return NextResponse.json(
        { error: 'client_id is required' },
        { status: 400 }
      );
    }

    let resolvedAgentTypeId = agent_type_id;

    // If agent_type_id is not provided but agent_type is, resolve it
    if (!resolvedAgentTypeId && agent_type) {
      const { data: agentTypeData, error: agentTypeError } = await supabase
        .from('agent_types')
        .select('id')
        .eq('type_code', agent_type)
        .eq('is_active', true)
        .single();

      if (agentTypeError || !agentTypeData) {
        // Try to get all available agent types for better error message
        const { data: availableTypes } = await supabase
          .from('agent_types')
          .select('type_code, name')
          .eq('is_active', true);

        console.error('Agent type not found:', {
          requested: agent_type,
          available: availableTypes?.map(t => t.type_code) || [],
          error: agentTypeError,
        });

        return NextResponse.json(
          {
            error: 'Agent type not found',
            details: `Agent type '${agent_type}' does not exist`,
            available_types: availableTypes || [],
            suggestion:
              'Please run the database setup script to create agent types',
          },
          { status: 400 }
        );
      }

      resolvedAgentTypeId = agentTypeData.id;
    }

    if (!resolvedAgentTypeId) {
      return NextResponse.json(
        { error: 'agent_type_id or agent_type is required' },
        { status: 400 }
      );
    }

    // Verify agent type exists
    const { data: agentTypeExists, error: typeCheckError } = await supabase
      .from('agent_types')
      .select('id, name')
      .eq('id', resolvedAgentTypeId)
      .eq('is_active', true)
      .single();

    if (typeCheckError || !agentTypeExists) {
      return NextResponse.json(
        {
          error: 'Agent type not found',
          details: `Agent type with ID '${resolvedAgentTypeId}' does not exist`,
          suggestion:
            'Please run the database setup script to create agent types',
        },
        { status: 400 }
      );
    }

    // Verify business profile exists
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('id', client_id)
      .single();

    if (profileError || !businessProfile) {
      return NextResponse.json(
        {
          error: 'Business profile not found',
          details: `Business profile with ID '${client_id}' does not exist`,
          suggestion: 'Please complete your business profile first',
        },
        { status: 400 }
      );
    }

    // Prepare configuration data
    const configData = {
      client_id,
      agent_type_id: resolvedAgentTypeId,
      agent_name:
        agent_name || `AI Agent - ${new Date().toISOString().split('T')[0]}`,
      basic_info_prompt,
      call_scripts_prompt,
      call_scripts: call_scripts || {},
      voice_settings: voice_settings || {},
      call_routing: call_routing || {},
      custom_settings: custom_settings || {},
      greeting_message,
      agent_personality: agent_personality || 'professional',
      custom_instructions: custom_instructions || '',
      based_on_template_id,
      updated_at: new Date().toISOString(),
    };

    // Upsert configuration
    const { data: config, error } = await supabase
      .from('agent_configurations_scoped')
      .upsert(configData, {
        onConflict: 'client_id,agent_type_id',
      })
      .select(
        `
        *,
        agent_types (
          id,
          type_code,
          name,
          description,
          icon
        )
      `
      )
      .single();

    if (error) {
      console.error('Error saving configuration:', error);

      // Provide more specific error messages
      if (error.code === '23503') {
        return NextResponse.json(
          {
            error: 'Database constraint violation',
            details: 'Referenced agent type or business profile does not exist',
            suggestion: 'Please ensure the database setup is complete',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to save configuration',
          details: (error as Error).message || 'Unknown database error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      configuration: config,
      message: 'Configuration saved successfully',
    });
  } catch (error) {
    console.error('Error in agent-configurations POST:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    // Get the configuration first to verify it exists
    const { data: config, error: fetchError } = await supabase
      .from('agent_configurations_scoped')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Initialize Retell SDK for cleanup
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) {
      console.error('RETELL_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Retell API key not configured' },
        { status: 500 }
      );
    }

    console.log(
      'Initializing Retell SDK with API key:',
      apiKey.substring(0, 10) + '...'
    );

    const retell = new Retell({
      apiKey: apiKey,
    });

    // Check for deployed retell agents associated with this configuration
    console.log('Looking for retell agents for configuration:', {
      id: config.id,
      agent_name: config.agent_name,
      client_id: config.client_id,
    });

    // Use config.id to match retell_agents.ai_agent_id
    const { data: retellAgents, error: retellQueryError } = await supabase
      .from('retell_agents')
      .select('retell_agent_id, retell_llm_id, ai_agent_id, agent_name')
      .eq('ai_agent_id', config.id);

    if (retellQueryError) {
      console.error('Error querying retell_agents:', retellQueryError);
    }

    console.log('Found retell agents by ai_agent_id:', retellAgents);

    // Clean up Retell AI resources
    if (retellAgents && retellAgents.length > 0) {
      console.log(`Found ${retellAgents.length} retell agents to delete`);

      for (const record of retellAgents) {
        console.log('Processing retell agent record:', record);

        try {
          // Delete Agent from Retell AI
          if (record.retell_agent_id) {
            console.log('Deleting Retell AI Agent:', record.retell_agent_id);
            await retell.agent.delete(record.retell_agent_id);
            console.log(
              'Successfully deleted agent from Retell AI:',
              record.retell_agent_id
            );
          }

          // Delete LLM from Retell AI
          if (record.retell_llm_id) {
            console.log('Deleting Retell AI LLM:', record.retell_llm_id);
            await retell.llm.delete(record.retell_llm_id);
            console.log(
              'Successfully deleted LLM from Retell AI:',
              record.retell_llm_id
            );
          }
        } catch (retellError) {
          console.error('Error deleting Retell AI resources:', {
            record,
            error: retellError,
            errorMessage:
              retellError instanceof Error
                ? retellError.message
                : 'Unknown error',
          });
          // Continue with deletion process even if Retell cleanup fails
        }
      }

      // Delete retell_agents records using ai_agent_id
      const { error: retellAgentsDeleteError } = await supabase
        .from('retell_agents')
        .delete()
        .eq('ai_agent_id', config.id);

      if (retellAgentsDeleteError) {
        console.error(
          'Error deleting retell_agents records:',
          retellAgentsDeleteError
        );
        // Continue with configuration deletion
      } else {
        console.log('Successfully deleted retell_agents records');
      }
    } else {
      console.log('No retell agents found for this configuration');
    }

    // Delete the configuration
    const { error: deleteError } = await supabase
      .from('agent_configurations_scoped')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting configuration:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration and associated resources deleted successfully',
    });
  } catch (error) {
    console.error('Error in agent-configurations DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
