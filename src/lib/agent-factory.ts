// Agent Factory Pattern
// Creates different agent types with their specific configurations

import {
  AgentType,
  AgentPersonality,
  SupportedLanguage,
  AIAgent,
  AgentConfiguration,
  CreateAgentRequest,
  AgentTypeConfig,
  AGENT_TYPE_CONFIGS,
  VoiceSettings,
  CallRoutingRule,
  EscalationTrigger,
  ActionDetectionConfig,
  BusinessHours,
  CalendarIntegration,
  CRMIntegration,
  WebhookSettings,
} from '@/types/ai-agent-types';

export class AgentFactory {
  private static instance: AgentFactory;

  private constructor() {}

  public static getInstance(): AgentFactory {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory();
    }
    return AgentFactory.instance;
  }

  /**
   * Create a new agent with type-specific configuration
   */
  public createAgent(
    request: CreateAgentRequest,
    clientId: string
  ): Partial<AIAgent> {
    const agentTypeConfig = AGENT_TYPE_CONFIGS[request.agent_type];

    if (!agentTypeConfig) {
      throw new Error(`Unsupported agent type: ${request.agent_type}`);
    }

    const baseAgent: Partial<AIAgent> = {
      client_id: clientId,
      name: request.name,
      description: request.description,
      personality: request.personality || agentTypeConfig.default_personality,
      voice_settings: this.createVoiceSettings(
        request.agent_type,
        request.language
      ),
      business_context: request.business_context,
      variables: this.createDefaultVariables(request.agent_type) as any,
      integrations: this.createDefaultIntegrations(request.agent_type) as any,
      prompt_template: this.generatePromptTemplate(
        request.agent_type,
        request.business_context
      ),
    };

    return baseAgent;
  }

  /**
   * Create agent configuration based on agent type
   */
  public createAgentConfiguration(
    agentType: AgentType,
    language: SupportedLanguage
  ): Partial<AgentConfiguration> {
    const baseConfig: Partial<AgentConfiguration> = {
      call_routing_rules: this.createCallRoutingRules(agentType),
      escalation_triggers: this.createEscalationTriggers(agentType),
      action_detection_logic: this.createActionDetectionLogic(agentType),
      response_templates: this.createResponseTemplates(agentType, language),
      confirmation_messages: this.createConfirmationMessages(
        agentType,
        language
      ),
      error_handling: this.createErrorHandling(agentType, language),
      business_hours: this.createDefaultBusinessHours(),
      calendar_integration: this.createCalendarIntegration(agentType),
      crm_integration: this.createCRMIntegration(agentType),
      webhook_settings: this.createWebhookSettings(),
      conditional_logic: [],
      variable_mapping: {},
      custom_actions: [],
    };

    return baseConfig;
  }

  /**
   * Create voice settings based on agent type and language
   */
  private createVoiceSettings(
    agentType: AgentType,
    language: SupportedLanguage
  ): VoiceSettings {
    const baseSettings = AGENT_TYPE_CONFIGS[agentType]
      ?.suggested_voice_settings || {
      speed: 1.0,
      pitch: 1.0,
      tone: 'professional',
    };

    // Language-specific adjustments
    const languageAdjustments = this.getLanguageVoiceAdjustments(language);

    return {
      ...baseSettings,
      ...languageAdjustments,
    };
  }

  /**
   * Get language-specific voice adjustments
   */
  private getLanguageVoiceAdjustments(
    language: SupportedLanguage
  ): Partial<VoiceSettings> {
    const adjustments: Record<SupportedLanguage, Partial<VoiceSettings>> = {
      [SupportedLanguage.ENGLISH]: { accent: 'american' },
      [SupportedLanguage.SPANISH]: { accent: 'neutral', speed: 0.95 },
      [SupportedLanguage.CHINESE_SIMPLIFIED]: {
        accent: 'mainland',
        speed: 0.9,
      },
      [SupportedLanguage.ITALIAN]: { accent: 'standard', speed: 1.05 },
    };

    return adjustments[language] || {};
  }

  /**
   * Create default variables for agent type
   */
  private createDefaultVariables(agentType: AgentType) {
    const commonVariables = {
      business_name: {
        name: 'business_name',
        type: 'text' as const,
        required: true,
        description: 'Name of the business',
      },
      customer_name: {
        name: 'customer_name',
        type: 'text' as const,
        required: false,
        description: "Customer's name",
      },
      phone_number: {
        name: 'phone_number',
        type: 'phone' as const,
        required: false,
        description: "Customer's phone number",
      },
    };

    const typeSpecificVariables: any = {
      [AgentType.INBOUND_RECEPTIONIST]: {
        ...commonVariables,
        department: {
          name: 'department',
          type: 'text',
          required: false,
          description: 'Requested department',
        },
        urgency_level: {
          name: 'urgency_level',
          type: 'text',
          required: false,
          description: 'Call urgency level',
        },
      },
      [AgentType.OUTBOUND_FOLLOW_UP]: {
        ...commonVariables,
        appointment_date: {
          name: 'appointment_date',
          type: 'date',
          required: false,
          description: 'Appointment date',
        },
        appointment_time: {
          name: 'appointment_time',
          type: 'text',
          required: false,
          description: 'Appointment time',
        },
        service_type: {
          name: 'service_type',
          type: 'text',
          required: false,
          description: 'Type of service',
        },
      },
      [AgentType.OUTBOUND_MARKETING]: {
        ...commonVariables,
        lead_source: {
          name: 'lead_source',
          type: 'text',
          required: false,
          description: 'Source of the lead',
        },
        interest_level: {
          name: 'interest_level',
          type: 'text',
          required: false,
          description: 'Customer interest level',
        },
        budget_range: {
          name: 'budget_range',
          type: 'text',
          required: false,
          description: 'Customer budget range',
        },
      },
      [AgentType.INBOUND_CUSTOMER_SUPPORT]: {
        ...commonVariables,
        issue_type: {
          name: 'issue_type',
          type: 'text',
          required: false,
          description: 'Type of issue',
        },
        ticket_number: {
          name: 'ticket_number',
          type: 'text',
          required: false,
          description: 'Support ticket number',
        },
        product_version: {
          name: 'product_version',
          type: 'text',
          required: false,
          description: 'Product version',
        },
      },
    };

    return typeSpecificVariables[agentType] || commonVariables;
  }

  /**
   * Create default integrations for agent type
   */
  private createDefaultIntegrations(agentType: AgentType) {
    const baseIntegrations = {
      webhook: {
        type: 'webhook',
        enabled: false,
        settings: {},
      },
    };

    const typeSpecificIntegrations: any = {
      [AgentType.INBOUND_RECEPTIONIST]: {
        ...baseIntegrations,
        calendar: {
          type: 'calendar',
          enabled: false,
          settings: {
            provider: 'cal.com',
            auto_schedule: false,
          },
        },
        crm: {
          type: 'crm',
          enabled: false,
          settings: {
            provider: 'custom',
            auto_create_contact: true,
          },
        },
      },
      [AgentType.OUTBOUND_FOLLOW_UP]: {
        ...baseIntegrations,
        calendar: {
          type: 'calendar',
          enabled: true,
          settings: {
            provider: 'cal.com',
            auto_schedule: true,
            reminder_enabled: true,
          },
        },
      },
      [AgentType.OUTBOUND_MARKETING]: {
        ...baseIntegrations,
        crm: {
          type: 'crm',
          enabled: true,
          settings: {
            provider: 'custom',
            lead_scoring: true,
            auto_follow_up: true,
          },
        },
      },
      [AgentType.INBOUND_CUSTOMER_SUPPORT]: {
        ...baseIntegrations,
        helpdesk: {
          type: 'helpdesk',
          enabled: false,
          settings: {
            auto_create_ticket: true,
            priority_detection: true,
          },
        },
      },
    };

    return typeSpecificIntegrations[agentType] || baseIntegrations;
  }

  /**
   * Generate prompt template based on agent type
   */
  private generatePromptTemplate(
    agentType: AgentType,
    businessContext: Record<string, unknown>
  ): string {
    const baseTemplate = AGENT_TYPE_CONFIGS[agentType]?.template_prompt || '';

    const typeSpecificPrompts: any = {
      [AgentType.INBOUND_RECEPTIONIST]: `You are a professional receptionist for {business_name}. Your role is to:

🎯 **Primary Objectives:**
- Greet callers warmly and professionally
- Identify the caller's needs quickly and accurately
- Route calls efficiently to the appropriate department or person
- Schedule appointments when requested
- Collect basic customer information
- Handle common inquiries about services, hours, and location

🗣️ **Communication Style:**
- Use a warm, welcoming tone
- Speak clearly and at an appropriate pace
- Be patient and helpful
- Maintain professionalism at all times
- Ask clarifying questions when needed

🔄 **Call Flow:**
1. **Greeting**: "Hello! Thank you for calling {business_name}. This is your AI assistant. How may I help you today?"
2. **Identification**: Determine the purpose of the call
3. **Action**: Route, schedule, inform, or escalate as appropriate
4. **Confirmation**: Confirm any actions taken or information provided
5. **Closing**: Professional goodbye with next steps if applicable

📋 **Available Actions:**
- Schedule appointments
- Transfer to specific departments
- Provide business information (hours, location, services)
- Take messages
- Handle basic inquiries
- Escalate to human staff when necessary

🚨 **Escalation Triggers:**
- Complex technical issues
- Complaints requiring management attention
- Emergency situations
- Requests beyond your capabilities

Remember: You represent {business_name} and should always maintain a professional, helpful demeanor.`,

      [AgentType.OUTBOUND_FOLLOW_UP]: `You are calling on behalf of {business_name} for appointment-related matters. Your role is to:

🎯 **Primary Objectives:**  
- Confirm upcoming appointments professionally
- Handle appointment changes and rescheduling requests
- Send appointment reminders
- Collect pre-appointment information when needed
- Reduce no-shows through effective communication
- Provide clear appointment details

🗣️ **Communication Style:**
- Friendly and approachable
- Respectful of the customer's time
- Clear and concise
- Flexible and accommodating
- Professional but warm

🔄 **Call Flow:**
1. **Introduction**: "Hello! This is your AI assistant calling from {business_name} regarding your upcoming appointment."
2. **Verification**: Confirm you're speaking with the right person
3. **Purpose**: State the reason for your call clearly
4. **Action**: Confirm, reschedule, or collect information as needed
5. **Confirmation**: Repeat any changes or confirmations
6. **Closing**: Thank them and provide next steps

📅 **Appointment Actions:**
- Confirm appointments 24-48 hours in advance
- Offer rescheduling options if conflicts arise  
- Collect preparation requirements
- Provide location and parking information
- Send calendar invitations when requested
- Handle cancellations professionally

🔄 **Rescheduling Process:**
- Check availability in real-time if possible
- Offer multiple time options
- Confirm new appointment details
- Update customer records
- Send confirmation of changes

⏰ **Timing Guidelines:**
- Confirmation calls: 1-2 days before
- Reminder calls: Day of appointment
- Follow-up calls: After missed appointments
- Respect calling hours and time zones`,

      [AgentType.OUTBOUND_MARKETING]: `You are a sales representative for {business_name}. Your goal is to:

🎯 **Primary Objectives:**
- Introduce {business_name} services to potential customers
- Qualify leads and identify genuine interest
- Present promotional offers clearly and compellingly  
- Schedule consultation appointments
- Handle objections professionally and persuasively
- Build positive relationships with prospects
- Maintain compliance with marketing regulations

🗣️ **Communication Style:**
- Energetic and enthusiastic
- Confident but not pushy
- Personable and relatable
- Results-oriented
- Respectful of customer needs

🔄 **Call Flow:**
1. **Opening**: Introduce yourself and {business_name}
2. **Permission**: Ask for a moment of their time
3. **Discovery**: Learn about their needs and situation
4. **Presentation**: Present relevant services/offers
5. **Objection Handling**: Address concerns professionally
6. **Closing**: Secure next steps or appointment
7. **Follow-up**: Set expectations for future contact

🎯 **Lead Qualification:**
- Assess budget and timeline
- Identify decision-making authority
- Understand current situation and needs
- Determine fit for services
- Gauge interest level and priority

💼 **Sales Techniques:**
- Use open-ended questions
- Listen actively to responses
- Present benefits, not just features
- Create urgency when appropriate
- Offer multiple options
- Use social proof and testimonials

🚫 **Compliance Rules:**
- Respect Do Not Call lists
- Provide clear opt-out options
- Be transparent about call purpose
- Follow all local marketing regulations
- Maintain professional standards
- Record consent when required

🔄 **Follow-up Strategy:**
- Schedule callbacks for interested prospects
- Send promised information promptly
- Nurture leads through multiple touchpoints
- Track engagement and interest levels`,

      [AgentType.INBOUND_CUSTOMER_SUPPORT]: `You are a customer support specialist for {business_name}. Your role involves:

🎯 **Primary Objectives:**
- Listen carefully to customer issues and concerns
- Provide detailed explanations and step-by-step solutions
- Troubleshoot problems systematically
- Escalate complex issues when necessary
- Follow up to ensure complete resolution
- Maintain detailed records of all interactions
- Demonstrate empathy and patience throughout

🗣️ **Communication Style:**
- Patient and understanding
- Clear and detailed
- Technically accurate
- Empathetic to customer frustration
- Professional and calm under pressure

🔄 **Support Process:**
1. **Acknowledgment**: Recognize the customer's issue
2. **Information Gathering**: Ask detailed questions
3. **Diagnosis**: Identify the root cause
4. **Solution**: Provide step-by-step resolution
5. **Verification**: Confirm the solution works
6. **Documentation**: Record the interaction
7. **Follow-up**: Check back to ensure satisfaction

🛠️ **Troubleshooting Approach:**
- Start with simple solutions first
- Ask clarifying questions
- Provide step-by-step instructions
- Verify each step before proceeding
- Use screen sharing or visual aids when possible
- Document successful solutions

📊 **Issue Categories:**
- Technical problems and bugs
- Account and billing issues  
- Product usage questions
- Feature requests and feedback
- Service complaints and concerns
- Installation and setup assistance

🔺 **Escalation Criteria:**
- Issues requiring specialized knowledge
- Billing disputes over $X amount
- Legal or compliance matters
- Customer requests for supervisor
- Technical issues requiring development team
- Unresolved issues after multiple attempts

📝 **Documentation Requirements:**
- Record all customer interactions
- Document solutions that work
- Track recurring issues
- Update knowledge base
- Log escalation reasons
- Measure resolution times`,
    };

    return typeSpecificPrompts[agentType] || baseTemplate;
  }

  /**
   * Create call routing rules for agent type
   */
  private createCallRoutingRules(agentType: AgentType): CallRoutingRule[] {
    const commonRules: CallRoutingRule[] = [
      {
        id: 'emergency',
        condition: 'keywords: emergency, urgent, 911',
        action: 'escalate',
        target: 'human_agent',
        priority: 1,
        enabled: true,
      },
    ];

    const typeSpecificRules: any = {
      [AgentType.INBOUND_RECEPTIONIST]: [
        ...commonRules,
        {
          id: 'appointment_request',
          condition: 'keywords: appointment, schedule, book',
          action: 'schedule',
          target: 'calendar_system',
          priority: 2,
          enabled: true,
        },
        {
          id: 'billing_inquiry',
          condition: 'keywords: bill, payment, charge, cost',
          action: 'transfer',
          target: 'billing_department',
          priority: 3,
          enabled: true,
        },
      ],
      [AgentType.OUTBOUND_FOLLOW_UP]: [
        {
          id: 'reschedule_request',
          condition: 'keywords: reschedule, change, different time',
          action: 'schedule',
          target: 'calendar_system',
          priority: 1,
          enabled: true,
        },
        {
          id: 'cancellation',
          condition: 'keywords: cancel, delete, remove',
          action: 'collect_info',
          target: 'cancellation_form',
          priority: 2,
          enabled: true,
        },
      ],
      [AgentType.OUTBOUND_MARKETING]: [
        {
          id: 'interested_lead',
          condition: 'sentiment: positive, keywords: interested, tell me more',
          action: 'schedule',
          target: 'consultation_calendar',
          priority: 1,
          enabled: true,
        },
        {
          id: 'not_interested',
          condition: 'keywords: not interested, no thanks, remove me',
          action: 'collect_info',
          target: 'opt_out_form',
          priority: 2,
          enabled: true,
        },
      ],
      [AgentType.INBOUND_CUSTOMER_SUPPORT]: [
        ...commonRules,
        {
          id: 'technical_issue',
          condition: 'keywords: broken, error, not working, bug',
          action: 'collect_info',
          target: 'technical_support_form',
          priority: 2,
          enabled: true,
        },
        {
          id: 'billing_dispute',
          condition: 'keywords: dispute, wrong charge, refund',
          action: 'escalate',
          target: 'billing_supervisor',
          priority: 3,
          enabled: true,
        },
      ],
    };

    return typeSpecificRules[agentType] || commonRules;
  }

  /**
   * Create escalation triggers for agent type
   */
  private createEscalationTriggers(agentType: AgentType): EscalationTrigger[] {
    const commonTriggers: EscalationTrigger[] = [
      {
        id: 'negative_sentiment',
        trigger_type: 'sentiment',
        condition: 'sentiment_score < -0.7',
        action: 'escalate_to_human',
        target: 'human_agent',
        enabled: true,
      },
      {
        id: 'long_duration',
        trigger_type: 'duration',
        condition: 'call_duration > 600', // 10 minutes
        action: 'offer_escalation',
        target: 'human_agent',
        enabled: true,
      },
    ];

    const typeSpecificTriggers: any = {
      [AgentType.INBOUND_RECEPTIONIST]: [
        ...commonTriggers,
        {
          id: 'complex_request',
          trigger_type: 'keyword',
          condition: 'keywords: legal, lawsuit, complaint, manager',
          action: 'escalate_immediately',
          target: 'supervisor',
          enabled: true,
        },
      ],
      [AgentType.OUTBOUND_FOLLOW_UP]: [
        {
          id: 'multiple_reschedules',
          trigger_type: 'manual',
          condition: 'reschedule_count > 2',
          action: 'escalate_to_scheduler',
          target: 'human_scheduler',
          enabled: true,
        },
      ],
      [AgentType.OUTBOUND_MARKETING]: [
        {
          id: 'regulatory_concern',
          trigger_type: 'keyword',
          condition: 'keywords: do not call, lawyer, report, illegal',
          action: 'end_call_immediately',
          target: 'compliance_team',
          enabled: true,
        },
      ],
      [AgentType.INBOUND_CUSTOMER_SUPPORT]: [
        ...commonTriggers,
        {
          id: 'unresolved_technical',
          trigger_type: 'manual',
          condition: 'resolution_attempts > 3',
          action: 'escalate_to_technical',
          target: 'technical_specialist',
          enabled: true,
        },
      ],
    };

    return typeSpecificTriggers[agentType] || commonTriggers;
  }

  /**
   * Create action detection logic for agent type
   */
  private createActionDetectionLogic(
    agentType: AgentType
  ): ActionDetectionConfig {
    const baseConfig: ActionDetectionConfig = {
      intent_recognition: true,
      keywords: [],
      sentiment_analysis: true,
      custom_detectors: [],
    };

    const typeSpecificConfigs: any = {
      [AgentType.INBOUND_RECEPTIONIST]: {
        ...baseConfig,
        keywords: [
          'appointment',
          'schedule',
          'book',
          'emergency',
          'urgent',
          'billing',
          'payment',
          'hours',
          'location',
          'services',
        ],
        custom_detectors: [
          {
            name: 'appointment_intent',
            pattern: '(schedule|book|make|set up).*(appointment|meeting)',
            action: 'trigger_appointment_flow',
            confidence_threshold: 0.8,
          },
        ],
      },
      [AgentType.OUTBOUND_FOLLOW_UP]: {
        ...baseConfig,
        keywords: [
          'confirm',
          'reschedule',
          'cancel',
          'change',
          'reminder',
          'preparation',
          'location',
          'parking',
        ],
        custom_detectors: [
          {
            name: 'reschedule_intent',
            pattern:
              '(reschedule|change|move|different).*(time|date|appointment)',
            action: 'trigger_reschedule_flow',
            confidence_threshold: 0.7,
          },
        ],
      },
      [AgentType.OUTBOUND_MARKETING]: {
        ...baseConfig,
        keywords: [
          'interested',
          'not interested',
          'maybe',
          'price',
          'cost',
          'tell me more',
          'information',
          'brochure',
          'consultation',
        ],
        custom_detectors: [
          {
            name: 'interest_level',
            pattern: '(very interested|definitely|yes|tell me more)',
            action: 'mark_as_hot_lead',
            confidence_threshold: 0.6,
          },
        ],
      },
      [AgentType.INBOUND_CUSTOMER_SUPPORT]: {
        ...baseConfig,
        keywords: [
          'problem',
          'issue',
          'broken',
          'error',
          'not working',
          'help',
          'support',
          'fix',
          'troubleshoot',
          'bug',
        ],
        custom_detectors: [
          {
            name: 'technical_issue',
            pattern: '(broken|error|not working|bug|crash)',
            action: 'start_technical_support',
            confidence_threshold: 0.7,
          },
        ],
      },
    };

    return typeSpecificConfigs[agentType] || baseConfig;
  }

  /**
   * Create response templates for agent type and language
   */
  private createResponseTemplates(
    agentType: AgentType,
    language: SupportedLanguage
  ) {
    // This would typically fetch from a database or translation service
    // For now, returning a basic structure
    return {
      greeting: {
        id: 'greeting',
        name: 'Greeting Template',
        template: this.getLocalizedTemplate('greeting', agentType, language),
        variables: ['business_name'],
      },
      confirmation: {
        id: 'confirmation',
        name: 'Confirmation Template',
        template: this.getLocalizedTemplate(
          'confirmation',
          agentType,
          language
        ),
        variables: ['action', 'details'],
      },
      goodbye: {
        id: 'goodbye',
        name: 'Goodbye Template',
        template: this.getLocalizedTemplate('goodbye', agentType, language),
        variables: ['business_name'],
      },
    };
  }

  /**
   * Get localized template text
   */
  private getLocalizedTemplate(
    templateType: string,
    agentType: AgentType,
    language: SupportedLanguage
  ): string {
    const templates: any = {
      greeting: {
        [AgentType.INBOUND_RECEPTIONIST]: {
          [SupportedLanguage.ENGLISH]:
            'Hello! Thank you for calling {business_name}. This is your AI assistant. How may I help you today?',
          [SupportedLanguage.SPANISH]:
            '¡Hola! Gracias por llamar a {business_name}. Soy su asistente de IA. ¿Cómo puedo ayudarle hoy?',
          [SupportedLanguage.CHINESE_SIMPLIFIED]:
            '您好！感谢您致电{business_name}。我是您的AI助手。今天我能为您做些什么？',
          [SupportedLanguage.ITALIAN]:
            'Ciao! Grazie per aver chiamato {business_name}. Sono il tuo assistente AI. Come posso aiutarti oggi?',
        },
        [AgentType.OUTBOUND_FOLLOW_UP]: {
          [SupportedLanguage.ENGLISH]:
            'Hello! This is your AI assistant calling from {business_name} regarding your upcoming appointment.',
          [SupportedLanguage.SPANISH]:
            '¡Hola! Soy su asistente de IA llamando de {business_name} sobre su próxima cita.',
          [SupportedLanguage.CHINESE_SIMPLIFIED]:
            '您好！我是来自{business_name}的AI助手，关于您即将到来的预约。',
          [SupportedLanguage.ITALIAN]:
            'Ciao! Sono il tuo assistente AI che chiama da {business_name} riguardo al tuo appuntamento.',
        },
        [AgentType.OUTBOUND_MARKETING]: {
          [SupportedLanguage.ENGLISH]:
            "Hello! I'm calling from {business_name} with some exciting news about our services.",
          [SupportedLanguage.SPANISH]:
            '¡Hola! Llamo de {business_name} con noticias emocionantes sobre nuestros servicios.',
          [SupportedLanguage.CHINESE_SIMPLIFIED]:
            '您好！我是{business_name}的代表，有一些关于我们服务的好消息。',
          [SupportedLanguage.ITALIAN]:
            'Ciao! Sto chiamando da {business_name} con notizie entusiasmanti sui nostri servizi.',
        },
        [AgentType.INBOUND_CUSTOMER_SUPPORT]: {
          [SupportedLanguage.ENGLISH]:
            "Hello! This is {business_name} customer support. I'm here to help you with any questions or issues.",
          [SupportedLanguage.SPANISH]:
            '¡Hola! Este es el soporte al cliente de {business_name}. Estoy aquí para ayudarle con cualquier pregunta o problema.',
          [SupportedLanguage.CHINESE_SIMPLIFIED]:
            '您好！这里是{business_name}客户支持。我来帮助您解决任何问题。',
          [SupportedLanguage.ITALIAN]:
            'Ciao! Questo è il supporto clienti di {business_name}. Sono qui per aiutarti con domande o problemi.',
        },
      },
    };

    return (
      templates[templateType]?.[agentType]?.[language] ||
      templates[templateType]?.[agentType]?.[SupportedLanguage.ENGLISH] ||
      'Hello! How can I help you today?'
    );
  }

  /**
   * Create confirmation messages
   */
  private createConfirmationMessages(
    agentType: AgentType,
    language: SupportedLanguage
  ) {
    return {
      appointment_scheduled:
        'Your appointment has been scheduled successfully.',
      information_collected:
        "I've collected your information. Is there anything else I can help you with?",
      transfer_initiated: "I'm connecting you with the right person now.",
    };
  }

  /**
   * Create error handling templates
   */
  private createErrorHandling(
    agentType: AgentType,
    language: SupportedLanguage
  ) {
    return {
      general_error: {
        error_type: 'general',
        response_template:
          "I apologize, but I'm experiencing a technical issue. Let me connect you with a human agent.",
        fallback_action: 'escalate_to_human',
        retry_count: 2,
      },
      timeout_error: {
        error_type: 'timeout',
        response_template:
          "I didn't catch that. Could you please repeat what you said?",
        fallback_action: 'repeat_question',
        retry_count: 3,
      },
    };
  }

  /**
   * Create default business hours
   */
  private createDefaultBusinessHours(): BusinessHours {
    return {
      timezone: 'America/New_York',
      schedule: [
        { day: 1, is_open: true, open_time: '09:00', close_time: '17:00' }, // Monday
        { day: 2, is_open: true, open_time: '09:00', close_time: '17:00' }, // Tuesday
        { day: 3, is_open: true, open_time: '09:00', close_time: '17:00' }, // Wednesday
        { day: 4, is_open: true, open_time: '09:00', close_time: '17:00' }, // Thursday
        { day: 5, is_open: true, open_time: '09:00', close_time: '17:00' }, // Friday
        { day: 6, is_open: false }, // Saturday
        { day: 0, is_open: false }, // Sunday
      ],
      exceptions: [],
    };
  }

  /**
   * Create calendar integration settings
   */
  private createCalendarIntegration(agentType: AgentType): CalendarIntegration {
    const needsCalendar = [
      AgentType.INBOUND_RECEPTIONIST,
      AgentType.OUTBOUND_FOLLOW_UP,
    ].includes(agentType);

    return {
      enabled: needsCalendar,
      provider: 'cal.com',
      settings: {
        auto_schedule: agentType === AgentType.OUTBOUND_FOLLOW_UP,
        buffer_time: 15, // minutes
        max_advance_booking: 90, // days
        confirmation_required: true,
      },
    };
  }

  /**
   * Create CRM integration settings
   */
  private createCRMIntegration(agentType: AgentType): CRMIntegration {
    const needsCRM = [
      AgentType.INBOUND_RECEPTIONIST,
      AgentType.OUTBOUND_MARKETING,
      AgentType.INBOUND_CUSTOMER_SUPPORT,
    ].includes(agentType);

    return {
      enabled: needsCRM,
      provider: 'custom',
      field_mapping: {
        customer_name: 'name',
        phone_number: 'phone',
        email: 'email',
        company: 'company_name',
      },
    };
  }

  /**
   * Create webhook settings
   */
  private createWebhookSettings(): WebhookSettings {
    return {
      endpoints: [],
      security: {
        signature_validation: true,
        ip_whitelist: [],
      },
      retry_policy: {
        max_attempts: 3,
        backoff_strategy: 'exponential',
        initial_delay: 1000,
        max_delay: 30000,
      },
    };
  }
}
