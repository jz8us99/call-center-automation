import { NextRequest, NextResponse } from 'next/server';

interface BusinessContext {
  business_profile?: {
    business_name: string;
    business_type: string;
    business_description?: string;
    business_address?: string;
    business_phone?: string;
    business_email?: string;
    website_url?: string;
    business_hours_description?: string;
    payment_methods?: string[];
    common_questions?: string[];
    support_content?: string[];
  };
  products: Array<{
    name: string;
    description?: string;
    price?: number;
    category?: string;
  }>;
  services: Array<{
    name: string;
    description?: string;
    duration?: number;
    price?: number;
    category?: string;
  }>;
  staff: Array<{
    first_name: string;
    last_name: string;
    title: string;
    specialties: string[];
    has_calendar_config: boolean;
  }>;
  office_hours: Array<{
    day_name: string;
    formatted_hours: string;
    is_active: boolean;
  }>;
  appointment_types: Array<{
    name: string;
    description?: string;
    duration?: number;
    price?: number;
  }>;
  upcoming_holidays: Array<{
    holiday_date: string;
    holiday_name: string;
    description?: string;
  }>;
}

function generateAgentPrompt(
  agentType: string,
  personality: string,
  context: BusinessContext
): {
  greeting_message: string;
  custom_instructions: string;
} {
  const businessName =
    context.business_profile?.business_name || '[Business Name]';
  const businessType = context.business_profile?.business_type || 'business';

  // Generate greeting message based on agent type
  const greetings = {
    inbound_call: `Hello! Thank you for calling ${businessName}. I'm your AI assistant and I'm here to help you today. How may I assist you?`,
    outbound_call: `Hi! This is your AI assistant from ${businessName}. I hope I'm reaching you at a good time. I'm calling regarding your ${businessType === 'healthcare' ? 'appointment' : 'service'} with us.`,
    appointment_booking: `Hello! Thank you for calling ${businessName}. I'm your appointment specialist and I'd be happy to help you schedule your ${businessType === 'healthcare' ? 'appointment' : 'service'}. What can I help you with today?`,
    customer_support: `Hi! Thank you for contacting ${businessName}. I'm your customer support assistant and I'm here to help resolve any questions or concerns you may have. How can I assist you today?`,
  };

  // Generate business hours section
  const activeHours = context.office_hours.filter(h => h.is_active);
  const businessHoursText =
    activeHours.length > 0
      ? `Our business hours are: ${activeHours.map(h => `${h.day_name} ${h.formatted_hours}`).join(', ')}.`
      : 'Please check our website or call during business hours for our current schedule.';

  // Generate services/products section
  let servicesText = '';
  if (context.services.length > 0) {
    servicesText = `\n\nServices we offer:\n${context.services
      .map(
        s =>
          `- ${s.name}${s.duration ? ` (${s.duration} minutes)` : ''}${s.price ? ` - $${s.price}` : ''}${s.description ? `: ${s.description}` : ''}`
      )
      .join('\n')}`;
  }

  let productsText = '';
  if (context.products.length > 0) {
    productsText = `\n\nProducts we offer:\n${context.products
      .map(
        p =>
          `- ${p.name}${p.price ? ` - $${p.price}` : ''}${p.description ? `: ${p.description}` : ''}`
      )
      .join('\n')}`;
  }

  // Generate staff information
  let staffText = '';
  if (context.staff.length > 0) {
    staffText = `\n\nOur team members:\n${context.staff
      .map(
        s =>
          `- ${s.first_name} ${s.last_name}, ${s.title}${s.specialties.length > 0 ? ` (specializes in: ${s.specialties.join(', ')})` : ''}`
      )
      .join('\n')}`;
  }

  // Generate appointment types section
  let appointmentTypesText = '';
  if (context.appointment_types.length > 0) {
    appointmentTypesText = `\n\nAvailable appointment types:\n${context.appointment_types
      .map(
        a =>
          `- ${a.name}${a.duration ? ` (${a.duration} minutes)` : ''}${a.price ? ` - $${a.price}` : ''}${a.description ? `: ${a.description}` : ''}`
      )
      .join('\n')}`;
  }

  // Generate holidays section
  let holidaysText = '';
  if (context.upcoming_holidays.length > 0) {
    holidaysText = `\n\nUpcoming holidays/closures:\n${context.upcoming_holidays
      .map(
        h =>
          `- ${h.holiday_name} on ${new Date(h.holiday_date).toLocaleDateString()}${h.description ? `: ${h.description}` : ''}`
      )
      .join('\n')}`;
  }

  // Personality-based tone adjustments
  const personalityInstructions = {
    professional:
      'Maintain a professional, courteous, and efficient tone. Be direct but polite in all interactions.',
    friendly:
      'Use a warm, welcoming, and conversational tone. Make customers feel comfortable and valued.',
    technical:
      'Provide detailed, accurate information. Be thorough in explanations and comfortable with technical terminology.',
  };

  // Agent type specific instructions
  const agentTypeInstructions = {
    inbound_call: `
**PRIMARY ROLE:** Handle incoming customer calls with efficiency and care.

**KEY RESPONSIBILITIES:**
1. Answer calls promptly and professionally
2. Identify customer needs quickly
3. Book appointments when requested
4. Provide accurate information about services and products
5. Transfer calls to appropriate staff when necessary
6. Handle basic customer service inquiries
7. Schedule callbacks if needed

**APPOINTMENT BOOKING PROCESS:**
- Ask for customer's preferred date and time
- Check staff availability
- Confirm appointment details
- Collect necessary contact information
- Send confirmation details`,

    outbound_call: `
**PRIMARY ROLE:** Make professional outbound calls for reminders, follow-ups, and surveys.

**KEY RESPONSIBILITIES:**
1. Appointment reminders (call 24-48 hours before)
2. Follow-up calls after service completion
3. Rescheduling appointments when needed
4. Customer satisfaction surveys
5. Promotional calls (when appropriate)

**OUTBOUND CALL GUIDELINES:**
- Always identify yourself and the business
- Respect customer's time and availability
- Be prepared with all relevant information
- Offer to call back at a more convenient time if needed`,

    appointment_booking: `
**PRIMARY ROLE:** Specialized appointment scheduling and management.

**KEY RESPONSIBILITIES:**
1. Schedule new appointments efficiently
2. Handle rescheduling requests
3. Manage cancellations professionally
4. Coordinate with staff calendars
5. Send appointment confirmations
6. Handle appointment-related inquiries

**BOOKING BEST PRACTICES:**
- Always confirm date, time, and service type
- Provide clear directions if needed
- Explain preparation requirements
- Offer alternative times if preferred slot is unavailable`,

    customer_support: `
**PRIMARY ROLE:** Provide comprehensive customer support and resolve issues.

**KEY RESPONSIBILITIES:**
1. Answer customer questions thoroughly
2. Troubleshoot common issues
3. Escalate complex problems appropriately
4. Provide product/service information
5. Handle complaints professionally
6. Follow up on resolved issues

**SUPPORT GUIDELINES:**
- Listen actively to customer concerns
- Ask clarifying questions when needed
- Provide step-by-step solutions
- Confirm customer satisfaction before ending calls`,
  };

  const customInstructions = `
**BUSINESS CONTEXT:**
You are an AI assistant for ${businessName}, ${context.business_profile?.business_description ? context.business_profile.business_description : `a ${businessType} business`}.

${businessHoursText}
${context.business_profile?.business_address ? `\nWe are located at: ${context.business_profile.business_address}` : ''}
${context.business_profile?.business_phone ? `\nOur phone number is: ${context.business_profile.business_phone}` : ''}
${context.business_profile?.website_url ? `\nOur website: ${context.business_profile.website_url}` : ''}

${agentTypeInstructions[agentType as keyof typeof agentTypeInstructions] || agentTypeInstructions.inbound_call}

**PERSONALITY & TONE:**
${personalityInstructions[personality as keyof typeof personalityInstructions] || personalityInstructions.professional}

**BUSINESS INFORMATION:**
${servicesText}
${productsText}
${appointmentTypesText}
${staffText}
${holidaysText}

**PAYMENT INFORMATION:**
${
  context.business_profile?.payment_methods &&
  context.business_profile.payment_methods.length > 0
    ? `We accept: ${context.business_profile.payment_methods.join(', ')}`
    : 'Please ask about payment options during your visit.'
}

**COMMON QUESTIONS & ANSWERS:**
${
  context.business_profile?.common_questions &&
  context.business_profile.common_questions.length > 0
    ? context.business_profile.common_questions
        .map((q, i) => `Q${i + 1}: ${q}`)
        .join('\n')
    : 'Be prepared to answer general questions about our services and availability.'
}

**IMPORTANT GUIDELINES:**
1. Always be helpful, accurate, and professional
2. If you don't know something, admit it and offer to find out
3. Protect customer privacy and confidential information
4. Never make promises about services or pricing without confirmation
5. Always confirm important details like appointments and contact information
6. If a situation requires human assistance, transfer the call appropriately

**EMERGENCY PROTOCOLS:**
- For medical emergencies: Direct caller to call 911 immediately
- For urgent business matters: Transfer to available staff or take detailed message
- For after-hours calls: Provide business hours and emergency contact if available

Remember: You represent ${businessName} and should always maintain our professional standards while being helpful and courteous to every caller.`;

  return {
    greeting_message:
      greetings[agentType as keyof typeof greetings] || greetings.inbound_call,
    custom_instructions: customInstructions,
  };
}

// POST - Generate AI agent prompt based on business context and agent type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_type, agent_personality, business_context } = body;

    if (!agent_type || !agent_personality || !business_context) {
      return NextResponse.json(
        {
          error: 'Agent type, personality, and business context are required',
        },
        { status: 400 }
      );
    }

    const generatedPrompt = generateAgentPrompt(
      agent_type,
      agent_personality,
      business_context
    );

    return NextResponse.json({
      success: true,
      generated_prompt: generatedPrompt,
    });
  } catch (error) {
    console.error('Error generating agent prompt:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate agent prompt',
      },
      { status: 500 }
    );
  }
}
