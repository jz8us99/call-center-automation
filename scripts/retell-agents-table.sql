-- Manual SQL script to create retell_agents table
-- Run this in your Supabase SQL Editor if the automated scripts fail

-- Drop existing table if it exists (optional - only if you want to start fresh)
-- DROP TABLE IF EXISTS retell_agents CASCADE;

-- Create the retell_agents table
CREATE TABLE IF NOT EXISTS retell_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  retell_agent_id TEXT NOT NULL UNIQUE,
  agent_name TEXT NOT NULL,
  ai_agent_id TEXT,
  status TEXT DEFAULT 'deployed',
  conversation_flow_id TEXT,
  response_engine_type TEXT,
  retell_llm_id TEXT,
  voice_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_retell_agents_business_id ON retell_agents(business_id);
CREATE INDEX IF NOT EXISTS idx_retell_agents_retell_agent_id ON retell_agents(retell_agent_id);
CREATE INDEX IF NOT EXISTS idx_retell_agents_status ON retell_agents(status);
CREATE INDEX IF NOT EXISTS idx_retell_agents_agent_type ON retell_agents(agent_type);

-- Enable Row Level Security
ALTER TABLE retell_agents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "service_role_all_retell_agents" ON retell_agents;
DROP POLICY IF EXISTS "users_retell_agents_policy" ON retell_agents;

-- Create policy for service role (full access)
CREATE POLICY "service_role_all_retell_agents" ON retell_agents
  FOR ALL 
  TO service_role
  USING (true) 
  WITH CHECK (true);

-- Create policy for authenticated users 
CREATE POLICY "users_retell_agents_policy" ON retell_agents
  FOR ALL 
  TO authenticated
  USING (true) 
  WITH CHECK (true);

-- Create policy for anonymous users (read-only if needed)
CREATE POLICY "anon_read_retell_agents" ON retell_agents
  FOR SELECT 
  TO anon
  USING (true);

-- Test insert to verify table works
INSERT INTO retell_agents (
  business_id,
  agent_type,
  retell_agent_id,
  agent_name,
  status,
  response_engine_type,
  voice_settings
) VALUES (
  'test-business-' || extract(epoch from now()),
  'test',
  'test-agent-' || extract(epoch from now()),
  'SQL Test Agent',
  'deployed',
  'retell-llm',
  '{"voice_id": "test-voice", "speed": 1.28}'::jsonb
);

-- Verify the test record was inserted
SELECT 
  id,
  business_id,
  agent_type,
  retell_agent_id,
  agent_name,
  status,
  created_at
FROM retell_agents 
WHERE agent_name = 'SQL Test Agent'
LIMIT 1;

-- Clean up test record (optional)
DELETE FROM retell_agents WHERE agent_name = 'SQL Test Agent';

-- Show final table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'retell_agents' 
ORDER BY ordinal_position;