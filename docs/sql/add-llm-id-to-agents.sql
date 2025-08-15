-- Add LLM ID support to agent configurations and retell agents tables
-- This allows each agent to use a different LLM model

-- 1. Add retell_llm_id to agent_configurations_scoped table
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_configurations_scoped' 
        AND column_name = 'retell_llm_id'
    ) THEN
        ALTER TABLE public.agent_configurations_scoped 
        ADD COLUMN retell_llm_id VARCHAR(255);
        
        -- Set default value to the current environment LLM ID
        UPDATE public.agent_configurations_scoped 
        SET retell_llm_id = 'llm_f56f731b3105a4b42d8cb522ffa7'
        WHERE retell_llm_id IS NULL;
        
        RAISE NOTICE 'Added retell_llm_id column to agent_configurations_scoped';
    ELSE
        RAISE NOTICE 'retell_llm_id column already exists in agent_configurations_scoped';
    END IF;
END $$;

-- 2. Add retell_llm_id to retell_agents table for deployed agents
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'retell_agents' 
        AND column_name = 'retell_llm_id'
    ) THEN
        ALTER TABLE public.retell_agents 
        ADD COLUMN retell_llm_id VARCHAR(255);
        
        -- Set default value to the current environment LLM ID
        UPDATE public.retell_agents 
        SET retell_llm_id = 'llm_f56f731b3105a4b42d8cb522ffa7'
        WHERE retell_llm_id IS NULL;
        
        RAISE NOTICE 'Added retell_llm_id column to retell_agents';
    ELSE
        RAISE NOTICE 'retell_llm_id column already exists in retell_agents';
    END IF;
END $$;

-- 3. Create a table to store available LLM configurations
CREATE TABLE IF NOT EXISTS retell_llm_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    llm_id VARCHAR(255) NOT NULL UNIQUE,
    llm_name VARCHAR(255) NOT NULL,
    description TEXT,
    model VARCHAR(100), -- e.g., 'gpt-4', 'gpt-3.5-turbo'
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    capabilities JSONB DEFAULT '{}', -- Store capabilities like max_tokens, supports_functions, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert the current LLM as default
INSERT INTO retell_llm_configs (llm_id, llm_name, model, is_default, description)
VALUES (
    'llm_f56f731b3105a4b42d8cb522ffa7',
    'Default GPT-4.1 Model',
    'gpt-4.1',
    true,
    'Default Retell LLM for multilingual appointment scheduling'
)
ON CONFLICT (llm_id) DO UPDATE
SET 
    is_default = true,
    updated_at = TIMEZONE('utc', NOW());

-- 4. Create a view to easily see agent configurations with LLM details
CREATE OR REPLACE VIEW agent_configurations_with_llm AS
SELECT 
    ac.*,
    llm.llm_name,
    llm.model as llm_model,
    llm.description as llm_description,
    at.name as agent_type_name,
    at.type_code as agent_type_code
FROM agent_configurations_scoped ac
LEFT JOIN retell_llm_configs llm ON ac.retell_llm_id = llm.llm_id
LEFT JOIN agent_types at ON ac.agent_type_id = at.id;

-- 5. Grant permissions for the new table
GRANT ALL ON public.retell_llm_configs TO authenticated;
GRANT ALL ON agent_configurations_with_llm TO authenticated;

-- 6. Enable RLS for retell_llm_configs
ALTER TABLE public.retell_llm_configs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view LLM configs (they're shared across businesses)
CREATE POLICY "Users can view LLM configs" ON public.retell_llm_configs
    FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can manage LLM configs (you might want to adjust this based on your needs)
CREATE POLICY "Service role can manage LLM configs" ON public.retell_llm_configs
    FOR ALL
    TO service_role
    USING (true);

-- 7. Create function to get default LLM ID
CREATE OR REPLACE FUNCTION get_default_llm_id()
RETURNS VARCHAR AS $$
BEGIN
    RETURN (
        SELECT llm_id 
        FROM retell_llm_configs 
        WHERE is_default = true 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to assign LLM to agent
CREATE OR REPLACE FUNCTION assign_llm_to_agent(
    p_agent_config_id UUID,
    p_llm_id VARCHAR(255)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verify the LLM exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM retell_llm_configs 
        WHERE llm_id = p_llm_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'LLM ID % not found or not active', p_llm_id;
    END IF;
    
    -- Update the agent configuration
    UPDATE agent_configurations_scoped
    SET 
        retell_llm_id = p_llm_id,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = p_agent_config_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 9. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_configs_llm_id 
ON public.agent_configurations_scoped(retell_llm_id);

CREATE INDEX IF NOT EXISTS idx_retell_agents_llm_id 
ON public.retell_agents(retell_llm_id);

-- 10. Sample query to view all agents with their LLM assignments
/*
SELECT 
    ac.agent_name,
    at.name as agent_type,
    ac.retell_llm_id,
    llm.llm_name,
    llm.model,
    ac.is_active
FROM agent_configurations_scoped ac
JOIN agent_types at ON ac.agent_type_id = at.id
LEFT JOIN retell_llm_configs llm ON ac.retell_llm_id = llm.llm_id
WHERE ac.client_id = 'YOUR_CLIENT_ID'
ORDER BY at.name, ac.agent_name;
*/