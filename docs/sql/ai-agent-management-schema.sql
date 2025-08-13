-- AI Agent Management System Database Schema
-- Multi-agent, multi-language support with Retell AI integration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- Core Tables
-- =====================================================

-- Clients table (if not exists)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR NOT NULL,
  business_type VARCHAR,
  contact_email VARCHAR,
  contact_phone VARCHAR,
  timezone VARCHAR DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent types definition
CREATE TABLE IF NOT EXISTS agent_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50),
  default_personality VARCHAR(20) DEFAULT 'professional',
  default_capabilities JSONB DEFAULT '[]',
  template_prompt TEXT,
  suggested_voice_settings JSONB DEFAULT '{"speed": 1.0, "pitch": 1.0, "tone": "professional"}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supported languages
CREATE TABLE IF NOT EXISTS supported_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL UNIQUE, -- en, es, zh-CN, it
  name VARCHAR(50) NOT NULL,
  native_name VARCHAR(50) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  rtl BOOLEAN DEFAULT false, -- right-to-left text
  voice_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main agents table
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  agent_type_id UUID REFERENCES agent_types(id),
  language_id UUID REFERENCES supported_languages(id),
  parent_agent_id UUID REFERENCES ai_agents(id), -- NULL for primary agents, references parent for translations
  
  -- Basic Info
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
  
  -- Retell AI Integration
  retell_agent_id VARCHAR UNIQUE,
  retell_phone_number VARCHAR,
  webhook_url VARCHAR,
  
  -- Configuration
  personality VARCHAR(20) DEFAULT 'professional' CHECK (personality IN ('professional', 'friendly', 'technical', 'multilingual')),
  voice_settings JSONB DEFAULT '{"speed": 1.0, "pitch": 1.0, "tone": "professional", "voice_id": null}',
  
  -- Business Context
  business_context JSONB DEFAULT '{}', -- Dynamic placeholders
  greeting_message TEXT,
  
  -- Advanced Configuration
  prompt_template TEXT,
  variables JSONB DEFAULT '{}', -- Dynamic variables
  integrations JSONB DEFAULT '{}', -- API connections
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_deployed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(client_id, agent_type_id, language_id)
);

-- Agent configurations (detailed settings)
CREATE TABLE IF NOT EXISTS agent_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  
  -- Call Flow Configuration
  call_routing_rules JSONB DEFAULT '[]',
  escalation_triggers JSONB DEFAULT '[]',
  action_detection_logic JSONB DEFAULT '{}',
  
  -- Response Templates
  response_templates JSONB DEFAULT '{}',
  confirmation_messages JSONB DEFAULT '{}',
  error_handling JSONB DEFAULT '{}',
  
  -- Business Hours & Availability
  business_hours JSONB DEFAULT '{}',
  after_hours_message TEXT,
  holiday_schedule JSONB DEFAULT '[]',
  
  -- Integration Settings
  calendar_integration JSONB DEFAULT '{}',
  crm_integration JSONB DEFAULT '{}',
  webhook_settings JSONB DEFAULT '{}',
  
  -- Advanced Features
  conditional_logic JSONB DEFAULT '[]',
  variable_mapping JSONB DEFAULT '{}',
  custom_actions JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent translations for multi-language support
CREATE TABLE IF NOT EXISTS agent_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  target_agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  source_language_id UUID REFERENCES supported_languages(id),
  target_language_id UUID REFERENCES supported_languages(id),
  
  -- Translation metadata
  translation_method VARCHAR(20) DEFAULT 'automatic' CHECK (translation_method IN ('automatic', 'manual', 'hybrid')),
  translation_quality_score DECIMAL(3,2),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Translation mappings
  field_translations JSONB DEFAULT '{}',
  template_translations JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(source_agent_id, target_language_id)
);

-- Call logs (enhanced for multi-agent system)
CREATE TABLE IF NOT EXISTS ai_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES ai_agents(id),
  client_id UUID REFERENCES clients(id),
  
  -- Call Details
  call_id VARCHAR NOT NULL UNIQUE,
  phone_number VARCHAR,
  call_direction VARCHAR(10) CHECK (call_direction IN ('inbound', 'outbound')),
  call_status VARCHAR(20) DEFAULT 'started' CHECK (call_status IN (
    'started', 'in_progress', 'completed', 'failed', 'abandoned', 'transferred'
  )),
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- seconds
  
  -- Content
  transcript JSONB, -- Structured conversation
  call_summary TEXT,
  detected_language VARCHAR(10),
  customer_intent VARCHAR(50),
  
  -- Analysis
  sentiment_analysis JSONB,
  call_analysis JSONB,
  action_items JSONB DEFAULT '[]',
  follow_up_required BOOLEAN DEFAULT false,
  
  -- Integration Data
  retell_data JSONB,
  custom_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent performance metrics
CREATE TABLE IF NOT EXISTS agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  
  -- Time Period
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),
  
  -- Call Metrics
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  average_duration DECIMAL(10,2) DEFAULT 0,
  
  -- Quality Metrics
  average_sentiment DECIMAL(3,2),
  customer_satisfaction DECIMAL(3,2),
  resolution_rate DECIMAL(3,2),
  transfer_rate DECIMAL(3,2),
  
  -- Language Metrics
  language_distribution JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(agent_id, date, hour)
);

-- Template library for reusable configurations
CREATE TABLE IF NOT EXISTS agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type_id UUID REFERENCES agent_types(id),
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  tags TEXT[],
  
  -- Template Content
  template_data JSONB NOT NULL,
  prompt_template TEXT,
  configuration_template JSONB DEFAULT '{}',
  
  -- Metadata
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Insert Default Data
-- =====================================================

-- Insert default agent types
INSERT INTO agent_types (type_code, name, description, icon, template_prompt, suggested_voice_settings) VALUES 
('inbound_call', 'Inbound Call Agent', 'Handles incoming customer calls, routing, and initial support', '📞', 
 'You are a professional receptionist for {business_name}. Handle incoming calls with warmth and efficiency.',
 '{"speed": 1.0, "pitch": 1.0, "tone": "professional", "voice_id": "default"}'),

('outbound_appointment', 'Outbound Appointment Follow-up Agent', 'Manages appointment confirmations, reminders, and rescheduling', '📅', 
 'You are calling on behalf of {business_name} to follow up on appointments professionally.',
 '{"speed": 0.9, "pitch": 1.1, "tone": "friendly", "voice_id": "default"}'),

('outbound_marketing', 'Outbound Marketing Agent', 'Conducts sales calls, lead qualification, and promotional campaigns', '📈', 
 'You are a sales representative for {business_name}. Engage prospects with enthusiasm.',
 '{"speed": 1.1, "pitch": 1.0, "tone": "energetic", "voice_id": "default"}'),

('customer_support', 'Customer Support Agent', 'Provides detailed technical support and issue resolution', '🛠️', 
 'You are a customer support specialist for {business_name}. Provide detailed, patient assistance.',
 '{"speed": 0.9, "pitch": 0.9, "tone": "calm", "voice_id": "default"}')

ON CONFLICT (type_code) DO NOTHING;

-- Insert supported languages
INSERT INTO supported_languages (code, name, native_name, is_default, voice_settings) VALUES 
('en', 'English', 'English', true, '{"accent": "american", "gender": "neutral"}'),
('es', 'Spanish', 'Español', false, '{"accent": "neutral", "gender": "neutral"}'),
('zh-CN', 'Chinese (Simplified)', '简体中文', false, '{"accent": "mainland", "gender": "neutral"}'),
('it', 'Italian', 'Italiano', false, '{"accent": "standard", "gender": "neutral"}')

ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Agents table indexes
CREATE INDEX IF NOT EXISTS idx_ai_agents_client_id ON ai_agents(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_type_language ON ai_agents(agent_type_id, language_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_parent ON ai_agents(parent_agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_retell_id ON ai_agents(retell_agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);

-- Call logs indexes
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_agent_id ON ai_call_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_client_id ON ai_call_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_started_at ON ai_call_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_call_status ON ai_call_logs(call_status);
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_detected_language ON ai_call_logs(detected_language);

-- Metrics indexes
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_date ON agent_metrics(agent_id, date);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_date ON agent_metrics(date);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_ai_agents_name_search ON ai_agents USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_agent_templates_search ON agent_templates USING gin((name || ' ' || description) gin_trgm_ops);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Users can view their own client data" ON clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own client data" ON clients
  FOR UPDATE USING (user_id = auth.uid());

-- AI Agents policies
CREATE POLICY "Users can view their own agents" ON ai_agents
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND (role = 'admin' OR is_super_admin = true))
  );

CREATE POLICY "Users can manage their own agents" ON ai_agents
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND (role = 'admin' OR is_super_admin = true))
  );

-- Agent configurations policies
CREATE POLICY "Users can view their agent configurations" ON agent_configurations
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM ai_agents WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND (role = 'admin' OR is_super_admin = true))
  );

CREATE POLICY "Users can manage their agent configurations" ON agent_configurations
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM ai_agents WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND (role = 'admin' OR is_super_admin = true))
  );

-- Call logs policies
CREATE POLICY "Users can view their call logs" ON ai_call_logs
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND (role = 'admin' OR is_super_admin = true))
  );

-- Allow service role to manage call logs (for webhooks)
CREATE POLICY "Service role can manage call logs" ON ai_call_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Agent metrics policies (similar to call logs)
CREATE POLICY "Users can view their agent metrics" ON agent_metrics
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM ai_agents WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND (role = 'admin' OR is_super_admin = true))
  );

-- Templates policies (public templates viewable by all)
CREATE POLICY "Users can view public templates" ON agent_templates
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can manage their own templates" ON agent_templates
  FOR ALL USING (created_by = auth.uid());

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_configurations_updated_at BEFORE UPDATE ON agent_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_translations_updated_at BEFORE UPDATE ON agent_translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_call_logs_updated_at BEFORE UPDATE ON ai_call_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_templates_updated_at BEFORE UPDATE ON agent_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get agent with full configuration
CREATE OR REPLACE FUNCTION get_agent_full_config(agent_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'agent', json_build_object(
            'id', a.id,
            'name', a.name,
            'description', a.description,
            'status', a.status,
            'personality', a.personality,
            'voice_settings', a.voice_settings,
            'business_context', a.business_context,
            'greeting_message', a.greeting_message,
            'prompt_template', a.prompt_template,
            'variables', a.variables,
            'integrations', a.integrations,
            'retell_agent_id', a.retell_agent_id,
            'retell_phone_number', a.retell_phone_number
        ),
        'agent_type', json_build_object(
            'code', at.type_code,
            'name', at.name,
            'description', at.description,
            'icon', at.icon
        ),
        'language', json_build_object(
            'code', sl.code,
            'name', sl.name,
            'native_name', sl.native_name
        ),
        'configuration', row_to_json(ac.*),
        'parent_agent', CASE 
            WHEN a.parent_agent_id IS NOT NULL THEN 
                json_build_object('id', pa.id, 'name', pa.name, 'language', psl.code)
            ELSE NULL 
        END,
        'translations', COALESCE(
            json_agg(
                json_build_object(
                    'id', ta.id,
                    'name', ta.name,
                    'language', tsl.code,
                    'language_name', tsl.name,
                    'status', ta.status
                )
            ) FILTER (WHERE ta.id IS NOT NULL),
            '[]'::json
        )
    ) INTO result
    FROM ai_agents a
    JOIN agent_types at ON a.agent_type_id = at.id
    JOIN supported_languages sl ON a.language_id = sl.id
    LEFT JOIN agent_configurations ac ON a.id = ac.agent_id
    LEFT JOIN ai_agents pa ON a.parent_agent_id = pa.id
    LEFT JOIN supported_languages psl ON pa.language_id = psl.id
    LEFT JOIN ai_agents ta ON ta.parent_agent_id = a.id
    LEFT JOIN supported_languages tsl ON ta.language_id = tsl.id
    WHERE a.id = agent_uuid
    GROUP BY a.id, at.id, sl.id, ac.id, pa.id, psl.id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get client agent overview
CREATE OR REPLACE FUNCTION get_client_agent_overview(client_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'client_id', client_uuid,
        'agent_summary', json_build_object(
            'total_agents', COUNT(a.id),
            'active_agents', COUNT(CASE WHEN a.status = 'active' THEN 1 END),
            'draft_agents', COUNT(CASE WHEN a.status = 'draft' THEN 1 END),
            'inactive_agents', COUNT(CASE WHEN a.status = 'inactive' THEN 1 END)
        ),
        'agents_by_type', json_object_agg(
            at.name,
            json_build_object(
                'count', type_counts.count,
                'languages', type_counts.languages
            )
        ),
        'recent_activity', (
            SELECT json_agg(
                json_build_object(
                    'call_id', cl.call_id,
                    'agent_name', ag.name,
                    'started_at', cl.started_at,
                    'duration', cl.duration,
                    'status', cl.call_status
                )
            )
            FROM ai_call_logs cl
            JOIN ai_agents ag ON cl.agent_id = ag.id
            WHERE cl.client_id = client_uuid
            ORDER BY cl.started_at DESC
            LIMIT 10
        )
    ) INTO result
    FROM ai_agents a
    JOIN agent_types at ON a.agent_type_id = at.id
    JOIN (
        SELECT 
            a2.agent_type_id,
            COUNT(*) as count,
            json_agg(DISTINCT sl.code) as languages
        FROM ai_agents a2
        JOIN supported_languages sl ON a2.language_id = sl.id
        WHERE a2.client_id = client_uuid
        GROUP BY a2.agent_type_id
    ) type_counts ON at.id = type_counts.agent_type_id
    WHERE a.client_id = client_uuid
    GROUP BY client_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;