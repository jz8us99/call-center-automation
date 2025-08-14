-- Add conversation flow and additional agent fields to retell_agents table

-- Add conversation_flow_id field
ALTER TABLE retell_agents 
ADD COLUMN IF NOT EXISTS conversation_flow_id TEXT;

-- Add response_engine_type field
ALTER TABLE retell_agents 
ADD COLUMN IF NOT EXISTS response_engine_type TEXT DEFAULT 'retell-llm';

-- Add voice_settings field for storing voice configuration
ALTER TABLE retell_agents 
ADD COLUMN IF NOT EXISTS voice_settings JSONB;

-- Create test_calls table for tracking test calls
CREATE TABLE IF NOT EXISTS test_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    retell_agent_id TEXT NOT NULL,
    retell_call_id TEXT NOT NULL,
    from_number TEXT,
    to_number TEXT,
    status TEXT DEFAULT 'created',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for test_calls
ALTER TABLE test_calls ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own test calls
CREATE POLICY "Users can view their own test calls" ON test_calls
    FOR SELECT USING (business_id = auth.uid());

-- Policy for users to insert their own test calls
CREATE POLICY "Users can insert their own test calls" ON test_calls
    FOR INSERT WITH CHECK (business_id = auth.uid());

-- Policy for users to update their own test calls
CREATE POLICY "Users can update their own test calls" ON test_calls
    FOR UPDATE USING (business_id = auth.uid());

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_retell_agents_conversation_flow_id ON retell_agents(conversation_flow_id);
CREATE INDEX IF NOT EXISTS idx_retell_agents_response_engine_type ON retell_agents(response_engine_type);
CREATE INDEX IF NOT EXISTS idx_test_calls_business_id ON test_calls(business_id);
CREATE INDEX IF NOT EXISTS idx_test_calls_retell_agent_id ON test_calls(retell_agent_id);
CREATE INDEX IF NOT EXISTS idx_test_calls_retell_call_id ON test_calls(retell_call_id);

-- Add updated_at trigger for test_calls
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_test_calls_updated_at 
    BEFORE UPDATE ON test_calls 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();