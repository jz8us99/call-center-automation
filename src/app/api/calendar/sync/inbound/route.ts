import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

/**
 * Store inbound calendar events from external calendars
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth: supabase } = authResult;

    const body = await request.json();
    const { credential_id, events } = body;

    if (!credential_id || !events) {
      return NextResponse.json(
        { error: 'Credential ID and events are required' },
        { status: 400 }
      );
    }

    // Verify credential belongs to user's business
    const { data: credential, error: credentialError } = await supabase
      .from('staff_calendar_credentials')
      .select(
        `
        id,
        business_profiles!inner (
          user_id
        )
      `
      )
      .eq('id', credential_id)
      .eq('business_profiles.user_id', user.id)
      .single();

    if (credentialError || !credential) {
      return NextResponse.json(
        { error: 'Calendar credential not found or access denied' },
        { status: 404 }
      );
    }

    // Process each event
    const processedEvents = [];
    const errors = [];

    for (const event of events) {
      try {
        // Check if event already exists
        const { data: existingEvent } = await supabase
          .from('staff_calendar_events')
          .select('id')
          .eq('credential_id', credential_id)
          .eq('external_event_id', event.id)
          .single();

        const eventData = {
          credential_id,
          external_event_id: event.id,
          title: event.title,
          description: event.description,
          start_time: event.start_time,
          end_time: event.end_time,
          is_busy: event.is_busy,
          attendees: event.attendees,
          location: event.location,
          is_recurring: event.is_recurring,
          recurrence_rule: event.recurrence_rule,
          external_updated_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        };

        if (existingEvent) {
          // Update existing event
          const { data: updatedEvent, error: updateError } = await supabase
            .from('staff_calendar_events')
            .update(eventData)
            .eq('id', existingEvent.id)
            .select()
            .single();

          if (updateError) {
            errors.push({ event_id: event.id, error: updateError.message });
          } else {
            processedEvents.push(updatedEvent);
          }
        } else {
          // Insert new event
          const { data: newEvent, error: insertError } = await supabase
            .from('staff_calendar_events')
            .insert(eventData)
            .select()
            .single();

          if (insertError) {
            errors.push({ event_id: event.id, error: insertError.message });
          } else {
            processedEvents.push(newEvent);
          }
        }
      } catch (error) {
        console.error('Error processing event:', error);
        errors.push({
          event_id: event.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log sync activity
    const { error: logError } = await supabase
      .from('calendar_sync_logs')
      .insert({
        credential_id,
        sync_type: 'incremental',
        sync_direction: 'inbound',
        events_processed: events.length,
        events_created: processedEvents.filter(e => !e.updated_at).length,
        events_updated: processedEvents.filter(e => e.updated_at).length,
        events_deleted: 0,
        errors_count: errors.length,
        sync_status: errors.length === 0 ? 'success' : 'partial',
        error_details: errors.length > 0 ? { errors } : null,
        completed_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Error logging sync activity:', logError);
    }

    return NextResponse.json({
      success: true,
      processed_events: processedEvents.length,
      errors: errors.length,
      details: errors.length > 0 ? { errors } : null,
    });
  } catch (error) {
    console.error('Inbound calendar sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
