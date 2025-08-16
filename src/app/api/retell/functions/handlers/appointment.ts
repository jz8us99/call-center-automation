import { FunctionContext } from '../types';
import { AppointmentService } from '@/lib/services/appointment-service';

const appointmentService = new AppointmentService();

/**
 * Handle check_existing_appointment function
 */
export async function handleCheckExistingAppointment(
  args: Record<string, any>,
  context: FunctionContext
): Promise<Record<string, any>> {
  try {
    const { customerId } = args;

    if (!customerId) {
      return {
        success: false,
        message: 'I need to identify you first before checking appointments.',
      };
    }

    const appointment =
      await appointmentService.checkExistingAppointment(customerId);

    if (appointment) {
      // Combine appointment_date and start_time to create a full Date
      const date = new Date(
        `${appointment.appointment_date}T${appointment.start_time}`
      );
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return {
        success: true,
        hasAppointment: true,
        appointmentId: appointment.id,
        date: formattedDate,
        time: formattedTime,
        jobType: appointment.job_type,
        staffName: (appointment as any).staff?.display_name,
        message: `You have an appointment scheduled for ${formattedDate} at ${formattedTime} with ${(appointment as any).staff?.display_name} for ${appointment.job_type}.`,
      };
    } else {
      return {
        success: true,
        hasAppointment: false,
        message:
          "You don't have any upcoming appointments. Would you like to schedule one?",
      };
    }
  } catch (error) {
    console.error('Error in check_existing_appointment:', error);
    return {
      success: false,
      message: 'I had trouble checking your appointments. Let me try again.',
    };
  }
}

/**
 * Handle get_staff_options_for_job_type function
 */
export async function handleGetStaffOptions(
  args: Record<string, any>,
  context: FunctionContext
): Promise<Record<string, any>> {
  try {
    const { jobType } = args;

    if (!jobType) {
      return {
        success: false,
        message: 'What type of service do you need?',
      };
    }

    const staff = await appointmentService.getStaffForJobType(jobType);

    console.log('[handleGetStaffOptions] Staff found:', staff);

    if (staff.length === 0) {
      return {
        success: false,
        message: `I'm sorry, we don't currently have staff available for ${jobType}. Is there another service I can help you with?`,
      };
    }

    const staffList = staff.map(s => {
      // Try multiple fields to get the staff name
      const name =
        s.display_name ||
        s.full_name ||
        `${s.first_name || ''} ${s.last_name || ''}`.trim() ||
        'Staff Member';
      return {
        id: s.id,
        name: name,
      };
    });

    const staffNames = staffList.map(s => s.name).join(', ');

    return {
      success: true,
      staff: staffList,
      message: `For ${jobType}, we have the following staff available: ${staffNames}. Do you have a preference, or would you like me to find the earliest available appointment?`,
    };
  } catch (error) {
    console.error('Error in get_staff_options:', error);
    return {
      success: false,
      message: 'I had trouble finding available staff. Let me try again.',
    };
  }
}

/**
 * Handle find_openings function
 */
export async function handleFindOpenings(
  args: Record<string, any>,
  context: FunctionContext
): Promise<Record<string, any>> {
  try {
    const { staffId, jobType, durationMins, dateFrom, dateTo } = args;

    if (!jobType) {
      return {
        success: false,
        message: 'What type of service do you need?',
      };
    }

    const slots = await appointmentService.findOpenings({
      staffId,
      jobType,
      durationMins,
      dateFrom,
      dateTo,
    });

    if (slots.length === 0) {
      return {
        success: false,
        message:
          "I'm sorry, I couldn't find any available appointments in that timeframe. Would you like me to check a different date range?",
      };
    }

    // Format the first few slots for speech
    const formattedSlots = slots.slice(0, 3).map(slot => {
      const date = new Date(slot.start);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const monthDay = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const time = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return {
        ...slot,
        spoken: `${dayName}, ${monthDay} at ${time}${slot.staffName ? ` with ${slot.staffName}` : ''}`,
      };
    });

    const slotList = formattedSlots.map(s => s.spoken).join(', ');

    return {
      success: true,
      slots: slots.map(s => ({
        start: s.start,
        end: s.end,
        staffId: s.staffId,
        staffName: s.staffName,
      })),
      message: `I have the following appointments available: ${slotList}. Which one works best for you?`,
    };
  } catch (error) {
    console.error('Error in find_openings:', error);
    return {
      success: false,
      message:
        'I had trouble finding available appointments. Let me try again.',
    };
  }
}

/**
 * Handle book_appointment function
 */
export async function handleBookAppointment(
  args: Record<string, any>,
  context: FunctionContext
): Promise<Record<string, any>> {
  try {
    const { customerId, staffId, jobType, startsAt, durationMins } = args;

    if (!customerId || !staffId || !jobType || !startsAt) {
      return {
        success: false,
        message:
          'I need a few more details to book your appointment. Let me confirm what we have so far.',
      };
    }

    // Get business_id from business_profiles table
    let businessId = null;
    if (context.userId) {
      console.log(
        `[handleBookAppointment] Looking up business_id for user_id: ${context.userId}`
      );
      const { supabaseAdmin } = await import('@/lib/supabase-admin');
      const { data: businessProfile, error: businessError } =
        await supabaseAdmin
          .from('business_profiles')
          .select('id')
          .eq('user_id', context.userId)
          .eq('is_active', true)
          .single();

      if (businessError) {
        console.error(
          `[handleBookAppointment] Error getting business_id:`,
          businessError
        );
        // Continue without business_id rather than failing
      } else {
        businessId = businessProfile?.id;
        console.log(`[handleBookAppointment] Found business_id: ${businessId}`);
      }
    }

    const appointment = await appointmentService.bookAppointment({
      customerId,
      staffId,
      jobType,
      startsAt,
      durationMins,
      userId: context.userId,
      businessId,
    });

    const date = new Date(appointment.starts_at);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return {
      success: true,
      appointmentId: appointment.id,
      confirmationNumber: appointment.id?.slice(-6).toUpperCase(),
      message: `Perfect! I've booked your appointment for ${formattedDate} at ${formattedTime}. Your confirmation number is ${appointment.id?.slice(-6).toUpperCase()}. You'll receive a confirmation email shortly.`,
    };
  } catch (error) {
    console.error('Error in book_appointment:', error);

    if (
      error instanceof Error &&
      error.message.includes('no longer available')
    ) {
      return {
        success: false,
        message:
          "I'm sorry, that time slot was just booked. Let me find another available time for you.",
      };
    }

    return {
      success: false,
      message: 'I had trouble booking your appointment. Let me try again.',
    };
  }
}

/**
 * Handle handoff_to_agent function
 */
export async function handleHandoffToAgent(
  args: Record<string, any>,
  context: FunctionContext
): Promise<Record<string, any>> {
  try {
    const { target, contextData } = args;

    if (!target) {
      return {
        success: false,
        message: 'I need to know which department to transfer you to.',
      };
    }

    // Store context for the target agent
    if (contextData && context.call?.call_id) {
      // TODO: Store context in Redis or database for the target agent to retrieve
    }

    const targetName =
      target === 'receptionist' ? 'our receptionist' : 'customer support';

    return {
      success: true,
      action: 'transfer',
      target,
      message: `I'll transfer you to ${targetName} now. One moment please.`,
    };
  } catch (error) {
    console.error('Error in handoff_to_agent:', error);
    return {
      success: false,
      message:
        'I had trouble transferring your call. Please hold while I try again.',
    };
  }
}
