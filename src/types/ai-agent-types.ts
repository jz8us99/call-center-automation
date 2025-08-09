// AI Agent Management System Types
// Comprehensive type definitions for multi-agent, multi-language support

export enum AgentType {
  INBOUND_RECEPTIONIST = 'inbound_receptionist',
  INBOUND_CUSTOMER_SUPPORT = 'inbound_customer_support',
  OUTBOUND_FOLLOW_UP = 'outbound_follow_up',
  OUTBOUND_MARKETING = 'outbound_marketing',
}

export enum AgentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum AgentPersonality {
  PROFESSIONAL = 'professional',
  FRIENDLY = 'friendly',
  TECHNICAL = 'technical',
  MULTILINGUAL = 'multilingual',
}

export enum SupportedLanguage {
  ENGLISH = 'en',
  SPANISH = 'es',
  CHINESE_SIMPLIFIED = 'zh-CN',
  ITALIAN = 'it',
}

export enum CallDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum CallStatus {
  STARTED = 'started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ABANDONED = 'abandoned',
  TRANSFERRED = 'transferred',
}

// ===== Core Agent Types =====

export interface AgentTypeConfig {
  id: string;
  type_code: AgentType;
  name: string;
  description: string;
  icon: string;
  default_personality: AgentPersonality;
  default_capabilities: string[];
  template_prompt: string;
  suggested_voice_settings: VoiceSettings;
  is_active: boolean;
  created_at: string;
}

export interface SupportedLanguageConfig {
  id: string;
  code: SupportedLanguage;
  name: string;
  native_name: string;
  is_default: boolean;
  rtl: boolean;
  voice_settings: LanguageVoiceSettings;
  created_at: string;
}

export interface VoiceSettings {
  speed: number;
  pitch: number;
  tone: string;
  voice_id?: string;
  accent?: string;
  gender?: 'male' | 'female' | 'neutral';
}

export interface LanguageVoiceSettings {
  accent?: string;
  gender?: 'male' | 'female' | 'neutral';
  [key: string]: unknown;
}

// ===== Main Agent Interface =====

export interface AIAgent {
  id: string;
  client_id: string;
  agent_type_id: string;
  language_id: string;
  parent_agent_id?: string;

  // Basic Info
  name: string;
  description?: string;
  status: AgentStatus;

  // Retell AI Integration
  retell_agent_id?: string;
  retell_phone_number?: string;
  webhook_url?: string;

  // Configuration
  personality: AgentPersonality;
  voice_settings: VoiceSettings;

  // Business Context
  business_context: Record<string, unknown>;
  greeting_message?: string;

  // Advanced Configuration
  prompt_template?: string;
  variables: Record<string, AgentVariable>;
  integrations: Record<string, IntegrationConfig>;

  // Metadata
  created_at: string;
  updated_at: string;
  last_deployed_at?: string;
}

export interface AgentVariable {
  name: string;
  type: 'text' | 'phone' | 'email' | 'date' | 'boolean' | 'number';
  required: boolean;
  default_value?: unknown;
  validation_rules?: string[];
  description?: string;
}

export interface IntegrationConfig {
  type: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  webhook_url?: string;
  api_key?: string;
  [key: string]: unknown;
}

// ===== Agent Configuration =====

export interface AgentConfiguration {
  id: string;
  agent_id: string;

  // Call Flow Configuration
  call_routing_rules: CallRoutingRule[];
  escalation_triggers: EscalationTrigger[];
  action_detection_logic: ActionDetectionConfig;

  // Response Templates
  response_templates: Record<string, ResponseTemplate>;
  confirmation_messages: Record<string, string>;
  error_handling: Record<string, ErrorHandler>;

  // Business Hours & Availability
  business_hours: BusinessHours;
  after_hours_message?: string;
  holiday_schedule: HolidaySchedule[];

  // Integration Settings
  calendar_integration: CalendarIntegration;
  crm_integration: CRMIntegration;
  webhook_settings: WebhookSettings;

  // Advanced Features
  conditional_logic: ConditionalLogic[];
  variable_mapping: Record<string, string>;
  custom_actions: CustomAction[];

  created_at: string;
  updated_at: string;
}

export interface CallRoutingRule {
  id: string;
  condition: string;
  action: 'transfer' | 'schedule' | 'collect_info' | 'escalate';
  target?: string;
  priority: number;
  enabled: boolean;
}

export interface EscalationTrigger {
  id: string;
  trigger_type: 'keyword' | 'sentiment' | 'duration' | 'manual';
  condition: string;
  action: string;
  target: string;
  enabled: boolean;
}

export interface ActionDetectionConfig {
  intent_recognition: boolean;
  keywords: string[];
  sentiment_analysis: boolean;
  custom_detectors: CustomDetector[];
}

export interface CustomDetector {
  name: string;
  pattern: string;
  action: string;
  confidence_threshold: number;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  conditions?: string[];
}

export interface ErrorHandler {
  error_type: string;
  response_template: string;
  fallback_action: string;
  retry_count: number;
}

export interface BusinessHours {
  timezone: string;
  schedule: DaySchedule[];
  exceptions: ScheduleException[];
}

export interface DaySchedule {
  day: number; // 0-6 (Sunday-Saturday)
  is_open: boolean;
  open_time?: string;
  close_time?: string;
  breaks?: TimeSlot[];
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
}

export interface ScheduleException {
  date: string;
  is_open: boolean;
  open_time?: string;
  close_time?: string;
  reason?: string;
}

export interface HolidaySchedule {
  name: string;
  date: string;
  is_recurring: boolean;
  message?: string;
}

export interface CalendarIntegration {
  enabled: boolean;
  provider: 'cal.com' | 'calendly' | 'google' | 'outlook';
  api_key?: string;
  webhook_url?: string;
  settings: Record<string, unknown>;
}

export interface CRMIntegration {
  enabled: boolean;
  provider: 'salesforce' | 'hubspot' | 'pipedrive' | 'custom';
  api_key?: string;
  webhook_url?: string;
  field_mapping: Record<string, string>;
}

export interface WebhookSettings {
  endpoints: WebhookEndpoint[];
  security: WebhookSecurity;
  retry_policy: RetryPolicy;
}

export interface WebhookEndpoint {
  name: string;
  url: string;
  events: string[];
  headers: Record<string, string>;
  enabled: boolean;
}

export interface WebhookSecurity {
  signature_validation: boolean;
  secret_key?: string;
  ip_whitelist?: string[];
}

export interface RetryPolicy {
  max_attempts: number;
  backoff_strategy: 'linear' | 'exponential';
  initial_delay: number;
  max_delay: number;
}

export interface ConditionalLogic {
  id: string;
  condition: string;
  if_true: ConditionalAction;
  if_false?: ConditionalAction;
  enabled: boolean;
}

export interface ConditionalAction {
  type: 'response' | 'transfer' | 'variable_set' | 'api_call';
  parameters: Record<string, unknown>;
}

export interface CustomAction {
  id: string;
  name: string;
  trigger: string;
  action_type: 'webhook' | 'api_call' | 'database_update';
  configuration: Record<string, unknown>;
  enabled: boolean;
}

// ===== Translation System =====

export interface AgentTranslation {
  id: string;
  source_agent_id: string;
  target_agent_id: string;
  source_language_id: string;
  target_language_id: string;

  translation_method: 'automatic' | 'manual' | 'hybrid';
  translation_quality_score?: number;
  reviewed_by?: string;
  reviewed_at?: string;

  field_translations: Record<string, string>;
  template_translations: Record<string, string>;

  created_at: string;
  updated_at: string;
}

// ===== Call Logs =====

export interface AICallLog {
  id: string;
  agent_id: string;
  client_id: string;

  call_id: string;
  phone_number: string;
  call_direction: CallDirection;
  call_status: CallStatus;

  started_at: string;
  ended_at?: string;
  duration?: number;

  transcript?: ConversationTranscript;
  call_summary?: string;
  detected_language?: SupportedLanguage;
  customer_intent?: string;

  sentiment_analysis?: SentimentAnalysis;
  call_analysis?: CallAnalysis;
  action_items: ActionItem[];
  follow_up_required: boolean;

  retell_data?: Record<string, unknown>;
  custom_data: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

export interface ConversationTranscript {
  turns: ConversationTurn[];
  language: SupportedLanguage;
  confidence_scores: number[];
}

export interface ConversationTurn {
  speaker: 'agent' | 'customer';
  text: string;
  timestamp: string;
  confidence: number;
  intent?: string;
  entities?: Entity[];
}

export interface Entity {
  type: string;
  value: string;
  confidence: number;
  start_position: number;
  end_position: number;
}

export interface SentimentAnalysis {
  overall_sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  emotional_tone: string[];
  sentiment_timeline: SentimentPoint[];
}

export interface SentimentPoint {
  timestamp: string;
  sentiment: number; // -1 to 1
  confidence: number;
}

export interface CallAnalysis {
  key_topics: string[];
  resolution_status: 'resolved' | 'pending' | 'escalated';
  customer_satisfaction: number;
  agent_performance: number;
  call_quality_score: number;
  issues_identified: string[];
  recommendations: string[];
}

export interface ActionItem {
  id: string;
  type: 'follow_up' | 'schedule_appointment' | 'send_information' | 'escalate';
  description: string;
  due_date?: string;
  assigned_to?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

// ===== Metrics =====

export interface AgentMetrics {
  id: string;
  agent_id: string;
  date: string;
  hour?: number;

  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  average_duration: number;

  average_sentiment: number;
  customer_satisfaction: number;
  resolution_rate: number;
  transfer_rate: number;

  language_distribution: Record<SupportedLanguage, number>;

  created_at: string;
}

// ===== Templates =====

export interface AgentTemplate {
  id: string;
  agent_type_id: string;

  name: string;
  description: string;
  category: string;
  tags: string[];

  template_data: Partial<AIAgent>;
  prompt_template: string;
  configuration_template: Partial<AgentConfiguration>;

  is_public: boolean;
  created_by: string;
  usage_count: number;
  rating?: number;

  created_at: string;
  updated_at: string;
}

// ===== API Interfaces =====

export interface CreateAgentRequest {
  agent_type: AgentType;
  language: SupportedLanguage;
  name: string;
  description?: string;
  personality?: AgentPersonality;
  business_context: Record<string, unknown>;
  configuration?: Partial<AgentConfiguration>;
  template_id?: string;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  status?: AgentStatus;
  personality?: AgentPersonality;
  voice_settings?: Partial<VoiceSettings>;
  business_context?: Record<string, unknown>;
  greeting_message?: string;
  prompt_template?: string;
  variables?: Record<string, AgentVariable>;
  integrations?: Record<string, IntegrationConfig>;
}

export interface DuplicateAgentRequest {
  source_agent_id: string;
  target_language: SupportedLanguage;
  name?: string;
  auto_translate?: boolean;
}

export interface AgentDashboardData {
  client_id: string;
  agent_summary: {
    total_agents: number;
    active_agents: number;
    draft_agents: number;
    inactive_agents: number;
  };
  agents_by_type: Record<
    string,
    {
      count: number;
      languages: SupportedLanguage[];
    }
  >;
  recent_activity: Partial<AICallLog>[];
  performance_metrics: AgentMetrics[];
}

// ===== UI Component Props =====

export interface AgentCardProps {
  agent: AIAgent;
  agentType: AgentTypeConfig;
  language: SupportedLanguageConfig;
  onEdit: (agent: AIAgent) => void;
  onDelete: (agentId: string) => void;
  onDuplicate: (agent: AIAgent) => void;
  onToggleStatus: (agentId: string, status: AgentStatus) => void;
}

export interface AgentConfigurationProps {
  agent?: AIAgent;
  agentType: AgentTypeConfig;
  language: SupportedLanguageConfig;
  onSave: (configuration: Partial<AgentConfiguration>) => Promise<void>;
  onCancel: () => void;
}

export interface PromptBuilderProps {
  initialPrompt?: string;
  variables: Record<string, AgentVariable>;
  templates: AgentTemplate[];
  onSave: (prompt: string) => void;
  onPreview: (prompt: string) => void;
}

// ===== Retell AI Integration =====

export interface RetellAgentConfig {
  agent_name: string;
  voice_id: string;
  voice_temperature: number;
  voice_speed: number;
  response_engine: string;
  llm_websocket_url: string;
  begin_message?: string;
  end_call_after_silence_ms?: number;
  max_call_duration_ms?: number;
  webhook_url?: string;
  language?: string;
}

export interface RetellAgentResponse {
  agent_id: string;
  agent_name: string;
  voice_id: string;
  created_at: string;
  last_modification_timestamp: string;
  webhook_url?: string;
}

// ===== Validation Schemas =====

export interface ValidationRule {
  field: string;
  rule: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ===== Configuration Templates =====

export const AGENT_TYPE_CONFIGS: Record<AgentType, Partial<AgentTypeConfig>> = {
  [AgentType.INBOUND_RECEPTIONIST]: {
    type_code: AgentType.INBOUND_RECEPTIONIST,
    name: 'Inbound Receptionist',
    description:
      'Professional phone receptionist handling incoming calls, routing, and scheduling',
    icon: '📞',
    default_personality: AgentPersonality.PROFESSIONAL,
    default_capabilities: [
      'Professional call greeting and routing',
      'Appointment scheduling and management',
      'Basic inquiry handling',
      'Customer information collection',
      'Call transfer and message taking',
      'Business hours and location information',
    ],
    suggested_voice_settings: {
      speed: 1.0,
      pitch: 1.0,
      tone: 'professional',
    },
  },
  [AgentType.INBOUND_CUSTOMER_SUPPORT]: {
    type_code: AgentType.INBOUND_CUSTOMER_SUPPORT,
    name: 'Inbound Customer Support',
    description:
      'Dedicated support agent for handling customer issues, complaints, and technical assistance',
    icon: '🛠️',
    default_personality: AgentPersonality.TECHNICAL,
    default_capabilities: [
      'Technical troubleshooting and support',
      'Issue resolution and problem solving',
      'Complaint handling and de-escalation',
      'Service explanations and guidance',
      'Follow-up coordination',
      'Escalation management',
    ],
    suggested_voice_settings: {
      speed: 0.9,
      pitch: 0.9,
      tone: 'calm',
    },
  },
  [AgentType.OUTBOUND_FOLLOW_UP]: {
    type_code: AgentType.OUTBOUND_FOLLOW_UP,
    name: 'Outbound Follow-up',
    description:
      'Follow-up agent for appointment confirmations, reminders, and post-service check-ins',
    icon: '📅',
    default_personality: AgentPersonality.FRIENDLY,
    default_capabilities: [
      'Appointment confirmations and reminders',
      'Rescheduling and cancellation handling',
      'Post-service follow-up calls',
      'Customer satisfaction surveys',
      'Feedback collection and documentation',
      'Gentle payment reminders',
    ],
    suggested_voice_settings: {
      speed: 0.9,
      pitch: 1.1,
      tone: 'friendly',
    },
  },
  [AgentType.OUTBOUND_MARKETING]: {
    type_code: AgentType.OUTBOUND_MARKETING,
    name: 'Outbound Marketing',
    description:
      'Marketing agent for lead generation, sales calls, and promotional campaigns',
    icon: '📈',
    default_personality: AgentPersonality.FRIENDLY,
    default_capabilities: [
      'Lead qualification and nurturing',
      'Sales presentations and demos',
      'Promotional campaign execution',
      'New service introductions',
      'Consultation scheduling',
      'Market research and surveys',
    ],
    suggested_voice_settings: {
      speed: 1.1,
      pitch: 1.0,
      tone: 'energetic',
    },
  },
};

export const SUPPORTED_LANGUAGES: Record<
  SupportedLanguage,
  Partial<SupportedLanguageConfig>
> = {
  [SupportedLanguage.ENGLISH]: {
    code: SupportedLanguage.ENGLISH,
    name: 'English',
    native_name: 'English',
    is_default: true,
    rtl: false,
    voice_settings: { accent: 'american', gender: 'neutral' },
  },
  [SupportedLanguage.SPANISH]: {
    code: SupportedLanguage.SPANISH,
    name: 'Spanish',
    native_name: 'Español',
    is_default: false,
    rtl: false,
    voice_settings: { accent: 'neutral', gender: 'neutral' },
  },
  [SupportedLanguage.CHINESE_SIMPLIFIED]: {
    code: SupportedLanguage.CHINESE_SIMPLIFIED,
    name: 'Chinese (Simplified)',
    native_name: '简体中文',
    is_default: false,
    rtl: false,
    voice_settings: { accent: 'mainland', gender: 'neutral' },
  },
  [SupportedLanguage.ITALIAN]: {
    code: SupportedLanguage.ITALIAN,
    name: 'Italian',
    native_name: 'Italiano',
    is_default: false,
    rtl: false,
    voice_settings: { accent: 'standard', gender: 'neutral' },
  },
};
