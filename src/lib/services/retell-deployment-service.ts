import { BaseBusinessService } from './base-service';
import { supabase } from '../supabase';
import { retellTools, routerAgentConfig } from '../retell/tools';
import Retell from 'retell-sdk';
import { createClient } from '@supabase/supabase-js';

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

export class RetellDeploymentService extends BaseBusinessService {
  readonly name = 'Retell Deployment Service';
  private retell: Retell;

  protected logger = {
    info: (message: string, ...args: any[]) =>
      console.log(`[${this.name}]`, message, ...args),
    error: (message: string, ...args: any[]) =>
      console.error(`[${this.name}]`, message, ...args),
    warn: (message: string, ...args: any[]) =>
      console.warn(`[${this.name}]`, message, ...args),
  };

  constructor() {
    super();

    const apiKey = process.env.RETELL_API_KEY;
    this.logger.info('Environment check:', {
      hasRetellApiKey: !!apiKey,
      retellApiKeyLength: apiKey?.length || 0,
      hasLlmId: !!process.env.RETELL_LLM_ID,
      llmId: process.env.RETELL_LLM_ID,
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

  /**
   * Create new LLM for agent deployment
   */
  private async createLlmForAgent(
    businessContext: any,
    config: any,
    role: string
  ): Promise<string> {
    try {
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

      this.logger.info('Created new LLM successfully:', newLlm.llm_id);
      this.logger.info('LLM prompt length:', comprehensivePrompt.length);
      this.logger.info(
        'LLM prompt preview:',
        comprehensivePrompt.substring(0, 200) + '...'
      );

      return newLlm.llm_id;
    } catch (error) {
      this.logger.error('Error creating new LLM:', error);

      // Fallback to environment variable if API fails
      const fallbackLlmId = process.env.RETELL_LLM_ID;
      if (fallbackLlmId) {
        this.logger.warn(
          'Using fallback LLM ID from environment:',
          fallbackLlmId
        );
        return fallbackLlmId;
      }

      throw new Error(
        'Failed to create new LLM and no fallback available: ' +
          (error instanceof Error ? error.message : error)
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
    // Start with enhanced business identity based on ALL Supabase data
    let generalPrompt = `You are a professional AI ${role} for ${businessContext.businessName}`;
    if (businessContext.businessType === 'dental') {
      generalPrompt += ', a dental practice';
    } else if (businessContext.businessType) {
      generalPrompt += `, a ${businessContext.businessType} business`;
    }
    generalPrompt += '. ';

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
   * Deploy a single agent to Retell
   */
  async deploySingleAgent(
    businessId: string,
    agentConfig: any
  ): Promise<{
    success: boolean;
    agent?: any;
    error?: string;
  }> {
    try {
      // Get business name
      const businessName = await this.getBusinessName(businessId);

      // Create agent name: Business Name + Agent Name from Step 6
      const fullAgentName = `${businessName} ${agentConfig.agent_name}`;

      // Deploy the individual agent
      const deployedAgent = await this.deployRoleAgent(
        {
          ...agentConfig,
          agent_name: fullAgentName,
          client_id: businessId,
        },
        'receptionist'
      ); // Default to receptionist, can be customized

      if (deployedAgent) {
        return {
          success: true,
          agent: deployedAgent,
        };
      } else {
        return {
          success: false,
          error: 'Failed to deploy agent',
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

      // Get active agent configurations from Step-6
      this.logger.info(
        'Searching for agent configs with businessId:',
        businessId
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
        .eq('client_id', businessId)
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
          .eq('client_id', businessId)
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
            .eq('client_id', businessId);

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

      // Deploy Router Agent
      const routerAgent = await this.deployRouterAgent(businessId);
      if (routerAgent) {
        deployedAgents.push(routerAgent);
      } else {
        errors.push('Failed to deploy router agent');
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
      await this.updateDeploymentStatus(businessId, deployedAgents);

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
   * Deploy the router agent
   */
  private async deployRouterAgent(businessId: string): Promise<any> {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'http://localhost:19080';
      const webhookUrl = `${baseUrl}/api/retell/functions/appointment`;

      // Get business context for LLM creation
      const businessContext = await this.getBusinessContext(businessId);

      // Create new LLM for router agent
      const routerConfig = {
        basic_info_prompt: 'Router agent for appointment handling',
      };
      const dynamicLlmId = await this.createLlmForAgent(
        businessContext,
        routerConfig,
        'router'
      );

      // Create comprehensive agent config based on sample working agent
      const agentConfig = {
        agent_name: routerAgentConfig.name,
        response_engine: {
          type: 'retell-llm',
          llm_id: dynamicLlmId,
        },
        voice_id: '11labs-Adrian',
        language: 'en-US',
        webhook_url: webhookUrl,
        voice_temperature: 1,
        voice_speed: 1.28,
        volume: 1,
        enable_backchannel: true,
        backchannel_words: ['mhm', 'uh-huh'],
        max_call_duration_ms: 1800000, // 30 minutes
        interruption_sensitivity: 0.9,
        normalize_for_speech: true,
        begin_message_delay_ms: 200,
        post_call_analysis_model: 'gpt-4o-mini',
      };

      this.logger.info(
        'Creating router agent with config:',
        JSON.stringify(agentConfig, null, 2)
      );

      // Check if agent already exists
      const existingAgents = await this.retell.agent.list();
      const existing = existingAgents.find(
        a => a.agent_name === routerAgentConfig.name
      );

      let agent;
      if (existing) {
        this.logger.info('Updating existing router agent:', existing.agent_id);
        // Update existing agent
        agent = await this.retell.agent.update(existing.agent_id, agentConfig);
      } else {
        this.logger.info('Creating new router agent...');
        // Create new agent
        try {
          agent = await this.retell.agent.create(agentConfig);
          this.logger.info(
            'Router agent created successfully:',
            agent.agent_id
          );
        } catch (createError) {
          this.logger.error('Failed to create router agent:', {
            error: createError.message,
            status: createError.status,
            details: createError.error || createError,
            config: agentConfig,
          });
          throw createError;
        }
      }

      // Store agent ID and configuration in database
      const routerRecord = {
        business_id: businessId,
        agent_type: 'router',
        retell_agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        status: 'deployed',
        updated_at: new Date().toISOString(),
        response_engine_type: 'retell-llm',
        retell_llm_id: dynamicLlmId,
        voice_settings: JSON.stringify({
          voice_id: agentConfig.voice_id,
          voice_temperature: agentConfig.voice_temperature,
          voice_speed: agentConfig.voice_speed,
        }),
      };

      await supabase.from('retell_agents').upsert(routerRecord);

      this.logger.info('Stored router agent in database:', routerRecord);

      return agent;
    } catch (error) {
      this.logger.error('Error deploying router agent:', error);
      return null;
    }
  }

  /**
   * Deploy a role-specific agent (receptionist or support)
   */
  private async deployRoleAgent(
    config: any,
    role: 'receptionist' | 'support'
  ): Promise<any> {
    try {
      // Use the business user-defined agent name directly
      const agentName = config.agent_name || `${role} Agent`;

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
        const dynamicLlmId = await this.createLlmForAgent(
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

      // Create comprehensive agent config (prompt is now handled in LLM creation)
      const agentConfig = {
        agent_name: agentName,
        response_engine: responseEngine,
        voice_id: config.voice_settings?.voice_id || '11labs-Adrian',
        language: businessContext.businessType === 'dental' ? 'en-US' : 'en-US',
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
          config.call_routing?.max_call_duration_ms || 1800000, // 30 minutes
        interruption_sensitivity:
          config.voice_settings?.interruption_sensitivity || 0.9,
        normalize_for_speech: true,
        begin_message_delay_ms:
          config.voice_settings?.begin_message_delay_ms || 200,
        post_call_analysis_model: 'gpt-4o-mini',
        opt_out_sensitive_data_storage: false, // Keep data for business analysis
        opt_in_signed_url: false,
        allow_user_dtmf: true,
        user_dtmf_options: {},
        is_published: true, // Make agent accessible in Retell interface
        begin_message:
          config.call_scripts?.greeting_script ||
          config.greeting_message ||
          'Hello! Thank you for calling. How can I help you today?',
        // Add business-specific post-call analysis fields
        post_call_analysis_data: this.generatePostCallAnalysisFields(
          businessContext,
          config
        ),
      };

      this.logger.info(
        'Creating role agent with config:',
        JSON.stringify(agentConfig, null, 2)
      );

      // For now, always create a new agent to avoid update issues
      // TODO: Implement proper agent updating logic later
      this.logger.info(`Creating ${role} agent...`);
      let agent;
      try {
        agent = await this.retell.agent.create(agentConfig);
        this.logger.info(`${role} agent created successfully:`, agent.agent_id);
      } catch (createError) {
        this.logger.error(`Failed to create ${role} agent:`, {
          error: createError.message,
          status: createError.status,
          details: createError.error || createError,
          config: agentConfig,
        });
        throw createError;
      }

      // Store agent ID and configuration in database
      const agentRecord = {
        business_id: config.client_id,
        agent_type: role,
        retell_agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        ai_agent_id: config.id,
        status: 'deployed',
        updated_at: new Date().toISOString(),
        conversation_flow_id:
          config.conversationFlowId || config.conversation_flow_id || null,
        response_engine_type: responseEngine.type,
        retell_llm_id: responseEngine.type === 'retell-llm' ? responseEngine.llm_id : null,
        voice_settings: JSON.stringify({
          voice_id: agentConfig.voice_id,
          voice_temperature: agentConfig.voice_temperature,
          voice_speed: agentConfig.voice_speed,
        }),
      };

      await supabase.from('retell_agents').upsert(agentRecord);

      this.logger.info(`Stored ${role} agent in database:`, agentRecord);

      return agent;
    } catch (error) {
      this.logger.error(`Error deploying ${role} agent:`, error);
      return null;
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
   * Assign phone number to router agent
   */
  async assignPhoneNumber(
    businessId: string,
    phoneNumber?: string
  ): Promise<{ success: boolean; phoneNumber?: string; error?: string }> {
    try {
      // Get router agent
      const { data: routerAgent, error } = await supabase
        .from('retell_agents')
        .select('retell_agent_id')
        .eq('business_id', businessId)
        .eq('agent_type', 'router')
        .single();

      if (error || !routerAgent) {
        throw new Error('Router agent not found');
      }

      let assignedNumber;

      if (phoneNumber) {
        // Use provided phone number
        assignedNumber = await this.retell.phoneNumber.import({
          phone_number: phoneNumber,
          agent_id: routerAgent.retell_agent_id,
        });
      } else {
        // Purchase new phone number
        const availableNumbers = await this.retell.phoneNumber.searchAvailable({
          country: 'US',
          limit: 1,
        });

        if (availableNumbers.length === 0) {
          throw new Error('No phone numbers available');
        }

        assignedNumber = await this.retell.phoneNumber.purchase({
          phone_number: availableNumbers[0].phone_number,
          agent_id: routerAgent.retell_agent_id,
        });
      }

      // Store phone number assignment
      await supabase.from('phone_assignments').insert({
        business_id: businessId,
        phone_number: assignedNumber.phone_number,
        retell_agent_id: routerAgent.retell_agent_id,
        type: 'inbound',
        status: 'active',
        assigned_at: new Date().toISOString(),
      });

      return {
        success: true,
        phoneNumber: assignedNumber.phone_number,
      };
    } catch (error) {
      this.logger.error('Error assigning phone number:', error);
      return {
        success: false,
        error: 'Failed to assign phone number: ' + error,
      };
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
