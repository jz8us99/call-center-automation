-- Create agent_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.agent_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Handle everything in one transaction to ensure column additions are visible
DO $$ 
BEGIN
    -- Add missing columns to existing agent_types table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_types' AND column_name = 'updated_at') THEN
        ALTER TABLE public.agent_types ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_types' AND column_name = 'created_at') THEN
        ALTER TABLE public.agent_types ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_types' AND column_name = 'is_active') THEN
        ALTER TABLE public.agent_types ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_types' AND column_name = 'icon') THEN
        ALTER TABLE public.agent_types ADD COLUMN icon VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_types' AND column_name = 'description') THEN
        ALTER TABLE public.agent_types ADD COLUMN description TEXT;
    END IF;

    -- Now insert/update the agent types (all columns should exist now)
    INSERT INTO public.agent_types (type_code, name, description, icon, is_active) 
    VALUES 
        ('inbound_receptionist', 'Inbound Receptionist', 'Professional phone receptionist handling incoming calls, routing, and scheduling', '📞', true),
        ('inbound_customer_support', 'Inbound Customer Support', 'Dedicated support agent for handling customer issues, complaints, and technical assistance', '🛠️', true),
        ('outbound_follow_up', 'Outbound Follow-up', 'Follow-up agent for appointment confirmations, reminders, and post-service check-ins', '📅', true),
        ('outbound_marketing', 'Outbound Marketing', 'Marketing agent for lead generation, sales calls, and promotional campaigns', '📈', true)
    ON CONFLICT (type_code) 
    DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        is_active = EXCLUDED.is_active,
        updated_at = TIMEZONE('utc', NOW());
        
END $$;

-- Create agent_configurations_scoped table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.agent_configurations_scoped (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    agent_type_id UUID REFERENCES public.agent_types(id) ON DELETE CASCADE,
    agent_name VARCHAR(255) NOT NULL,
    
    -- Prompt fields
    basic_info_prompt TEXT,
    call_scripts_prompt TEXT,
    greeting_message TEXT,
    custom_instructions TEXT,
    agent_personality VARCHAR(50) DEFAULT 'professional',
    
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
CREATE INDEX IF NOT EXISTS idx_agent_configurations_client_id ON public.agent_configurations_scoped(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_configurations_agent_type_id ON public.agent_configurations_scoped(agent_type_id);
CREATE INDEX IF NOT EXISTS idx_agent_configurations_active ON public.agent_configurations_scoped(is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for agent_types
DROP TRIGGER IF EXISTS update_agent_types_updated_at ON public.agent_types;
CREATE TRIGGER update_agent_types_updated_at 
    BEFORE UPDATE ON public.agent_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for agent_configurations_scoped
DROP TRIGGER IF EXISTS update_agent_configurations_updated_at ON public.agent_configurations_scoped;
CREATE TRIGGER update_agent_configurations_updated_at 
    BEFORE UPDATE ON public.agent_configurations_scoped 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your RLS policies)
GRANT ALL ON public.agent_types TO authenticated;
GRANT ALL ON public.agent_configurations_scoped TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.agent_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_configurations_scoped ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agent_types (everyone can read)
CREATE POLICY "Allow read access to agent_types" ON public.agent_types
    FOR SELECT
    TO authenticated
    USING (true);

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