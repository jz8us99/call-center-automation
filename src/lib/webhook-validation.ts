/**
 * Webhook payload validation utilities
 */

export interface RetellCallValidated {
  call_id?: string;
  agent_id?: string;
  call_type?: string;
  agent_name?: string;
  start_timestamp?: string;
  end_timestamp?: string;
  duration_ms?: number;
  transcript?: string;
  recording_url?: string;
  public_log_url?: string;
  disconnection_reason?: string;
  call_cost?: unknown;
  call_analysis?: unknown;
  from_number?: string;
  to_number?: string;
  direction?: 'inbound' | 'outbound';
  telephony_identifier?: string;
}

export interface WebhookPayload {
  event: string;
  call: RetellCallValidated;
}

/**
 * Validates webhook payload structure and sanitizes data
 */
export function validateWebhookPayload(payload: unknown): {
  success: boolean;
  data?: WebhookPayload;
  error?: string;
} {
  if (!payload || typeof payload !== 'object') {
    return {
      success: false,
      error: 'Invalid payload: must be an object',
    };
  }

  const data = payload as Record<string, unknown>;

  // Validate required fields
  if (!data.event || typeof data.event !== 'string') {
    return {
      success: false,
      error: 'Invalid payload: event field is required and must be a string',
    };
  }

  if (!data.call || typeof data.call !== 'object') {
    return {
      success: false,
      error: 'Invalid payload: call field is required and must be an object',
    };
  }

  const call = data.call as Record<string, unknown>;

  // Validate and sanitize call data
  const validatedCall: RetellCallValidated = {};

  // String fields
  const stringFields: (keyof RetellCallValidated)[] = [
    'call_id',
    'agent_id',
    'call_type',
    'agent_name',
    'start_timestamp',
    'end_timestamp',
    'transcript',
    'recording_url',
    'public_log_url',
    'disconnection_reason',
    'from_number',
    'to_number',
    'telephony_identifier',
  ];

  for (const field of stringFields) {
    if (call[field] !== undefined) {
      if (typeof call[field] === 'string') {
        validatedCall[field] = call[field] as string;
      } else {
        return {
          success: false,
          error: `Invalid payload: ${field} must be a string if provided`,
        };
      }
    }
  }

  // Number fields
  if (call.duration_ms !== undefined) {
    if (typeof call.duration_ms === 'number' && call.duration_ms >= 0) {
      validatedCall.duration_ms = call.duration_ms;
    } else {
      return {
        success: false,
        error:
          'Invalid payload: duration_ms must be a non-negative number if provided',
      };
    }
  }

  // Direction enum
  if (call.direction !== undefined) {
    if (call.direction === 'inbound' || call.direction === 'outbound') {
      validatedCall.direction = call.direction;
    } else {
      return {
        success: false,
        error:
          'Invalid payload: direction must be "inbound" or "outbound" if provided',
      };
    }
  }

  // JSON fields (call_cost, call_analysis) - store as-is but log potential issues
  if (call.call_cost !== undefined) {
    validatedCall.call_cost = call.call_cost;
  }

  if (call.call_analysis !== undefined) {
    validatedCall.call_analysis = call.call_analysis;
  }

  return {
    success: true,
    data: {
      event: data.event as string,
      call: validatedCall,
    },
  };
}

/**
 * Safely parses JSON with error handling
 */
export function safeJsonParse<T = unknown>(
  jsonString: string | unknown,
  fallback: T | null = null
): T | null {
  if (typeof jsonString !== 'string') {
    return fallback;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    console.warn('JSON parsing failed:', error);
    return fallback;
  }
}

/**
 * Validates that a string is a valid timestamp
 */
export function isValidTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}
