import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const agentType = searchParams.get('agent_type');

    if (!userId || !agentType) {
      return NextResponse.json(
        { error: 'user_id and agent_type are required' },
        { status: 400 }
      );
    }

    // Get business profile data
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !businessProfile) {
      return NextResponse.json(
        {
          error:
            'Business profile not found. Please complete previous steps first.',
        },
        { status: 404 }
      );
    }

    // Parse support_content if it exists
    let supportContent: any = {};
    try {
      if (businessProfile.support_content) {
        supportContent =
          typeof businessProfile.support_content === 'string'
            ? JSON.parse(businessProfile.support_content)
            : businessProfile.support_content;
      }
    } catch (e) {
      console.warn('Could not parse support_content:', e);
    }

    // Generate agent-specific basic information prompt
    const basicInfoPrompt = generateAgentSpecificPrompt(
      agentType,
      businessProfile,
      supportContent
    );

    return NextResponse.json({
      success: true,
      basic_info_prompt: basicInfoPrompt,
      business_data_used: {
        business_name: businessProfile.business_name,
        business_type: businessProfile.business_type,
        business_phone: businessProfile.business_phone,
        business_address: businessProfile.business_address,
        has_support_content: !!supportContent,
        has_staff_info: !!supportContent.staff_information?.length,
        has_products_services: !!supportContent.products_services,
        has_business_hours: !!supportContent.business_hours,
      },
    });
  } catch (error) {
    console.error('Error generating basic prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate basic prompt' },
      { status: 500 }
    );
  }
}

function generateAgentSpecificPrompt(
  agentType: string,
  businessProfile: any,
  supportContent: any
): string {
  const businessName = businessProfile.business_name || 'our business';
  const businessType = businessProfile.business_type || 'business';
  const phone = businessProfile.business_phone;
  const address = businessProfile.business_address;
  const website = businessProfile.business_website;

  // Extract key business information
  const staffInfo = supportContent.staff_information || [];
  const productsServices = supportContent.products_services || {};
  const businessHours = supportContent.business_hours || {};
  const insuranceAccepted =
    supportContent.insurance_accepted ||
    businessProfile.accepted_insurances ||
    [];
  const paymentMethods =
    supportContent.payment_methods || businessProfile.payment_methods || [];

  // Get document sections for additional context
  const documentSections = supportContent.document_sections || [];
  const generalBusinessSection = documentSections.find(
    (section: any) => section.category === 'general_business' && section.content
  );
  const faqSection = documentSections.find(
    (section: any) => section.category === 'faq' && section.content
  );

  let basePrompt = '';

  switch (agentType) {
    case 'inbound_receptionist':
      basePrompt = `You are a professional receptionist for ${businessName}, a ${businessType}. Your primary role is to handle incoming calls with warmth, efficiency, and professionalism.

**YOUR BUSINESS INFORMATION:**
- Business: ${businessName}${businessType !== 'business' ? ` (${businessType})` : ''}`;

      if (phone) basePrompt += `\n- Phone: ${phone}`;
      if (address) basePrompt += `\n- Address: ${address}`;
      if (website) basePrompt += `\n- Website: ${website}`;

      if (staffInfo.length > 0) {
        basePrompt += `\n\n**STAFF INFORMATION:**`;
        staffInfo.slice(0, 5).forEach((staff: any) => {
          basePrompt += `\n- ${staff.name}${staff.title ? ` (${staff.title})` : ''}${staff.specialties ? ` - ${staff.specialties}` : ''}`;
        });
      }

      if (Object.keys(businessHours).length > 0) {
        basePrompt += `\n\n**BUSINESS HOURS:**`;
        Object.entries(businessHours).forEach(([day, hours]: [string, any]) => {
          if (hours && typeof hours === 'object') {
            basePrompt += `\n- ${day}: ${hours.open || 'Closed'} - ${hours.close || 'Closed'}`;
          }
        });
      }

      basePrompt += `\n\n**YOUR RESPONSIBILITIES:**
- Answer calls professionally with a warm greeting
- Collect caller's name and reason for calling
- Schedule appointments efficiently
- Provide basic business information
- Route calls to appropriate staff members
- Take detailed messages when needed
- Handle appointment confirmations and changes`;

      break;

    case 'inbound_customer_support':
      basePrompt = `You are a dedicated customer support specialist for ${businessName}, a ${businessType}. You provide comprehensive technical assistance, handle complaints, and resolve customer issues with patience and expertise.

**YOUR BUSINESS INFORMATION:**
- Business: ${businessName}${businessType !== 'business' ? ` (${businessType})` : ''}`;

      if (phone) basePrompt += `\n- Phone: ${phone}`;
      if (address) basePrompt += `\n- Address: ${address}`;
      if (website) basePrompt += `\n- Website: ${website}`;

      // Include detailed business information for support
      if (generalBusinessSection?.content) {
        basePrompt += `\n\n**DETAILED BUSINESS INFORMATION:**\n${generalBusinessSection.content.substring(0, 800)}...`;
      }

      if (productsServices && Object.keys(productsServices).length > 0) {
        basePrompt += `\n\n**PRODUCTS & SERVICES:**`;
        Object.entries(productsServices)
          .slice(0, 5)
          .forEach(([product, details]: [string, any]) => {
            basePrompt += `\n- ${product}${details?.description ? `: ${details.description}` : ''}`;
          });
      }

      if (insuranceAccepted.length > 0) {
        basePrompt += `\n\n**INSURANCE ACCEPTED:** ${insuranceAccepted.slice(0, 10).join(', ')}`;
      }

      if (paymentMethods.length > 0) {
        basePrompt += `\n\n**PAYMENT METHODS:** ${paymentMethods.join(', ')}`;
      }

      if (faqSection?.content) {
        basePrompt += `\n\n**COMMON QUESTIONS & ANSWERS:**\n${faqSection.content.substring(0, 1000)}...`;
      }

      basePrompt += `\n\n**YOUR RESPONSIBILITIES:**
- Provide detailed technical support and troubleshooting
- Handle customer complaints with empathy and professionalism  
- Resolve issues efficiently using available resources
- Explain services, procedures, and policies clearly
- Escalate complex issues to appropriate specialists
- Follow up on resolved issues to ensure satisfaction
- Document all interactions for quality assurance`;

      break;

    case 'outbound_follow_up':
      basePrompt = `You are an outbound follow-up specialist for ${businessName}, a ${businessType}. You make proactive calls for appointment confirmations, reminders, and post-service check-ins to ensure excellent customer care.

**YOUR BUSINESS INFORMATION:**
- Business: ${businessName}${businessType !== 'business' ? ` (${businessType})` : ''}`;

      if (phone) basePrompt += `\n- Phone: ${phone}`;
      if (address) basePrompt += `\n- Address: ${address}`;

      if (staffInfo.length > 0) {
        basePrompt += `\n\n**STAFF INFORMATION:**`;
        staffInfo.slice(0, 5).forEach((staff: any) => {
          basePrompt += `\n- ${staff.name}${staff.title ? ` (${staff.title})` : ''}`;
        });
      }

      if (Object.keys(businessHours).length > 0) {
        basePrompt += `\n\n**BUSINESS HOURS:**`;
        Object.entries(businessHours).forEach(([day, hours]: [string, any]) => {
          if (hours && typeof hours === 'object') {
            basePrompt += `\n- ${day}: ${hours.open || 'Closed'} - ${hours.close || 'Closed'}`;
          }
        });
      }

      basePrompt += `\n\n**YOUR RESPONSIBILITIES:**
- Make 24-hour appointment confirmation calls
- Send appointment reminders (day before and day of)
- Conduct post-service follow-up calls for satisfaction
- Handle appointment rescheduling and cancellations
- Gather feedback on service quality
- Update customer records with interaction notes
- Maintain professional, caring, and courteous demeanor`;

      break;

    case 'outbound_marketing':
      basePrompt = `You are an outbound marketing specialist for ${businessName}, a ${businessType}. You conduct professional sales calls, qualify leads, and promote our services with enthusiasm while maintaining ethical marketing practices.

**YOUR BUSINESS INFORMATION:**
- Business: ${businessName}${businessType !== 'business' ? ` (${businessType})` : ''}`;

      if (phone) basePrompt += `\n- Phone: ${phone}`;
      if (address) basePrompt += `\n- Address: ${address}`;
      if (website) basePrompt += `\n- Website: ${website}`;

      if (productsServices && Object.keys(productsServices).length > 0) {
        basePrompt += `\n\n**OUR SERVICES & PRODUCTS:**`;
        Object.entries(productsServices)
          .slice(0, 8)
          .forEach(([product, details]: [string, any]) => {
            basePrompt += `\n- ${product}${details?.price ? ` (${details.price})` : ''}${details?.description ? `: ${details.description}` : ''}`;
          });
      }

      if (staffInfo.length > 0) {
        basePrompt += `\n\n**OUR SPECIALISTS:**`;
        staffInfo.slice(0, 3).forEach((staff: any) => {
          basePrompt += `\n- ${staff.name}${staff.title ? ` (${staff.title})` : ''}${staff.experience ? ` - ${staff.experience}` : ''}`;
        });
      }

      if (insuranceAccepted.length > 0) {
        basePrompt += `\n\n**INSURANCE ACCEPTED:** ${insuranceAccepted.slice(0, 8).join(', ')}`;
      }

      basePrompt += `\n\n**YOUR RESPONSIBILITIES:**
- Make professional outbound sales calls to qualified leads
- Present our services with enthusiasm and expertise
- Qualify prospects based on their needs and budget
- Schedule consultations and appointments
- Follow up on quotes and proposals
- Maintain detailed records of all interactions
- Respect do-not-call preferences and regulations
- Build relationships that lead to long-term customer loyalty`;

      break;

    default:
      basePrompt = `You are a professional AI agent for ${businessName}, a ${businessType}. Handle all interactions with professionalism, accuracy, and excellent customer service.`;
  }

  basePrompt += `\n\n**IMPORTANT GUIDELINES:**
- Always maintain patient confidentiality and privacy
- Be helpful, professional, and courteous in all interactions
- If you don't know something, say so and offer to find out
- Never make promises about services or pricing without confirmation
- Keep detailed notes of all customer interactions
- Follow all relevant regulations and compliance requirements`;

  return basePrompt;
}
