-- Essential AI Agent Management Schema
-- Simplified version without problematic template inserts

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Clients table (enhanced for comprehensive business information)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR NOT NULL,
  business_type VARCHAR,
  business_address TEXT,
  contact_email VARCHAR,
  contact_phone VARCHAR,
  business_website VARCHAR,
  timezone VARCHAR DEFAULT 'America/New_York',
  
  -- Contact person information
  contact_person_name VARCHAR,
  contact_person_role VARCHAR,
  contact_person_phone VARCHAR,
  contact_person_email VARCHAR,
  
  -- Comprehensive business information for AI agent training
  support_content TEXT, -- This will store JSON with all comprehensive data
  
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

-- Business types definition
CREATE TABLE IF NOT EXISTS business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  call_scripts JSONB DEFAULT '{}',
  voice_settings JSONB DEFAULT '{}',
  call_routing JSONB DEFAULT '{}',
  
  -- Metadata
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(agent_type_id, name)
);

-- Business type agent template mapping
CREATE TABLE IF NOT EXISTS business_type_agent_template_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID REFERENCES business_types(id) ON DELETE CASCADE,
  agent_type_id UUID REFERENCES agent_types(id) ON DELETE CASCADE,
  template_id UUID REFERENCES agent_templates(id) ON DELETE CASCADE,
  
  -- Additional metadata
  is_default BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(business_type_id, agent_type_id)
);

-- Agent configurations persistence (scoped by business_id + agent_type_id)
CREATE TABLE IF NOT EXISTS agent_configurations_scoped (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  agent_type_id UUID REFERENCES agent_types(id) ON DELETE CASCADE,
  
  -- Configuration data
  call_scripts JSONB DEFAULT '{}',
  voice_settings JSONB DEFAULT '{}',
  call_routing JSONB DEFAULT '{}',
  custom_settings JSONB DEFAULT '{}',
  
  -- Template reference
  based_on_template_id UUID REFERENCES agent_templates(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(client_id, agent_type_id)
);

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

-- Insert business types
INSERT INTO business_types (type_code, name, description, category, icon) VALUES 
('clinic', 'Medical Clinic', 'General medical practice and healthcare services', 'healthcare', '🏥'),
('dental', 'Dental Office', 'Dental care and oral health services', 'healthcare', '🦷'),
('veterinary', 'Veterinary Clinic', 'Animal care and veterinary services', 'healthcare', '🐾'),
('therapy', 'Therapy Practice', 'Mental health and counseling services', 'healthcare', '🧠'),
('wellness', 'Wellness Center', 'Holistic health and wellness services', 'healthcare', '🌿'),
('gardener', 'Gardener', 'Landscaping and garden maintenance services', 'services', '🌱'),
('handyman', 'Handyman', 'Home repair and maintenance services', 'services', '🔧'),
('beauty_salon', 'Beauty Salon', 'Hair, beauty, and styling services', 'services', '💇'),
('daycare', 'Daycare', 'Childcare and early education services', 'services', '👶'),
('tutors', 'Tutors', 'Educational and tutoring services', 'education', '📚'),
('law_office', 'Law Office', 'Legal services and consultation', 'professional', '⚖️'),
('real_estate', 'Real Estate', 'Property sales and rental services', 'professional', '🏠'),
('notary', 'Notary', 'Notarization and document services', 'professional', '📋'),
('repair_shop', 'Repair Shop', 'Equipment and device repair services', 'services', '🔨'),
('financial_advisor', 'Financial Advisor', 'Financial planning and investment services', 'professional', '💰'),
('hvac_contractor', 'HVAC Contractor', 'Heating, ventilation, and air conditioning services', 'services', '🏠'),
('other', 'Other', 'Other business types', 'general', '🏢')

ON CONFLICT (type_code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_business_types_code ON business_types(type_code);
CREATE INDEX IF NOT EXISTS idx_agent_types_code ON agent_types(type_code);
CREATE INDEX IF NOT EXISTS idx_agent_configurations_scoped_client ON agent_configurations_scoped(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_configurations_scoped_agent_type ON agent_configurations_scoped(agent_type_id);

-- Enable RLS on tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configurations_scoped ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Users can view their own client data" ON clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own client data" ON clients
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own client data" ON clients
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Templates policies (public templates viewable by all)
CREATE POLICY "Users can view public templates" ON agent_templates
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can manage their own templates" ON agent_templates
  FOR ALL USING (created_by = auth.uid());

-- Agent configurations scoped policies
CREATE POLICY "Users can view their scoped configurations" ON agent_configurations_scoped
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage their scoped configurations" ON agent_configurations_scoped
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

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

CREATE TRIGGER update_agent_templates_updated_at BEFORE UPDATE ON agent_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_configurations_scoped_updated_at BEFORE UPDATE ON agent_configurations_scoped
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();