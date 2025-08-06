import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const businessTypeId = searchParams.get('business_type_id');
    const agentTypeId = searchParams.get('agent_type_id');

    if (!businessTypeId || !agentTypeId) {
      return NextResponse.json(
        { error: 'business_type_id and agent_type_id are required' },
        { status: 400 }
      );
    }

    // Get template for business type + agent type combination
    const { data: templateMap, error: mapError } = await supabase
      .from('business_type_agent_template_map')
      .select(
        `
        template_id,
        agent_templates (
          id,
          name,
          description,
          call_scripts,
          voice_settings,
          call_routing,
          prompt_template,
          configuration_template
        )
      `
      )
      .eq('business_type_id', businessTypeId)
      .eq('agent_type_id', agentTypeId)
      .single();

    if (mapError && mapError.code !== 'PGRST116') {
      console.error('Error fetching template map:', mapError);
      return NextResponse.json(
        { error: 'Failed to fetch template' },
        { status: 500 }
      );
    }

    if (!templateMap) {
      // No specific template found, return default template for agent type
      const { data: agentType, error: agentTypeError } = await supabase
        .from('agent_types')
        .select('*')
        .eq('id', agentTypeId)
        .single();

      if (agentTypeError) {
        console.error('Error fetching agent type:', agentTypeError);
        return NextResponse.json(
          { error: 'Failed to fetch agent type' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        template: {
          id: null,
          name: `Default ${agentType.name}`,
          description: `Default template for ${agentType.name}`,
          call_scripts: {},
          voice_settings: agentType.suggested_voice_settings,
          call_routing: {},
          prompt_template: agentType.template_prompt,
          configuration_template: {},
        },
      });
    }

    return NextResponse.json({
      template: templateMap.agent_templates,
    });
  } catch (error) {
    console.error('Error in agent-templates GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
