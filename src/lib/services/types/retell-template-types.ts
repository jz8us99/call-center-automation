/**
 * Type definitions for Retell Agent and LLM templates
 */

export interface RetellTemplate {
  agent_id?: string;
  channel: string;
  last_modification_timestamp?: number;
  agent_name: string;
  response_engine: ResponseEngine;
  webhook_url: string;
  language: string;
  opt_out_sensitive_data_storage: boolean;
  opt_in_signed_url: boolean;
  post_call_analysis_data: PostCallAnalysisField[];
  version?: number;
  is_published: boolean;
  post_call_analysis_model: string;
  voice_id: string;
  voice_temperature: number;
  voice_speed: number;
  volume: number;
  enable_backchannel: boolean;
  backchannel_words: string[];
  max_call_duration_ms: number;
  interruption_sensitivity: number;
  normalize_for_speech: boolean;
  begin_message_delay_ms: number;
  allow_user_dtmf: boolean;
  user_dtmf_options: any;
  retellLlmData: RetellLlmData;
  conversationFlow?: any;
  llmURL?: string;
}

export interface ResponseEngine {
  type: 'retell-llm' | 'conversation-flow';
  llm_id?: string;
  conversation_flow_id?: string;
  version?: number;
}

export interface PostCallAnalysisField {
  type: string;
  name: string;
  description: string;
  examples?: string[];
}

export interface RetellLlmData {
  llm_id?: string;
  version?: number;
  model: string;
  general_prompt: string;
  general_tools: RetellTool[];
  start_speaker: string;
  begin_message: string;
  last_modification_timestamp?: number;
  is_published?: boolean;
  knowledge_base_ids?: string[];
}

export interface RetellTool {
  name: string;
  type: string;
  description?: string;
  headers?: Record<string, string>;
  parameter_type?: string;
  method?: string;
  query_params?: Record<string, any>;
  url?: string;
  args_at_root?: boolean;
  timeout_ms?: number;
  speak_after_execution?: boolean;
  response_variables?: Record<string, string>;
  speak_during_execution?: boolean;
  parameters?: {
    type: string;
    properties?: Record<string, any>;
  };
  transfer_destination?: {
    type: string;
    number?: string;
  };
  transfer_option?: {
    type: string;
    show_transferee_as_caller?: boolean;
  };
  custom_sip_headers?: Record<string, string>;
  execution_message_description?: string;
}

export interface BusinessContext {
  businessName: string;
  businessType: string;
  industry: string;
  services: any[];
  products: any[];
  staff: any[];
  locations: any[];
  insuranceProviders: any[];
}

export interface DeploymentResult {
  success: boolean;
  agent?: any;
  llmId?: string;
  error?: string;
}

export interface TemplateConfig {
  businessType: string;
  agentRole: string;
  version: string;
}
