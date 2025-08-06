-- Database schema for Call Center Configuration Feature Enhancement
-- Run this in your Supabase SQL editor

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  retell_agent_id VARCHAR NOT NULL UNIQUE,
  agent_name VARCHAR NOT NULL,
  webhook_url VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'error')),
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_knowledge table
CREATE TABLE IF NOT EXISTS business_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  content_type VARCHAR NOT NULL CHECK (content_type IN ('pricing', 'policy', 'hours')),
  content_text TEXT NOT NULL,
  source_type VARCHAR NOT NULL CHECK (source_type IN ('upload', 'website')),
  source_reference VARCHAR,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call_logs table (enhanced version)
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id VARCHAR NOT NULL UNIQUE,
  agent_id UUID REFERENCES agents(id),
  client_id UUID NOT NULL,
  phone_number VARCHAR,
  call_status VARCHAR DEFAULT 'started' CHECK (call_status IN ('started', 'ended', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  transcript TEXT,
  call_summary TEXT,
  call_analysis JSONB,
  sentiment_score DECIMAL(3,2),
  keywords TEXT[],
  action_items TEXT[],
  retell_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_configurations table for detailed settings
CREATE TABLE IF NOT EXISTS agent_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  business_name VARCHAR NOT NULL,
  business_type VARCHAR NOT NULL,
  business_address TEXT,
  business_phone VARCHAR,
  business_email VARCHAR,
  business_website VARCHAR,
  timezone VARCHAR DEFAULT 'America/New_York',
  agent_personality VARCHAR DEFAULT 'professional' CHECK (agent_personality IN ('professional', 'friendly', 'technical')),
  greeting_message TEXT,
  voice_settings JSONB DEFAULT '{"speed": 1.0, "pitch": 1.0, "tone": "professional"}',
  custom_prompt TEXT,
  contact_person JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_notifications table for tracking admin notifications
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type VARCHAR NOT NULL,
  recipient_email VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_client_id ON agents(client_id);
CREATE INDEX IF NOT EXISTS idx_agents_retell_agent_id ON agents(retell_agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

CREATE INDEX IF NOT EXISTS idx_business_knowledge_client_id ON business_knowledge(client_id);
CREATE INDEX IF NOT EXISTS idx_business_knowledge_content_type ON business_knowledge(content_type);
CREATE INDEX IF NOT EXISTS idx_business_knowledge_source_type ON business_knowledge(source_type);

CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_id ON call_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_client_id ON call_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON call_logs(started_at);

CREATE INDEX IF NOT EXISTS idx_agent_configurations_agent_id ON agent_configurations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_configurations_client_id ON agent_configurations(client_id);

CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at);

-- Create RLS (Row Level Security) policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agents table
CREATE POLICY "Users can view their own agents" ON agents
  FOR SELECT USING (
    client_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.is_super_admin = true)
    )
  );

CREATE POLICY "Users can insert their own agents" ON agents
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own agents" ON agents
  FOR UPDATE USING (
    client_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.is_super_admin = true)
    )
  );

-- RLS Policies for business_knowledge table
CREATE POLICY "Users can view their own business knowledge" ON business_knowledge
  FOR SELECT USING (
    client_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.is_super_admin = true)
    )
  );

CREATE POLICY "Users can insert their own business knowledge" ON business_knowledge
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own business knowledge" ON business_knowledge
  FOR UPDATE USING (client_id = auth.uid());

CREATE POLICY "Users can delete their own business knowledge" ON business_knowledge
  FOR DELETE USING (client_id = auth.uid());

-- RLS Policies for call_logs table
CREATE POLICY "Users can view their own call logs" ON call_logs
  FOR SELECT USING (
    client_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.is_super_admin = true)
    )
  );

-- Allow webhook access to call_logs (service role)
CREATE POLICY "Service role can manage call logs" ON call_logs
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for agent_configurations table
CREATE POLICY "Users can view their own agent configurations" ON agent_configurations
  FOR SELECT USING (
    client_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.is_super_admin = true)
    )
  );

CREATE POLICY "Users can insert their own agent configurations" ON agent_configurations
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own agent configurations" ON agent_configurations
  FOR UPDATE USING (client_id = auth.uid());

-- RLS Policies for email_notifications table (admin only)
CREATE POLICY "Admins can view all email notifications" ON email_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.is_super_admin = true)
    )
  );

-- Allow service role to manage email notifications
CREATE POLICY "Service role can manage email notifications" ON email_notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_knowledge_updated_at BEFORE UPDATE ON business_knowledge
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_logs_updated_at BEFORE UPDATE ON call_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_configurations_updated_at BEFORE UPDATE ON agent_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get agent configuration with business knowledge
CREATE OR REPLACE FUNCTION get_agent_configuration_with_knowledge(agent_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'agent', row_to_json(a.*),
        'configuration', row_to_json(ac.*),
        'business_knowledge', COALESCE(
            json_agg(
                json_build_object(
                    'id', bk.id,
                    'content_type', bk.content_type,
                    'content_text', bk.content_text,
                    'source_type', bk.source_type,
                    'source_reference', bk.source_reference,
                    'created_at', bk.created_at
                )
            ) FILTER (WHERE bk.id IS NOT NULL),
            '[]'::json
        )
    ) INTO result
    FROM agents a
    LEFT JOIN agent_configurations ac ON a.id = ac.agent_id
    LEFT JOIN business_knowledge bk ON a.client_id = bk.client_id
    WHERE a.id = agent_uuid
    GROUP BY a.id, ac.id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;