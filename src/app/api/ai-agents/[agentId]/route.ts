// Individual Agent Management API
// GET, PUT, DELETE operations for specific agents

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/supabase';
import { supabase } from '@/lib/supabase-admin';
import {
  TranslationManager,
  MockTranslationService,
} from '@/lib/translation-manager';
import {
  UpdateAgentRequest,
  AgentStatus,
  AIAgent,
} from '@/types/ai-agent-types';

const translationManager = TranslationManager.getInstance(
  new MockTranslationService()
);

// GET /api/ai-agents/[agentId] - Get specific agent
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agentId = params.agentId;

    // Get agent with full configuration
    const { data: agent, error } = await supabase
      .from('ai_agents')
      .select(
        `
        *,
        agent_types(type_code, name, description, icon),
        supported_languages(code, name, native_name),
        agent_configurations(*),
        parent_agent:ai_agents!parent_agent_id(
          id, 
          name, 
          supported_languages(code, native_name)
        ),
        translated_agents:ai_agents!parent_agent_id(
          id,
          name,
          status,
          supported_languages(code, name, native_name)
        )
      `
      )
      .eq('id', agentId)
      .single();

    if (error) {
      console.error('Error fetching agent:', error);
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Verify user has access to this agent
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (
      !clientData ||
      (agent.client_id !== clientData.id &&
        !user.is_super_admin &&
        user.role !== 'admin')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get recent call statistics
    const { data: callStats } = await supabase
      .from('ai_call_logs')
      .select('call_status, duration, started_at')
      .eq('agent_id', agentId)
      .gte(
        'started_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      ) // Last 7 days
      .order('started_at', { ascending: false });

    // Calculate performance metrics
    const totalCalls = callStats?.length || 0;
    const completedCalls =
      callStats?.filter(call => call.call_status === 'completed').length || 0;
    const averageDuration = callStats?.length
      ? callStats.reduce((sum, call) => sum + (call.duration || 0), 0) /
        callStats.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...agent,
        performance: {
          total_calls_7d: totalCalls,
          completed_calls_7d: completedCalls,
          success_rate:
            totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0,
          average_duration: Math.round(averageDuration),
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/ai-agents/[agentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/ai-agents/[agentId] - Update agent
export async function PUT(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agentId = params.agentId;
    const updateRequest: UpdateAgentRequest = await request.json();

    // Get existing agent
    const { data: existingAgent, error: fetchError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (fetchError || !existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Verify user has access to this agent
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (
      !clientData ||
      (existingAgent.client_id !== clientData.id &&
        !user.is_super_admin &&
        user.role !== 'admin')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare update data
    const updateData: Partial<AIAgent> = {};

    if (updateRequest.name !== undefined) updateData.name = updateRequest.name;
    if (updateRequest.description !== undefined)
      updateData.description = updateRequest.description;
    if (updateRequest.status !== undefined)
      updateData.status = updateRequest.status;
    if (updateRequest.personality !== undefined)
      updateData.personality = updateRequest.personality;
    if (updateRequest.voice_settings !== undefined) {
      updateData.voice_settings = {
        ...existingAgent.voice_settings,
        ...updateRequest.voice_settings,
      };
    }
    if (updateRequest.business_context !== undefined) {
      updateData.business_context = {
        ...existingAgent.business_context,
        ...updateRequest.business_context,
      };
    }
    if (updateRequest.greeting_message !== undefined)
      updateData.greeting_message = updateRequest.greeting_message;
    if (updateRequest.prompt_template !== undefined)
      updateData.prompt_template = updateRequest.prompt_template;
    if (updateRequest.variables !== undefined) {
      updateData.variables = {
        ...existingAgent.variables,
        ...updateRequest.variables,
      };
    }
    if (updateRequest.integrations !== undefined) {
      updateData.integrations = {
        ...existingAgent.integrations,
        ...updateRequest.integrations,
      };
    }

    // Update agent
    const { data: updatedAgent, error: updateError } = await supabase
      .from('ai_agents')
      .update(updateData)
      .eq('id', agentId)
      .select(
        `
        *,
        agent_types(type_code, name, description, icon),
        supported_languages(code, name, native_name)
      `
      )
      .single();

    if (updateError) {
      console.error('Error updating agent:', updateError);
      return NextResponse.json(
        { error: 'Failed to update agent' },
        { status: 500 }
      );
    }

    // Sync changes to translated agents if this is a parent agent
    try {
      await translationManager.syncTranslatedAgents(agentId, updateData);
    } catch (syncError) {
      console.error('Error syncing translated agents:', syncError);
      // Don't fail the request, just log the error
    }

    // If status changed to active, deploy to Retell AI
    if (
      updateRequest.status === AgentStatus.ACTIVE &&
      existingAgent.status !== AgentStatus.ACTIVE
    ) {
      try {
        // TODO: Implement Retell AI deployment
        console.log('Deploying agent to Retell AI:', agentId);
      } catch (deployError) {
        console.error('Error deploying agent:', deployError);
        // Revert status change
        await supabase
          .from('ai_agents')
          .update({ status: existingAgent.status })
          .eq('id', agentId);

        return NextResponse.json(
          { error: 'Failed to deploy agent to Retell AI' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedAgent,
      message: 'Agent updated successfully',
    });
  } catch (error) {
    console.error('Error in PUT /api/ai-agents/[agentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/ai-agents/[agentId] - Delete agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agentId = params.agentId;

    // Get existing agent
    const { data: existingAgent, error: fetchError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (fetchError || !existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Verify user has access to this agent
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (
      !clientData ||
      (existingAgent.client_id !== clientData.id &&
        !user.is_super_admin &&
        user.role !== 'admin')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if agent has active calls
    const { data: activeCalls } = await supabase
      .from('ai_call_logs')
      .select('id')
      .eq('agent_id', agentId)
      .in('call_status', ['started', 'in_progress'])
      .limit(1);

    if (activeCalls && activeCalls.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete agent with active calls' },
        { status: 409 }
      );
    }

    // Get translated agents
    const { data: translatedAgents } = await supabase
      .from('ai_agents')
      .select('id, retell_agent_id')
      .eq('parent_agent_id', agentId);

    // Delete from Retell AI if deployed
    if (existingAgent.retell_agent_id) {
      try {
        // TODO: Implement Retell AI deletion
        console.log(
          'Deleting agent from Retell AI:',
          existingAgent.retell_agent_id
        );
      } catch (retellError) {
        console.error('Error deleting from Retell AI:', retellError);
        // Continue with local deletion
      }
    }

    // Delete translated agents from Retell AI
    if (translatedAgents) {
      for (const translatedAgent of translatedAgents) {
        if (translatedAgent.retell_agent_id) {
          try {
            // TODO: Implement Retell AI deletion
            console.log(
              'Deleting translated agent from Retell AI:',
              translatedAgent.retell_agent_id
            );
          } catch (retellError) {
            console.error(
              'Error deleting translated agent from Retell AI:',
              retellError
            );
          }
        }
      }
    }

    // Delete agent (cascading deletes will handle related records)
    const { error: deleteError } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', agentId);

    if (deleteError) {
      console.error('Error deleting agent:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete agent' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/ai-agents/[agentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
