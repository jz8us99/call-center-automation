import { NextRequest, NextResponse } from 'next/server';
import { Retell } from 'retell-sdk';
import { supabaseAdmin } from './supabase-admin';

export interface RetellCall {
  call_id?: string;
  agent_id?: string;
  call_type: string;
  agent_name?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  duration_ms?: number;
  transcript?: string;
  recording_url?: string;
  public_log_url?: string;
  disconnection_reason?: string;
  call_cost?: Record<string, unknown>;
  call_analysis?: {
    custom_analysis_data?: {
      caller_firstname?: string;
      caller_lastname?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  from_number?: string;
  to_number?: string;
  direction?: string;
  telephony_identifier?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RetellWebhookPayload {
  event: string;
  call: RetellCall;
}

export interface WebhookVerificationResult {
  success: boolean;
  body?: string;
  payload?: RetellWebhookPayload;
  error?: NextResponse;
}

/**
 * Verify Retell webhook signature and parse request body (for route handlers)
 * @param request NextRequest object
 * @returns WebhookVerificationResult verification result
 */
export async function verifyRetellWebhook(
  request: NextRequest
): Promise<WebhookVerificationResult> {
  try {
    // Parse request body
    const json = await request.json();

    // Only allow signature skipping in development/local environment
    const isLocalEnv = process.env.ENVIRONMENT === 'local'; // Local development without Vercel
    console.log(`env is : ${process.env.ENVIRONMENT}`);
    const ignoreFlag = request.headers.get('ignore-check') || false;
    if (ignoreFlag && isLocalEnv) {
      console.warn(
        'Warning: Skipping webhook signature verification in development mode'
      );
      return {
        success: true,
        body: '', // No need for body string in development
        payload: json,
      };
    } else if (ignoreFlag && !isLocalEnv) {
      console.error(
        'Security: Attempted to skip signature verification in production environment - rejecting request'
      );
      return {
        success: false,
        error: NextResponse.json({ error: 'Invalid request' }, { status: 401 }),
      };
    }

    // Only stringify when actually needed for signature verification
    const body = JSON.stringify(json);

    // Get signature
    const signature = request.headers.get('x-retell-signature');
    console.log(`Webhook signature: ${signature}`);

    if (!signature) {
      console.error('Missing x-retell-signature header');
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        ),
      };
    }

    // Check API Key
    const apiKey = process.env.RETELL_API_KEY;
    console.log('Verifying webhook signature...');

    if (!apiKey) {
      console.error('RETELL_API_KEY not configured');
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        ),
      };
    }

    // Verify signature
    const valid = Retell.verify(body, apiKey, signature);

    if (!valid) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        ),
      };
    }

    // Return success result
    return {
      success: true,
      body,
      payload: json,
    };
  } catch (error) {
    console.error('Webhook verification error:', error);
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Get user_id by agent_id with default value support
 * @param agent_id Retell agent ID
 * @returns user_id string, returns default value on failure
 */
export async function getUserIdByAgentId(agent_id?: string): Promise<string> {
  try {
    const { data: agentConfig } = await supabaseAdmin
      .from('agent_configs')
      .select('user_id')
      .eq('agent_id', agent_id)
      .single();

    return agentConfig?.user_id;
  } catch (error) {
    console.error('Failed to get user_id from agent_configs:', error);
    console.log(`Using default user_id for agent_id ${agent_id}`);
    throw error;
  }
}
