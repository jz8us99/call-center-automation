import { NextRequest, NextResponse } from 'next/server';
import { Retell } from 'retell-sdk';

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
 * 验证 Retell webhook 签名并解析请求体
 * @param request NextRequest 对象
 * @returns WebhookVerificationResult 验证结果
 */
export async function verifyRetellWebhook(
  request: NextRequest
): Promise<WebhookVerificationResult> {
  try {
    // 解析请求体
    const json = await request.json();
    const body = JSON.stringify(json);

    // 生产环境必须验证签名，开发环境可选择跳过
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.CHECK_SIGN === 'false'
    ) {
      console.warn('警告: 开发模式下跳过webhook签名验证');
      return {
        success: true,
        body,
        payload: json,
      };
    }

    // 获取签名
    const signature = request.headers.get('x-retell-signature');
    console.log('Processing webhook signature verification');

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

    // 检查 API Key
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

    // 验证签名
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

    // 返回成功结果
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
