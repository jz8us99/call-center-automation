// AI Agents Management API
// CRUD operations for AI agents with RLS support

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';
import {
  CreateAgentRequest,
  UpdateAgentRequest,
  AIAgent,
  AgentType,
  SupportedLanguage,
  AgentStatus,
} from '@/types/ai-agent-types';

// GET /api/ai-agents - List all agents for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth } = authResult;

    const url = new URL(request.url);
    const agentType = url.searchParams.get('agent_type') as AgentType;
    const status = url.searchParams.get('status') as AgentStatus;
    const language = url.searchParams.get('language') as SupportedLanguage;
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query - RLS will automatically restrict users to only see their own data
    let query = supabaseWithAuth
      .from('ai_agents')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (agentType) {
      query = query.eq('agent_type', agentType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (language) {
      query = query.eq('language', language);
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
      agents: agents || [],
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
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth } = authResult;

    const createRequest: CreateAgentRequest = await request.json();

    // Validate required fields
    if (!createRequest.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Create agent data with authenticated user's ID
    const agentToCreate = {
      user_id: user.id, // Use authenticated user's ID
      name: createRequest.name,
      description: createRequest.description || null,
      agent_type: createRequest.agent_type || 'assistant',
      language: createRequest.language || 'en',
      status: 'active',
      configuration: createRequest.configuration || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert agent into database - RLS will ensure proper access
    const { data: newAgent, error: insertError } = await supabaseWithAuth
      .from('ai_agents')
      .insert(agentToCreate)
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating agent:', insertError);
      return NextResponse.json(
        { error: 'Failed to create agent' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        agent: newAgent,
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
