import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth: supabase } = authResult;

    const {
      clientId,
      agentName,
      businessName,
      businessType,
      agentPersonality,
      customPrompt,
      voiceSettings,
    } = await request.json();

    if (!clientId || !agentName || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, agentName, businessName' },
        { status: 400 }
      );
    }

    // Fetch business knowledge from database
    const { data: businessKnowledge, error: knowledgeError } = await supabase
      .from('business_knowledge')
      .select('*')
      .eq('client_id', clientId);

    if (knowledgeError) {
      console.error('Error fetching business knowledge:', knowledgeError);
    }

    // Create knowledge base content
    const knowledgeBase = createKnowledgeBase(
      businessKnowledge || [],
      businessName,
      businessType
    );

    // Create Retell AI agent
    const retellAgent = await createRetellAgent({
      agentName,
      businessName,
      businessType,
      agentPersonality: agentPersonality || 'professional',
      knowledgeBase,
      customPrompt,
      voiceSettings: voiceSettings || {
        speed: 1.0,
        pitch: 1.0,
        tone: 'professional',
      },
    });

    // Generate webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/retell/${retellAgent.agent_id}`;

    // Store agent configuration in database
    const { data: agentConfig, error: agentError } = await supabase
      .from('agents')
      .insert({
        client_id: clientId,
        retell_agent_id: retellAgent.agent_id,
        agent_name: agentName,
        webhook_url: webhookUrl,
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (agentError) {
      console.error('Database error saving agent:', agentError);
      return NextResponse.json(
        { error: 'Failed to save agent configuration' },
        { status: 500 }
      );
    }

    // Send email notification to admin
    await emailService.sendAgentCreationNotification({
      agentName,
      clientName: businessName,
      retellAgentId: retellAgent.agent_id,
      businessType,
      webhookUrl,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        agent_id: retellAgent.agent_id,
        agent_name: agentName,
        webhook_url: webhookUrl,
        status: 'active',
        retell_config: retellAgent,
      },
    });
  } catch (error) {
    console.error('Agent creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create AI agent' },
      { status: 500 }
    );
  }
}

function createKnowledgeBase(
  businessKnowledge: Record<string, unknown>[],
  businessName: string,
  businessType: string
): string {
  let knowledgeBase = `Business Name: ${businessName}\nBusiness Type: ${businessType}\n\n`;

  // Organize knowledge by type
  const knowledgeByType = businessKnowledge.reduce(
    (acc, item) => {
      if (!acc[item.content_type]) {
        acc[item.content_type] = [];
      }
      acc[item.content_type].push(item.content_text);
      return acc;
    },
    {} as Record<string, string[]>
  );

  // Add pricing information
  if (knowledgeByType.pricing) {
    knowledgeBase += `PRICING INFORMATION:\n${knowledgeByType.pricing.join('\n\n')}\n\n`;
  }

  // Add policy information
  if (knowledgeByType.policy) {
    knowledgeBase += `POLICIES AND PROCEDURES:\n${knowledgeByType.policy.join('\n\n')}\n\n`;
  }

  // Add hours information
  if (knowledgeByType.hours) {
    knowledgeBase += `OFFICE HOURS AND AVAILABILITY:\n${knowledgeByType.hours.join('\n\n')}\n\n`;
  }

  return knowledgeBase;
}

async function createRetellAgent(config: {
  agentName: string;
  businessName: string;
  businessType: string;
  agentPersonality: string;
  knowledgeBase: string;
  customPrompt?: string;
  voiceSettings: Record<string, unknown>;
}) {
  // This would integrate with the actual Retell AI API
  // For now, return a mock response
  const mockAgentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // In a real implementation, this would make an API call to Retell AI:
  /*
  const retellResponse = await fetch('https://api.retellai.com/create-agent', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_name: config.agentName,
      llm_websocket_url: process.env.RETELL_WEBSOCKET_URL,
      voice_id: config.voiceSettings.voice_id || 'default',
      voice_temperature: config.voiceSettings.pitch || 1.0,
      voice_speed: config.voiceSettings.speed || 1.0,
      response_engine: 'retell-llm',
      llm_id: 'your-llm-id',
      begin_message: config.customPrompt || generateDefaultPrompt(config),
    }),
  });
  
  const retellAgent = await retellResponse.json();
  */

  // Mock response for development
  return {
    agent_id: mockAgentId,
    agent_name: config.agentName,
    voice_id: 'default',
    created_at: new Date().toISOString(),
    status: 'active',
  };
}

function generateDefaultPrompt(config: {
  businessName: string;
  businessType: string;
  agentPersonality: string;
  knowledgeBase: string;
}): string {
  const personalityMap = {
    professional: 'professional and courteous',
    friendly: 'warm and approachable',
    technical: 'detail-oriented and precise',
  };

  const tone =
    personalityMap[config.agentPersonality as keyof typeof personalityMap] ||
    'professional';

  return `You are an AI assistant for ${config.businessName}, a ${config.businessType}. 
Your role is to be ${tone} while helping customers with their inquiries.

Business Information:
${config.knowledgeBase}

Instructions:
- Always greet callers warmly and identify yourself as an AI assistant
- Use the business information provided to answer questions accurately
- If you don't know something, politely say so and offer to connect them with a human
- Keep responses concise but helpful
- Maintain a ${tone} tone throughout the conversation
- Always ask how you can help after greeting the caller`;
}
