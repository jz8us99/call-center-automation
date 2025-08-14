-- Retell Agent Deployments
CREATE TABLE IF NOT EXISTS retell_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  agent_type VARCHAR(50) NOT NULL, -- 'router', 'receptionist', 'support'
  retell_agent_id VARCHAR(255) NOT NULL UNIQUE,
  agent_name VARCHAR(255),
  ai_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'deployed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(business_id, agent_type)
);

-- Agent Deployment History
CREATE TABLE IF NOT EXISTS agent_deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  deployment_type VARCHAR(50) NOT NULL, -- 'retell', 'twilio', etc.
  agents_deployed INT DEFAULT 0,
  agent_ids JSONB,
  status VARCHAR(50) DEFAULT 'active',
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deployed_by UUID REFERENCES profiles(id)
);

-- Phone Number Assignments
CREATE TABLE IF NOT EXISTS phone_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  phone_number VARCHAR(50) NOT NULL,
  retell_agent_id VARCHAR(255),
  type VARCHAR(50) DEFAULT 'inbound', -- 'inbound', 'outbound'
  status VARCHAR(50) DEFAULT 'active',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(phone_number)
);

-- Customer Records
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  notes TEXT,
  tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES profiles(id),
  UNIQUE(business_id, phone)
);

-- Appointments Table (Enhanced)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  job_type VARCHAR(255),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'cancelled', 'completed', 'no-show'
  source VARCHAR(50) DEFAULT 'retell', -- 'retell', 'web', 'manual', 'phone'
  notes TEXT,
  confirmation_sent BOOLEAN DEFAULT FALSE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  calendar_event_id VARCHAR(255), -- External calendar event ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES profiles(id),
  CONSTRAINT valid_appointment_times CHECK (ends_at > starts_at)
);

-- Staff Calendar Integrations
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS calendar_provider VARCHAR(50);
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS provider_account_id VARCHAR(255);
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS oauth_tokens JSONB; -- Encrypted OAuth tokens
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP WITH TIME ZONE;

-- Availability Cache (for performance)
CREATE TABLE IF NOT EXISTS availability_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
  slot_end TIMESTAMP WITH TIME ZONE NOT NULL,
  job_type VARCHAR(255),
  available BOOLEAN DEFAULT TRUE,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(staff_id, slot_start, slot_end)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON appointments(starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_availability_cache_staff_id ON availability_cache(staff_id);
CREATE INDEX IF NOT EXISTS idx_availability_cache_slot_start ON availability_cache(slot_start);

-- Row Level Security Policies
ALTER TABLE retell_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for retell_agents
CREATE POLICY "Users can view their own retell agents"
  ON retell_agents FOR SELECT
  USING (business_id = auth.uid());

CREATE POLICY "Users can manage their own retell agents"
  ON retell_agents FOR ALL
  USING (business_id = auth.uid());

-- RLS Policies for customers
CREATE POLICY "Users can view their own customers"
  ON customers FOR SELECT
  USING (business_id = auth.uid());

CREATE POLICY "Users can manage their own customers"
  ON customers FOR ALL
  USING (business_id = auth.uid());

-- RLS Policies for appointments
CREATE POLICY "Users can view their own appointments"
  ON appointments FOR SELECT
  USING (business_id = auth.uid());

CREATE POLICY "Users can manage their own appointments"
  ON appointments FOR ALL
  USING (business_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_retell_agents_updated_at BEFORE UPDATE ON retell_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();