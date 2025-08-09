// Agent Duplication API
// Handle multi-language agent duplication

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/supabase';
import { supabase } from '@/lib/supabase-admin';
import {
  TranslationManager,
  MockTranslationService,
} from '@/lib/translation-manager';
import {
  DuplicateAgentRequest,
  SupportedLanguage,
} from '@/types/ai-agent-types';

const translationManager = TranslationManager.getInstance(
  new MockTranslationService()
);

// POST /api/ai-agents/[agentId]/duplicate - Duplicate agent for different language
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId: sourceAgentId } = await params;
    const duplicateRequest: DuplicateAgentRequest = await request.json();

    // Validate required fields
    if (!duplicateRequest.target_language) {
      return NextResponse.json(
        { error: 'Missing required field: target_language' },
        { status: 400 }
      );
    }

    // Validate target language
    if (
      !Object.values(SupportedLanguage).includes(
        duplicateRequest.target_language
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid target language' },
        { status: 400 }
      );
    }

    // Get source agent to verify ownership
    const { data: sourceAgent, error: fetchError } = await supabase
      .from('ai_agents')
      .select('client_id, name, supported_languages(code)')
      .eq('id', sourceAgentId)
      .single();

    if (fetchError || !sourceAgent) {
      return NextResponse.json(
        { error: 'Source agent not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this agent
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (
      !clientData ||
      (sourceAgent.client_id !== clientData.id &&
        !user.is_super_admin &&
        user.role !== 'admin')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if source is already in target language
    if (
      (sourceAgent.supported_languages as any)?.code === duplicateRequest.target_language
    ) {
      return NextResponse.json(
        { error: 'Source agent is already in the target language' },
        { status: 400 }
      );
    }

    // Use complete request object
    const completeRequest: DuplicateAgentRequest = {
      source_agent_id: sourceAgentId,
      target_language: duplicateRequest.target_language,
      name: duplicateRequest.name,
      auto_translate: duplicateRequest.auto_translate !== false, // Default to true
    };

    // Duplicate the agent
    const duplicatedAgent =
      await translationManager.duplicateAgentForLanguage(completeRequest);

    // Get the full agent data with relationships
    const { data: fullAgent, error: fullFetchError } = await supabase
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
        )
      `
      )
      .eq('id', duplicatedAgent.id)
      .single();

    if (fullFetchError) {
      console.error('Error fetching duplicated agent:', fullFetchError);
      return NextResponse.json(
        { error: 'Agent duplicated but error fetching details' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: fullAgent,
        message: `Agent successfully duplicated for ${duplicateRequest.target_language.toUpperCase()}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/ai-agents/[agentId]/duplicate:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if ((error as Error).message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Translation already exists for this language' },
          { status: 409 }
        );
      }
      if ((error as Error).message.includes('Unsupported target language')) {
        return NextResponse.json(
          { error: 'Unsupported target language' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to duplicate agent' },
      { status: 500 }
    );
  }
}
