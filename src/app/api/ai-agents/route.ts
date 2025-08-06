// AI Agents Management API
// CRUD operations for AI agents with multi-language support

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/supabase';
import { supabase } from '@/lib/supabase-admin';
import { AgentFactory } from '@/lib/agent-factory';
import {
  TranslationManager,
  MockTranslationService,
} from '@/lib/translation-manager';
import {
  CreateAgentRequest,
  UpdateAgentRequest,
  AIAgent,
  AgentType,
  SupportedLanguage,
  AgentStatus,
} from '@/types/ai-agent-types';

const agentFactory = AgentFactory.getInstance();
const translationManager = TranslationManager.getInstance(
  new MockTranslationService()
);

// GET /api/ai-agents - List all agents for a client
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientId = url.searchParams.get('client_id');
    const agentType = url.searchParams.get('agent_type') as AgentType;
    const status = url.searchParams.get('status') as AgentStatus;
    const language = url.searchParams.get('language') as SupportedLanguage;
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('ai_agents')
      .select(
        `
        *,
        agent_types(type_code, name, description, icon),
        supported_languages(code, name, native_name),
        agent_configurations(*),
        parent_agent:ai_agents!parent_agent_id(id, name, supported_languages(code))
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (clientId) {
      // Verify user has access to this client
      if (
        user.id !== clientId &&
        !user.is_super_admin &&
        user.role !== 'admin'
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      query = query.eq('client_id', clientId);
    } else {
      // Get agents for user's client
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientData) {
        query = query.eq('client_id', clientData.id);
      }
    }

    if (agentType) {
      const { data: agentTypeData } = await supabase
        .from('agent_types')
        .select('id')
        .eq('type_code', agentType)
        .single();

      if (agentTypeData) {
        query = query.eq('agent_type_id', agentTypeData.id);
      }
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (language) {
      const { data: languageData } = await supabase
        .from('supported_languages')
        .select('id')
        .eq('code', language)
        .single();

      if (languageData) {
        query = query.eq('language_id', languageData.id);
      }
    }

    const { data: agents, error, count } = await query;

    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agents || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/ai-agents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ai-agents - Create new agent
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const createRequest: CreateAgentRequest = await request.json();

    // Validate required fields
    if (
      !createRequest.agent_type ||
      !createRequest.language ||
      !createRequest.name
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: agent_type, language, name' },
        { status: 400 }
      );
    }

    // Get client ID
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get agent type and language IDs
    const { data: agentTypeData } = await supabase
      .from('agent_types')
      .select('id')
      .eq('type_code', createRequest.agent_type)
      .single();

    const { data: languageData } = await supabase
      .from('supported_languages')
      .select('id')
      .eq('code', createRequest.language)
      .single();

    if (!agentTypeData || !languageData) {
      return NextResponse.json(
        { error: 'Invalid agent type or language' },
        { status: 400 }
      );
    }

    // Check for duplicate agent (same type + language for client)
    const { data: existingAgent } = await supabase
      .from('ai_agents')
      .select('id')
      .eq('client_id', clientData.id)
      .eq('agent_type_id', agentTypeData.id)
      .eq('language_id', languageData.id)
      .single();

    if (existingAgent) {
      return NextResponse.json(
        { error: 'Agent with this type and language already exists' },
        { status: 409 }
      );
    }

    // Create agent using factory
    const agentData = agentFactory.createAgent(createRequest, clientData.id);

    // Add required fields
    const agentToCreate = {
      ...agentData,
      agent_type_id: agentTypeData.id,
      language_id: languageData.id,
      status: 'draft' as AgentStatus,
    };

    // Insert agent into database
    const { data: newAgent, error: insertError } = await supabase
      .from('ai_agents')
      .insert(agentToCreate)
      .select(
        `
        *,
        agent_types(type_code, name, description, icon),
        supported_languages(code, name, native_name)
      `
      )
      .single();

    if (insertError) {
      console.error('Error creating agent:', insertError);
      return NextResponse.json(
        { error: 'Failed to create agent' },
        { status: 500 }
      );
    }

    // Create agent configuration
    if (createRequest.configuration || true) {
      const configurationData = agentFactory.createAgentConfiguration(
        createRequest.agent_type,
        createRequest.language
      );

      const { error: configError } = await supabase
        .from('agent_configurations')
        .insert({
          agent_id: newAgent.id,
          ...configurationData,
        });

      if (configError) {
        console.error('Error creating agent configuration:', configError);
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: newAgent,
        message: 'Agent created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/ai-agents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
