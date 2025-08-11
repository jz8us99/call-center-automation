import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

// GET - Get available time slots for booking
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const { searchParams } = new URL(request.url);

    const business_id = searchParams.get('business_id');
    const staff_id = searchParams.get('staff_id');
    const date = searchParams.get('date');
    const appointment_type_id = searchParams.get('appointment_type_id');
    const duration_minutes = searchParams.get('duration_minutes');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    if (!business_id) {
      return NextResponse.json(
        {
          error: 'Business ID is required',
        },
        { status: 400 }
      );
    }

    if (!date && !start_date) {
      return NextResponse.json(
        {
          error: 'Either date or start_date is required',
        },
        { status: 400 }
      );
    }

    // Get appointment type details if provided
    let appointmentType: any = null;
    let serviceDuration = parseInt(duration_minutes || '30');
    let bufferTime = 15;

    if (appointment_type_id) {
      const { data: typeData } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('id', appointment_type_id)
        .eq('business_id', business_id)
        .single();

      if (typeData) {
        appointmentType = typeData;
        serviceDuration = typeData.duration_minutes;
        bufferTime = Math.max(
          typeData.buffer_before_minutes || 0,
          typeData.buffer_after_minutes || 0
        );
      }
    }

    // Get business appointment settings
    const { data: businessSettings } = await supabase
      .from('business_appointment_settings')
      .select('*')
      .eq('business_id', business_id)
      .single();

    const settings = businessSettings || {
      min_advance_hours: 24,
      slot_duration_minutes: 30,
      buffer_between_appointments: 15,
      same_day_booking_enabled: true,
    };

    // Determine which staff to check
    let staffToCheck: string[] = [];

    if (staff_id) {
      staffToCheck = [staff_id];
    } else {
      // Get all active staff for the business
      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', business_id) // Assuming business_id maps to user_id
        .eq('is_active', true);

      if (staffData) {
        staffToCheck = staffData.map(s => s.id);
      }
    }

    if (staffToCheck.length === 0) {
      return NextResponse.json({
        available_slots: [],
        message: 'No staff available',
      });
    }

    // Prepare date range
    const datesToCheck: string[] = [];
    if (date) {
      datesToCheck.push(date);
    } else {
      const startDate = new Date(start_date!);
      const endDate = new Date(end_date || start_date!);

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        datesToCheck.push(d.toISOString().split('T')[0]);
      }
    }

    const allAvailableSlots: any[] = [];

    // Check each date and staff combination
    for (const checkDate of datesToCheck) {
      for (const staffMemberId of staffToCheck) {
        // Get available time slots for this staff member on this date
        const { data: timeSlots, error } = await supabase.rpc(
          'get_available_time_slots',
          {
            p_staff_id: staffMemberId,
            p_date: checkDate,
            p_duration_minutes: serviceDuration,
            p_buffer_minutes: bufferTime,
          }
        );

        if (error) {
          console.error('Error getting time slots:', error);
          continue;
        }

        if (timeSlots && timeSlots.length > 0) {
          // Get staff details
          const { data: staffDetails } = await supabase
            .from('staff')
            .select('id, first_name, last_name, title')
            .eq('id', staffMemberId)
            .single();

          // Filter available slots and format response
          const availableSlots = timeSlots
            .filter((slot: { is_available: boolean }) => slot.is_available)
            .map((slot: { slot_time: string }) => {
              // Calculate end time from start time and duration
              const startTime = new Date(`2000-01-01 ${slot.slot_time}`);
              const endTime = new Date(
                startTime.getTime() + serviceDuration * 60000
              );
              const endTimeString = endTime.toTimeString().slice(0, 8);

              return {
                date: checkDate,
                start_time: slot.slot_time,
                end_time: endTimeString,
                duration_minutes: serviceDuration,
                staff_id: staffMemberId,
                staff_name: staffDetails
                  ? `${staffDetails.first_name} ${staffDetails.last_name}`
                  : 'Unknown',
                staff_title: staffDetails?.title || '',
                appointment_type_id: appointment_type_id || null,
                price: appointmentType?.price || null,
                booking_available: true,
              };
            });

          allAvailableSlots.push(...availableSlots);
        }
      }
    }

    // Apply business rules and filtering
    const now = new Date();
    const minAdvanceTime = new Date(
      now.getTime() + settings.min_advance_hours * 60 * 60 * 1000
    );

    const filteredSlots = allAvailableSlots.filter(slot => {
      const slotDateTime = new Date(`${slot.date}T${slot.start_time}`);

      // Check minimum advance booking time
      if (slotDateTime < minAdvanceTime && !settings.same_day_booking_enabled) {
        return false;
      }

      // Check appointment type specific rules
      if (appointmentType) {
        const daysDifference = Math.ceil(
          (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDifference < appointmentType.advance_booking_days) {
          return false;
        }

        if (daysDifference > appointmentType.max_advance_booking_days) {
          return false;
        }

        // Check if same day booking is allowed for this appointment type
        if (daysDifference === 0 && !appointmentType.same_day_booking) {
          return false;
        }
      }

      return true;
    });

    // Sort by date and time
    filteredSlots.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return a.start_time.localeCompare(b.start_time);
    });

    // Group by date for easier frontend consumption
    const slotsByDate = filteredSlots.reduce(
      (acc: Record<string, unknown[]>, slot) => {
        if (!acc[slot.date]) {
          acc[slot.date] = [];
        }
        acc[slot.date].push(slot);
        return acc;
      },
      {}
    );

    return NextResponse.json({
      available_slots: filteredSlots,
      slots_by_date: slotsByDate,
      total_slots: filteredSlots.length,
      dates_checked: datesToCheck,
      staff_checked: staffToCheck.length,
      appointment_type: appointmentType,
      business_settings: settings,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Check specific time slot availability (for booking validation)
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const body = await request.json();

    const {
      business_id,
      staff_id,
      date,
      start_time,
      end_time,
      appointment_type_id,
      exclude_appointment_id,
    } = body;

    if (!business_id || !staff_id || !date || !start_time || !end_time) {
      return NextResponse.json(
        {
          error:
            'Business ID, staff ID, date, start time, and end time are required',
        },
        { status: 400 }
      );
    }

    // Check if the specific slot is available
    const { data: isAvailable, error } = await supabase.rpc(
      'is_appointment_slot_available',
      {
        p_staff_id: staff_id,
        p_date: date,
        p_start_time: start_time,
        p_end_time: end_time,
        p_exclude_appointment_id: exclude_appointment_id,
      }
    );

    if (error) {
      console.error('Error checking slot availability:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    let unavailabilityReason: string | null = null;

    if (!isAvailable) {
      // Get more details about why it's not available

      // Check staff availability
      const { data: staffAvailability } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', staff_id)
        .eq('date', date)
        .single();

      if (!staffAvailability || !staffAvailability.is_available) {
        unavailabilityReason =
          staffAvailability?.reason || 'Staff not available';
      } else {
        // Check for conflicting appointments
        const { data: conflicts } = await supabase
          .from('appointments')
          .select('id, start_time, end_time, status')
          .eq('staff_id', staff_id)
          .eq('appointment_date', date)
          .not('status', 'in', '(cancelled,no_show)')
          .or(
            `and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time}),and(start_time.gte.${start_time},end_time.lte.${end_time})`
          );

        if (conflicts && conflicts.length > 0) {
          if (exclude_appointment_id) {
            const actualConflicts = conflicts.filter(
              c => c.id !== exclude_appointment_id
            );
            if (actualConflicts.length > 0) {
              unavailabilityReason =
                'Time slot conflicts with existing appointment';
            } else {
              // No actual conflicts, the slot is available
              return NextResponse.json({
                available: true,
                slot: {
                  date,
                  start_time,
                  end_time,
                  staff_id,
                },
              });
            }
          } else {
            unavailabilityReason =
              'Time slot conflicts with existing appointment';
          }
        }
      }
    }

    // Get appointment type details for additional validation
    let appointmentType: any = null;
    if (appointment_type_id) {
      const { data: typeData } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('id', appointment_type_id)
        .eq('business_id', business_id)
        .single();

      appointmentType = typeData;
    }

    // Additional business rule checks
    if (isAvailable && appointmentType) {
      const slotDateTime = new Date(`${date}T${start_time}`);
      const now = new Date();
      const daysDifference = Math.ceil(
        (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDifference < appointmentType.advance_booking_days) {
        return NextResponse.json({
          available: false,
          reason: `Appointments must be booked at least ${appointmentType.advance_booking_days} day(s) in advance`,
          slot: { date, start_time, end_time, staff_id },
        });
      }

      if (daysDifference > appointmentType.max_advance_booking_days) {
        return NextResponse.json({
          available: false,
          reason: `Appointments cannot be booked more than ${appointmentType.max_advance_booking_days} days in advance`,
          slot: { date, start_time, end_time, staff_id },
        });
      }

      if (daysDifference === 0 && !appointmentType.same_day_booking) {
        return NextResponse.json({
          available: false,
          reason: 'Same-day booking is not allowed for this appointment type',
          slot: { date, start_time, end_time, staff_id },
        });
      }
    }

    return NextResponse.json({
      available: isAvailable,
      reason: unavailabilityReason,
      slot: {
        date,
        start_time,
        end_time,
        staff_id,
      },
      appointment_type: appointmentType,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
