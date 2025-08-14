-- Fix agent_configurations_scoped table structure
-- This script ensures all required fields exist for call scripts functionality

-- First, check if the table exists and what fields are missing
-- You can run: \d agent_configurations_scoped in psql to see current structure

-- OPTION 1: Complete table recreation (Recommended if you can lose existing data)
-- Uncomment the section below if you want to recreate the table completely

/*
-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS public.agent_configurations_scoped CASCADE;

-- Create agent_configurations_scoped table with correct structure
CREATE TABLE public.agent_configurations_scoped (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    agent_type_id UUID REFERENCES public.agent_types(id) ON DELETE CASCADE,
    agent_name VARCHAR(255) NOT NULL,
    
    -- Basic information fields
    greeting_message TEXT,
    custom_instructions TEXT,
    basic_info_prompt TEXT,
    agent_personality VARCHAR(50) DEFAULT 'professional',
    
    -- Advanced prompt fields (REQUIRED FOR CALL SCRIPTS)
    call_scripts_prompt TEXT,
    
    -- Configuration JSON fields (REQUIRED FOR CALL SCRIPTS)
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
*/

-- OPTION 2: Add missing fields only (Use this if you want to preserve existing data)
-- Check which fields are missing first, then add them

-- Add call_scripts_prompt field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_configurations_scoped' 
        AND column_name = 'call_scripts_prompt'
    ) THEN
        ALTER TABLE public.agent_configurations_scoped 
        ADD COLUMN call_scripts_prompt TEXT;
        
        RAISE NOTICE 'Added call_scripts_prompt column';
    ELSE
        RAISE NOTICE 'call_scripts_prompt column already exists';
    END IF;
END $$;

-- Add call_scripts field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_configurations_scoped' 
        AND column_name = 'call_scripts'
    ) THEN
        ALTER TABLE public.agent_configurations_scoped 
        ADD COLUMN call_scripts JSONB DEFAULT '{}';
        
        RAISE NOTICE 'Added call_scripts column';
    ELSE
        RAISE NOTICE 'call_scripts column already exists';
    END IF;
END $$;

-- Add voice_settings field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_configurations_scoped' 
        AND column_name = 'voice_settings'
    ) THEN
        ALTER TABLE public.agent_configurations_scoped 
        ADD COLUMN voice_settings JSONB DEFAULT '{}';
        
        RAISE NOTICE 'Added voice_settings column';
    ELSE
        RAISE NOTICE 'voice_settings column already exists';
    END IF;
END $$;

-- Add call_routing field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_configurations_scoped' 
        AND column_name = 'call_routing'
    ) THEN
        ALTER TABLE public.agent_configurations_scoped 
        ADD COLUMN call_routing JSONB DEFAULT '{}';
        
        RAISE NOTICE 'Added call_routing column';
    ELSE
        RAISE NOTICE 'call_routing column already exists';
    END IF;
END $$;

-- Add custom_settings field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_configurations_scoped' 
        AND column_name = 'custom_settings'
    ) THEN
        ALTER TABLE public.agent_configurations_scoped 
        ADD COLUMN custom_settings JSONB DEFAULT '{}';
        
        RAISE NOTICE 'Added custom_settings column';
    ELSE
        RAISE NOTICE 'custom_settings column already exists';
    END IF;
END $$;

-- Add basic_info_prompt field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_configurations_scoped' 
        AND column_name = 'basic_info_prompt'
    ) THEN
        ALTER TABLE public.agent_configurations_scoped 
        ADD COLUMN basic_info_prompt TEXT;
        
        RAISE NOTICE 'Added basic_info_prompt column';
    ELSE
        RAISE NOTICE 'basic_info_prompt column already exists';
    END IF;
END $$;

-- Add agent_personality field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_configurations_scoped' 
        AND column_name = 'agent_personality'
    ) THEN
        ALTER TABLE public.agent_configurations_scoped 
        ADD COLUMN agent_personality VARCHAR(50) DEFAULT 'professional';
        
        RAISE NOTICE 'Added agent_personality column';
    ELSE
        RAISE NOTICE 'agent_personality column already exists';
    END IF;
END $$;

-- Add custom_instructions field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_configurations_scoped' 
        AND column_name = 'custom_instructions'
    ) THEN
        ALTER TABLE public.agent_configurations_scoped 
        ADD COLUMN custom_instructions TEXT;
        
        RAISE NOTICE 'Added custom_instructions column';
    ELSE
        RAISE NOTICE 'custom_instructions column already exists';
    END IF;
END $$;

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agent_configurations_scoped'
ORDER BY ordinal_position;