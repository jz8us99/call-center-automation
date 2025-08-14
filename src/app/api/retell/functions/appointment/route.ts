import { NextRequest, NextResponse } from 'next/server';
import { AppointmentService } from '@/lib/services/appointment-service';
import { validateWebhookSignature } from '@/lib/webhook-validation';

const appointmentService = new AppointmentService();

export async function POST(request: NextRequest) {
  try {
    // Validate webhook signature
    const signature = request.headers.get('x-retell-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    const body = await request.text();
    const isValid = await validateWebhookSignature(body, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const data = JSON.parse(body);
    const { function_name, function_args, call } = data;

    console.log(`Processing Retell function: ${function_name}`, function_args);

    let result;
    
    switch (function_name) {
      case 'lookup_customer':
        result = await handleLookupCustomer(function_args);
        break;
      
      case 'upsert_customer':
        result = await handleUpsertCustomer(function_args);
        break;
      
      case 'check_existing_appointment':
        result = await handleCheckExistingAppointment(function_args);
        break;
      
      case 'get_staff_options_for_job_type':
        result = await handleGetStaffOptions(function_args);
        break;
      
      case 'find_openings':
        result = await handleFindOpenings(function_args);
        break;
      
      case 'book_appointment':
        result = await handleBookAppointment(function_args);
        break;
      
      case 'handoff_to_agent':
        result = await handleHandoffToAgent(function_args, call);
        break;
      
      default:
        return NextResponse.json(
          { error: `Unknown function: ${function_name}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      response: result
    });
  } catch (error) {
    console.error('Error processing Retell function:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleLookupCustomer(args: any) {
  try {
    const { lastName, phone } = args;
    
    if (!lastName || !phone) {
      return {
        success: false,
        message: "I need both last name and phone number to look up your record."
      };
    }

    const customer = await appointmentService.lookupCustomer(lastName, phone);
    
    if (customer) {
      return {
        success: true,
        customerId: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        email: customer.email,
        message: `Found your record, ${customer.first_name}.`
      };
    } else {
      return {
        success: false,
        message: "I couldn't find a record with that information. Let me create a new profile for you."
      };
    }
  } catch (error) {
    console.error('Error in lookup_customer:', error);
    return {
      success: false,
      message: "I had trouble looking up your information. Let me try again."
    };
  }
}

async function handleUpsertCustomer(args: any) {
  try {
    const { firstName, lastName, phone, email } = args;
    
    if (!firstName || !lastName || !phone) {
      return {
        success: false,
        message: "I need your first name, last name, and phone number to create your profile."
      };
    }

    const customer = await appointmentService.upsertCustomer({
      first_name: firstName,
      last_name: lastName,
      phone,
      email
    });

    return {
      success: true,
      customerId: customer.id,
      message: `Perfect! I've ${customer.created_at === customer.updated_at ? 'created' : 'updated'} your profile.`
    };
  } catch (error) {
    console.error('Error in upsert_customer:', error);
    return {
      success: false,
      message: "I had trouble saving your information. Let me try again."
    };
  }
}

async function handleCheckExistingAppointment(args: any) {
  try {
    const { customerId } = args;
    
    if (!customerId) {
      return {
        success: false,
        message: "I need to identify you first before checking appointments."
      };
    }

    const appointment = await appointmentService.checkExistingAppointment(customerId);
    
    if (appointment) {
      const date = new Date(appointment.starts_at);
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      return {
        success: true,
        hasAppointment: true,
        appointmentId: appointment.id,
        date: formattedDate,
        time: formattedTime,
        jobType: appointment.job_type,
        staffName: appointment.staff?.display_name,
        message: `You have an appointment scheduled for ${formattedDate} at ${formattedTime} with ${appointment.staff?.display_name} for ${appointment.job_type}.`
      };
    } else {
      return {
        success: true,
        hasAppointment: false,
        message: "You don't have any upcoming appointments. Would you like to schedule one?"
      };
    }
  } catch (error) {
    console.error('Error in check_existing_appointment:', error);
    return {
      success: false,
      message: "I had trouble checking your appointments. Let me try again."
    };
  }
}

async function handleGetStaffOptions(args: any) {
  try {
    const { jobType } = args;
    
    if (!jobType) {
      return {
        success: false,
        message: "What type of service do you need?"
      };
    }

    const staff = await appointmentService.getStaffForJobType(jobType);
    
    if (staff.length === 0) {
      return {
        success: false,
        message: `I'm sorry, we don't currently have staff available for ${jobType}. Is there another service I can help you with?`
      };
    }

    const staffList = staff.map(s => ({
      id: s.id,
      name: s.display_name
    }));

    const staffNames = staff.map(s => s.display_name).join(', ');

    return {
      success: true,
      staff: staffList,
      message: `For ${jobType}, we have the following staff available: ${staffNames}. Do you have a preference, or would you like me to find the earliest available appointment?`
    };
  } catch (error) {
    console.error('Error in get_staff_options:', error);
    return {
      success: false,
      message: "I had trouble finding available staff. Let me try again."
    };
  }
}

async function handleFindOpenings(args: any) {
  try {
    const { staffId, jobType, durationMins, dateFrom, dateTo } = args;
    
    if (!jobType) {
      return {
        success: false,
        message: "What type of service do you need?"
      };
    }

    const slots = await appointmentService.findOpenings({
      staffId,
      jobType,
      durationMins,
      dateFrom,
      dateTo
    });

    if (slots.length === 0) {
      return {
        success: false,
        message: "I'm sorry, I couldn't find any available appointments in that timeframe. Would you like me to check a different date range?"
      };
    }

    // Format the first few slots for speech
    const formattedSlots = slots.slice(0, 3).map(slot => {
      const date = new Date(slot.start);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const time = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      return {
        ...slot,
        spoken: `${dayName}, ${monthDay} at ${time}${slot.staffName ? ` with ${slot.staffName}` : ''}`
      };
    });

    const slotList = formattedSlots.map(s => s.spoken).join(', ');

    return {
      success: true,
      slots: slots.map(s => ({
        start: s.start,
        end: s.end,
        staffId: s.staffId,
        staffName: s.staffName
      })),
      message: `I have the following appointments available: ${slotList}. Which one works best for you?`
    };
  } catch (error) {
    console.error('Error in find_openings:', error);
    return {
      success: false,
      message: "I had trouble finding available appointments. Let me try again."
    };
  }
}

async function handleBookAppointment(args: any) {
  try {
    const { customerId, staffId, jobType, startsAt, durationMins } = args;
    
    if (!customerId || !staffId || !jobType || !startsAt) {
      return {
        success: false,
        message: "I need a few more details to book your appointment. Let me confirm what we have so far."
      };
    }

    const appointment = await appointmentService.bookAppointment({
      customerId,
      staffId,
      jobType,
      startsAt,
      durationMins
    });

    const date = new Date(appointment.starts_at);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return {
      success: true,
      appointmentId: appointment.id,
      confirmationNumber: appointment.id?.slice(-6).toUpperCase(),
      message: `Perfect! I've booked your appointment for ${formattedDate} at ${formattedTime}. Your confirmation number is ${appointment.id?.slice(-6).toUpperCase()}. You'll receive a confirmation email shortly.`
    };
  } catch (error) {
    console.error('Error in book_appointment:', error);
    
    if (error instanceof Error && error.message.includes('no longer available')) {
      return {
        success: false,
        message: "I'm sorry, that time slot was just booked. Let me find another available time for you."
      };
    }
    
    return {
      success: false,
      message: "I had trouble booking your appointment. Let me try again."
    };
  }
}

async function handleHandoffToAgent(args: any, call: any) {
  try {
    const { target, context } = args;
    
    if (!target) {
      return {
        success: false,
        message: "I need to know which department to transfer you to."
      };
    }

    // Store context for the target agent
    if (context && call?.call_id) {
      // TODO: Store context in Redis or database for the target agent to retrieve
    }

    const targetName = target === 'receptionist' ? 'our receptionist' : 'customer support';

    return {
      success: true,
      action: 'transfer',
      target,
      message: `I'll transfer you to ${targetName} now. One moment please.`
    };
  } catch (error) {
    console.error('Error in handoff_to_agent:', error);
    return {
      success: false,
      message: "I had trouble transferring your call. Please hold while I try again."
    };
  }
}