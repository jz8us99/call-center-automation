import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

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
    inbound_receptionist: `Hello! Thank you for calling ${businessName}. I'm your AI receptionist and I'm here to help you today. How may I assist you?`,
    inbound_customer_support: `Hi! Thank you for contacting ${businessName}. I'm your customer support assistant and I'm here to help resolve any questions or concerns you may have. How can I assist you today?`,
    outbound_follow_up: `Hi! This is your AI assistant from ${businessName}. I hope I'm reaching you at a good time. I'm calling to follow up regarding your recent ${businessType === 'healthcare' ? 'appointment' : 'service'} with us.`,
    outbound_marketing: `Hello! This is your marketing assistant from ${businessName}. I hope you're having a great day! I'm reaching out because we have some exciting services that might interest you.`,
  };

  // Generate business hours section
  const activeHours = context.office_hours.filter(h => h.is_active);
  const businessHoursText =
    activeHours.length > 0
      ? `Our business hours are: ${activeHours.map(h => `${h.day_name} ${h.formatted_hours}`).join(', ')}.`
      : 'Please check our website or call during business hours for our current schedule.';

  // Generate services/products section organized by category
  let servicesText = '';
  if (context.services.length > 0) {
    // Group services by category
    const servicesByCategory = context.services.reduce(
      (acc: any, service: any) => {
        const categoryName = service.category || 'General Services';
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push(service);
        return acc;
      },
      {}
    );

    // Format services by category
    servicesText = `\n\nServices we offer:\n${Object.entries(servicesByCategory)
      .map(([category, services]) => {
        const serviceList = (services as any[])
          .map(
            s =>
              `  • ${s.name}${s.duration ? ` (${s.duration} minutes)` : ''}${s.price ? ` - $${s.price}` : ''}${s.description ? `: ${s.description}` : ''}`
          )
          .join('\n');
        return `\n${category}:\n${serviceList}`;
      })
      .join('')}`;
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

  // Generate staff information with job types
  let staffText = '';
  if (context.staff.length > 0) {
    staffText = `\n\nOur team members:\n${context.staff
      .map(s => {
        let staffInfo = `- ${s.first_name} ${s.last_name}, ${s.title}`;

        // Add job types if available
        if ((s as any).job_types && (s as any).job_types.length > 0) {
          staffInfo += ` (can handle: ${(s as any).job_types.join(', ')})`;
        }

        // Add specialties if different from job types
        if (s.specialties.length > 0) {
          staffInfo += ` (specializes in: ${s.specialties.join(', ')})`;
        }

        return staffInfo;
      })
      .join('\n')}`;
  }

  // Generate appointment types section (using services/job types)
  let appointmentTypesText = '';
  if (context.services.length > 0) {
    const appointmentServices = context.services.filter(
      s => s.duration && s.duration > 0
    );
    if (appointmentServices.length > 0) {
      appointmentTypesText = `\n\nAvailable appointment types:\n${appointmentServices
        .map(
          a =>
            `- ${a.name}${a.duration ? ` (${a.duration} minutes)` : ''}${a.price ? ` - $${a.price}` : ''}${a.description ? `: ${a.description}` : ''}`
        )
        .join('\n')}`;
    }
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

  // Generate business locations section
  let locationsText = '';
  if ((context as any).business_locations && (context as any).business_locations.length > 0) {
    locationsText = `\n\nOur business locations:\n${(context as any).business_locations
      .map((location: any) => {
        const address = [
          location.street_address,
          location.city,
          location.state,
          location.postal_code,
        ]
          .filter(Boolean)
          .join(', ');

        let locationInfo = `- ${location.location_name}${location.is_primary ? ' (Main Location)' : ''}`;
        if (address) locationInfo += `\n  Address: ${address}`;
        if (location.phone) locationInfo += `\n  Phone: ${location.phone}`;
        if (location.email) locationInfo += `\n  Email: ${location.email}`;

        return locationInfo;
      })
      .join('\n\n')}`;
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
    inbound_receptionist: `
**PRIMARY ROLE:** Professional phone receptionist handling all incoming calls with warmth and efficiency.

**KEY RESPONSIBILITIES:**
1. Answer calls promptly with a warm, professional greeting
2. Identify caller needs quickly and route appropriately
3. Schedule appointments with accuracy and courtesy
4. Provide information about services, hours, and locations
5. Transfer calls to appropriate staff members
6. Take detailed messages when staff unavailable
7. Handle routine inquiries about business operations
8. Collect and update customer contact information

**RETELL AI FUNCTION PARAMETERS FOR BOOKING OPERATIONS:**

**Function: collect_customer_information**
Parameters:
- customer_first_name: string (required)
- customer_last_name: string (required)
- customer_phone: string (required, format: "xxx-xxx-xxxx")
- customer_email: string (optional, validate email format)
- insurance_provider: string (optional, from accepted list)
- preferred_language: string (optional, default: "english")
- reason_for_call: enum ["add_booking", "update_booking", "cancel_booking", "inquiry"]

**Function: identify_service_and_staff**
Parameters:
- requested_staff_name: string (optional, staff member name)
- requested_job_type: string (optional, from available job types)
- service_category: string (optional, from business categories)
- appointment_duration: integer (optional, in minutes)
- preferred_date: string (optional, format: "YYYY-MM-DD")
- preferred_time: string (optional, format: "HH:MM AM/PM")

**Function: manage_booking_action**
Parameters:
- booking_action: enum ["create", "update", "cancel"] (required)
- existing_appointment_id: string (required for update/cancel)
- new_appointment_date: string (optional, format: "YYYY-MM-DD")
- new_appointment_time: string (optional, format: "HH:MM AM/PM")
- assigned_staff_id: string (required for create/update)
- service_type_id: string (required for create/update)
- appointment_notes: string (optional)
- cancellation_reason: string (required for cancel)

**Function: calendar_integration_booking**
Parameters:
- staff_calendar_type: enum ["internal", "gmail", "outlook", "apple", "other"]
- staff_calendar_id: string (required)
- calendar_event_action: enum ["create", "update", "delete"]
- event_title: string (required)
- event_description: string (optional)
- event_start_time: string (required, ISO format)
- event_end_time: string (required, ISO format)
- event_location: string (optional)
- attendee_emails: array[string] (optional)
- reminder_settings: object (optional)

**STRUCTURED APPOINTMENT BOOKING PROCESS:**
1. **Initial Greeting & Call Purpose**
   - "Hello! Thank you for calling ${businessName}. How may I assist you today?"
   - Use collect_customer_information() to determine reason_for_call

2. **Customer Information Collection**
   - "I'll be happy to help you with that [booking action]. Let me get some information from you first."
   - Collect: first_name, last_name, phone_number (required)
   - Collect: email, insurance_provider, preferred_language (optional)

3. **Service & Staff Identification**
   - If customer knows staff name: "Which staff member would you like to see?"
   - If customer doesn't know staff: "What type of service do you need?" → match to job_type
   - Use identify_service_and_staff() to determine best fit

4. **Booking Action Execution**
   - For ADD: Check availability → Create appointment → Book to staff calendar
   - For UPDATE: Verify existing appointment → Modify details → Update calendar
   - For CANCEL: Confirm appointment details → Process cancellation → Remove from calendar

5. **Calendar Integration Process**
   - Determine staff_calendar_type (internal/external)
   - Use calendar_integration_booking() to sync with staff's calendar
   - Send confirmation to customer and staff
   - Set up reminders and notifications

**BOOKING CONFIRMATION SCRIPT:**
"Perfect! I have scheduled your [service_type] appointment with [staff_name] for [date] at [time]. You'll receive a confirmation email at [email] and a reminder call 24 hours before. Is there anything else I can help you with today?"`,

    inbound_customer_support: `
**PRIMARY ROLE:** Dedicated support specialist for resolving customer issues and providing technical assistance.

**KEY RESPONSIBILITIES:**
1. Listen actively to customer concerns with empathy
2. Troubleshoot problems systematically
3. Provide clear, step-by-step solutions
4. Handle complaints with professionalism and care
5. Escalate complex issues to appropriate departments
6. Follow up to ensure customer satisfaction
7. Document interactions for future reference
8. Provide detailed service explanations

**SUPPORT APPROACH:**
- Acknowledge customer frustration with empathy
- Ask clarifying questions to understand the issue fully
- Provide multiple solution options when possible
- Explain each step clearly and confirm understanding
- Set realistic expectations for resolution timeframes
- Always follow up to ensure satisfaction`,

    outbound_follow_up: `
**PRIMARY ROLE:** Follow-up specialist for appointment management and customer care.

**KEY RESPONSIBILITIES:**
1. Confirm upcoming appointments (24-48 hours prior)
2. Send appointment reminders via preferred method
3. Handle rescheduling requests courteously
4. Follow up after completed services
5. Collect customer feedback and satisfaction ratings
6. Process cancellations professionally
7. Coordinate with staff for scheduling changes
8. Maintain positive ongoing customer relationships

**FOLLOW-UP BEST PRACTICES:**
- Always identify yourself and the business clearly
- Respect the customer's time and availability
- Have all appointment details readily available
- Offer flexible rescheduling options
- Express genuine interest in their experience
- Thank them for choosing your business`,

    outbound_marketing: `
**PRIMARY ROLE:** Marketing representative focused on lead generation and relationship building.

**KEY RESPONSIBILITIES:**
1. Introduce business services to potential customers
2. Qualify leads and assess genuine interest
3. Present promotional offers clearly and compellingly
4. Schedule consultation appointments
5. Handle objections professionally and respectfully
6. Conduct market research and surveys
7. Follow up on previous inquiries
8. Build positive relationships with prospects

**MARKETING GUIDELINES:**
- Always comply with marketing and privacy regulations
- Respect do-not-call lists and customer preferences
- Focus on value proposition and customer benefits
- Listen more than you speak to understand needs
- Be honest about services and pricing
- Offer to call back at more convenient times
- Maintain professional enthusiasm throughout
- Never be pushy or aggressive in approach`,
  };

  const customInstructions = `
**BUSINESS CONTEXT:**
You are an AI assistant for ${businessName}, ${context.business_profile?.business_description ? context.business_profile.business_description : `a ${businessType} business`}.

${businessHoursText}
${context.business_profile?.business_address ? `\nWe are located at: ${context.business_profile.business_address}` : ''}
${context.business_profile?.business_phone ? `\nOur phone number is: ${context.business_profile.business_phone}` : ''}
${context.business_profile?.website_url ? `\nOur website: ${context.business_profile.website_url}` : ''}

${agentTypeInstructions[agentType as keyof typeof agentTypeInstructions] || agentTypeInstructions.inbound_receptionist}

**PERSONALITY & TONE:**
${personalityInstructions[personality as keyof typeof personalityInstructions] || personalityInstructions.professional}

**BUSINESS INFORMATION:**
${servicesText}
${productsText}
${appointmentTypesText}
${staffText}
${locationsText}
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
2. Protect customer privacy and confidential information
3. Never make promises about services or pricing without confirmation
4. Always confirm important details like appointments and contact information

**WHEN YOU DON'T KNOW HOW TO ANSWER A QUESTION:**
1. Say: "That's a great question. Let me make sure you get the right answer."
2. Offer these specific options:
   • "I can take a detailed message and have a staff member email or text you back within 2 hours"
   • "I can transfer you directly to our live office staff at ${context.business_profile?.business_phone || '[OFFICE PHONE]'}"
   • "Would you prefer to leave a voicemail for our ${businessType} team?"
   • "I can schedule a callback at a time that works best for you"
3. Always ask for their preferred contact method (phone/email/text)
4. Get the best time to reach them and their specific question details
5. Take comprehensive notes for proper follow-up

**EMERGENCY PROTOCOLS:**
- For medical emergencies: Direct caller to call 911 immediately
- For urgent business matters: Transfer to available staff or take detailed message
- For after-hours calls: Provide business hours and emergency contact if available

Remember: You represent ${businessName} and should always maintain our professional standards while being helpful and courteous to every caller.`;

  return {
    greeting_message:
      greetings[agentType as keyof typeof greetings] ||
      greetings.inbound_receptionist,
    custom_instructions: customInstructions,
  };
}

function transformToBusinessContext(data: any): BusinessContext {
  const {
    businessProfile,
    businessLocations,
    staffMembers,
    jobTypes,
    jobCategories,
    officeHours,
  } = data;

  // Transform office hours
  const transformedOfficeHours = officeHours.map((hour: any) => ({
    day_name: hour.day_name,
    formatted_hours: `${hour.start_time} - ${hour.end_time}`,
    is_active: hour.is_active,
  }));

  // Transform staff with their job types
  const transformedStaff = staffMembers.map((staff: any) => {
    // Get job type names for this staff member
    const staffJobTypes = staff.job_types
      ? jobTypes
          .filter((jt: any) => staff.job_types.includes(jt.id))
          .map((jt: any) => jt.job_name)
      : [];

    return {
      first_name: staff.first_name,
      last_name: staff.last_name,
      title: staff.title,
      specialties: staff.specialties || [],
      job_types: staffJobTypes,
      has_calendar_config: true,
    };
  });

  // Transform services (from job types) with category information
  const transformedServices = jobTypes.map((jobType: any) => {
    // Find the category name
    const category = jobCategories?.find(
      (cat: any) => cat.id === jobType.category_id
    );

    return {
      name: jobType.job_name,
      description: jobType.job_description,
      duration: jobType.default_duration_minutes,
      price: jobType.default_price,
      category: category?.category_name || 'General',
      category_id: jobType.category_id,
    };
  });

  return {
    business_profile: {
      business_name: businessProfile.business_name,
      business_type: businessProfile.business_type,
      business_description: businessProfile.business_description,
      business_address: businessLocations.find((loc: any) => loc.is_primary)
        ?.street_address,
      business_phone: businessProfile.business_phone,
      business_email: businessProfile.business_email,
      website_url: businessProfile.business_website,
      business_hours_description: businessProfile.business_hours_description,
      payment_methods: businessProfile.payment_methods || [],
      common_questions: businessProfile.common_questions || [],
      support_content: businessProfile.support_content || [],
    },
    products: [], // Not implemented yet
    services: transformedServices,
    staff: transformedStaff,
    office_hours: transformedOfficeHours,
    appointment_types: [], // Could be derived from job types
    upcoming_holidays: [], // Not implemented yet
    business_locations: businessLocations || [],
  } as any;
}

function generateEnhancedAgentPrompt(
  agentType: string,
  personality: string,
  context: BusinessContext,
  acceptedInsurance: any[]
) {
  // Get the base prompt
  const basePrompt = generateAgentPrompt(agentType, personality, context);

  // Add insurance information for healthcare businesses
  let insuranceText = '';
  if (acceptedInsurance.length > 0) {
    const insuranceByType = acceptedInsurance.reduce(
      (acc, insurance) => {
        const type = insurance.insurance_providers.provider_type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(insurance);
        return acc;
      },
      {} as Record<string, any[]>
    );

    insuranceText =
      '\n\n**ACCEPTED INSURANCE:**\n' +
      Object.entries(insuranceByType)
        .map(([type, insurances]) => {
          const insuranceList = (insurances as any[])
            .map((ins: any) => {
              const provider = ins.insurance_providers;
              const details = [];
              if (ins.copay_amount) details.push(`Copay: $${ins.copay_amount}`);
              if (ins.requires_referral) details.push('Requires referral');
              if (ins.network_status && ins.network_status !== 'in-network')
                details.push(`Network: ${ins.network_status}`);

              return `  - ${provider.provider_name}${details.length > 0 ? ` (${details.join(', ')})` : ''}`;
            })
            .join('\n');

          return `${type.charAt(0).toUpperCase() + type.slice(1)} Insurance:\n${insuranceList}`;
        })
        .join('\n\n');

    // Add insurance-specific guidelines
    insuranceText += '\n\n**INSURANCE GUIDELINES:**\n';
    insuranceText +=
      '- Always verify insurance benefits before confirming appointments\n';
    insuranceText += '- Inform patients of their copay amount if applicable\n';
    insuranceText += '- Mention if referral is required for their insurance\n';
    insuranceText += '- If insurance is not accepted, offer self-pay options\n';
    insuranceText +=
      '- Direct complex insurance questions to billing department';
  }

  return {
    greeting_message: basePrompt.greeting_message,
    custom_instructions: basePrompt.custom_instructions + insuranceText,
  };
}

// GET - Fetch comprehensive business data and generate AI prompt
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const agentType = searchParams.get('agent_type') || 'inbound_receptionist';
    const personality = searchParams.get('personality') || 'professional';

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Fetch business profile
    const { data: businessProfile, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (businessError || !businessProfile) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Fetch business locations
    const { data: businessLocations } = await supabase
      .from('business_locations')
      .select('*')
      .eq('business_id', businessProfile.id)
      .eq('is_active', true)
      .order('is_primary', { ascending: false });

    // Fetch staff members
    const { data: staffMembers } = await supabase
      .from('staff_members')
      .select(
        `
        *,
        business_locations (
          location_name,
          street_address,
          city,
          state,
          postal_code
        )
      `
      )
      .eq('user_id', userId)
      .eq('is_active', true);

    // Fetch job categories
    const { data: jobCategories } = await supabase
      .from('job_categories')
      .select('*')
      .eq('service_type_code', businessProfile.business_type)
      .eq('is_active', true);

    // Fetch job types
    const { data: jobTypes } = await supabase
      .from('job_types')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Fetch office hours
    const { data: officeHours } = await supabase
      .from('office_hours')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('day_of_week');

    // Fetch accepted insurance (for healthcare businesses)
    let acceptedInsurance = [];
    if (businessProfile.business_type === 'healthcare') {
      const { data: insurance } = await supabase
        .from('business_accepted_insurance')
        .select(
          `
          *,
          insurance_providers (
            provider_name,
            provider_code,
            provider_type,
            website,
            phone
          )
        `
        )
        .eq('user_id', userId)
        .eq('is_active', true);

      acceptedInsurance = insurance || [];
    }

    // Transform data into the expected format
    const businessContext = transformToBusinessContext({
      businessProfile,
      businessLocations: businessLocations || [],
      staffMembers: staffMembers || [],
      jobCategories: jobCategories || [],
      jobTypes: jobTypes || [],
      officeHours: officeHours || [],
      acceptedInsurance,
    });

    // Generate the enhanced AI prompt
    const generatedPrompt = generateEnhancedAgentPrompt(
      agentType,
      personality,
      businessContext,
      acceptedInsurance
    );

    return NextResponse.json({
      success: true,
      generated_prompt: generatedPrompt,
      business_data: businessContext,
      raw_data: {
        businessProfile,
        businessLocations,
        staffMembers,
        jobCategories,
        jobTypes,
        officeHours,
        acceptedInsurance,
      },
    });
  } catch (error) {
    console.error('Error generating agent prompt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
