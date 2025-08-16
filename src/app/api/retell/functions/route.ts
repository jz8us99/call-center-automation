import { NextRequest, NextResponse } from 'next/server';
import {
  getUserIdByAgentId,
  verifyRetellWebhook,
} from '@/lib/retell-webhook-utils';
import { ErrorResponse, RetellFunctionCall } from '@/types/clinic';
import { functionRegistry } from './registry';
import { FunctionContext } from './types';
import './handlers'; // Import to trigger registration

/**
 * General retell function route handler with dynamic function registry
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify webhook and get payload
    const verification = await verifyRetellWebhook(request);
    if (!verification.success) {
      return verification.error!;
    }

    const retellCall: RetellFunctionCall =
      verification.payload as unknown as RetellFunctionCall;

    // Get user_id from agent_id
    const agent_id = retellCall.call.agent_id!;
    console.log(
      `[functions/route] agent_id: ${agent_id}  function_name: ${retellCall.name} args:${JSON.stringify(retellCall.args)}`
    );

    let user_id: string;
    try {
      user_id = await getUserIdByAgentId(agent_id);
      console.log(`[functions/route] Retrieved user_id: ${user_id}`);
    } catch (error) {
      console.error('Failed to get user_id:', error);
      return NextResponse.json(
        { error: 'Failed to get user configuration' },
        { status: 400 }
      );
    }

    // Check if function exists in registry
    const handler = functionRegistry.getHandler(retellCall.name);

    if (!handler) {
      return NextResponse.json(
        {
          error: `Invalid function name: ${retellCall.name}.  `,
        },
        { status: 400 }
      );
    }

    // Create context for the handler
    const context: FunctionContext = {
      userId: user_id,
      agentId: agent_id,
      request,
      call: retellCall.call,
    };

    // Execute the handler
    try {
      const result = await handler(retellCall.args || {}, context);

      // Wrap the result in the expected format
      return NextResponse.json({ result });
    } catch (handlerError) {
      console.error(`Error in handler ${retellCall.name}:`, handlerError);

      // Return a user-friendly error
      return NextResponse.json(
        {
          result: {
            success: false,
            message:
              'I encountered an error processing your request. Please try again.',
            error:
              handlerError instanceof Error
                ? handlerError.message
                : 'Unknown error',
          },
        },
        { status: 200 } // Return 200 to prevent Retell from retrying
      );
    }
  } catch (error) {
    console.error('Function execution error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handlePOST(request);
}
