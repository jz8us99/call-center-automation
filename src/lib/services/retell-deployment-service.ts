// import { BaseBusinessService } from './base-service';
import { supabase } from '../supabase';
import Retell from 'retell-sdk';
import { createClient } from '@supabase/supabase-js';
import { RetellTemplateService } from './retell-template-service';
import type { TemplateConfig } from './types/retell-template-types';

export interface RetellAgentConfig {
  id?: string;
  name: string;
  type: string;
  prompt: string;
  callScript?: string;
  voice: {
    provider: string;
    voiceId: string;
    speed?: number;
  };
  tools?: any[];
  webhookUrl?: string;
  conversationFlowId?: string;
  responseEngineType?: 'retell-llm' | 'conversation-flow';
}

export class RetellDeploymentService {
  readonly name = 'Retell Deployment Service';
  private retell: Retell;

  protected logger = {
    info: (message: string, ...args: any[]) =>
      console.log(`[${this.name}]`, message, ...args),
    error: (message: string, ...args: any[]) =>
      console.error(`[${this.name}]`, message, ...args),
    warn: (message: string, ...args: any[]) =>
      console.warn(`[${this.name}]`, message, ...args),
    debug: (message: string, ...args: any[]) =>
      console.debug(`[${this.name}]`, message, ...args),
  };

  constructor() {
    const apiKey = process.env.RETELL_API_KEY;
    this.logger.info('Environment check:', {
      hasRetellApiKey: !!apiKey,
      retellApiKeyLength: apiKey?.length || 0,
      hasBaseUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
      nodeEnv: process.env.NODE_ENV,
    });

    if (!apiKey) {
      throw new Error('RETELL_API_KEY environment variable is required');
    }

    this.retell = new Retell({
      apiKey: apiKey,
    });

    this.logger.info('Retell SDK initialized successfully');
  }

  // async initialize(): Promise<void> {
  //   // Required by BaseBusinessService
  //   this.logger.info('Service initialized');
  // }

  /**
   * Get or create LLM for agent deployment
   */
  private async getOrCreateLlm(
    businessContext: any,
    config: any,
    role: string
  ): Promise<string> {
    try {
      // Create a new LLM - if this fails, the entire deployment should fail
      this.logger.info('Creating new LLM for agent deployment...');

      // Generate comprehensive prompt using all available data
      const comprehensivePrompt = this.generateComprehensivePrompt(
        businessContext,
        config,
        role
      );

      // Create LLM with business-specific configuration
      const newLlm = await this.retell.llm.create({
        model_name: 'gpt-4o-mini',
        general_prompt: comprehensivePrompt,
        begin_message: this.generateBeginMessage(businessContext),
        inbound_dynamic_variables_webhook_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/retell/webhook`,
      });

      this.logger.info('Successfully created new LLM:', {
        llm_id: newLlm.llm_id,
        prompt_length: comprehensivePrompt.length,
        business_name: businessContext.businessName,
        agent_role: role,
      });

      this.logger.debug(
        'LLM prompt preview:',
        comprehensivePrompt.substring(0, 200) + '...'
      );

      return newLlm.llm_id;
    } catch (error) {
      // Log detailed error information for debugging
      this.logger.error('Failed to create LLM - deployment will be aborted', {
        business_name: businessContext.businessName,
        agent_role: role,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_status: (error as any)?.status,
        error_response: (error as any)?.response?.data || (error as any)?.error,
      });

      // Re-throw the error to fail the deployment process
      throw new Error(
        `LLM creation failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
          'Please check your Retell API configuration and try again.'
      );
    }
  }

  /**
   * Generate comprehensive LLM prompt with all business data and user configuration
   */
  private generateComprehensivePrompt(
    businessContext: any,
    config: any,
    role: string
  ): string {
    // Start with calendar-integrated AI receptionist prompt
    let generalPrompt = `You are a professional AI receptionist for ${businessContext.businessName}`;
    if (businessContext.businessType === 'dental') {
      generalPrompt += ', a dental practice';
    } else if (businessContext.businessType) {
      generalPrompt += `, a ${businessContext.businessType} business`;
    }
    generalPrompt +=
      '. AI receptionist connected to my application and my integrated calendar.\n\n';

    generalPrompt +=
      'Your main role is to handle customer appointment scheduling by creating, updating, and canceling bookings directly in my calendar.\n\n';

    generalPrompt += 'CAPABILITIES & RULES:\n\n';

    generalPrompt += 'Calendar Integration:\n';
    generalPrompt += '- Access my configured calendar from the application\n';
    generalPrompt +=
      '- Always check availability before confirming a booking\n';
    generalPrompt +=
      '- Create, reschedule, or cancel appointments based on customer requests\n\n';

    generalPrompt += 'Customer Interaction:\n';
    generalPrompt +=
      '- Always greet the customer politely and ask for their first name, last name, phone number, and email address\n';
    generalPrompt += '- If they want to create an appointment, ask for:\n';
    generalPrompt += '  • Date and time preference\n';
    generalPrompt +=
      '  • Service type (e.g., consultation, cleaning, follow-up, etc.)\n';
    generalPrompt += '  • Staff preference (if any)\n';
    generalPrompt +=
      '- If they want to update an existing appointment, confirm their current booking details before making changes\n';
    generalPrompt +=
      '- If they want to cancel an appointment, confirm their booking ID or details and then proceed\n\n';

    generalPrompt += 'Validation & Confirmation:\n';
    generalPrompt +=
      '- Confirm all details before saving or updating the booking\n';
    generalPrompt +=
      '- Provide a clear confirmation message with the appointment date, time, and staff name\n';
    generalPrompt +=
      '- If the requested time is unavailable, suggest the nearest available slot\n\n';

    generalPrompt += 'Special Cases:\n';
    generalPrompt +=
      '- For existing customers, check by last name or phone number to locate their booking\n';
    generalPrompt +=
      '- For urgent changes, mark as high priority in the calendar notes\n\n';

    generalPrompt += 'Tone & Personality:\n';
    generalPrompt += '- Friendly, professional, and efficient\n';
    generalPrompt +=
      '- Always speak clearly and keep the conversation easy for the customer to follow\n\n';

    // Add user's basic info prompt (contains specific business details)
    if (config.basic_info_prompt) {
      generalPrompt += config.basic_info_prompt + '\n\n';
      this.logger.info('Added user basic_info_prompt to general prompt');
    }

    // Add comprehensive business services from database
    if (businessContext.services && businessContext.services.length > 0) {
      generalPrompt += 'SERVICES WE OFFER:\n';
      businessContext.services.forEach((service: any) => {
        generalPrompt += `- ${service.service_name}`;
        if (service.service_description) {
          generalPrompt += `: ${service.service_description}`;
        }
        if (service.price && service.price > 0) {
          generalPrompt += ` (Starting at $${service.price})`;
        }
        generalPrompt += '\n';
      });
      generalPrompt += '\n';
      this.logger.info(
        `Added ${businessContext.services.length} services to prompt`
      );
    }

    // Add staff information from database
    if (businessContext.staff && businessContext.staff.length > 0) {
      generalPrompt += 'OUR TEAM:\n';
      businessContext.staff.forEach((staff: any) => {
        generalPrompt += `- ${staff.first_name} ${staff.last_name}`;
        if (staff.job_title) {
          generalPrompt += ` (${staff.job_title})`;
        }
        if (staff.specialization) {
          generalPrompt += ` - Specializes in: ${staff.specialization}`;
        }
        generalPrompt += '\n';
      });
      generalPrompt += '\n';
      this.logger.info(
        `Added ${businessContext.staff.length} staff members to prompt`
      );
    }

    // Add location information from database
    if (businessContext.locations && businessContext.locations.length > 0) {
      if (businessContext.locations.length === 1) {
        generalPrompt += 'OUR LOCATION:\n';
      } else {
        generalPrompt += 'OUR LOCATIONS:\n';
      }
      businessContext.locations.forEach((location: any) => {
        generalPrompt += `- ${location.location_name || 'Main Office'}`;
        if (location.address) {
          generalPrompt += `: ${location.address}`;
        }
        if (location.phone_number) {
          generalPrompt += ` (Phone: ${location.phone_number})`;
        }
        generalPrompt += '\n';
      });
      generalPrompt += '\n';
      this.logger.info(
        `Added ${businessContext.locations.length} locations to prompt`
      );
    }

    // Add insurance information for healthcare businesses
    if (
      businessContext.businessType === 'dental' &&
      businessContext.insuranceProviders &&
      businessContext.insuranceProviders.length > 0
    ) {
      generalPrompt += 'INSURANCE ACCEPTED:\n';
      businessContext.insuranceProviders.forEach((insurance: any) => {
        generalPrompt += `- ${insurance.provider_name}`;
        if (insurance.plan_type) {
          generalPrompt += ` (${insurance.plan_type})`;
        }
        generalPrompt += '\n';
      });
      generalPrompt += '\n';
      this.logger.info(
        `Added ${businessContext.insuranceProviders.length} insurance providers to prompt`
      );
    }

    // Add user's custom instructions (escalation, behavior guidelines)
    if (config.custom_instructions) {
      generalPrompt +=
        'SPECIAL INSTRUCTIONS:\n' + config.custom_instructions + '\n\n';
      this.logger.info('Added user custom_instructions to general prompt');
    }

    // Add user's call scripts
    if (config.call_scripts && Object.keys(config.call_scripts).length > 0) {
      generalPrompt += 'CALL SCRIPTS TO FOLLOW:\n';
      if (config.call_scripts.greeting_script) {
        generalPrompt += `Greeting: ${config.call_scripts.greeting_script}\n`;
      }
      if (config.call_scripts.main_script) {
        generalPrompt += `Main Script: ${config.call_scripts.main_script}\n`;
      }
      if (config.call_scripts.escalation_script) {
        generalPrompt += `Escalation: ${config.call_scripts.escalation_script}\n`;
      }
      if (config.call_scripts.closing_script) {
        generalPrompt += `Closing: ${config.call_scripts.closing_script}\n`;
      }
      generalPrompt += '\n';
      this.logger.info('Added user call_scripts to general prompt');
    }

    // Add user's call handling instructions
    if (config.call_scripts_prompt) {
      generalPrompt +=
        'CALL HANDLING GUIDELINES:\n' + config.call_scripts_prompt + '\n\n';
      this.logger.info('Added user call_scripts_prompt to general prompt');
    }

    // Add direction-specific guidelines (default to inbound)
    const direction = 'inbound'; // Default direction
    if (direction === 'inbound') {
      generalPrompt += 'INBOUND CALL GUIDELINES:\n';
      generalPrompt +=
        '- You are receiving calls from customers/patients contacting the business\n';
      generalPrompt += '- Greet callers warmly and professionally\n';
      generalPrompt += '- Listen carefully to understand their needs\n';
      generalPrompt += '- Provide helpful information and assistance\n';
      generalPrompt += '- Schedule appointments if requested\n';
      generalPrompt +=
        '- Never make outbound calls - you only receive them\n\n';
      this.logger.info('Added inbound call guidelines to prompt');
    } else if (direction === 'outbound') {
      generalPrompt += 'OUTBOUND CALL GUIDELINES:\n';
      generalPrompt += '- You are making calls on behalf of the business\n';
      generalPrompt +=
        '- Introduce yourself and the business clearly at the start\n';
      generalPrompt += '- Explain the purpose of your call politely\n';
      generalPrompt += '- Respect if the person prefers not to talk\n';
      generalPrompt +=
        '- Follow up on appointments, services, or business matters\n';
      generalPrompt += '- Keep calls professional and purpose-driven\n\n';
      this.logger.info('Added outbound call guidelines to prompt');
    } else if (direction === 'both') {
      generalPrompt += 'BIDIRECTIONAL CALL GUIDELINES:\n';
      generalPrompt += '- You can both receive and make calls\n';
      generalPrompt +=
        '- For inbound calls: Greet warmly and assist with their needs\n';
      generalPrompt +=
        '- For outbound calls: Introduce yourself and explain the purpose\n';
      generalPrompt +=
        '- Adapt your approach based on whether you initiated or received the call\n';
      generalPrompt +=
        '- Always be professional and helpful regardless of call direction\n\n';
      this.logger.info('Added bidirectional call guidelines to prompt');
    }

    // Add business-type specific guidelines
    if (businessContext.businessType === 'dental') {
      generalPrompt += 'DENTAL PRACTICE GUIDELINES:\n';
      generalPrompt += '- Always ask for patient insurance information\n';
      generalPrompt +=
        '- For dental emergencies, prioritize immediate scheduling\n';
      generalPrompt += '- Collect patient date of birth for verification\n';
      generalPrompt +=
        '- Ask about the reason for visit to schedule appropriate appointment time\n';
      generalPrompt += '- Confirm if they are an existing or new patient\n';
      generalPrompt += '- Be empathetic with patients experiencing pain\n\n';
      this.logger.info('Added dental-specific guidelines to prompt');
    }

    // Fallback if no prompts provided
    if (!generalPrompt.trim()) {
      generalPrompt = `You are a professional ${role} AI assistant for ${businessContext.businessName}. Provide helpful, courteous service to all callers.`;
    }

    return generalPrompt;
  }

  /**
   * Generate begin message based on business context
   */
  private generateBeginMessage(businessContext: any): string {
    return `Hello! Thank you for calling ${businessContext.businessName}. How can I help you today?`;
  }

  /**
   * Get conversation flow configuration from Retell API
   */
  private async getConversationFlow(conversationFlowId: string): Promise<any> {
    try {
      const response = await fetch(
        `https://api.retellai.com/get-conversation-flow/${conversationFlowId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get conversation flow: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      this.logger.error('Failed to get conversation flow:', error);
      throw error;
    }
  }

  /**
   * Update conversation flow configuration in Retell API
   */
  private async updateConversationFlow(
    conversationFlowId: string,
    updateData: any
  ): Promise<any> {
    try {
      const response = await fetch(
        `https://api.retellai.com/update-conversation-flow/${conversationFlowId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update conversation flow: ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      this.logger.error('Failed to update conversation flow:', error);
      throw error;
    }
  }

  /**
   * Get complete business context from database
   */
  private async getBusinessContext(businessId: string): Promise<{
    businessName: string;
    businessType: string;
    industry: string;
    services: any[];
    products: any[];
    staff: any[];
    locations: any[];
    insuranceProviders: any[];
  }> {
    try {
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get business profile
      const { data: business } = await serviceSupabase
        .from('business_profiles')
        .select('*')
        .eq('id', businessId)
        .single();

      // Get services
      const { data: services } = await serviceSupabase
        .from('business_services')
        .select('*')
        .eq('business_id', businessId);

      // Get products
      const { data: products } = await serviceSupabase
        .from('business_products')
        .select('*')
        .eq('business_id', businessId);

      // Get staff
      const { data: staff } = await serviceSupabase
        .from('business_staff')
        .select('*')
        .eq('business_id', businessId);

      // Get locations
      const { data: locations } = await serviceSupabase
        .from('business_locations')
        .select('*')
        .eq('business_id', businessId);

      // Get insurance providers (for healthcare businesses)
      const { data: insurance } = await serviceSupabase
        .from('insurance_providers')
        .select('*')
        .eq('business_id', businessId);

      return {
        businessName: business?.business_name || 'Business',
        businessType: business?.business_type || 'general',
        industry: business?.industry || 'general',
        services: services || [],
        products: products || [],
        staff: staff || [],
        locations: locations || [],
        insuranceProviders: insurance || [],
      };
    } catch (error) {
      this.logger.error('Error getting business context:', error);
      return {
        businessName: 'Business',
        businessType: 'general',
        industry: 'general',
        services: [],
        products: [],
        staff: [],
        locations: [],
        insuranceProviders: [],
      };
    }
  }

  /**
   * Generate calendar-specific post-call analysis fields for appointment scheduling
   */
  private generateCalendarPostCallAnalysisFields(
    businessContext: any,
    config: any
  ): any[] {
    const calendarFields = [
      {
        name: 'caller_firstname',
        description: 'Get caller first name from context',
        type: 'string',
      },
      {
        name: 'caller_lastname',
        description: 'Get caller last name from context',
        type: 'string',
      },
      {
        name: 'caller_email',
        description: 'Get caller email address from context',
        type: 'string',
        examples: ['xyz@gmail.com'],
      },
      {
        name: 'caller_phone',
        description: 'Get caller phone number from context',
        type: 'string',
        examples: ['+1234567890'],
      },
      {
        name: 'appointment_action',
        description: 'What appointment action was performed',
        type: 'string',
        examples: ['created', 'updated', 'cancelled', 'searched', 'no_action'],
      },
      {
        name: 'appointment_date_time',
        description: 'Get the appointment date and time from conversation',
        type: 'string',
        examples: ['2025-01-20T14:00:00'],
      },
      {
        name: 'service_type',
        description: 'Type of service requested for the appointment',
        type: 'string',
        examples: businessContext.services
          ?.map((s: any) => s.service_name)
          ?.slice(0, 5) || ['consultation', 'cleaning', 'checkup'],
      },
      {
        name: 'preferred_staff',
        description: 'Staff member requested by the customer',
        type: 'string',
        examples: businessContext.staff
          ?.map((s: any) => s.first_name + ' ' + s.last_name)
          ?.slice(0, 3) || ['Any available'],
      },
      {
        name: 'appointment_id',
        description: 'Appointment ID if an existing appointment was referenced',
        type: 'string',
      },
      {
        name: 'call_outcome',
        description: 'Overall outcome of the call',
        type: 'string',
        examples: [
          'appointment_scheduled',
          'appointment_updated',
          'appointment_cancelled',
          'information_provided',
          'callback_requested',
          'no_action_needed',
        ],
      },
      {
        name: 'customer_satisfaction',
        description: 'Perceived customer satisfaction level',
        type: 'string',
        examples: ['satisfied', 'neutral', 'dissatisfied'],
      },
      {
        name: 'availability_checked',
        description: 'Whether availability was checked during the call',
        type: 'string',
        examples: ['yes', 'no'],
      },
      {
        name: 'alternative_times_offered',
        description: 'Whether alternative appointment times were offered',
        type: 'string',
        examples: ['yes', 'no'],
      },
    ];

    // Add business-type specific fields
    if (businessContext.businessType === 'dental') {
      calendarFields.push(
        {
          name: 'reason_for_visit',
          description: 'Get the appointment reason from context',
          type: 'string',
          examples: [
            'cleaning',
            'checkup',
            'tooth pain',
            'crown',
            'filling',
            'consultation',
          ],
        },
        {
          name: 'emergency_flag',
          description: 'Flag indicating if this is an emergency appointment',
          type: 'string',
          examples: ['1', '0'],
        },
        {
          name: 'existing_patient',
          description: 'Whether the caller is an existing patient',
          type: 'string',
          examples: ['yes', 'no', 'unknown'],
        },
        {
          name: 'insurance_mentioned',
          description: 'Whether insurance was discussed during the call',
          type: 'string',
          examples: ['yes', 'no'],
        }
      );
    }

    return calendarFields;
  }

  /**
   * Generate business-specific post-call analysis fields
   */
  private generatePostCallAnalysisFields(
    businessContext: any,
    config: any
  ): any[] {
    const baseFields = [
      {
        name: 'caller_firstname',
        description: 'Get caller first name from context',
        type: 'string',
      },
      {
        name: 'caller_lastname',
        description: 'Get caller last name from context',
        type: 'string',
      },
      {
        name: 'caller_email',
        description: 'Get caller email address from context',
        type: 'string',
        examples: ['xyz@gmail.com'],
      },
      {
        name: 'caller_phone',
        description: 'Get caller phone number from context',
        type: 'string',
        examples: ['+1234567890'],
      },
      {
        name: 'call_outcome',
        description: 'Overall outcome of the call',
        type: 'string',
        examples: [
          'appointment_scheduled',
          'information_provided',
          'transferred',
          'callback_requested',
        ],
      },
      {
        name: 'customer_satisfaction',
        description: 'Perceived customer satisfaction level',
        type: 'string',
        examples: ['satisfied', 'neutral', 'dissatisfied'],
      },
    ];

    // Add business-type specific fields
    if (
      businessContext.businessType === 'dental' ||
      businessContext.industry === 'healthcare'
    ) {
      baseFields.push(
        {
          name: 'caller_birth_date',
          description: 'Get the caller date of birth from conversation',
          type: 'string',
          examples: ['07/09/1968'],
        },
        {
          name: 'dental_insurance',
          description: 'Get caller dental insurance information from context',
          type: 'string',
        },
        {
          name: 'medical_insurance',
          description: 'Get caller medical insurance information from context',
          type: 'string',
        },
        {
          name: 'appointment_date_time',
          description: 'Get the appointment date and time from conversation',
          type: 'string',
          examples: ['2025-07-19T14:00:00-07:00'],
        },
        {
          name: 'appointment_made_flag',
          description:
            'If the call made an appointment successfully. 1 for success, 0 for no appointment',
          type: 'string',
          examples: ['1', '0'],
        },
        {
          name: 'reason_for_visit',
          description: 'Get the appointment reason from context',
          type: 'string',
          examples: ['cleaning', 'checkup', 'tooth pain', 'crown', 'filling'],
        },
        {
          name: 'doctor',
          description: 'Get the appointment with which doctor',
          type: 'string',
        },
        {
          name: 'emergency_flag',
          description:
            'Flag indicating if this is an emergency call requiring immediate attention',
          type: 'string',
          examples: ['1', '0'],
        },
        {
          name: 'existing_patient',
          description: 'Whether the caller is an existing patient',
          type: 'string',
          examples: ['yes', 'no', 'unknown'],
        }
      );
    }

    // Add service-specific fields if services are configured
    if (businessContext.services && businessContext.services.length > 0) {
      baseFields.push({
        name: 'service_requested',
        description: 'The specific service the caller is interested in',
        type: 'string',
        examples: businessContext.services
          .map((s: any) => s.service_name)
          .slice(0, 5),
      });
    }

    // Add staff-specific fields if staff are configured
    if (businessContext.staff && businessContext.staff.length > 0) {
      baseFields.push({
        name: 'preferred_staff_member',
        description: 'If caller requested a specific staff member',
        type: 'string',
        examples: businessContext.staff
          .map((s: any) => s.first_name + ' ' + s.last_name)
          .slice(0, 3),
      });
    }

    // Add location-specific fields if multiple locations
    if (businessContext.locations && businessContext.locations.length > 1) {
      baseFields.push({
        name: 'preferred_location',
        description: 'The location the caller prefers for service',
        type: 'string',
        examples: businessContext.locations
          .map((l: any) => l.location_name)
          .slice(0, 3),
      });
    }

    return baseFields;
  }

  /**
   * Get business name from database
   */
  private async getBusinessName(businessId: string): Promise<string> {
    try {
      // Use service role client for reliable access
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: business, error } = await serviceSupabase
        .from('business_profiles')
        .select('business_name')
        .eq('user_id', businessId)
        .single();

      if (error || !business) {
        this.logger.warn('Business profile not found, using fallback name');
        return 'Business'; // Fallback name
      }

      return business.business_name || 'Business';
    } catch (error) {
      this.logger.error('Error getting business name:', error);
      return 'Business'; // Fallback name
    }
  }

  /**
   * Resolve business profile ID from user ID or business ID
   */
  private async resolveBusinessId(inputId: string): Promise<string> {
    try {
      this.logger.info('Resolving business ID for input:', inputId);

      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceKey) {
        throw new Error(
          `Missing Supabase credentials: url=${!!supabaseUrl}, key=${!!serviceKey}`
        );
      }

      const serviceSupabase = createClient(supabaseUrl, serviceKey);

      // First try to find by business profile ID (direct match)
      const { data: businessById } = await serviceSupabase
        .from('business_profiles')
        .select('id')
        .eq('id', inputId)
        .single();

      if (businessById) {
        this.logger.info('Found business by direct ID match:', inputId);
        return inputId;
      }

      // If not found, try to find by user_id
      const { data: businessByUserId } = await serviceSupabase
        .from('business_profiles')
        .select('id, business_name')
        .eq('user_id', inputId)
        .single();

      if (businessByUserId) {
        this.logger.info('Resolved user_id to business_id:', {
          user_id: inputId,
          business_id: businessByUserId.id,
          business_name: businessByUserId.business_name,
        });
        return businessByUserId.id;
      }

      // If still not found, log warning and return original ID
      this.logger.warn(
        'Could not resolve business ID, using input ID:',
        inputId
      );
      return inputId;
    } catch (error) {
      this.logger.error('Error resolving business ID:', error);
      return inputId; // Fallback to input ID
    }
  }

  /**
   * Deploy a single agent using template
   */
  async deploySingleAgentWithTemplate(
    businessId: string,
    agentConfig: any,
    userId?: string,
    authenticatedSupabase?: any
  ): Promise<{
    success: boolean;
    agent?: any;
    error?: string;
  }> {
    try {
      this.logger.info('Deploying agent using template approach...');

      const templateService = new RetellTemplateService();

      // Get business context to determine template type
      const businessContext = await this.getBusinessContext(businessId);

      // Determine template configuration based on business type
      const templateConfig: TemplateConfig = {
        businessType: businessContext.businessType || 'dental',
        agentRole: 'inbound-receptionist',
        version: 'v01',
      };

      this.logger.info('Using template configuration:', templateConfig);

      // Deploy using template
      const result = await templateService.deployFromTemplate(
        businessId,
        agentConfig,
        templateConfig,
        userId
      );

      if (result.success) {
        // Update deployment status in database
        await this.updateDeploymentStatus(businessId, [result.agent]);

        return {
          success: true,
          agent: result.agent,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      this.logger.error('Error deploying agent with template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Deploy a single agent to Retell
   */
  async deploySingleAgent(
    businessId: string,
    agentConfig: any,
    userId?: string,
    authenticatedSupabase?: any
  ): Promise<{
    success: boolean;
    agent?: any;
    error?: string;
  }> {
    try {
      // Resolve proper business profile ID
      const resolvedBusinessId = await this.resolveBusinessId(businessId);

      // Get business name
      const businessName = await this.getBusinessName(businessId);

      // Create agent name: Business Name + Agent Name from Step 6
      const fullAgentName = `${businessName} ${agentConfig.agent_name}`;

      // Check if agent already exists for this specific agent configuration
      const dbClient = authenticatedSupabase || supabase;
      const { data: existingAgents, error: checkError } = await dbClient
        .from('retell_agents')
        .select('*')
        .eq('ai_agent_id', agentConfig.id)
        .eq('status', 'deployed');

      if (checkError) {
        this.logger.error('Error checking existing agents:', checkError);
      }

      let deployedAgent;

      if (existingAgents && existingAgents.length > 0) {
        // Agent exists in database, check if it still exists in Retell AI
        this.logger.info(
          'Found existing deployed agent in database for this ai_agent_id, checking Retell AI...',
          {
            aiAgentId: agentConfig.id,
            retellAgentId: existingAgents[0].retell_agent_id,
            agentName: existingAgents[0].agent_name,
          }
        );

        let agentExistsInRetell = false;
        try {
          // Check if agent still exists in Retell
          const retellAgent = await this.retell.agent.retrieve(
            existingAgents[0].retell_agent_id
          );
          if (retellAgent) {
            agentExistsInRetell = true;
            this.logger.info('Agent exists in Retell AI, will update it');
          }
        } catch (error: any) {
          if (error?.status === 404) {
            this.logger.warn(
              'Agent not found in Retell AI (404), will create new one'
            );
          } else {
            this.logger.error('Error checking agent in Retell AI:', error);
          }
        }

        if (agentExistsInRetell) {
          // Agent exists in Retell, update it
          deployedAgent = await this.updateExistingAgent(
            existingAgents[0],
            {
              ...agentConfig,
              agent_name: fullAgentName,
              client_id: resolvedBusinessId,
            },
            userId,
            authenticatedSupabase
          );
        } else {
          // Agent doesn't exist in Retell, create new one
          this.logger.info(
            'Agent not found in Retell AI, creating new agent...'
          );
          deployedAgent = await this.deployRoleAgent(
            {
              ...agentConfig,
              agent_name: fullAgentName,
              client_id: resolvedBusinessId,
            },
            'receptionist',
            userId,
            authenticatedSupabase
          );

          // Update database record with new agent ID if created successfully
          if (deployedAgent && existingAgents[0].id) {
            const { error: updateError } = await dbClient
              .from('retell_agents')
              .update({
                retell_agent_id: deployedAgent.agent_id,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingAgents[0].id);

            if (updateError) {
              this.logger.error(
                'Failed to update database with new agent ID:',
                updateError
              );
            }
          }
        }
      } else {
        // No existing agent, create new one
        this.logger.info('No existing agent found, creating new...');

        deployedAgent = await this.deployRoleAgent(
          {
            ...agentConfig,
            agent_name: fullAgentName,
            client_id: resolvedBusinessId,
          },
          'receptionist',
          userId,
          authenticatedSupabase
        );
      }

      if (deployedAgent) {
        // Update deployment status in database
        await this.updateDeploymentStatus(resolvedBusinessId, [deployedAgent]);

        return {
          success: true,
          agent: deployedAgent,
        };
      } else {
        return {
          success: false,
          error: 'Failed to deploy or update agent',
        };
      }
    } catch (error) {
      this.logger.error('Error deploying single agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update existing agent and its LLM
   */
  private async updateExistingAgent(
    existingAgent: any,
    config: any,
    userId?: string,
    authenticatedSupabase?: any
  ): Promise<any> {
    try {
      this.logger.info('Updating existing agent:', {
        agentId: existingAgent.retell_agent_id,
        llmId: existingAgent.retell_llm_id,
      });

      // Get business context for prompt generation
      const businessContext = await this.getBusinessContext(config.client_id);

      // Check current agent's response engine type from Retell API
      let shouldUpdateLlm = true;
      let existingResponseEngine: any = null;
      try {
        this.logger.info(
          'Checking agent response engine type from Retell API...'
        );
        const currentAgent = await this.retell.agent.retrieve(
          existingAgent.retell_agent_id
        );

        if (
          currentAgent?.response_engine?.type &&
          currentAgent.response_engine.type !== 'retell-llm'
        ) {
          this.logger.info(
            'Agent uses conversation-flow, skipping LLM update:',
            {
              responseEngineType: currentAgent.response_engine.type,
              conversationFlowId: (currentAgent.response_engine as any)
                .conversation_flow_id,
            }
          );
          shouldUpdateLlm = false;
          // Store the existing response engine configuration to reuse
          existingResponseEngine = currentAgent.response_engine;
        }
      } catch (retrieveError: any) {
        this.logger.warn(
          'Failed to retrieve agent from Retell API:',
          retrieveError
        );
        // Continue with LLM update if we can't determine the type
      }

      // Update LLM only if the agent uses retell-llm response engine
      if (shouldUpdateLlm && existingAgent.retell_llm_id) {
        try {
          const comprehensivePrompt = this.generateComprehensivePrompt(
            businessContext,
            config,
            'receptionist'
          );

          const llmUpdatePayload = {
            general_prompt: comprehensivePrompt,
            begin_message: this.generateBeginMessage(businessContext),
            model_name: 'gpt-4o-mini',
          };

          this.logger.info('Updating LLM:', existingAgent.retell_llm_id);

          // Update LLM using Retell SDK
          const updatedLlm = await this.retell.llm.update(
            existingAgent.retell_llm_id,
            llmUpdatePayload
          );

          this.logger.info('LLM updated successfully:', updatedLlm.llm_id);
        } catch (llmError: any) {
          this.logger.error('Failed to update LLM:', llmError);

          // If LLM doesn't exist, create a new one only if we should update LLM
          if (llmError?.status === 404 && shouldUpdateLlm) {
            this.logger.info('LLM not found, creating new one...');
            const newLlmId = await this.getOrCreateLlm(
              businessContext,
              config,
              'receptionist'
            );
            existingAgent.retell_llm_id = newLlmId;
          }
        }
      } else if (shouldUpdateLlm && !existingAgent.retell_llm_id) {
        // No LLM ID stored, create new one only if we should update LLM
        this.logger.info('No LLM ID found, creating new LLM...');
        const newLlmId = await this.getOrCreateLlm(
          businessContext,
          config,
          'receptionist'
        );
        existingAgent.retell_llm_id = newLlmId;
      } else if (!shouldUpdateLlm && existingResponseEngine) {
        // Update conversation-flow's global_prompt
        try {
          const comprehensivePrompt = this.generateComprehensivePrompt(
            businessContext,
            config,
            'receptionist'
          );

          const conversationFlowId =
            existingResponseEngine.conversation_flow_id;

          this.logger.info('Updating conversation-flow global_prompt:', {
            conversationFlowId,
            promptLength: comprehensivePrompt.length,
          });

          // Get existing conversation flow configuration
          const existingFlow =
            await this.getConversationFlow(conversationFlowId);

          // Keep all existing configuration, only update global_prompt
          const updatePayload = {
            ...existingFlow, // Keep all existing fields
            global_prompt: comprehensivePrompt, // Only override global_prompt
          };

          await this.updateConversationFlow(conversationFlowId, updatePayload);

          this.logger.info(
            'Successfully updated conversation-flow global_prompt'
          );
        } catch (error) {
          this.logger.error('Failed to update conversation-flow:', error);
          // Continue processing, don't interrupt the whole flow
        }
      } else if (!shouldUpdateLlm) {
        this.logger.info(
          'Skipping LLM update - agent uses conversation-flow response engine'
        );
      }

      // Prepare response engine configuration
      let responseEngine;
      if (existingResponseEngine) {
        // Use existing conversation-flow response engine
        responseEngine = existingResponseEngine;
        this.logger.info('Using existing conversation-flow response engine:', {
          type: existingResponseEngine.type,
          conversationFlowId: existingResponseEngine.conversation_flow_id,
        });
      } else if (existingAgent.retell_llm_id) {
        // Use retell-llm response engine
        responseEngine = {
          type: 'retell-llm' as const,
          llm_id: existingAgent.retell_llm_id,
        };
      } else {
        responseEngine = undefined;
      }

      // Update Agent
      const agentUpdatePayload: any = {
        agent_name: config.agent_name,
        voice_id: config.voice_settings?.voice_id || '11labs-Adrian',
        language: 'en-US' as const,
        webhook_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/retell/webhook`,
      };

      // Only add response_engine if we have it
      if (responseEngine) {
        agentUpdatePayload.response_engine = responseEngine;
      }

      this.logger.info('Updating agent:', {
        agentId: existingAgent.retell_agent_id,
        payload: agentUpdatePayload,
      });

      // Update agent using Retell SDK
      const updatedAgent = await this.retell.agent.update(
        existingAgent.retell_agent_id,
        agentUpdatePayload
      );

      this.logger.info('Agent updated successfully:', updatedAgent.agent_id);

      // Update database record
      const dbClient = authenticatedSupabase || supabase;
      const { error: dbUpdateError } = await dbClient
        .from('retell_agents')
        .update({
          agent_name: updatedAgent.agent_name,
          retell_llm_id: existingAgent.retell_llm_id,
          updated_at: new Date().toISOString(),
          user_id: userId || existingAgent.user_id,
        })
        .eq('id', existingAgent.id);

      if (dbUpdateError) {
        this.logger.error('Failed to update database record:', dbUpdateError);
      }

      return updatedAgent;
    } catch (error) {
      this.logger.error('Error updating existing agent:', error);
      throw error;
    }
  }

  /**
   * Deploy all agents using templates
   */
  async deployAgentsWithTemplate(businessId: string): Promise<{
    success: boolean;
    agents: any[];
    errors?: string[];
  }> {
    try {
      this.logger.info('Deploying agents using template approach...');

      const errors: string[] = [];
      const deployedAgents: any[] = [];
      const templateService = new RetellTemplateService();

      // Resolve proper business profile ID
      const resolvedBusinessId = await this.resolveBusinessId(businessId);

      // Get active agent configurations from database
      const { data: agentConfigs, error: configError } = await supabase
        .from('agent_configurations_scoped')
        .select('*')
        .eq('client_id', resolvedBusinessId)
        .eq('is_active', true);

      if (configError) {
        throw configError;
      }

      if (!agentConfigs || agentConfigs.length === 0) {
        this.logger.info(
          'No agent configurations found, creating default agent...'
        );

        // Get business context
        const businessContext = await this.getBusinessContext(businessId);

        // Create default configuration
        const defaultConfig = {
          id: 'default-agent',
          agent_name: `${businessContext.businessName} AI Receptionist`,
          client_id: resolvedBusinessId,
          basic_info_prompt: 'Professional AI receptionist',
          call_scripts: {
            greeting_script: 'Hello! How may I assist you today?',
          },
        };

        // Deploy using template
        const templateConfig: TemplateConfig = {
          businessType: businessContext.businessType || 'dental',
          agentRole: 'inbound-receptionist',
          version: 'v01',
        };

        const result = await templateService.deployFromTemplate(
          resolvedBusinessId,
          defaultConfig,
          templateConfig
        );

        if (result.success) {
          deployedAgents.push(result.agent);
        } else {
          errors.push(result.error || 'Failed to deploy default agent');
        }
      } else {
        // Deploy each configured agent using templates
        for (const config of agentConfigs) {
          try {
            const businessContext =
              await this.getBusinessContext(resolvedBusinessId);

            const templateConfig: TemplateConfig = {
              businessType: businessContext.businessType || 'dental',
              agentRole: 'inbound-receptionist',
              version: 'v01',
            };

            const result = await templateService.deployFromTemplate(
              resolvedBusinessId,
              config,
              templateConfig
            );

            if (result.success) {
              deployedAgents.push(result.agent);
            } else {
              errors.push(
                `Failed to deploy agent ${config.agent_name}: ${result.error}`
              );
            }
          } catch (agentError) {
            errors.push(
              `Error deploying agent ${config.agent_name}: ${
                agentError instanceof Error
                  ? agentError.message
                  : 'Unknown error'
              }`
            );
          }
        }
      }

      // Update deployment status in database
      if (deployedAgents.length > 0) {
        await this.updateDeploymentStatus(resolvedBusinessId, deployedAgents);
      }

      return {
        success: errors.length === 0,
        agents: deployedAgents,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error('Error deploying agents with templates:', error);
      return {
        success: false,
        agents: [],
        errors: [
          'Failed to deploy agents: ' +
            (error instanceof Error ? error.message : 'Unknown error'),
        ],
      };
    }
  }

  /**
   * Deploy all agents to Retell
   */
  async deployAgents(businessId: string): Promise<{
    success: boolean;
    agents: any[];
    errors?: string[];
  }> {
    try {
      const errors: string[] = [];
      const deployedAgents: any[] = [];

      // Resolve proper business profile ID
      const resolvedBusinessId = await this.resolveBusinessId(businessId);

      // Get active agent configurations from Step-6
      this.logger.info(
        'Searching for agent configs with businessId:',
        businessId,
        'resolved to:',
        resolvedBusinessId
      );

      // First try with full join, then fallback to any configs if none found
      const { data: agentConfigs, error: configError } = await supabase
        .from('agent_configurations_scoped')
        .select(
          `
          *,
          agent_types (
            id,
            type_code,
            name
          )
        `
        )
        .eq('client_id', resolvedBusinessId)
        .eq('is_active', true)
        .not('agent_type_id', 'is', null);

      this.logger.info(
        'Initial agent configs found:',
        agentConfigs?.length || 0
      );
      if (configError) {
        this.logger.error('Config query error:', configError);
      }

      // If no configs found with agent types, try without the join
      if (!agentConfigs || agentConfigs.length === 0) {
        this.logger.info('Trying fallback query without agent_types join...');

        const { data: fallbackConfigs, error: fallbackError } = await supabase
          .from('agent_configurations_scoped')
          .select('*')
          .eq('client_id', resolvedBusinessId)
          .eq('is_active', true);

        this.logger.info(
          'Fallback agent configs found:',
          fallbackConfigs?.length || 0
        );
        if (fallbackError) {
          this.logger.error('Fallback query error:', fallbackError);
        }

        // Try even more general query to see what's in the table
        if (!fallbackConfigs || fallbackConfigs.length === 0) {
          const { data: allConfigs, error: allError } = await supabase
            .from('agent_configurations_scoped')
            .select('*')
            .eq('client_id', resolvedBusinessId);

          this.logger.info(
            'All agent configs for businessId (any is_active):',
            allConfigs?.length || 0
          );
          if (allConfigs && allConfigs.length > 0) {
            this.logger.info('Sample config:', allConfigs[0]);
          }
          if (allError) {
            this.logger.error('All configs query error:', allError);
          }

          // Check if there are ANY agent configs in the table
          const { data: anyConfigs, error: anyError } = await supabase
            .from('agent_configurations_scoped')
            .select('client_id, is_active, agent_name, id')
            .limit(10);

          this.logger.info(
            'Any agent configs in table:',
            anyConfigs?.length || 0
          );
          if (anyConfigs && anyConfigs.length > 0) {
            this.logger.info(
              'Available client_ids:',
              anyConfigs.map(c => c.client_id)
            );
            this.logger.info('Sample configs:', anyConfigs);
          }
          if (anyError) {
            this.logger.error('Any configs query error:', anyError);
          }
        }

        if (fallbackConfigs && fallbackConfigs.length > 0) {
          // Manually add agent type info
          agentConfigs = fallbackConfigs.map(config => ({
            ...config,
            agent_types: {
              type_code: 'inbound_receptionist',
              name: 'Inbound Receptionist',
            },
          }));
        }
      }

      if (configError) {
        throw configError;
      }

      if (!agentConfigs || agentConfigs.length === 0) {
        this.logger.info(
          'No agent configurations found, creating default agent...'
        );

        // Get business name for default agent
        const businessName = await this.getBusinessName(businessId);

        // Create a default agent configuration if none exists
        const defaultAgent = {
          id: 'default-agent',
          agent_name: `${businessName} AI Receptionist`,
          client_id: businessId,
          basic_info_prompt:
            'You are a helpful AI receptionist for this business. Assist customers with their inquiries professionally and courteously.',
          call_scripts_prompt:
            'Greet callers warmly and ask how you can help them today.',
          call_scripts: {
            greeting_script:
              'Hello! Thank you for calling. How may I assist you today?',
          },
          voice_settings: {
            provider: 'retell',
            voice_id: '11labs-Adrian',
            speed: 1.28,
          },
          agent_types: {
            type_code: 'inbound_receptionist',
            name: 'Inbound Receptionist',
          },
        };

        agentConfigs = [defaultAgent];
        this.logger.info(
          'Created default agent configuration with business name:',
          businessName
        );
      }

      // Deploy Receptionist Agent
      const receptionistConfig = agentConfigs.find(
        a => a.agent_types?.type_code === 'inbound_receptionist'
      );
      if (receptionistConfig) {
        const receptionistAgent = await this.deployRoleAgent(
          receptionistConfig,
          'receptionist'
        );
        if (receptionistAgent) {
          deployedAgents.push(receptionistAgent);
        } else {
          errors.push('Failed to deploy receptionist agent');
        }
      }

      // Deploy Customer Support Agent
      const supportConfig = agentConfigs.find(
        a => a.agent_types?.type_code === 'inbound_customer_support'
      );
      if (supportConfig) {
        const supportAgent = await this.deployRoleAgent(
          supportConfig,
          'support'
        );
        if (supportAgent) {
          deployedAgents.push(supportAgent);
        } else {
          errors.push('Failed to deploy customer support agent');
        }
      }

      // Update deployment status in database
      await this.updateDeploymentStatus(resolvedBusinessId, deployedAgents);

      return {
        success: errors.length === 0,
        agents: deployedAgents,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error('Error deploying agents:', error);
      this.logger.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        businessId,
      });
      return {
        success: false,
        agents: [],
        errors: [
          'Failed to deploy agents: ' +
            (error instanceof Error ? error.message : error),
        ],
      };
    }
  }

  /**
   * Deploy a role-specific agent (receptionist or support)
   */
  private async deployRoleAgent(
    config: any,
    role: 'receptionist' | 'support',
    userId?: string,
    authenticatedSupabase?: any
  ): Promise<any> {
    try {
      // Use the business user-defined agent name directly
      const agentName = config.agent_name || `${role} Agent`;

      // Get agent type information including direction
      let agentDirection = 'inbound'; // default
      if (config.agent_type_id) {
        const { data: agentType } = await supabase
          .from('agent_types')
          .select('direction, type_code')
          .eq('id', config.agent_type_id)
          .single();

        if (agentType) {
          agentDirection = agentType.direction || 'inbound';
          this.logger.info(
            `Agent type ${agentType.type_code} has direction: ${agentDirection}`
          );
        }
      }

      // Determine response engine type based on configuration
      let responseEngine;
      if (config.conversationFlowId || config.conversation_flow_id) {
        responseEngine = {
          type: 'conversation-flow',
          conversation_flow_id:
            config.conversationFlowId || config.conversation_flow_id,
        };
      }

      // Get complete business context first (needed for both LLM creation and prompt building)
      const businessContext = await this.getBusinessContext(config.client_id);

      // Create LLM if using retell-llm response engine
      if (!config.conversationFlowId && !config.conversation_flow_id) {
        // Create new LLM for this agent
        const dynamicLlmId = await this.getOrCreateLlm(
          businessContext,
          config,
          role
        );
        responseEngine = {
          type: 'retell-llm',
          llm_id: dynamicLlmId,
        };
      }

      this.logger.info('Response engine config:', responseEngine);

      // Test API permissions before creating agent
      try {
        this.logger.info('Testing Retell API permissions by listing agents...');
        const existingAgents = await this.retell.agent.list();
        this.logger.info(
          `Found ${existingAgents.length} existing agents in Retell account`
        );
        if (existingAgents.length > 0) {
          this.logger.info('Sample agent ID:', existingAgents[0].agent_id);
        }
      } catch (listError) {
        this.logger.error(
          'Failed to list agents - API key may have permission issues:',
          listError
        );
      }

      // Create calendar-integrated agent config
      const agentConfig = {
        agent_name: agentName,
        response_engine: responseEngine,
        voice_id: config.voice_settings?.voice_id || '11labs-Adrian',
        language: 'en-US',
        webhook_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/retell/webhook`,
        voice_temperature: config.voice_settings?.voice_temperature || 1,
        voice_speed: config.voice_settings?.speed || 1.28,
        volume: config.voice_settings?.volume || 1,
        enable_backchannel: config.voice_settings?.enable_backchannel !== false,
        backchannel_words: config.voice_settings?.backchannel_words || [
          'mhm',
          'uh-huh',
        ],
        max_call_duration_ms:
          config.call_routing?.max_call_duration_ms || 1800000,
        interruption_sensitivity:
          config.voice_settings?.interruption_sensitivity || 0.9,
        normalize_for_speech: true,
        begin_message_delay_ms:
          config.voice_settings?.begin_message_delay_ms || 200,
        post_call_analysis_model: 'gpt-4o-mini',
        opt_out_sensitive_data_storage: false,
        opt_in_signed_url: false,
        allow_user_dtmf: true,
        user_dtmf_options: {},
        is_published: true,
        begin_message:
          config.call_scripts?.greeting_script ||
          config.greeting_message ||
          `Hello! Thank you for calling ${businessContext.businessName}. I'm your AI receptionist and I'm here to help you with scheduling appointments. How may I assist you today?`,
        // Calendar integration tools
        tools: [
          {
            type: 'function',
            function: {
              name: 'check_availability',
              description:
                'Check staff availability for appointment scheduling',
              parameters: {
                type: 'object',
                properties: {
                  date: {
                    type: 'string',
                    description: 'Date in YYYY-MM-DD format',
                  },
                  time: {
                    type: 'string',
                    description: 'Time in HH:MM format',
                  },
                  staff_id: {
                    type: 'string',
                    description:
                      'Optional staff member ID for specific staff preference',
                  },
                  service_type: {
                    type: 'string',
                    description: 'Type of service/appointment',
                  },
                },
                required: ['date', 'time'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'create_appointment',
              description: 'Create a new appointment in the calendar',
              parameters: {
                type: 'object',
                properties: {
                  customer_first_name: { type: 'string' },
                  customer_last_name: { type: 'string' },
                  customer_phone: { type: 'string' },
                  customer_email: { type: 'string' },
                  date: {
                    type: 'string',
                    description: 'Date in YYYY-MM-DD format',
                  },
                  time: { type: 'string', description: 'Time in HH:MM format' },
                  service_type: { type: 'string' },
                  staff_id: { type: 'string' },
                  notes: {
                    type: 'string',
                    description: 'Additional notes or special requests',
                  },
                },
                required: [
                  'customer_first_name',
                  'customer_last_name',
                  'customer_phone',
                  'date',
                  'time',
                  'service_type',
                ],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'update_appointment',
              description: 'Update an existing appointment',
              parameters: {
                type: 'object',
                properties: {
                  appointment_id: { type: 'string' },
                  date: {
                    type: 'string',
                    description: 'New date in YYYY-MM-DD format',
                  },
                  time: {
                    type: 'string',
                    description: 'New time in HH:MM format',
                  },
                  service_type: { type: 'string' },
                  staff_id: { type: 'string' },
                  notes: { type: 'string' },
                },
                required: ['appointment_id'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'cancel_appointment',
              description: 'Cancel an existing appointment',
              parameters: {
                type: 'object',
                properties: {
                  appointment_id: { type: 'string' },
                  reason: {
                    type: 'string',
                    description: 'Reason for cancellation',
                  },
                },
                required: ['appointment_id'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'find_customer_appointments',
              description: 'Find existing appointments by customer information',
              parameters: {
                type: 'object',
                properties: {
                  last_name: { type: 'string' },
                  phone_number: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        ],
        // Enhanced post-call analysis for appointment data
        post_call_analysis_data: this.generateCalendarPostCallAnalysisFields(
          businessContext,
          config
        ),
      };

      this.logger.info(
        'Creating role agent with config:',
        JSON.stringify(agentConfig, null, 2)
      );

      // Check if agent already exists in database using ai_agent_id
      const { data: existingDbAgent } = await supabase
        .from('retell_agents')
        .select('*')
        .eq('ai_agent_id', config.id)
        .single();

      // If we have a retell_agent_id, check if it still exists in Retell API
      let existing = null;
      if (existingDbAgent?.retell_agent_id) {
        try {
          // Use the retrieve API to check if the specific agent exists
          existing = await this.retell.agent.retrieve(
            existingDbAgent.retell_agent_id
          );
          this.logger.info('Found existing agent in Retell AI:', {
            agent_id: existing.agent_id,
            agent_name: existing.agent_name,
          });
        } catch (error: any) {
          if (error?.status === 404) {
            this.logger.warn(
              'Agent not found in Retell AI, will create new one'
            );
            existing = null;
          } else {
            this.logger.error('Error retrieving agent from Retell AI:', error);
          }
        }
      }

      let agent;
      if (existing) {
        this.logger.info(`Updating existing ${role} agent:`, existing.agent_id);

        // Check if response_engine type has changed
        const existingResponseEngineType = existing.response_engine?.type;
        const newResponseEngineType = agentConfig.response_engine?.type;

        if (
          existingResponseEngineType &&
          newResponseEngineType &&
          existingResponseEngineType !== newResponseEngineType
        ) {
          this.logger.warn(
            `Response engine type changed from ${existingResponseEngineType} to ${newResponseEngineType}. ` +
              `Deleting old agent and creating new one...`
          );

          // Delete the old agent first
          try {
            await this.retell.agent.delete(existing.agent_id);
            this.logger.info(`Deleted old agent ${existing.agent_id}`);
          } catch (deleteError) {
            this.logger.error(`Failed to delete old agent:`, deleteError);
            // Continue anyway - the old agent might already be deleted
          }

          // Create new agent with new response engine
          try {
            agent = await this.retell.agent.create(agentConfig);
            this.logger.info(
              `New ${role} agent created with different response engine:`,
              agent.agent_id
            );
          } catch (createError) {
            this.logger.error(`Failed to create new ${role} agent:`, {
              error: createError.message,
              status: createError.status,
              details: createError.error || createError,
              config: agentConfig,
            });
            throw createError;
          }
        } else {
          // Response engine type hasn't changed, proceed with update
          try {
            agent = await this.retell.agent.update(
              existing.agent_id,
              agentConfig
            );
            this.logger.info(
              `${role} agent updated successfully:`,
              agent.agent_id
            );
          } catch (updateError) {
            this.logger.error(`Failed to update ${role} agent:`, {
              error: updateError.message,
              status: updateError.status,
              details: updateError.error || updateError,
              config: agentConfig,
            });

            // If agent doesn't exist (404) or response engine error (400), create a new one instead
            if (
              updateError.status === 404 ||
              (updateError.status === 400 &&
                updateError.message?.includes('response engine'))
            ) {
              this.logger.warn(
                `Agent ${existing.agent_id} cannot be updated (${updateError.status}), creating new agent instead...`
              );

              // Try to delete the old agent first if it's a 400 error
              if (updateError.status === 400) {
                try {
                  await this.retell.agent.delete(existing.agent_id);
                  this.logger.info(
                    `Deleted old agent ${existing.agent_id} before creating new one`
                  );
                } catch (deleteError) {
                  this.logger.error(`Failed to delete old agent:`, deleteError);
                }
              }

              try {
                agent = await this.retell.agent.create(agentConfig);
                this.logger.info(
                  `New ${role} agent created successfully after ${updateError.status} error:`,
                  agent.agent_id
                );
              } catch (createError) {
                this.logger.error(
                  `Failed to create new ${role} agent after ${updateError.status}:`,
                  {
                    error: createError.message,
                    status: createError.status,
                    details: createError.error || createError,
                    config: agentConfig,
                  }
                );
                throw createError;
              }
            } else {
              throw updateError;
            }
          }
        }
      } else {
        this.logger.info(`Creating new ${role} agent...`);
        // Create new agent
        try {
          agent = await this.retell.agent.create(agentConfig);
          this.logger.info(
            `${role} agent created successfully:`,
            agent.agent_id
          );
        } catch (createError) {
          this.logger.error(`Failed to create ${role} agent:`, {
            error: createError.message,
            status: createError.status,
            details: createError.error || createError,
            config: agentConfig,
          });
          throw createError;
        }
      }

      // Store agent ID and configuration in database
      const agentRecord = {
        business_id: config.client_id,
        user_id: userId || config.client_id, // Use userId if provided, fallback to business_id
        agent_type: `${role}_${agent.agent_id.slice(-8)}`, // Make agent_type unique by appending agent ID suffix
        retell_agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        ai_agent_id: config.id,
        status: 'deployed',
        updated_at: new Date().toISOString(),
        conversation_flow_id:
          config.conversationFlowId || config.conversation_flow_id || null,
        response_engine_type: responseEngine.type,
        retell_llm_id:
          responseEngine.type === 'retell-llm' ? responseEngine.llm_id : null,
        voice_settings: JSON.stringify({
          voice_id: agentConfig.voice_id,
          voice_temperature: agentConfig.voice_temperature,
          voice_speed: agentConfig.voice_speed,
        }),
      };

      // Always ensure the record is stored in database
      const dbClient = authenticatedSupabase || supabase;
      const { data: insertedRecord, error: insertError } = await dbClient
        .from('retell_agents')
        .upsert(agentRecord, {
          onConflict: 'retell_agent_id',
          ignoreDuplicates: false,
        })
        .select();

      if (insertError) {
        this.logger.error(
          `Failed to store ${role} agent in database:`,
          insertError
        );
        this.logger.error('Agent record that failed to insert:', agentRecord);

        // Try alternative insert method if upsert fails
        try {
          const { data: fallbackRecord, error: fallbackError } = await dbClient
            .from('retell_agents')
            .insert(agentRecord)
            .select();

          if (!fallbackError) {
            this.logger.info(
              `Fallback insert successful for ${role} agent:`,
              fallbackRecord
            );
          } else {
            this.logger.error(
              `Fallback insert also failed for ${role} agent:`,
              fallbackError
            );
          }
        } catch (fallbackErr) {
          this.logger.error(
            `Fallback insert exception for ${role} agent:`,
            fallbackErr
          );
        }
      } else {
        this.logger.info(
          `Successfully stored ${role} agent in database:`,
          insertedRecord
        );
      }

      // Final verification: check if record exists in database
      const { data: verificationRecord, error: verifyError } = await dbClient
        .from('retell_agents')
        .select('*')
        .eq('retell_agent_id', agent.agent_id)
        .single();

      if (verifyError || !verificationRecord) {
        this.logger.error(
          `CRITICAL: ${role} agent record not found in database after insertion!`,
          {
            agentId: agent.agent_id,
            agentName: agent.agent_name,
            businessId: config.client_id,
            verifyError,
          }
        );
      } else {
        this.logger.info(
          `✅ Verified ${role} agent record exists in database:`,
          {
            id: verificationRecord.id,
            retell_agent_id: verificationRecord.retell_agent_id,
            agent_name: verificationRecord.agent_name,
            business_id: verificationRecord.business_id,
          }
        );
      }

      // Final step: Always ensure the record exists in database
      const recordExists = await this.ensureAgentRecordExists(
        agent,
        config.client_id || businessId,
        role,
        config,
        userId,
        authenticatedSupabase
      );

      if (!recordExists) {
        this.logger.error(
          `❌ CRITICAL: Could not ensure database record for ${role} agent: ${agent.agent_id}`
        );
      } else {
        this.logger.info(
          `✅ Database record confirmed for ${role} agent: ${agent.agent_id}`
        );
      }

      return agent;
    } catch (error) {
      this.logger.error(`Error deploying ${role} agent:`, error);
      return null;
    }
  }

  /**
   * Ensure agent record exists in database - force insert if missing
   */
  private async ensureAgentRecordExists(
    agent: any,
    businessId: string,
    role: string,
    config: any,
    userId?: string,
    authenticatedSupabase?: any
  ): Promise<boolean> {
    try {
      const resolvedBusinessId = await this.resolveBusinessId(businessId);

      // Check if record exists
      const dbClient = authenticatedSupabase || supabase;
      const { data: existingRecord, error: checkError } = await dbClient
        .from('retell_agents')
        .select('*')
        .eq('retell_agent_id', agent.agent_id)
        .single();

      if (existingRecord && !checkError) {
        this.logger.info(`✅ Agent record already exists: ${agent.agent_id}`);
        return true;
      }

      this.logger.warn(
        `🔧 Agent record missing for ${agent.agent_id}, force creating...`
      );

      // Create the missing record with unique agent_type to avoid constraint conflicts
      const agentRecord = {
        business_id: resolvedBusinessId,
        user_id: userId || resolvedBusinessId, // Use userId if provided, fallback to business_id
        agent_type: `${role}_${agent.agent_id.slice(-8)}`, // Make agent_type unique by appending agent ID suffix
        retell_agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        ai_agent_id: config?.id || null,
        status: 'deployed',
        conversation_flow_id:
          config?.conversationFlowId || config?.conversation_flow_id || null,
        response_engine_type: agent.response_engine?.type || 'retell-llm',
        retell_llm_id:
          agent.response_engine?.type === 'retell-llm'
            ? agent.response_engine.llm_id
            : null,
        voice_settings: JSON.stringify({
          voice_id:
            config?.voice?.voiceId || agent.voice?.voice_id || '11labs-Adrian',
          voice_temperature:
            config?.voice?.temperature || agent.voice?.voice_temperature || 1,
          voice_speed: config?.voice?.speed || agent.voice?.voice_speed || 1.28,
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Try multiple insertion methods
      const insertMethods = [
        () =>
          dbClient
            .from('retell_agents')
            .upsert(agentRecord, { onConflict: 'retell_agent_id' })
            .select(),
        () => dbClient.from('retell_agents').insert(agentRecord).select(),
      ];

      for (const method of insertMethods) {
        const { data: insertResult, error: insertError } = await method();

        if (!insertError && insertResult && insertResult.length > 0) {
          this.logger.info(`✅ Force insert successful: ${insertResult[0].id}`);
          return true;
        } else if (insertError) {
          this.logger.warn(`⚠️  Insert method failed: ${insertError.message}`);
        }
      }

      this.logger.error(
        '❌ All insertion methods failed for agent:',
        agent.agent_id
      );
      return false;
    } catch (error) {
      this.logger.error('❌ Error ensuring agent record exists:', error);
      return false;
    }
  }

  /**
   * Update deployment status in database
   */
  private async updateDeploymentStatus(
    businessId: string,
    agents: any[]
  ): Promise<void> {
    try {
      await supabase.from('agent_deployments').insert({
        business_id: businessId,
        deployment_type: 'retell',
        agents_deployed: agents.length,
        agent_ids: agents.map(a => a.agent_id),
        status: 'active',
        deployed_at: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error updating deployment status:', error);
    }
  }

  /**
   * Create a test inbound call to an agent
   */
  async createTestCall(
    businessId: string,
    agentId?: string,
    fromNumber?: string,
    toNumber?: string
  ): Promise<{
    success: boolean;
    callId?: string;
    callUrl?: string;
    error?: string;
  }> {
    try {
      // Get deployed agents for this business
      const { data: agents, error } = await supabase
        .from('retell_agents')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'deployed');

      if (error || !agents || agents.length === 0) {
        throw new Error('No deployed agents found for testing');
      }

      // Use specified agent or default to first available
      const targetAgent = agentId
        ? agents.find(a => a.retell_agent_id === agentId)
        : agents[0];

      if (!targetAgent) {
        throw new Error('Specified agent not found');
      }

      // Create test call configuration
      const testCallConfig = {
        agent_id: targetAgent.retell_agent_id,
        from_number: fromNumber || '+1234567890', // Test number
        to_number: toNumber || '+1987654321', // Test number
        metadata: {
          test_call: true,
          business_id: businessId,
          agent_name: targetAgent.agent_name,
          created_at: new Date().toISOString(),
        },
      };

      this.logger.info('Creating test call:', testCallConfig);

      // Create the test call using Retell API
      const testCall = await this.retell.call.create(testCallConfig);

      // Store test call record
      await supabase.from('test_calls').insert({
        business_id: businessId,
        retell_agent_id: targetAgent.retell_agent_id,
        retell_call_id: testCall.call_id,
        from_number: testCallConfig.from_number,
        to_number: testCallConfig.to_number,
        status: 'created',
        created_at: new Date().toISOString(),
      });

      return {
        success: true,
        callId: testCall.call_id,
        callUrl: `https://app.retellai.com/call/${testCall.call_id}`,
      };
    } catch (error) {
      this.logger.error('Error creating test call:', error);
      return {
        success: false,
        error:
          'Failed to create test call: ' +
          (error instanceof Error ? error.message : error),
      };
    }
  }

  /**
   * Assign phone number to business
   */
  async assignPhoneNumber(
    businessId: string,
    phoneNumber?: string
  ): Promise<{ success: boolean; phoneNumber?: string; error?: string }> {
    try {
      this.logger.info(
        'Attempting to assign phone number for business:',
        businessId
      );

      // Get deployed agents for this business
      const { data: agents, error } = await supabase
        .from('retell_agents')
        .select('retell_agent_id')
        .eq('business_id', businessId)
        .eq('status', 'deployed')
        .limit(1);

      if (error || !agents || agents.length === 0) {
        this.logger.warn(
          'No deployed agents found for phone number assignment'
        );
        return {
          success: true,
          phoneNumber: undefined,
        };
      }

      const agentId = agents[0].retell_agent_id;
      let assignedNumber;

      if (phoneNumber) {
        // Use provided phone number
        this.logger.info('Using provided phone number:', phoneNumber);
        assignedNumber = phoneNumber;
      } else {
        // For now, return success without actually purchasing a new number
        // This can be implemented later when phone number purchasing is needed
        this.logger.info(
          'Phone number purchase not implemented - returning success'
        );
        return {
          success: true,
          phoneNumber: undefined,
        };
      }

      this.logger.info('Phone number assigned successfully:', assignedNumber);
      return {
        success: true,
        phoneNumber: assignedNumber,
      };
    } catch (error) {
      this.logger.error('Error assigning phone number:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test agent deployment
   */
  async testDeployment(businessId: string): Promise<{
    success: boolean;
    results: any;
    error?: string;
  }> {
    try {
      // Get deployed agents
      const { data: agents, error } = await supabase
        .from('retell_agents')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'deployed');

      if (error || !agents || agents.length === 0) {
        throw new Error('No deployed agents found');
      }

      const testResults = [];

      for (const agent of agents) {
        try {
          // Get agent details from Retell
          const retellAgent = await this.retell.agent.retrieve(
            agent.retell_agent_id
          );

          testResults.push({
            agentType: agent.agent_type,
            agentName: agent.agent_name,
            status: 'active',
            details: retellAgent,
          });
        } catch (agentError) {
          testResults.push({
            agentType: agent.agent_type,
            agentName: agent.agent_name,
            status: 'error',
            error: agentError,
          });
        }
      }

      return {
        success: true,
        results: testResults,
      };
    } catch (error) {
      this.logger.error('Error testing deployment:', error);
      return {
        success: false,
        results: [],
        error: 'Failed to test deployment: ' + error,
      };
    }
  }
}
