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
 * Handle tool calls from Retell AI for calendar operations
 */
async function handleToolCall(
  request: NextRequest,
  userId: string
): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { tool_call } = body;

    console.log('Processing tool call:', tool_call);

    if (!tool_call || !tool_call.function_name) {
      return NextResponse.json(
        { error: 'Invalid tool call format' },
        { status: 400 }
      );
    }

    const { function_name, function_parameters } = tool_call;
    let result;

    switch (function_name) {
      case 'check_availability':
        result = await checkStaffAvailability(function_parameters, userId);
        break;

      case 'create_appointment':
        result = await createAppointment(function_parameters, userId);
        break;

      case 'update_appointment':
        result = await updateAppointment(function_parameters, userId);
        break;

      case 'cancel_appointment':
        result = await cancelAppointment(function_parameters, userId);
        break;

      case 'find_customer_appointments':
        result = await findCustomerAppointments(function_parameters, userId);
        break;

      default:
        result = {
          success: false,
          message: `Unknown function: ${function_name}`,
        };
    }

    return NextResponse.json({
      result: result.message || result.data || 'Operation completed',
      success: result.success || false,
    });
  } catch (error) {
    console.error('Tool call error:', error);
    return NextResponse.json(
      {
        result:
          'An error occurred while processing your request. Please try again.',
        success: false,
      },
      { status: 200 } // Return 200 so Retell doesn't retry
    );
  }
}

/**
 * Check staff availability for appointment scheduling
 */
async function checkStaffAvailability(params: any, userId: string) {
  try {
    console.log('Checking availability for:', params);

    // Mock implementation - replace with actual calendar API
    const { date, time, staff_id, service_type } = params;

    // Simple availability check logic
    const requestedDateTime = new Date(`${date}T${time}`);
    const now = new Date();

    if (requestedDateTime < now) {
      return {
        success: false,
        message: `I'm sorry, but ${date} at ${time} is in the past. Could you please provide a future date and time?`,
      };
    }

    // Check if it's during business hours (9 AM - 5 PM, Mon-Fri)
    const dayOfWeek = requestedDateTime.getDay();
    const hour = requestedDateTime.getHours();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        success: false,
        message: `We're closed on weekends. Our office hours are Monday through Friday, 9 AM to 5 PM. Would you like to schedule for a weekday instead?`,
      };
    }

    if (hour < 9 || hour >= 17) {
      return {
        success: false,
        message: `That time is outside our office hours. We're open Monday through Friday, 9 AM to 5 PM. Would you like to choose a time between 9 AM and 5 PM?`,
      };
    }

    return {
      success: true,
      message: `Great! ${date} at ${time} is available. Would you like me to book this appointment for you?`,
      data: {
        available: true,
        date,
        time,
        staff_id: staff_id || 'any_available',
      },
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    return {
      success: false,
      message:
        'I had trouble checking our availability. Let me transfer you to our scheduling team.',
    };
  }
}

/**
 * Create a new appointment
 */
async function createAppointment(params: any, userId: string) {
  try {
    console.log('Creating appointment with params:', params);

    const {
      customer_first_name,
      customer_last_name,
      customer_phone,
      customer_email,
      date,
      time,
      service_type,
      staff_id,
      notes,
    } = params;

    // Mock appointment creation - replace with actual database integration
    const appointmentId = `APPT-${Date.now()}`;

    return {
      success: true,
      message: `Perfect! I've successfully scheduled your ${service_type} appointment for ${customer_first_name} ${customer_last_name} on ${date} at ${time}. Your appointment ID is ${appointmentId}. You'll receive a confirmation email at ${customer_email || 'your email address'}. Is there anything else I can help you with?`,
      data: {
        appointment_id: appointmentId,
        customer_name: `${customer_first_name} ${customer_last_name}`,
        date,
        time,
        service_type,
      },
    };
  } catch (error) {
    console.error('Error creating appointment:', error);
    return {
      success: false,
      message:
        'I encountered an issue while creating your appointment. Let me transfer you to our scheduling team to complete this booking.',
    };
  }
}

/**
 * Update an existing appointment
 */
async function updateAppointment(params: any, userId: string) {
  try {
    console.log('Updating appointment with params:', params);

    const { appointment_id, date, time, service_type, notes } = params;

    // Mock update - replace with actual database integration
    return {
      success: true,
      message: `I've successfully updated your appointment ${appointment_id}. Your new appointment is scheduled for ${date} at ${time}${service_type ? ` for ${service_type}` : ''}. You'll receive a confirmation email with the updated details.`,
      data: {
        appointment_id,
        new_date: date,
        new_time: time,
      },
    };
  } catch (error) {
    console.error('Error updating appointment:', error);
    return {
      success: false,
      message:
        'I had trouble updating your appointment. Let me connect you with our scheduling team to make this change.',
    };
  }
}

/**
 * Cancel an existing appointment
 */
async function cancelAppointment(params: any, userId: string) {
  try {
    console.log('Cancelling appointment with params:', params);

    const { appointment_id, reason } = params;

    // Mock cancellation - replace with actual database integration
    return {
      success: true,
      message: `I've successfully cancelled your appointment ${appointment_id}. You'll receive a confirmation email shortly. If you'd like to reschedule, I'd be happy to help you find another available time.`,
      data: {
        appointment_id,
        status: 'cancelled',
        reason,
      },
    };
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return {
      success: false,
      message:
        'I had trouble cancelling your appointment. Let me transfer you to our scheduling team to assist with this.',
    };
  }
}

/**
 * Find existing customer appointments
 */
async function findCustomerAppointments(params: any, userId: string) {
  try {
    console.log('Finding appointments with params:', params);

    const { last_name, phone_number, email } = params;

    // Mock search - replace with actual database integration
    const mockAppointments = [
      {
        id: 'APPT-12345',
        date: '2025-01-22',
        time: '10:00',
        service: 'Dental Cleaning',
        status: 'confirmed',
      },
    ];

    if (mockAppointments.length > 0) {
      const appointment = mockAppointments[0];
      return {
        success: true,
        message: `I found your appointment! You have a ${appointment.service} scheduled for ${appointment.date} at ${appointment.time}. Your appointment ID is ${appointment.id}. How can I help you with this appointment?`,
        data: mockAppointments,
      };
    } else {
      return {
        success: false,
        message: `I couldn't find any appointments under that information. Could you please verify your last name and phone number? Or would you like me to check with a different spelling?`,
      };
    }
  } catch (error) {
    console.error('Error finding appointments:', error);
    return {
      success: false,
      message:
        'I had trouble looking up your appointment information. Let me transfer you to our scheduling team for assistance.',
    };
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

      case 'tool_call':
        console.log('Tool call received:', JSON.stringify(request));
        try {
          return await handleToolCall(request, userId);
        } catch (error) {
          console.error('Failed to handle tool_call:', error);
          return NextResponse.json(
            { error: 'Tool call processing failed' },
            { status: 500 }
          );
        }

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
