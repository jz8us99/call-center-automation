import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

/**
 * Get system events for outbound calendar sync
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth: supabase } = authResult;

    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('credential_id');

    if (!credentialId) {
      return NextResponse.json(
        { error: 'Credential ID is required' },
        { status: 400 }
      );
    }

    // Verify credential belongs to user's business
    const { data: credential, error: credentialError } = await supabase
      .from('staff_calendar_credentials')
      .select(
        `
        id,
        staff_id,
        business_profiles!inner (
          user_id
        )
      `
      )
      .eq('id', credentialId)
      .eq('business_profiles.user_id', user.id)
      .single();

    if (credentialError || !credential) {
      return NextResponse.json(
        { error: 'Calendar credential not found or access denied' },
        { status: 404 }
      );
    }

    // Get system appointments that need to be synced to external calendar
    // This would typically be appointments booked through the AI system
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments') // Assuming there's an appointments table
      .select('*')
      .eq('staff_id', credential.staff_id)
      .gte('start_time', new Date().toISOString()) // Only future appointments
      .eq('status', 'confirmed')
      .is('external_calendar_id', null); // Not yet synced to external calendar

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch system appointments' },
        { status: 500 }
      );
    }

    // Transform appointments to calendar event format
    const events = (appointments || []).map(appointment => ({
      id: appointment.id,
      title: `${appointment.service_name || 'Appointment'} - ${appointment.customer_name || 'Customer'}`,
      description:
        appointment.notes || `Appointment booked through AI receptionist`,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      is_busy: true,
      attendees: appointment.customer_email
        ? [
            {
              email: appointment.customer_email,
              name: appointment.customer_name,
            },
          ]
        : [],
      location: appointment.location || '',
      is_recurring: false,
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Outbound calendar sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Mark system events as synced to external calendar
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth: supabase } = authResult;

    const body = await request.json();
    const { credential_id, synced_events } = body;

    if (!credential_id || !synced_events) {
      return NextResponse.json(
        { error: 'Credential ID and synced events are required' },
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

    // Update appointments with external calendar IDs
    const updatePromises = synced_events.map(async (event: any) => {
      return supabase
        .from('appointments')
        .update({
          external_calendar_id: event.external_id,
          external_calendar_provider: 'google', // or 'outlook' based on credential
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', event.system_id);
    });

    await Promise.all(updatePromises);

    // Log sync activity
    const { error: logError } = await supabase
      .from('calendar_sync_logs')
      .insert({
        credential_id,
        sync_type: 'incremental',
        sync_direction: 'outbound',
        events_processed: synced_events.length,
        events_created: synced_events.length,
        events_updated: 0,
        events_deleted: 0,
        errors_count: 0,
        sync_status: 'success',
        completed_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Error logging sync activity:', logError);
    }

    return NextResponse.json({
      success: true,
      synced_count: synced_events.length,
    });
  } catch (error) {
    console.error('Outbound calendar sync mark error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
