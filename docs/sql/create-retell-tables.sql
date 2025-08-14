-- Create tables needed for Retell deployment functionality
-- Run this script to add the missing tables

-- 1. Create retell_agents table
CREATE TABLE IF NOT EXISTS public.retell_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL,
    agent_type VARCHAR(50) NOT NULL, -- 'router', 'receptionist', 'support'
    retell_agent_id VARCHAR(255) NOT NULL UNIQUE,
    agent_name VARCHAR(255) NOT NULL,
    ai_agent_id UUID, -- Reference to agent_configurations_scoped.id
    status VARCHAR(20) DEFAULT 'deployed' CHECK (status IN ('deployed', 'active', 'inactive', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(business_id, agent_type),
    
    -- Foreign key to business profiles
    CONSTRAINT retell_agents_business_id_fkey 
    FOREIGN KEY (business_id) REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    
    -- Foreign key to agent configurations
    CONSTRAINT retell_agents_ai_agent_id_fkey 
    FOREIGN KEY (ai_agent_id) REFERENCES public.agent_configurations_scoped(id) ON DELETE SET NULL
);

-- 2. Create agent_deployments table
CREATE TABLE IF NOT EXISTS public.agent_deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL,
    deployment_type VARCHAR(50) NOT NULL DEFAULT 'retell',
    agents_deployed INTEGER NOT NULL DEFAULT 0,
    agent_ids TEXT[] DEFAULT '{}', -- Array of retell agent IDs
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'failed')),
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key to business profiles
    CONSTRAINT agent_deployments_business_id_fkey 
    FOREIGN KEY (business_id) REFERENCES public.business_profiles(id) ON DELETE CASCADE
);

-- 3. Create phone_assignments table
CREATE TABLE IF NOT EXISTS public.phone_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    retell_agent_id VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'inbound' CHECK (type IN ('inbound', 'outbound')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(phone_number),
    UNIQUE(business_id, type), -- One phone per business per type
    
    -- Foreign key to business profiles
    CONSTRAINT phone_assignments_business_id_fkey 
    FOREIGN KEY (business_id) REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    
    -- Foreign key to retell agents
    CONSTRAINT phone_assignments_retell_agent_id_fkey 
    FOREIGN KEY (retell_agent_id) REFERENCES public.retell_agents(retell_agent_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS retell_agents_business_id_idx ON public.retell_agents(business_id);
CREATE INDEX IF NOT EXISTS retell_agents_status_idx ON public.retell_agents(status);
CREATE INDEX IF NOT EXISTS retell_agents_agent_type_idx ON public.retell_agents(agent_type);

CREATE INDEX IF NOT EXISTS agent_deployments_business_id_idx ON public.agent_deployments(business_id);
CREATE INDEX IF NOT EXISTS agent_deployments_status_idx ON public.agent_deployments(status);

CREATE INDEX IF NOT EXISTS phone_assignments_business_id_idx ON public.phone_assignments(business_id);
CREATE INDEX IF NOT EXISTS phone_assignments_phone_number_idx ON public.phone_assignments(phone_number);
CREATE INDEX IF NOT EXISTS phone_assignments_status_idx ON public.phone_assignments(status);

-- Enable Row Level Security
ALTER TABLE public.retell_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for retell_agents
CREATE POLICY "Users can access their own retell agents" ON public.retell_agents
    FOR ALL 
    TO authenticated 
    USING (
        business_id IN (
            SELECT id FROM public.business_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for agent_deployments
CREATE POLICY "Users can access their own agent deployments" ON public.agent_deployments
    FOR ALL 
    TO authenticated 
    USING (
        business_id IN (
            SELECT id FROM public.business_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for phone_assignments
CREATE POLICY "Users can access their own phone assignments" ON public.phone_assignments
    FOR ALL 
    TO authenticated 
    USING (
        business_id IN (
            SELECT id FROM public.business_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.retell_agents TO authenticated;
GRANT ALL ON public.agent_deployments TO authenticated;
GRANT ALL ON public.phone_assignments TO authenticated;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_retell_agents_updated_at
    BEFORE UPDATE ON public.retell_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('retell_agents', 'agent_deployments', 'phone_assignments')
ORDER BY table_name;