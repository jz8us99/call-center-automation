import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const agentTypeId = searchParams.get('agent_type_id');

    if (!clientId || !agentTypeId) {
      return NextResponse.json(
        { error: 'client_id and agent_type_id are required' },
        { status: 400 }
      );
    }

    // Get existing configuration for this client + agent type
    const { data: config, error } = await supabase
      .from('agent_configurations_scoped')
      .select('*')
      .eq('client_id', clientId)
      .eq('agent_type_id', agentTypeId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching configuration:', error);
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      configuration: config || null,
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
      call_scripts,
      voice_settings,
      call_routing,
      custom_settings,
      based_on_template_id,
    } = body;

    if (!client_id || !agent_type_id) {
      return NextResponse.json(
        { error: 'client_id and agent_type_id are required' },
        { status: 400 }
      );
    }

    // Upsert configuration
    const { data: config, error } = await supabase
      .from('agent_configurations_scoped')
      .upsert(
        {
          client_id,
          agent_type_id,
          call_scripts: call_scripts || {},
          voice_settings: voice_settings || {},
          call_routing: call_routing || {},
          custom_settings: custom_settings || {},
          based_on_template_id,
        },
        {
          onConflict: 'client_id,agent_type_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving configuration:', error);
      return NextResponse.json(
        { error: 'Failed to save configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      configuration: config,
    });
  } catch (error) {
    console.error('Error in agent-configurations POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
