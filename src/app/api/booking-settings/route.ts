import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const businessId = searchParams.get('business_id');

    if (!userId || !businessId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const { data: settings, error } = await supabase
      .rpc('get_booking_settings', {
        p_user_id: userId,
        p_business_id: businessId,
      })
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching booking settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch booking settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: settings || null,
      success: true,
    });
  } catch (error) {
    console.error('Booking settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      user_id,
      business_id,
      advance_booking_days,
      min_booking_notice_hours,
      max_bookings_per_day,
      max_bookings_per_slot,
      default_slot_duration,
      slot_buffer_minutes,
      booking_window_start,
      booking_window_end,
      allow_same_day_booking,
      allow_weekend_booking,
      require_customer_info,
      require_phone_number,
      require_email_confirmation,
      allow_customer_cancellation,
      cancellation_notice_hours,
      allow_customer_reschedule,
      reschedule_notice_hours,
      send_booking_confirmation,
      send_reminder_email,
      reminder_hours_before,
      send_sms_reminders,
      blackout_dates,
      special_hours,
      booking_instructions,
      terms_and_conditions,
      online_booking_enabled,
      show_staff_names,
      show_prices,
      allow_service_selection,
      require_deposit,
      deposit_percentage,
    } = body;

    if (!user_id || !business_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if settings already exist
    const { data: existingSettings } = await supabase
      .from('booking_settings')
      .select('id')
      .eq('user_id', user_id)
      .eq('business_id', business_id)
      .single();

    let result;

    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from('booking_settings')
        .update({
          advance_booking_days,
          min_booking_notice_hours,
          max_bookings_per_day,
          max_bookings_per_slot,
          default_slot_duration,
          slot_buffer_minutes,
          booking_window_start,
          booking_window_end,
          allow_same_day_booking,
          allow_weekend_booking,
          require_customer_info,
          require_phone_number,
          require_email_confirmation,
          allow_customer_cancellation,
          cancellation_notice_hours,
          allow_customer_reschedule,
          reschedule_notice_hours,
          send_booking_confirmation,
          send_reminder_email,
          reminder_hours_before,
          send_sms_reminders,
          blackout_dates,
          special_hours,
          booking_instructions,
          terms_and_conditions,
          online_booking_enabled,
          show_staff_names,
          show_prices,
          allow_service_selection,
          require_deposit,
          deposit_percentage,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id)
        .eq('business_id', business_id)
        .select()
        .single();
    } else {
      // Create new settings
      result = await supabase
        .from('booking_settings')
        .insert({
          user_id,
          business_id,
          advance_booking_days,
          min_booking_notice_hours,
          max_bookings_per_day,
          max_bookings_per_slot,
          default_slot_duration,
          slot_buffer_minutes,
          booking_window_start,
          booking_window_end,
          allow_same_day_booking,
          allow_weekend_booking,
          require_customer_info,
          require_phone_number,
          require_email_confirmation,
          allow_customer_cancellation,
          cancellation_notice_hours,
          allow_customer_reschedule,
          reschedule_notice_hours,
          send_booking_confirmation,
          send_reminder_email,
          reminder_hours_before,
          send_sms_reminders,
          blackout_dates: blackout_dates || [],
          special_hours: special_hours || {},
          booking_instructions,
          terms_and_conditions,
          online_booking_enabled,
          show_staff_names,
          show_prices,
          allow_service_selection,
          require_deposit,
          deposit_percentage,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving booking settings:', result.error);
      return NextResponse.json(
        { error: 'Failed to save booking settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: result.data,
      success: true,
    });
  } catch (error) {
    console.error('Booking settings POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
