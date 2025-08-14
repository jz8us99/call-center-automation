import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';
import Retell from 'retell-sdk';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('[DEPLOY-SIMPLE] Starting simple deployment...');

    // Authenticate request
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { businessId, agentConfig } = await request.json();
    console.log('[DEPLOY-SIMPLE] Got request:', {
      businessId,
      agentName: agentConfig?.agent_name,
    });

    if (!businessId || !agentConfig) {
      return NextResponse.json(
        { error: 'Missing businessId or agentConfig' },
        { status: 400 }
      );
    }

    // Initialize Retell client directly
    const retell = new Retell({
      apiKey: process.env.RETELL_API_KEY!,
    });

    // Get dynamic LLM ID from Retell API
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let llmId = agentConfig.retell_llm_id;

    if (!llmId) {
      console.log('[DEPLOY-SIMPLE] Getting dynamic LLM ID from Retell API...');

      try {
        // Get list of available LLMs from Retell API
        const llms = await retell.llm.list();
        console.log(
          `[DEPLOY-SIMPLE] Found ${llms.length} LLMs in Retell account`
        );

        if (llms.length === 0) {
          console.log(
            '[DEPLOY-SIMPLE] No LLMs found, creating a default LLM...'
          );

          // Create a default LLM if none exist
          const newLlm = await retell.llm.create({
            model_name: 'gpt-3.5-turbo-16k',
            general_prompt:
              'You are a helpful AI assistant for a business. Provide professional and courteous service to all callers.',
            begin_message: 'Hello! How can I help you today?',
          });

          llmId = newLlm.llm_id;
          console.log('[DEPLOY-SIMPLE] Created new LLM:', llmId);
        } else {
          // Use the first available LLM
          llmId = llms[0].llm_id;
          console.log('[DEPLOY-SIMPLE] Using available LLM:', llmId);
        }
      } catch (llmError) {
        console.error(
          '[DEPLOY-SIMPLE] Error getting dynamic LLM ID:',
          llmError
        );

        // Fallback to database or environment variable
        const { data: defaultLlm } = await supabase
          .from('retell_llm_configs')
          .select('llm_id')
          .eq('is_default', true)
          .single();

        llmId =
          defaultLlm?.llm_id ||
          process.env.RETELL_LLM_ID ||
          'llm_f56f731b3105a4b42d8cb522ffa7';

        console.log('[DEPLOY-SIMPLE] Using fallback LLM ID:', llmId);
      }
    }

    console.log('[DEPLOY-SIMPLE] Final LLM ID:', llmId);

    // Get business name for agent naming
    const { data: business } = await supabase
      .from('business_profiles')
      .select('business_name')
      .eq('user_id', businessId)
      .single();

    const businessName = business?.business_name || 'Business';
    const fullAgentName = `${businessName} ${agentConfig.agent_name}`;

    console.log('[DEPLOY-SIMPLE] Creating agent:', fullAgentName);

    // Create agent with Retell API directly
    const agentCreateConfig = {
      agent_name: fullAgentName,
      response_engine: {
        type: 'retell-llm',
        llm_id: llmId,
      },
      voice_id: '11labs-Adrian',
      language: 'en-US',
      webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/retell/webhook`,
      voice_temperature: agentConfig.voice_settings?.voice_temperature || 1,
      voice_speed: agentConfig.voice_settings?.speed || 1.28,
      volume: 1,
      enable_backchannel: true,
      backchannel_words: ['mhm', 'uh-huh'],
      max_call_duration_ms: 1800000,
      interruption_sensitivity: 0.9,
      normalize_for_speech: true,
      begin_message_delay_ms: 200,
      post_call_analysis_model: 'gpt-4o-mini',
      begin_message:
        agentConfig.call_scripts?.greeting_script ||
        agentConfig.greeting_message ||
        'Hello! Thank you for calling. How can I help you today?',
    };

    console.log('[DEPLOY-SIMPLE] Agent config prepared');

    const agent = await retell.agent.create(agentCreateConfig);
    console.log('[DEPLOY-SIMPLE] Agent created:', agent.agent_id);

    // Store agent in database
    await supabase.from('retell_agents').upsert({
      business_id: businessId,
      agent_type: 'receptionist',
      retell_agent_id: agent.agent_id,
      agent_name: agent.agent_name,
      ai_agent_id: agentConfig.id,
      status: 'deployed',
      updated_at: new Date().toISOString(),
      response_engine_type: 'retell-llm',
      retell_llm_id: llmId,
      voice_settings: JSON.stringify({
        voice_id: agentCreateConfig.voice_id,
        voice_temperature: agentCreateConfig.voice_temperature,
        voice_speed: agentCreateConfig.voice_speed,
      }),
    });

    console.log('[DEPLOY-SIMPLE] Agent stored in database');

    return NextResponse.json({
      success: true,
      agent: agent,
      message: `Successfully deployed agent: ${agentConfig.agent_name}`,
    });
  } catch (error) {
    console.error('[DEPLOY-SIMPLE] Error:', error);
    console.error(
      '[DEPLOY-SIMPLE] Stack:',
      error instanceof Error ? error.stack : 'No stack'
    );

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
