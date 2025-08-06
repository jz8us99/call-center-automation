-- Missing Tables Fix for Call Center Automation
-- This adds tables that the application expects but are missing from the schema

-- Create profiles table if it doesn't exist (referenced in RLS policies and auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR,
  full_name VARCHAR,
  phone_number VARCHAR,
  role VARCHAR DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  pricing_tier VARCHAR DEFAULT 'basic',
  agent_types_allowed JSONB DEFAULT '["inbound_call"]',
  business_name VARCHAR,
  business_type VARCHAR,
  is_super_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_call_logs table (expected by API routes)
CREATE TABLE IF NOT EXISTS customer_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id VARCHAR,
  call_id VARCHAR,
  call_type VARCHAR,
  phone_number VARCHAR,
  caller_name VARCHAR,
  duration_seconds INTEGER,
  start_timestamp TIMESTAMP WITH TIME ZONE,
  end_timestamp TIMESTAMP WITH TIME ZONE,
  transcript TEXT,
  recording_url VARCHAR,
  status VARCHAR,
  disconnection_reason VARCHAR,
  call_cost DECIMAL(10,4),
  call_analysis JSONB DEFAULT '{}',
  custom_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_configs table (referenced in webhook handlers)
CREATE TABLE IF NOT EXISTS agent_configs (
  agent_id VARCHAR PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  config_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_customer_call_logs_user_id ON customer_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_call_logs_agent_id ON customer_call_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_customer_call_logs_call_id ON customer_call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_customer_call_logs_start_timestamp ON customer_call_logs(start_timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_configs_user_id ON agent_configs(user_id);

-- Enable RLS on new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR is_super_admin = true)
    )
  );

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR is_super_admin = true)
    )
  );

-- RLS Policies for customer_call_logs
CREATE POLICY "Users can view own call logs" ON customer_call_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own call logs" ON customer_call_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own call logs" ON customer_call_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all call logs" ON customer_call_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR is_super_admin = true)
    )
  );

-- RLS Policies for agent_configs
CREATE POLICY "Users can view own agent configs" ON agent_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own agent configs" ON agent_configs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all agent configs" ON agent_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR is_super_admin = true)
    )
  );

-- Update trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_call_logs_updated_at BEFORE UPDATE ON customer_call_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_configs_updated_at BEFORE UPDATE ON agent_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();