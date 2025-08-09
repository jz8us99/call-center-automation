-- Fix the agent_configurations_scoped table structure
-- Run this in Supabase SQL Editor

-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS public.agent_configurations_scoped CASCADE;

-- Create agent_configurations_scoped table with correct structure
CREATE TABLE public.agent_configurations_scoped (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    agent_type_id UUID REFERENCES public.agent_types(id) ON DELETE CASCADE,
    agent_name VARCHAR(255) NOT NULL,
    
    -- Basic information fields (THIS IS WHAT WAS MISSING!)
    greeting_message TEXT,
    custom_instructions TEXT,
    basic_info_prompt TEXT,
    agent_personality VARCHAR(50) DEFAULT 'professional',
    
    -- Advanced prompt fields
    call_scripts_prompt TEXT,
    
    -- Configuration JSON fields
    call_scripts JSONB DEFAULT '{}',
    voice_settings JSONB DEFAULT '{}',
    call_routing JSONB DEFAULT '{}',
    custom_settings JSONB DEFAULT '{}',
    
    -- Template reference
    based_on_template_id UUID,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Unique constraint for one configuration per client per agent type
    UNIQUE(client_id, agent_type_id)
);

-- Create indexes for better performance
CREATE INDEX idx_agent_configurations_client_id ON public.agent_configurations_scoped(client_id);
CREATE INDEX idx_agent_configurations_agent_type_id ON public.agent_configurations_scoped(agent_type_id);
CREATE INDEX idx_agent_configurations_active ON public.agent_configurations_scoped(is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for agent_configurations_scoped
CREATE TRIGGER update_agent_configurations_updated_at 
    BEFORE UPDATE ON public.agent_configurations_scoped 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.agent_configurations_scoped TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.agent_configurations_scoped ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agent_configurations_scoped
CREATE POLICY "Users can view their own agent configurations" ON public.agent_configurations_scoped
    FOR SELECT
    TO authenticated
    USING (
        client_id IN (
            SELECT id FROM public.business_profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own agent configurations" ON public.agent_configurations_scoped
    FOR INSERT
    TO authenticated
    WITH CHECK (
        client_id IN (
            SELECT id FROM public.business_profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own agent configurations" ON public.agent_configurations_scoped
    FOR UPDATE
    TO authenticated
    USING (
        client_id IN (
            SELECT id FROM public.business_profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own agent configurations" ON public.agent_configurations_scoped
    FOR DELETE
    TO authenticated
    USING (
        client_id IN (
            SELECT id FROM public.business_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Test insert to verify everything works
INSERT INTO public.agent_configurations_scoped (
    client_id,
    agent_type_id, 
    agent_name,
    greeting_message,
    custom_instructions,
    basic_info_prompt,
    agent_personality
) VALUES (
    (SELECT id FROM public.business_profiles LIMIT 1),
    (SELECT id FROM public.agent_types WHERE type_code = 'inbound_receptionist' LIMIT 1),
    'Test Receptionist Agent',
    'Hello! Welcome to our business. How can I help you today?',
    'Always be professional, friendly, and helpful. Ask for the caller''s name and the reason for their call.',
    'You are a professional receptionist for our business. Handle all incoming calls with warmth and efficiency.',
    'professional'
) ON CONFLICT (client_id, agent_type_id) 
DO UPDATE SET
    agent_name = EXCLUDED.agent_name,
    greeting_message = EXCLUDED.greeting_message,
    custom_instructions = EXCLUDED.custom_instructions,
    basic_info_prompt = EXCLUDED.basic_info_prompt,
    agent_personality = EXCLUDED.agent_personality,
    updated_at = TIMEZONE('utc', NOW());

-- Verify the test insert worked
SELECT 
    ac.*,
    at.type_code,
    at.name as agent_type_name
FROM public.agent_configurations_scoped ac
JOIN public.agent_types at ON ac.agent_type_id = at.id
LIMIT 5;