import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  RetellCall,
  getUserIdByAgentId,
  verifyRetellWebhook,
} from '@/lib/retell-webhook-utils';
import { messageDispatcher } from '@/lib/message-system/message-dispatcher';
import {
  MessageType,
  CallAnalyzedData,
  CallStartedData,
  CallEndedData,
  MessageProcessResult,
} from '@/lib/message-system/message-types';
import { initializeBusinessServices } from '@/lib/services/business-registry';

// Import clinic service to activate auto-registration
import '@/lib/services/clinic-service';

/**
 * Handle call started event
 */
async function handleCallStarted(
  call: RetellCall,
  userId: string
): Promise<void> {
  try {
    console.log('Starting call started message dispatch...', {
      callId: call?.call_id,
      userId,
    });

    const messageData: CallStartedData = {
      type: MessageType.CALL_STARTED,
      timestamp: new Date(),
      call: {
        call_id: call?.call_id,
        agent_id: call?.agent_id,
        start_timestamp: call?.start_timestamp,
      },
      userId,
    };

    const result = await messageDispatcher.dispatch(
      MessageType.CALL_STARTED,
      messageData
    );
    logDispatchResult(result, 'call_started');
  } catch (error) {
    console.error('Error handling call started event:', error);
  }
}

/**
 * Handle call ended event
 */
async function handleCallEnded(
  call: RetellCall,
  userId: string
): Promise<void> {
  try {
    console.log('Starting call ended message dispatch...', {
      callId: call?.call_id,
      userId,
    });

    const messageData: CallEndedData = {
      type: MessageType.CALL_ENDED,
      timestamp: new Date(),
      call: {
        call_id: call?.call_id,
        agent_id: call?.agent_id,
        end_timestamp: call?.end_timestamp,
        duration_ms: call?.duration_ms,
      },
      userId,
    };

    const result = await messageDispatcher.dispatch(
      MessageType.CALL_ENDED,
      messageData
    );
    logDispatchResult(result, 'call_ended');
  } catch (error) {
    console.error('Error handling call ended event:', error);
  }
}

/**
 * Log dispatch results
 */
function logDispatchResult(
  result: MessageProcessResult,
  eventType: string
): void {
  if (result.success) {
    const successCount =
      result.handlerResults?.filter(r => r.success).length || 0;
    const totalCount = result.handlerResults?.length || 0;
    console.log(
      `${eventType} message dispatch completed: ${successCount}/${totalCount} handlers processed successfully`
    );

    // Log processing details
    if (result.handlerResults) {
      result.handlerResults.forEach(handlerResult => {
        if (handlerResult.success) {
          console.log(
            `✅ Handler ${handlerResult.handlerName} processed successfully`
          );
        } else {
          console.error(
            `❌ Handler ${handlerResult.handlerName} processing failed: ${handlerResult.error}`
          );
        }
      });
    }
  } else {
    console.error(`${eventType} message dispatch failed:`, result.error);
  }
}

/**
 * Handle call analysis completion business logic
 * Dispatch to various business services through message dispatcher
 */
async function handleCallAnalyzed(
  call: RetellCall,
  userId: string,
  callLogId: string
): Promise<void> {
  try {
    console.log('Starting call analyzed message dispatch...', {
      callId: call?.call_id,
      userId,
      callLogId,
    });

    // Construct message data
    const messageData: CallAnalyzedData = {
      type: MessageType.CALL_ANALYZED,
      timestamp: new Date(),
      call: {
        call_id: call?.call_id,
        agent_id: call?.agent_id,
        call_type: call?.call_type,
        agent_name: call?.agent_name,
        start_timestamp: call?.start_timestamp,
        end_timestamp: call?.end_timestamp,
        duration_ms: call?.duration_ms,
        transcript: call?.transcript,
        recording_url: call?.recording_url,
        public_log_url: call?.public_log_url,
        disconnection_reason: call?.disconnection_reason,
        call_cost: call?.call_cost,
        call_analysis: call?.call_analysis,
        from_number: call?.from_number,
        to_number: call?.to_number,
        direction: call?.direction,
        telephony_identifier:
          typeof call?.telephony_identifier === 'string'
            ? call.telephony_identifier
            : null,
      },
      userId,
      callLogId,
    };

    // Dispatch message through message dispatcher
    const result = await messageDispatcher.dispatch(
      MessageType.CALL_ANALYZED,
      messageData
    );
    logDispatchResult(result, 'call_analyzed');
  } catch (error) {
    console.error('Error handling call analysis completion event:', error);
    // Processing failure doesn't affect normal webhook response
  }
}

async function handlePOST(request: NextRequest) {
  try {
    // Initialize business services (serverless environment requires reinitialization on each request)
    await initializeBusinessServices();

    // Verify webhook and get payload
    const verification = await verifyRetellWebhook(request);
    if (!verification.success) {
      return verification.error!;
    }

    const { event, call } = verification.payload!;

    console.log('Received Retell webhook:', { event, callId: call?.call_id });

    const userId = await getUserIdByAgentId(call?.agent_id);
    console.log(`retrieved userId ${userId} by ${call?.agent_id}`);

    // Process different webhook events
    switch (event) {
      case 'call_started':
        console.log('Call started:', call?.call_id);
        try {
          await handleCallStarted(call, userId);
        } catch (error) {
          console.error('Failed to handle call_started event:', error);
        }
        break;

      case 'call_ended':
        console.log('Call ended:', call?.call_id);
        try {
          await handleCallEnded(call, userId);
        } catch (error) {
          console.error('Failed to handle call_ended event:', error);
        }
        break;

      case 'call_analyzed':
        console.log(`call_analysis ${JSON.stringify(call?.call_analysis)}`);

        try {
          // Prepare data for database insertion
          const callLogData = {
            call_id: call?.call_id,
            agent_id: call?.agent_id,
            call_type: call?.call_type,
            agent_name: call?.agent_name,
            start_timestamp: call?.start_timestamp
              ? new Date(call.start_timestamp).toISOString()
              : null,
            end_timestamp: call?.end_timestamp
              ? new Date(call.end_timestamp).toISOString()
              : null,
            duration_ms: call?.duration_ms,
            transcript: call?.transcript,
            call_record_url: call?.recording_url,
            public_log_url: call?.public_log_url,
            disconnection_reason: call?.disconnection_reason,
            call_cost: call?.call_cost || null,
            call_analysis: call?.call_analysis || {},
            from_number: call?.from_number,
            to_number: call?.to_number,
            direction: call?.direction,
            telephony_identifier: call?.telephony_identifier || null,
            user_id: userId,
          };

          const { data, error } = await supabaseAdmin
            .from('customer_call_logs')
            .insert(callLogData)
            .select();

          let callLogId: string | undefined;

          if (error) {
            console.error('Database insertion error:', error);
          } else {
            const insertedRecord = data?.[0];
            callLogId = insertedRecord?.id;
            console.log('Successfully inserted call record:', callLogId);
          }

          // Process business logic regardless of database insertion success
          // This way business services can decide how to handle it themselves
          await handleCallAnalyzed(call, userId, callLogId || '');
        } catch (dbError) {
          console.error(
            'Error occurred while processing call_analyzed event:',
            dbError
          );
        }
        break;

      default:
        console.log('Unknown event type:', event);
    }

    // Acknowledge receipt of the webhook
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Retell webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handlePOST(request);
}
