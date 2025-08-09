import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const payload = await request.json();

    // Validate webhook signature if needed
    // const signature = request.headers.get('x-retell-signature');
    // if (!validateWebhookSignature(payload, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Find the agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('retell_agent_id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Process different webhook events
    const eventType = payload.event;

    switch (eventType) {
      case 'call_started':
        await handleCallStarted(agent, payload);
        break;
      case 'call_ended':
        await handleCallEnded(agent, payload);
        break;
      case 'call_analyzed':
        await handleCallAnalyzed(agent, payload);
        break;
      default:
        console.log('Unknown webhook event:', eventType);
    }

    // Return success response to Retell AI
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCallStarted(agent: any, payload: any) {
  try {
    console.log('Call started for agent:', agent.retell_agent_id);
    console.log('Call data:', payload);

    // Store call start information
    const { error } = await supabase.from('call_logs').insert({
      call_id: payload.call_id,
      agent_id: agent.id,
      client_id: agent.client_id,
      phone_number: payload.from_number,
      call_status: 'started',
      started_at: new Date().toISOString(),
      retell_data: payload,
    });

    if (error) {
      console.error('Error storing call start:', error);
    }
  } catch (error) {
    console.error('Error handling call started:', error);
  }
}

async function handleCallEnded(agent: any, payload: any) {
  try {
    console.log('Call ended for agent:', agent.retell_agent_id);
    console.log('Call data:', payload);

    // Update call log with end information
    const { error } = await supabase
      .from('call_logs')
      .update({
        call_status: 'ended',
        ended_at: new Date().toISOString(),
        duration: payload.call_length,
        transcript: payload.transcript,
        call_summary: payload.call_summary,
        retell_data: payload,
      })
      .eq('call_id', payload.call_id);

    if (error) {
      console.error('Error updating call end:', error);
    }
  } catch (error) {
    console.error('Error handling call ended:', error);
  }
}

async function handleCallAnalyzed(agent: any, payload: any) {
  try {
    console.log('Call analyzed for agent:', agent.retell_agent_id);
    console.log('Analysis data:', payload);

    // Update call log with analysis information
    const { error } = await supabase
      .from('call_logs')
      .update({
        call_analysis: payload.analysis,
        sentiment_score: payload.sentiment_score,
        keywords: payload.keywords,
        action_items: payload.action_items,
        retell_data: payload,
      })
      .eq('call_id', payload.call_id);

    if (error) {
      console.error('Error updating call analysis:', error);
    }
  } catch (error) {
    console.error('Error handling call analyzed:', error);
  }
}

// Optional: Validate webhook signature for security
function validateWebhookSignature(
  payload: any,
  signature: string | null
): boolean {
  if (!signature || !process.env.RETELL_WEBHOOK_SECRET) {
    return true; // Skip validation if not configured
  }

  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RETELL_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}
