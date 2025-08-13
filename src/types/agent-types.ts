export interface VoiceSettings {
  speed: number;
  pitch: number;
  tone: string;
  voice_id?: string;
  accent?: string;
  gender?: string;
}

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
      'Handles incoming customer calls, routing, and initial support',
    icon: '📞',
    capabilities: [
      'Call routing and transfer',
      'Appointment scheduling',
      'Basic inquiry handling',
      'Customer information collection',
      'Emergency call identification',
    ],
    defaultPrompt: `You are a professional receptionist for {business_name}. Your role is to:
- Greet callers warmly and professionally
- Identify the caller's needs quickly
- Schedule appointments when requested
- Route calls to appropriate staff members
- Collect basic customer information
- Handle common inquiries about services and hours
- Maintain a helpful and courteous tone throughout the call`,
    suggestedVoiceSettings: {
      speed: 1.0,
      pitch: 1.0,
      tone: 'professional',
    },
  },
  [AgentType.OUTBOUND_FOLLOW_UP]: {
    type: AgentType.OUTBOUND_FOLLOW_UP,
    name: 'Outbound Follow-up Agent',
    description:
      'Manages appointment confirmations, reminders, and rescheduling',
    icon: '📅',
    capabilities: [
      'Appointment confirmations',
      'Reminder calls',
      'Rescheduling requests',
      'Cancellation handling',
      'Follow-up after appointments',
    ],
    defaultPrompt: `You are calling on behalf of {business_name} to follow up on appointments. Your responsibilities include:
- Confirming upcoming appointments professionally
- Offering rescheduling options if needed
- Sending appointment reminders
- Collecting any required pre-appointment information
- Handling cancellations politely
- Following up on completed appointments for feedback`,
    suggestedVoiceSettings: {
      speed: 0.9,
      pitch: 1.1,
      tone: 'friendly',
    },
  },
  [AgentType.OUTBOUND_MARKETING]: {
    type: AgentType.OUTBOUND_MARKETING,
    name: 'Outbound Marketing Agent',
    description:
      'Conducts sales calls, lead qualification, and promotional campaigns',
    icon: '📈',
    capabilities: [
      'Lead qualification',
      'Sales presentations',
      'Promotional campaigns',
      'Service introductions',
      'Follow-up on inquiries',
      'Appointment setting for consultations',
    ],
    defaultPrompt: `You are a sales representative for {business_name}. Your goal is to:
- Introduce our services to potential customers
- Qualify leads and identify genuine interest
- Present promotional offers clearly and compellingly
- Schedule consultation appointments
- Handle objections professionally
- Maintain compliance with marketing regulations
- Build positive relationships with prospects`,
    suggestedVoiceSettings: {
      speed: 1.1,
      pitch: 1.0,
      tone: 'energetic',
    },
  },
  [AgentType.INBOUND_CUSTOMER_SUPPORT]: {
    type: AgentType.INBOUND_CUSTOMER_SUPPORT,
    name: 'Customer Support Agent',
    description: 'Provides detailed technical support and issue resolution',
    icon: '🛠️',
    capabilities: [
      'Technical troubleshooting',
      'Detailed issue resolution',
      'Service explanation',
      'Complaint handling',
      'Multi-step problem solving',
      'Escalation management',
    ],
    defaultPrompt: `You are a customer support specialist for {business_name}. Your role involves:
- Listening carefully to customer issues and concerns
- Providing detailed explanations and solutions
- Troubleshooting problems step-by-step
- Escalating complex issues when necessary
- Following up to ensure resolution
- Maintaining detailed records of interactions
- Demonstrating empathy and patience throughout`,
    suggestedVoiceSettings: {
      speed: 0.9,
      pitch: 0.9,
      tone: 'calm',
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
