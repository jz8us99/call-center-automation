import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
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
    const supabase = createServerSupabaseClient();
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
