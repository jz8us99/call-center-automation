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

    // Allow signature skipping in development/local environment or when explicitly disabled
    const isLocalEnv =
      process.env.ENVIRONMENT === 'local' ||
      process.env.NODE_ENV === 'development';
    const skipSignatureCheck = process.env.CHECK_SIGN === 'false';
    console.log(
      `Environment: ${process.env.ENVIRONMENT}, NODE_ENV: ${process.env.NODE_ENV}, CHECK_SIGN: ${process.env.CHECK_SIGN}`
    );

    const ignoreFlag = request.headers.get('ignore-check') || false;
    if ((ignoreFlag && isLocalEnv) || skipSignatureCheck) {
      console.warn(
        'Warning: Skipping webhook signature verification in development mode or due to CHECK_SIGN=false'
      );
      return {
        success: true,
        body: '', // No need for body string in development
        payload: json,
      };
    } else if (ignoreFlag && !isLocalEnv && !skipSignatureCheck) {
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
    console.log('Attempting signature verification with:', {
      bodyLength: body.length,
      signaturePresent: !!signature,
      apiKeyPresent: !!apiKey,
    });

    const valid = Retell.verify(body, apiKey, signature);
    console.log('Signature verification result:', valid);

    if (!valid) {
      console.error('Webhook signature verification failed:', {
        signature,
        bodyPreview: body.substring(0, 100) + '...',
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'missing',
      });
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
    const { data: retellAgent } = await supabaseAdmin
      .from('retell_agents')
      .select('user_id')
      .eq('retell_agent_id', agent_id)
      .single();

    return retellAgent?.user_id;
  } catch (error) {
    console.error('Failed to get user_id from retell_agents:', error);
    console.log(`Using default user_id for agent_id ${agent_id}`);
    throw error;
  }
}
