import { createClient } from '@supabase/supabase-js';
import Retell from 'retell-sdk';
import { promises as fs } from 'fs';
import path from 'path';
import type {
  RetellTemplate,
  BusinessContext,
  DeploymentResult,
  TemplateConfig,
  RetellTool,
} from './types/retell-template-types';

export class RetellTemplateService {
  private retell: Retell;
  private readonly name = 'Retell Template Service';

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
    if (!apiKey) {
      throw new Error('RETELL_API_KEY environment variable is required');
    }

    this.retell = new Retell({
      apiKey: apiKey,
    });

    this.logger.info('Retell Template Service initialized');
  }

  /**
   * Load template from local file system
   */
  async loadTemplate(
    businessType: string,
    agentRole: string,
    version: string
  ): Promise<RetellTemplate> {
    try {
      // Generate filename based on business type, agent role, and version
      // Format: {businessType}-{agentRole}-{version}.json
      const filename = `${businessType}-${agentRole}-${version}.json`;

      // Get the template file path (relative to project root)
      const templatePath = path.join(
        process.cwd(),
        'src',
        'agent-template',
        filename
      );

      this.logger.info('Loading template from local file:', {
        filename,
        templatePath,
      });

      // Read the template file
      const templateText = await fs.readFile(templatePath, 'utf-8');
      const template = JSON.parse(templateText) as RetellTemplate;

      this.logger.info('Template loaded successfully', {
        filename,
        agentName: template.agent_name,
        hasLlmData: !!template.retellLlmData,
        toolsCount: template.retellLlmData?.general_tools?.length || 0,
      });

      return template;
    } catch (error) {
      this.logger.error('Error loading template:', error);

      // Check if it's a file not found error
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        throw new Error(
          `Template file not found: ${businessType}-${agentRole}-${version}.json`
        );
      }

      if (error instanceof Error) {
        throw new Error(`Failed to load template: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * List available templates in the local directory
   */
  async listAvailableTemplates(): Promise<string[]> {
    try {
      const templateDir = path.join(process.cwd(), 'src', 'agent-template');
      const files = await fs.readdir(templateDir);

      // Filter only JSON files and extract template info
      const templates = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));

      this.logger.info('Available templates:', templates);
      return templates;
    } catch (error) {
      this.logger.error('Error listing templates:', error);
      return [];
    }
  }

  /**
   * Parse template filename to extract components
   */
  parseTemplateFilename(
    filename: string
  ): { businessType: string; agentRole: string; version: string } | null {
    // Expected format: {businessType}-{agentRole}-{version}
    const parts = filename.split('-');

    if (parts.length >= 3) {
      const businessType = parts[0];
      const version = parts[parts.length - 1];
      const agentRole = parts.slice(1, -1).join('-'); // Handle multi-word roles like "inbound-receptionist"

      return {
        businessType,
        agentRole,
        version,
      };
    }

    return null;
  }

  /**
   * Create LLM from template's retellLlmData
   */
  async createLlmFromTemplate(
    template: RetellTemplate,
    businessContext: BusinessContext,
    config: any
  ): Promise<string> {
    try {
      this.logger.info('Creating LLM from template...');

      // Copy LLM config from template
      const llmConfig = { ...template.retellLlmData };

      // Remove fields that shouldn't be in create request
      delete llmConfig.llm_id;
      delete llmConfig.last_modification_timestamp;
      delete llmConfig.version;
      delete llmConfig.is_published;

      // Replace general_prompt with generated comprehensive prompt
      llmConfig.general_prompt = this.generateComprehensivePrompt(
        businessContext,
        config,
        'receptionist'
      );

      // Replace begin_message with business-specific message
      llmConfig.begin_message = this.generateBeginMessage(businessContext);

      // Update webhook URLs in tools
      if (llmConfig.general_tools && llmConfig.general_tools.length > 0) {
        llmConfig.general_tools = llmConfig.general_tools.map(
          (tool: RetellTool) => {
            if (tool.type === 'custom' && tool.url) {
              return {
                ...tool,
                url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/retell/functions`,
              };
            }
            return tool;
          }
        );
      }

      // Set inbound dynamic variables webhook
      (llmConfig as any).inbound_dynamic_variables_webhook_url =
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/retell/webhook`;

      this.logger.info('Creating LLM with config:', {
        model: llmConfig.model,
        promptLength: llmConfig.general_prompt.length,
        toolsCount: llmConfig.general_tools?.length || 0,
      });

      // Create LLM using Retell SDK
      const llm = await this.retell.llm.create(llmConfig);

      this.logger.info('LLM created successfully:', llm.llm_id);
      return llm.llm_id;
    } catch (error) {
      this.logger.error('Failed to create LLM from template:', error);
      throw new Error(
        `LLM creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create Agent from template
   */
  async createAgentFromTemplate(
    template: RetellTemplate,
    llmId: string,
    businessContext: BusinessContext,
    config?: any
  ): Promise<any> {
    try {
      this.logger.info('Creating Agent from template...');

      // Copy agent config from template
      const agentConfig = { ...template };

      // Remove fields that shouldn't be in create request
      delete agentConfig.agent_id;
      delete agentConfig.retellLlmData;
      delete agentConfig.conversationFlow;
      delete agentConfig.llmURL;
      delete agentConfig.last_modification_timestamp;
      delete agentConfig.version;

      // Use agent name from config if available, otherwise fall back to business-specific name
      agentConfig.agent_name =
        config?.agent_name || `${businessContext.businessName} AI Receptionist`;

      // Replace webhook URL
      agentConfig.webhook_url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/retell/webhook`;

      // Update response_engine to use the new LLM
      agentConfig.response_engine = {
        type: 'retell-llm' as const,
        llm_id: llmId,
      };

      // Update examples in post_call_analysis_data based on business context
      if (agentConfig.post_call_analysis_data) {
        agentConfig.post_call_analysis_data.forEach(field => {
          if (field.name === 'service_type' && businessContext.services) {
            field.examples = businessContext.services
              .map((s: any) => s.service_name)
              .slice(0, 5);
          }
          if (field.name === 'preferred_staff' && businessContext.staff) {
            field.examples = businessContext.staff
              .map((s: any) => `${s.first_name} ${s.last_name}`)
              .slice(0, 3);
          }
        });
      }

      this.logger.info('Creating Agent with config:', {
        agentName: agentConfig.agent_name,
        voiceId: agentConfig.voice_id,
        responseEngineType: agentConfig.response_engine.type,
      });

      // Create Agent using Retell SDK
      const agent = await this.retell.agent.create(agentConfig);

      this.logger.info('Agent created successfully:', agent.agent_id);
      return agent;
    } catch (error) {
      this.logger.error('Failed to create Agent from template:', error);
      throw new Error(
        `Agent creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deploy Agent from template
   */
  async deployFromTemplate(
    businessId: string,
    config: any,
    templateConfig: TemplateConfig,
    userId?: string
  ): Promise<DeploymentResult> {
    try {
      this.logger.info('Starting template deployment:', {
        businessId,
        templateConfig,
      });

      // 1. Get business context
      const businessContext = await this.getBusinessContext(businessId);

      // 2. Check if agent already exists by agent_id
      const agentId = config?.id;
      const existingAgent = await this.getExistingAgent(agentId);

      // 3. Load template from Storage
      const template = await this.loadTemplate(
        templateConfig.businessType,
        templateConfig.agentRole,
        templateConfig.version
      );

      let llmId: string;
      let agent: any;

      if (existingAgent) {
        this.logger.info('Existing agent found, updating...', {
          existingAgentId: existingAgent.retell_agent_id,
          existingLlmId: existingAgent.retell_llm_id,
        });

        // 4a. Update existing LLM
        llmId = await this.updateLlmFromTemplate(
          existingAgent.retell_llm_id,
          template,
          businessContext,
          config
        );

        // 5a. Update existing Agent
        agent = await this.updateAgentFromTemplate(
          existingAgent.retell_agent_id,
          template,
          llmId,
          businessContext,
          config
        );
      } else {
        this.logger.info('No existing agent found, creating new one...');

        // 4b. Create new LLM from template's retellLlmData
        llmId = await this.createLlmFromTemplate(
          template,
          businessContext,
          config
        );

        // 5b. Create new Agent from template
        agent = await this.createAgentFromTemplate(
          template,
          llmId,
          businessContext,
          config
        );
      }

      // 6. Save to database
      await this.saveAgentRecord(
        agent,
        businessId,
        llmId,
        config,
        userId,
        existingAgent
      );

      this.logger.info('Template deployment completed successfully', {
        agentId: agent.agent_id,
        llmId,
        isUpdate: !!existingAgent,
      });

      return {
        success: true,
        agent,
        llmId,
      };
    } catch (error) {
      this.logger.error('Template deployment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate comprehensive LLM prompt (reusing existing logic)
   */
  private generateComprehensivePrompt(
    businessContext: BusinessContext,
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

    // Add user's basic info prompt
    if (config.basic_info_prompt) {
      generalPrompt += config.basic_info_prompt + '\n\n';
    }

    // Add services
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
    }

    // Add staff
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
    }

    // Add locations
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
    }

    // Add custom instructions
    if (config.custom_instructions) {
      generalPrompt +=
        'SPECIAL INSTRUCTIONS:\n' + config.custom_instructions + '\n\n';
    }

    // Add structured call scripts in Retell AI recommended format
    // Always use structured format for better prompt organization
    {
      generalPrompt += '## Identify\n';
      generalPrompt += `You are a friendly AI assistant for ${businessContext.businessName}`;
      if (businessContext.businessType === 'dental') {
        generalPrompt += ', a dental practice';
      } else if (businessContext.businessType) {
        generalPrompt += `, a ${businessContext.businessType} business`;
      }
      generalPrompt +=
        '. Your primary role is to handle incoming calls with warmth, efficiency, and professionalism.\n\n';

      generalPrompt += '## Style Guardrails\n';
      generalPrompt +=
        'Be concise: Keep responses brief and to the point while being helpful\n';
      generalPrompt +=
        'Be conversational: Use natural, friendly language that puts callers at ease\n';
      generalPrompt +=
        'Be professional: Maintain a courteous and competent demeanor at all times\n';
      generalPrompt +=
        'Be empathetic: Show understanding for customer needs and concerns\n';
      if (businessContext.businessType === 'dental') {
        generalPrompt +=
          'Be sensitive: Show extra care when patients mention pain or discomfort\n';
      }
      generalPrompt += '\n';

      generalPrompt += '## Response Guideline\n';
      generalPrompt +=
        'Return dates in their spoken forms: "Monday, January 15th" instead of "2024-01-15"\n';
      generalPrompt +=
        'Ask up to one question at a time: Focus on gathering one piece of information per interaction\n';
      generalPrompt +=
        'Confirm important details: Always repeat back appointment times, dates, and contact information\n';
      generalPrompt +=
        'Offer alternatives: If the requested time is unavailable, suggest nearby options\n';
      generalPrompt +=
        "Stay in character: Always respond as the business's receptionist, never break character\n";
      generalPrompt +=
        'Handle transfers gracefully: If you need to transfer, explain why and set expectations\n\n';

      // Only add Task section if not already present in scripts
      const hasTaskSection =
        config.call_scripts?.main_script?.includes('## Task') ||
        config.call_scripts_prompt?.includes('## Task');

      if (!hasTaskSection) {
        generalPrompt += '## Task\n';
      }

      // Add greeting task
      if (
        !hasTaskSection &&
        config.call_scripts &&
        config.call_scripts.greeting_script
      ) {
        generalPrompt += '1. **Greet the caller warmly**\n';
        generalPrompt += `   - Use: "${config.call_scripts.greeting_script}"\n`;
        generalPrompt += '   - Ask for their name and how you can help\n\n';
      } else if (!hasTaskSection) {
        generalPrompt += '1. **Greet the caller warmly**\n';
        generalPrompt += `   - Use: "Hello! Thank you for calling ${businessContext.businessName}. How may I assist you today?"\n`;
        generalPrompt += '   - Ask for their name and how you can help\n\n';
      }

      // Add main interaction tasks only if Task section was added
      if (!hasTaskSection) {
        generalPrompt += '2. **Identify the caller and their needs**\n';
        generalPrompt +=
          "   - Collect caller's first name, last name, phone number, and email address\n";
        generalPrompt +=
          '   - Determine the purpose of their call (appointment, inquiry, etc.)\n';
        if (businessContext.businessType === 'dental') {
          generalPrompt +=
            '   - For new patients, ask about insurance information\n';
        }
        generalPrompt += '\n';

        generalPrompt += '3. **Handle appointment requests**\n';
        generalPrompt += '   - Ask for preferred date and time\n';
        generalPrompt += '   - Confirm service type needed\n';
        generalPrompt += '   - Check staff preferences if applicable\n';
        generalPrompt +=
          '   - Verify availability and book the appointment\n\n';

        generalPrompt += '4. **Provide information and assistance**\n';
        generalPrompt +=
          '   - Answer questions about services, hours, and location\n';
        generalPrompt += '   - Provide pricing information if available\n';
        generalPrompt += '   - Explain policies and procedures as needed\n\n';

        // Add escalation task
        if (config.call_scripts && config.call_scripts.escalation_script) {
          generalPrompt += '5. **Handle escalations when needed**\n';
          generalPrompt += `   - Use: "${config.call_scripts.escalation_script}"\n`;
          generalPrompt +=
            '   - Transfer to appropriate staff member when necessary\n\n';
        } else {
          generalPrompt += '5. **Handle escalations when needed**\n';
          generalPrompt +=
            '   - If you cannot answer a question, offer to find someone who can\n';
          generalPrompt +=
            '   - Transfer to appropriate staff member when necessary\n\n';
        }

        // Add closing task
        if (config.call_scripts && config.call_scripts.closing_script) {
          generalPrompt += '6. **Close the call professionally**\n';
          generalPrompt += `   - Use: "${config.call_scripts.closing_script}"\n`;
          generalPrompt += '   - Confirm all details and next steps\n';
          generalPrompt +=
            '   - Thank the caller for choosing the business\n\n';
        } else {
          generalPrompt += '6. **Close the call professionally**\n';
          generalPrompt += '   - Summarize what was accomplished\n';
          generalPrompt += '   - Confirm all details and next steps\n';
          generalPrompt += `   - Thank the caller for choosing ${businessContext.businessName}\n\n`;
        }
      }

      // Add main script if available (only if not already present)
      if (
        config.call_scripts &&
        config.call_scripts.main_script &&
        !config.call_scripts.main_script.includes('## Task')
      ) {
        generalPrompt += '## Additional Instructions\n';
        generalPrompt += config.call_scripts.main_script + '\n\n';
      }
    }

    // Add call handling instructions
    if (config.call_scripts_prompt) {
      generalPrompt += '## Call Handling Guidelines\n';
      generalPrompt += config.call_scripts_prompt + '\n\n';
    }

    // Add inbound call guidelines
    generalPrompt += 'INBOUND CALL GUIDELINES:\n';
    generalPrompt +=
      '- You are receiving calls from customers/patients contacting the business\n';
    generalPrompt += '- Greet callers warmly and professionally\n';
    generalPrompt += '- Listen carefully to understand their needs\n';
    generalPrompt += '- Provide helpful information and assistance\n';
    generalPrompt += '- Schedule appointments if requested\n';
    generalPrompt += '- Never make outbound calls - you only receive them\n\n';

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
    }

    return generalPrompt;
  }

  /**
   * Generate begin message based on business context
   */
  private generateBeginMessage(businessContext: BusinessContext): string {
    return `Hello! Thank you for calling ${businessContext.businessName}. How can I help you today?`;
  }

  /**
   * Get business context from database
   */
  private async getBusinessContext(
    businessId: string
  ): Promise<BusinessContext> {
    try {
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Resolve business ID (could be user_id or business_id)
      const resolvedBusinessId = await this.resolveBusinessId(businessId);

      // Get business profile
      const { data: business } = await serviceSupabase
        .from('business_profiles')
        .select('*')
        .eq('id', resolvedBusinessId)
        .single();

      // Get services
      const { data: services } = await serviceSupabase
        .from('business_services')
        .select('*')
        .eq('business_id', resolvedBusinessId);

      // Get products
      const { data: products } = await serviceSupabase
        .from('business_products')
        .select('*')
        .eq('business_id', resolvedBusinessId);

      // Get staff
      const { data: staff } = await serviceSupabase
        .from('business_staff')
        .select('*')
        .eq('business_id', resolvedBusinessId);

      // Get locations
      const { data: locations } = await serviceSupabase
        .from('business_locations')
        .select('*')
        .eq('business_id', resolvedBusinessId);

      // Get insurance providers (for healthcare businesses)
      const { data: insurance } = await serviceSupabase
        .from('insurance_providers')
        .select('*')
        .eq('business_id', resolvedBusinessId);

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
   * Resolve business profile ID from user ID or business ID
   */
  private async resolveBusinessId(inputId: string): Promise<string> {
    try {
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // First try to find by business profile ID (direct match)
      const { data: businessById } = await serviceSupabase
        .from('business_profiles')
        .select('id')
        .eq('id', inputId)
        .single();

      if (businessById) {
        return inputId;
      }

      // If not found, try to find by user_id
      const { data: businessByUserId } = await serviceSupabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', inputId)
        .single();

      if (businessByUserId) {
        return businessByUserId.id;
      }

      // If still not found, return original ID
      this.logger.warn(
        'Could not resolve business ID, using input ID:',
        inputId
      );
      return inputId;
    } catch (error) {
      this.logger.error('Error resolving business ID:', error);
      return inputId;
    }
  }

  /**
   * Get existing agent record by agent_id
   */
  private async getExistingAgent(agentId?: string): Promise<any | null> {
    try {
      if (!agentId) {
        this.logger.info('No agent ID provided, treating as new agent');
        return null;
      }

      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await serviceSupabase
        .from('retell_agents')
        .select('*')
        .eq('ai_agent_id', agentId)
        .eq('status', 'deployed')
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned", which is expected
        this.logger.error('Error querying existing agent:', error);
        throw error;
      }

      if (data) {
        this.logger.info('Found existing agent:', {
          ai_agent_id: data.ai_agent_id,
          retell_agent_id: data.retell_agent_id,
          retell_llm_id: data.retell_llm_id,
        });
      }

      return data;
    } catch (error) {
      this.logger.error('Error getting existing agent:', error);
      return null;
    }
  }

  /**
   * Update existing LLM from template
   */
  async updateLlmFromTemplate(
    llmId: string,
    template: RetellTemplate,
    businessContext: BusinessContext,
    config: any
  ): Promise<string> {
    try {
      this.logger.info('Updating existing LLM from template...', { llmId });

      // Copy LLM config from template
      const llmConfig = { ...template.retellLlmData };

      // Remove fields that shouldn't be in update request
      delete llmConfig.llm_id;
      delete llmConfig.last_modification_timestamp;
      delete llmConfig.version;
      delete llmConfig.is_published;

      // Replace general_prompt with generated comprehensive prompt
      llmConfig.general_prompt = this.generateComprehensivePrompt(
        businessContext,
        config,
        'receptionist'
      );

      // Replace begin_message with business-specific message
      llmConfig.begin_message = this.generateBeginMessage(businessContext);

      // Update webhook URLs in tools
      if (llmConfig.general_tools && llmConfig.general_tools.length > 0) {
        llmConfig.general_tools = llmConfig.general_tools.map(
          (tool: RetellTool) => {
            if (tool.type === 'custom' && tool.url) {
              return {
                ...tool,
                url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/retell/functions`,
              };
            }
            return tool;
          }
        );
      }

      // Set inbound dynamic variables webhook
      (llmConfig as any).inbound_dynamic_variables_webhook_url =
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/retell/webhook`;

      this.logger.info('Updating LLM with config:', {
        llmId,
        model: llmConfig.model,
        promptLength: llmConfig.general_prompt.length,
        toolsCount: llmConfig.general_tools?.length || 0,
      });

      // Update LLM using Retell SDK
      const llm = await this.retell.llm.update(llmId, llmConfig as any);

      this.logger.info('LLM updated successfully:', llm.llm_id);
      return llm.llm_id;
    } catch (error) {
      this.logger.error('Failed to update LLM from template:', error);
      throw new Error(
        `LLM update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update existing Agent from template
   */
  async updateAgentFromTemplate(
    agentId: string,
    template: RetellTemplate,
    llmId: string,
    businessContext: BusinessContext,
    config?: any
  ): Promise<any> {
    try {
      this.logger.info('Updating existing Agent from template...', { agentId });

      // Copy agent config from template
      const agentConfig = { ...template };

      // Remove fields that shouldn't be in update request
      delete (agentConfig as any).agent_id;
      delete (agentConfig as any).retellLlmData;
      delete (agentConfig as any).conversationFlow;
      delete (agentConfig as any).llmURL;
      delete (agentConfig as any).last_modification_timestamp;
      delete (agentConfig as any).version;

      // Use agent name from config if available, otherwise fall back to business-specific name
      agentConfig.agent_name =
        config?.agent_name || `${businessContext.businessName} AI Receptionist`;

      // Replace webhook URL
      agentConfig.webhook_url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/retell/webhook`;

      // Update response_engine to use the LLM
      agentConfig.response_engine = {
        type: 'retell-llm' as const,
        llm_id: llmId,
      };

      // Update examples in post_call_analysis_data based on business context
      if (agentConfig.post_call_analysis_data) {
        agentConfig.post_call_analysis_data.forEach(field => {
          if (field.name === 'service_type' && businessContext.services) {
            field.examples = businessContext.services
              .map((s: any) => s.service_name)
              .slice(0, 5);
          }
          if (field.name === 'preferred_staff' && businessContext.staff) {
            field.examples = businessContext.staff
              .map((s: any) => `${s.first_name} ${s.last_name}`)
              .slice(0, 3);
          }
        });
      }

      this.logger.info('Updating Agent with config:', {
        agentId,
        agentName: agentConfig.agent_name,
        voiceId: agentConfig.voice_id,
        responseEngineType: agentConfig.response_engine.type,
      });

      // Update Agent using Retell SDK
      const agent = await this.retell.agent.update(agentId, agentConfig as any);

      this.logger.info('Agent updated successfully:', agent.agent_id);
      return agent;
    } catch (error) {
      this.logger.error('Failed to update Agent from template:', error);
      throw new Error(
        `Agent update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Save agent record to database
   */
  private async saveAgentRecord(
    agent: any,
    businessId: string,
    llmId: string,
    config: any,
    userId?: string,
    existingAgent?: any
  ): Promise<void> {
    try {
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const resolvedBusinessId = await this.resolveBusinessId(businessId);

      const agentRecord = {
        business_id: resolvedBusinessId,
        user_id: userId || resolvedBusinessId,
        agent_type: `receptionist_${agent.agent_id.slice(-8)}`,
        retell_agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        ai_agent_id: config?.id || null,
        status: 'deployed',
        response_engine_type: 'retell-llm',
        retell_llm_id: llmId,
        voice_settings: JSON.stringify({
          voice_id: agent.voice_id,
          voice_temperature: agent.voice_temperature,
          voice_speed: agent.voice_speed,
        }),
        updated_at: new Date().toISOString(),
      };

      if (existingAgent) {
        // 更新现有记录
        this.logger.info('Updating existing agent record in database', {
          ai_agent_id: agentRecord.ai_agent_id,
        });
        const { error } = await serviceSupabase
          .from('retell_agents')
          .update(agentRecord)
          .eq('ai_agent_id', agentRecord.ai_agent_id);

        if (error) {
          this.logger.error('Failed to update agent record:', error);
          throw error;
        }

        this.logger.info('Agent record updated successfully');
      } else {
        // 插入新记录
        this.logger.info('Inserting new agent record to database');
        (agentRecord as any).created_at = new Date().toISOString();

        const { error } = await serviceSupabase
          .from('retell_agents')
          .insert(agentRecord);

        if (error) {
          this.logger.error('Failed to insert agent record:', error);
          throw error;
        }

        this.logger.info('Agent record inserted successfully');
      }
    } catch (error) {
      this.logger.error('Error saving agent record:', error);
      throw error;
    }
  }
}
