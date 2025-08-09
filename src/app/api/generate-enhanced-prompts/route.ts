import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

interface EnhancedPromptRequest {
  agent_type: string;
  agent_personality: string;
  business_context: any;
  prompt_type: 'basic_info' | 'call_scripts' | 'combined';
}

interface EnhancedPromptResponse {
  basic_info_prompt?: string;
  call_scripts_prompt?: string;
  combined_prompt?: string;
  greeting_message: string;
}

function generateBasicInfoPrompt(
  agentType: string,
  personality: string,
  context: any
): string {
  const businessName =
    context.business_profile?.business_name || '[Business Name]';
  const businessType = context.business_profile?.business_type || 'business';

  const personalityInstructions = {
    professional:
      'Maintain a professional, courteous, and efficient tone throughout all interactions.',
    friendly:
      'Use a warm, welcoming, and conversational tone that makes customers feel comfortable and valued.',
    technical:
      'Provide detailed, accurate information with thorough explanations and technical expertise.',
  };

  // Generate business hours section
  const activeHours =
    context.office_hours?.filter((h: any) => h.is_active) || [];
  const businessHoursText =
    activeHours.length > 0
      ? `Our business hours are: ${activeHours.map((h: any) => `${h.day_name} ${h.formatted_hours}`).join(', ')}.`
      : 'Please check our website or call during business hours for our current schedule.';

  // Generate services section
  let servicesText = '';
  if (context.services && context.services.length > 0) {
    const servicesByCategory = context.services.reduce(
      (acc: any, service: any) => {
        const categoryName = service.category || 'General Services';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(service);
        return acc;
      },
      {}
    );

    servicesText = `\n\nSERVICES WE OFFER:\n${Object.entries(servicesByCategory)
      .map(([category, services]: [string, any[]]) => {
        const serviceList = services
          .map(
            s =>
              `  • ${s.name}${s.duration ? ` (${s.duration} minutes)` : ''}${s.price ? ` - $${s.price}` : ''}${s.description ? `: ${s.description}` : ''}`
          )
          .join('\n');
        return `\n${category}:\n${serviceList}`;
      })
      .join('')}`;
  }

  // Generate staff information
  let staffText = '';
  if (context.staff && context.staff.length > 0) {
    staffText = `\n\nOUR TEAM:\n${context.staff
      .map((s: any) => {
        let staffInfo = `- ${s.first_name} ${s.last_name}, ${s.title}`;
        if (s.specialties && s.specialties.length > 0) {
          staffInfo += ` (specializes in: ${s.specialties.join(', ')})`;
        }
        return staffInfo;
      })
      .join('\n')}`;
  }

  // Generate agent-specific content based on role
  const agentSpecificContent = generateAgentSpecificContent(agentType, context);

  return `**BUSINESS INFORMATION FOR ${businessName.toUpperCase()}**

**CORE BUSINESS DETAILS:**
- Business Name: ${businessName}
- Business Type: ${businessType}
- Description: ${context.business_profile?.business_description || 'Professional service provider'}
${context.business_profile?.business_address ? `- Location: ${context.business_profile.business_address}` : ''}
${context.business_profile?.business_phone ? `- Phone: ${context.business_profile.business_phone}` : ''}
${context.business_profile?.website_url ? `- Website: ${context.business_profile.website_url}` : ''}

**BUSINESS HOURS:**
${businessHoursText}

**YOUR ROLE AS ${agentType.replace(/_/g, ' ').toUpperCase()}:**
You are an AI assistant representing ${businessName}. ${personalityInstructions[personality as keyof typeof personalityInstructions] || personalityInstructions.professional}

${agentSpecificContent}

**IMPORTANT GUIDELINES:**
1. Always represent ${businessName} professionally
2. Provide accurate information about services and availability
3. Protect customer privacy and confidential information
4. If unsure about something, admit it and offer to find out
5. Transfer calls to appropriate staff when necessary`;
}

function generateAgentSpecificContent(agentType: string, context: any): string {
  const businessName =
    context.business_profile?.business_name || '[Business Name]';

  switch (agentType) {
    case 'inbound_receptionist':
      return generateReceptionistContent(context);
    case 'inbound_customer_support':
      return generateCustomerSupportContent(context);
    case 'outbound_follow_up':
      return generateFollowUpContent(context);
    case 'outbound_marketing':
      return generateMarketingContent(context);
    default:
      return generateGeneralContent(context);
  }
}

function generateReceptionistContent(context: any): string {
  const businessName =
    context.business_profile?.business_name || '[Business Name]';
  const businessType = context.business_profile?.business_type || 'business';

  // Focus on essential information for receptionist
  let content = `**RECEPTIONIST FOCUS AREAS:**

**CUSTOMER INFORMATION TO COLLECT:**
- Customer's first and last name
- Phone number (primary contact)
- Email address (if needed)
- New or existing customer status
- Reason for visit/service needed
`;

  // Add staff information for routing
  if (context.staff && context.staff.length > 0) {
    content += `\n**STAFF DIRECTORY FOR ROUTING:**\n${context.staff
      .map(
        (s: any) =>
          `- ${s.first_name} ${s.last_name} (${s.title})${s.specialties?.length ? ` - Specializes in: ${s.specialties.join(', ')}` : ''}`
      )
      .join('\n')}`;
  }

  // Add basic services for appointment booking
  if (context.services && context.services.length > 0) {
    const bookableServices = context.services.filter(
      (s: any) => s.duration && s.duration > 0
    );
    if (bookableServices.length > 0) {
      content += `\n\n**AVAILABLE APPOINTMENTS:**\n${bookableServices
        .map(
          (s: any) =>
            `- ${s.name}${s.duration ? ` (${s.duration} min)` : ''}${s.price ? ` - $${s.price}` : ''}`
        )
        .join('\n')}`;
    }
  }

  content += `\n\n**BOOKING ACTIONS:**\n- New appointment booking\n- Reschedule existing appointment\n- Cancel appointment\n- Confirm appointment details\n- Check appointment availability`;

  return content;
}

function generateCustomerSupportContent(context: any): string {
  const businessName =
    context.business_profile?.business_name || '[Business Name]';

  let content = `**CUSTOMER SUPPORT COMPREHENSIVE KNOWLEDGE:**\n\n`;

  // Include ALL business information for support
  if (context.services && context.services.length > 0) {
    const servicesByCategory = context.services.reduce(
      (acc: any, service: any) => {
        const categoryName = service.category || 'General Services';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(service);
        return acc;
      },
      {}
    );

    content += `**COMPLETE SERVICE CATALOG:**\n${Object.entries(
      servicesByCategory
    )
      .map(([category, services]: [string, any[]]) => {
        const serviceList = services
          .map(
            s =>
              `  • ${s.name}${s.duration ? ` (${s.duration} min)` : ''}${s.price ? ` - $${s.price}` : ''}${s.description ? `: ${s.description}` : ''}`
          )
          .join('\n');
        return `\n${category}:\n${serviceList}`;
      })
      .join('')}`;
  }

  // Include all staff information
  if (context.staff && context.staff.length > 0) {
    content += `\n\n**COMPLETE STAFF DIRECTORY:**\n${context.staff
      .map((s: any) => {
        let staffInfo = `- ${s.first_name} ${s.last_name}, ${s.title}`;
        if (s.specialties?.length)
          staffInfo += ` - Specializes in: ${s.specialties.join(', ')}`;
        if (s.job_types?.length)
          staffInfo += ` - Services: ${s.job_types.join(', ')}`;
        return staffInfo;
      })
      .join('\n')}`;
  }

  // Include document sections if available
  if (context.document_sections && context.document_sections.length > 0) {
    content += `\n\n**BUSINESS DOCUMENTATION:**`;
    context.document_sections.forEach((section: any) => {
      if (section.content) {
        content += `\n\n**${section.title.toUpperCase()}:**\n${section.content}`;
      }
    });
  }

  // Include support content
  if (context.business_profile?.support_content) {
    content += `\n\n**ADDITIONAL BUSINESS INFORMATION:**\n${context.business_profile.support_content}`;
  }

  content += `\n\n**SUPPORT RESPONSIBILITIES:**\n- Resolve customer complaints and issues\n- Provide detailed service explanations\n- Handle billing and payment questions\n- Assist with appointment scheduling conflicts\n- Escalate complex technical issues\n- Follow up on resolved matters`;

  return content;
}

function generateFollowUpContent(context: any): string {
  let content = `**FOLLOW-UP AGENT COMPREHENSIVE RESPONSIBILITIES:**\n\n**APPOINTMENT REMINDER CALLS (24-48 HOURS PRIOR):**\n- Confirm upcoming appointments with specific date, time, and staff member\n- Verify contact information is current\n- Provide preparation instructions if needed\n- Offer rescheduling if customer has conflicts\n- Confirm location and parking information\n- Send follow-up text/email confirmation\n`;

  // Include detailed staff information for coordination
  if (context.staff && context.staff.length > 0) {
    content += `\n**STAFF SCHEDULE COORDINATION:**\n${context.staff
      .map((s: any) => {
        let info = `- ${s.first_name} ${s.last_name} (${s.title})`;
        if (s.specialties?.length)
          info += ` - Specializes in: ${s.specialties.join(', ')}`;
        if (s.schedule) info += ` - Available: ${s.schedule}`;
        return info;
      })
      .join('\n')}`;
  }

  // Include all appointment types and follow-up schedules
  if (context.services && context.services.length > 0) {
    const appointmentServices = context.services.filter(
      (s: any) => s.duration && s.duration > 0
    );
    if (appointmentServices.length > 0) {
      content += `\n\n**APPOINTMENT TYPES & FOLLOW-UP SCHEDULES:**\n${appointmentServices
        .map((s: any) => {
          let serviceInfo = `- ${s.name} (${s.duration} min)${s.price ? ` - $${s.price}` : ''}`;
          // Add typical follow-up schedules based on service type
          if (
            s.name.toLowerCase().includes('cleaning') ||
            s.name.toLowerCase().includes('checkup')
          ) {
            serviceInfo += ' - Follow-up reminder in 6 months';
          } else if (s.name.toLowerCase().includes('consultation')) {
            serviceInfo += ' - Follow-up call within 1 week';
          }
          return serviceInfo;
        })
        .join('\n')}`;
    }
  }

  content += `\n\n**POST-APPOINTMENT FOLLOW-UP (WITHIN 24-48 HOURS):**\n- Thank customer for their visit\n- Check satisfaction with service received\n- Address any immediate concerns or questions\n- Schedule next routine appointment if applicable\n- Collect feedback for service improvement\n- Handle billing questions or payment issues\n- Document any special needs or preferences\n\n**ROUTINE CHECK-UP SCHEDULING:**\n- Identify customers due for routine check-ups or maintenance\n- Call to schedule based on service intervals (6 months, 1 year, etc.)\n- Explain importance of regular maintenance/check-ups\n- Offer convenient scheduling options\n- Send calendar invites and confirmations\n\n**EXISTING APPOINTMENT DATABASE ACCESS:**\n- Review customer appointment history\n- Check upcoming scheduled appointments\n- Verify preferred appointment times and days\n- Note any special accommodations needed\n- Track no-shows and reschedules\n- Update customer preferences in system`;

  return content;
}

function generateMarketingContent(context: any): string {
  let content = `**MARKETING AGENT COMPREHENSIVE KNOWLEDGE:**\n\n**LEAD QUALIFICATION PROCESS:**\n- Assess customer needs and pain points\n- Identify decision makers and influencers\n- Determine budget range and timeline\n- Understand current solutions in use\n- Evaluate urgency and priority level\n`;

  // Include ALL services with detailed pricing for marketing
  if (context.services && context.services.length > 0) {
    const servicesByCategory = context.services.reduce(
      (acc: any, service: any) => {
        const categoryName = service.category || 'General Services';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(service);
        return acc;
      },
      {}
    );

    content += `\n**COMPLETE SERVICE OFFERINGS WITH PRICING:**\n${Object.entries(
      servicesByCategory
    )
      .map(([category, services]: [string, any[]]) => {
        const serviceList = services
          .map(
            s =>
              `  • ${s.name}${s.duration ? ` (${s.duration} min)` : ''}${s.price ? ` - Starting at $${s.price}` : ''}${s.description ? `: ${s.description}` : ''}`
          )
          .join('\n');
        return `\n${category}:\n${serviceList}`;
      })
      .join('')}`;
  }

  // Include FAQ content for objection handling
  if (context.document_sections && context.document_sections.length > 0) {
    const faqSection = context.document_sections.find(
      (s: any) => s.category === 'faq'
    );
    if (faqSection && faqSection.content) {
      content += `\n\n**FREQUENTLY ASKED QUESTIONS (FOR OBJECTION HANDLING):**\n${faqSection.content}`;
    }

    // Include pricing policies
    const pricingSection = context.document_sections.find(
      (s: any) =>
        s.category === 'products_pricing' || s.category === 'services_pricing'
    );
    if (pricingSection && pricingSection.content) {
      content += `\n\n**DETAILED PRICING INFORMATION:**\n${pricingSection.content}`;
    }
  }

  // Include business strengths and credentials
  const yearsInBusiness = context.business_profile?.years_in_business;
  const numEmployees = context.business_profile?.number_of_employees;

  content += `\n\n**COMPETITIVE ADVANTAGES:**`;
  if (yearsInBusiness)
    content += `\n- ${yearsInBusiness} years of proven experience in the industry`;
  if (numEmployees)
    content += `\n- Professional team of ${numEmployees} dedicated employees`;
  if (context.staff?.length)
    content += `\n- Expert specialists: ${context.staff.map((s: any) => `${s.first_name} ${s.last_name} (${s.title})`).join(', ')}`;
  if (context.business_locations?.length)
    content += `\n- ${context.business_locations.length} convenient location${context.business_locations.length > 1 ? 's' : ''}`;

  // Include accepted insurances for healthcare
  if (context.business_profile?.accepted_insurances?.length) {
    content += `\n- Accept ${context.business_profile.accepted_insurances.length} major insurance providers including: ${context.business_profile.accepted_insurances.slice(0, 5).join(', ')}${context.business_profile.accepted_insurances.length > 5 ? ' and more' : ''}`;
  }

  content += `\n\n**MARKETING CALL OBJECTIVES:**\n- Generate qualified leads through needs assessment\n- Schedule consultations and appointments\n- Present compelling value propositions\n- Handle objections with factual responses\n- Build rapport and long-term relationships\n- Ensure compliance with telemarketing regulations\n- Follow up appropriately based on interest level`;

  return content;
}

function generateGeneralContent(context: any): string {
  let content = '';

  if (context.services && context.services.length > 0) {
    const servicesByCategory = context.services.reduce(
      (acc: any, service: any) => {
        const categoryName = service.category || 'General Services';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(service);
        return acc;
      },
      {}
    );

    content += `**SERVICES WE OFFER:**\n${Object.entries(servicesByCategory)
      .map(([category, services]: [string, any[]]) => {
        const serviceList = services
          .map(
            s =>
              `  • ${s.name}${s.duration ? ` (${s.duration} minutes)` : ''}${s.price ? ` - $${s.price}` : ''}${s.description ? `: ${s.description}` : ''}`
          )
          .join('\n');
        return `\n${category}:\n${serviceList}`;
      })
      .join('')}`;
  }

  if (context.staff && context.staff.length > 0) {
    content += `\n\n**OUR TEAM:**\n${context.staff
      .map((s: any) => {
        let staffInfo = `- ${s.first_name} ${s.last_name}, ${s.title}`;
        if (s.specialties && s.specialties.length > 0) {
          staffInfo += ` (specializes in: ${s.specialties.join(', ')})`;
        }
        return staffInfo;
      })
      .join('\n')}`;
  }

  return content;
}

function generateCallScriptsPrompt(
  agentType: string,
  personality: string,
  context: any
): string {
  const businessName =
    context.business_profile?.business_name || '[Business Name]';

  const roleSpecificInstructions = {
    inbound_receptionist: `**CALL HANDLING PROCEDURES:**

**INCOMING CALL FLOW:**
1. Answer within 3 rings with warm, professional greeting
2. Identify caller's needs through active listening
3. Provide requested information or route to appropriate person
4. Schedule appointments when requested
5. Take detailed messages when staff unavailable
6. End calls professionally with summary and next steps

**APPOINTMENT BOOKING SCRIPT:**
- "I'd be happy to schedule that appointment for you"
- "What date and time works best for your schedule?"
- "Let me check our availability for you"
- "I have [time] available with [staff member]. Does that work?"
- "I'll need your contact information to confirm the appointment"

**CALL TRANSFER SCRIPT:**
- "Let me connect you with the right person to help you"
- "I'm transferring you to [department/person] now"
- "Please hold while I get [name] on the line for you"`,

    inbound_customer_support: `**SUPPORT CALL PROCEDURES:**

**ISSUE RESOLUTION FLOW:**
1. Listen actively to the customer's concern
2. Ask clarifying questions to understand the problem
3. Acknowledge their frustration with empathy
4. Provide step-by-step solutions
5. Confirm understanding at each step
6. Follow up to ensure satisfaction

**TROUBLESHOOTING SCRIPT:**
- "I understand how frustrating this must be"
- "Let me help you resolve this issue right away"
- "Can you walk me through exactly what happened?"
- "Here's what we're going to do to fix this..."
- "Does this solution work for you?"

**ESCALATION SCRIPT:**
- "I want to make sure you get the best possible help"
- "Let me connect you with a specialist who can assist further"
- "I'm going to transfer you to someone who can resolve this completely"`,

    outbound_follow_up: `**FOLLOW-UP CALL PROCEDURES:**

**APPOINTMENT CONFIRMATION FLOW:**
1. Identify yourself and the business clearly
2. Confirm you're speaking with the right person
3. Reference the specific appointment details
4. Ask for confirmation or rescheduling needs
5. Provide any preparation instructions
6. Confirm contact information is current

**FOLLOW-UP SCRIPT:**
- "I'm calling to confirm your appointment on [date] at [time]"
- "Does this time still work for your schedule?"
- "Is there anything you need to know before your appointment?"
- "We look forward to seeing you then"

**POST-SERVICE FOLLOW-UP:**
- "I wanted to check how your recent [service] went"
- "Do you have any questions about your experience?"
- "Is there anything else we can help you with?"`,

    outbound_marketing: `**MARKETING CALL PROCEDURES:**

**OUTREACH CALL FLOW:**
1. Identify yourself and the business professionally
2. Briefly state the reason for calling
3. Ask if it's a good time to talk
4. Present value proposition clearly
5. Listen to customer needs and concerns
6. Offer next steps (consultation, information, etc.)

**MARKETING SCRIPT:**
- "I'm calling because we have services that might benefit you"
- "Based on [relevant information], I thought this might interest you"
- "Would you like to hear how this could help with [specific need]?"
- "What questions can I answer for you?"

**OBJECTION HANDLING:**
- "I completely understand that concern"
- "Many of our clients felt the same way initially"
- "Would it help if I explained how we address that?"
- "What if we could [alternative solution]?"`,
  };

  return `**CONVERSATION SCRIPTS FOR ${agentType.replace(/_/g, ' ').toUpperCase()}**

**STANDARD GREETING:**
"Hello! Thank you for ${agentType.includes('outbound') ? 'taking my call' : `calling ${businessName}`}. I'm [your AI name], and I'm here to help you today."

${roleSpecificInstructions[agentType as keyof typeof roleSpecificInstructions] || roleSpecificInstructions.inbound_receptionist}

**STANDARD CLOSING:**
"Thank you for ${agentType.includes('outbound') ? 'your time' : `calling ${businessName}`}. Is there anything else I can help you with today? Have a wonderful day!"

**EMERGENCY PROTOCOLS:**
- Medical emergencies: "Please call 911 immediately for medical emergencies"
- Urgent matters: "Let me transfer you to someone who can help right away"
- After hours: "I'll make sure someone contacts you first thing in the morning"

**COMMON PHRASES TO USE:**
- "I'd be happy to help you with that"
- "Let me check that information for you"
- "That's a great question"
- "I want to make sure I understand correctly"
- "Is there anything else I can assist you with?"

**PHRASES TO AVOID:**
- "I don't know" (say "Let me find that out for you" instead)
- "That's not my job" (redirect professionally)
- "You'll have to..." (offer alternatives)
- "Calm down" (acknowledge their concern instead)`;
}

function generateCombinedPrompt(
  agentType: string,
  personality: string,
  context: any
): string {
  const basicInfo = generateBasicInfoPrompt(agentType, personality, context);
  const callScripts = generateCallScriptsPrompt(
    agentType,
    personality,
    context
  );

  return `${basicInfo}

---

${callScripts}

**INTEGRATION NOTES:**
Use the business information above to personalize all conversations. Adapt the scripts based on the specific services, staff, and policies of ${context.business_profile?.business_name || '[Business Name]'}.`;
}

function generateGreetingMessage(agentType: string, context: any): string {
  const businessName =
    context.business_profile?.business_name || '[Business Name]';

  const greetings = {
    inbound_receptionist: `Hello! Thank you for calling ${businessName}. I'm your AI receptionist, and I'm here to help you today. How may I assist you?`,
    inbound_customer_support: `Hi! Thank you for contacting ${businessName}. I'm your customer support assistant, and I'm here to help resolve any questions or concerns. How can I assist you today?`,
    outbound_follow_up: `Hello! This is your AI assistant calling from ${businessName}. I hope I'm reaching you at a good time. I'm calling to follow up on your recent experience with us.`,
    outbound_marketing: `Hello! This is your marketing assistant from ${businessName}. I hope you're having a great day! I'm reaching out because we have some services that might be valuable for you.`,
  };

  return (
    greetings[agentType as keyof typeof greetings] ||
    greetings.inbound_receptionist
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: EnhancedPromptRequest = await request.json();
    const { agent_type, agent_personality, business_context, prompt_type } =
      body;

    if (
      !agent_type ||
      !agent_personality ||
      !business_context ||
      !prompt_type
    ) {
      return NextResponse.json(
        {
          error:
            'Agent type, personality, business context, and prompt type are required',
        },
        { status: 400 }
      );
    }

    const response: EnhancedPromptResponse = {
      greeting_message: generateGreetingMessage(agent_type, business_context),
    };

    switch (prompt_type) {
      case 'basic_info':
        response.basic_info_prompt = generateBasicInfoPrompt(
          agent_type,
          agent_personality,
          business_context
        );
        break;

      case 'call_scripts':
        response.call_scripts_prompt = generateCallScriptsPrompt(
          agent_type,
          agent_personality,
          business_context
        );
        break;

      case 'combined':
        response.combined_prompt = generateCombinedPrompt(
          agent_type,
          agent_personality,
          business_context
        );
        response.basic_info_prompt = generateBasicInfoPrompt(
          agent_type,
          agent_personality,
          business_context
        );
        response.call_scripts_prompt = generateCallScriptsPrompt(
          agent_type,
          agent_personality,
          business_context
        );
        break;

      default:
        return NextResponse.json(
          {
            error:
              'Invalid prompt type. Must be "basic_info", "call_scripts", or "combined"',
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      prompts: response,
    });
  } catch (error) {
    console.error('Error generating enhanced prompts:', error);
    return NextResponse.json(
      { error: 'Failed to generate enhanced prompts' },
      { status: 500 }
    );
  }
}
