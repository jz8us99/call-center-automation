export enum AgentType {
  INBOUND_RECEPTIONIST = 'inbound_receptionist',
  INBOUND_CUSTOMER_SUPPORT = 'inbound_customer_support',
  OUTBOUND_FOLLOW_UP = 'outbound_follow_up',
  OUTBOUND_MARKETING = 'outbound_marketing',
}

export interface AgentTypeConfig {
  type: AgentType;
  name: string;
  description: string;
  icon: string;
  capabilities: string[];
  defaultPrompt: string;
  suggestedVoiceSettings: {
    speed: number;
    pitch: number;
    tone: 'professional' | 'friendly' | 'energetic' | 'calm';
  };
}

export const AGENT_TYPE_CONFIGS: Record<AgentType, AgentTypeConfig> = {
  [AgentType.INBOUND_RECEPTIONIST]: {
    type: AgentType.INBOUND_RECEPTIONIST,
    name: 'Inbound Receptionist',
    description:
      'Professional phone receptionist handling incoming calls, routing, and scheduling',
    icon: '📞',
    capabilities: [
      'Professional call greeting and routing',
      'Appointment scheduling and management',
      'Basic inquiry handling',
      'Customer information collection',
      'Call transfer and message taking',
      'Business hours and location information',
    ],
    defaultPrompt: `You are a professional receptionist for {business_name}. Your role is to:
- Answer all calls with a warm, professional greeting
- Identify the caller's needs quickly and efficiently
- Schedule appointments according to availability
- Route calls to the appropriate staff members
- Collect and update customer contact information
- Provide information about services, hours, and location
- Handle routine inquiries with courtesy and accuracy`,
    suggestedVoiceSettings: {
      speed: 1.0,
      pitch: 1.0,
      tone: 'professional',
    },
  },
  [AgentType.INBOUND_CUSTOMER_SUPPORT]: {
    type: AgentType.INBOUND_CUSTOMER_SUPPORT,
    name: 'Inbound Customer Support',
    description:
      'Dedicated support agent for handling customer issues, complaints, and technical assistance',
    icon: '🛠️',
    capabilities: [
      'Technical troubleshooting and support',
      'Issue resolution and problem solving',
      'Complaint handling and de-escalation',
      'Service explanations and guidance',
      'Follow-up coordination',
      'Escalation management',
    ],
    defaultPrompt: `You are a customer support specialist for {business_name}. Your responsibilities include:
- Listening actively to customer concerns and issues
- Providing clear, step-by-step solutions
- Troubleshooting problems with patience and expertise
- Handling complaints with empathy and professionalism
- Escalating complex issues to appropriate departments
- Following up to ensure customer satisfaction
- Maintaining detailed records of all interactions`,
    suggestedVoiceSettings: {
      speed: 0.9,
      pitch: 0.9,
      tone: 'calm',
    },
  },
  [AgentType.OUTBOUND_FOLLOW_UP]: {
    type: AgentType.OUTBOUND_FOLLOW_UP,
    name: 'Outbound Follow-up',
    description:
      'Follow-up agent for appointment confirmations, reminders, and post-service check-ins',
    icon: '📅',
    capabilities: [
      'Appointment confirmations and reminders',
      'Rescheduling and cancellation handling',
      'Post-service follow-up calls',
      'Customer satisfaction surveys',
      'Feedback collection and documentation',
      'Gentle payment reminders',
    ],
    defaultPrompt: `You are making follow-up calls on behalf of {business_name}. Your duties include:
- Confirming upcoming appointments professionally
- Sending timely appointment reminders
- Offering rescheduling options when needed
- Following up after completed services
- Collecting customer feedback and satisfaction ratings
- Handling cancellations with understanding
- Maintaining positive customer relationships`,
    suggestedVoiceSettings: {
      speed: 0.9,
      pitch: 1.1,
      tone: 'friendly',
    },
  },
  [AgentType.OUTBOUND_MARKETING]: {
    type: AgentType.OUTBOUND_MARKETING,
    name: 'Outbound Marketing',
    description:
      'Marketing agent for lead generation, sales calls, and promotional campaigns',
    icon: '📈',
    capabilities: [
      'Lead qualification and nurturing',
      'Sales presentations and demos',
      'Promotional campaign execution',
      'New service introductions',
      'Consultation scheduling',
      'Market research and surveys',
    ],
    defaultPrompt: `You are a marketing representative for {business_name}. Your objectives are to:
- Introduce our services to potential customers
- Qualify leads and assess customer needs
- Present promotional offers clearly and persuasively
- Schedule consultations and appointments
- Handle objections professionally and respectfully
- Build positive relationships with prospects
- Comply with all marketing and privacy regulations`,
    suggestedVoiceSettings: {
      speed: 1.1,
      pitch: 1.0,
      tone: 'energetic',
    },
  },
};

export interface AgentConfiguration {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_type: AgentType;
  business_name: string;
  business_type: string;
  is_active: boolean;
  voice_settings: {
    speed: number;
    pitch: number;
    tone: string;
    voice_id?: string;
  };
  custom_prompt?: string;
  created_at: string;
  updated_at: string;
}
