-- Create ai_agents table
CREATE TABLE IF NOT EXISTS public.ai_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    client_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    agent_type TEXT DEFAULT 'assistant',
    language TEXT DEFAULT 'en',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'training', 'error')),
    configuration JSONB DEFAULT '{}',
    prompt_template TEXT,
    personality JSONB DEFAULT '{}',
    capabilities TEXT[] DEFAULT '{}',
    knowledge_base_ids UUID[] DEFAULT '{}',
    parent_agent_id UUID,
    version INTEGER DEFAULT 1,
    is_template BOOLEAN DEFAULT false,
    template_category TEXT,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- Policy for users to access their own agents
CREATE POLICY "Users can access their own agents" ON public.ai_agents
    FOR ALL USING (auth.uid() = user_id);

-- Policy for service role to access all agents
CREATE POLICY "Service role can access all agents" ON public.ai_agents
    FOR ALL USING (auth.role() = 'service_role');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS ai_agents_user_id_idx ON public.ai_agents(user_id);
CREATE INDEX IF NOT EXISTS ai_agents_client_id_idx ON public.ai_agents(client_id);
CREATE INDEX IF NOT EXISTS ai_agents_agent_type_idx ON public.ai_agents(agent_type);
CREATE INDEX IF NOT EXISTS ai_agents_status_idx ON public.ai_agents(status);
CREATE INDEX IF NOT EXISTS ai_agents_language_idx ON public.ai_agents(language);
CREATE INDEX IF NOT EXISTS ai_agents_is_template_idx ON public.ai_agents(is_template);
CREATE INDEX IF NOT EXISTS ai_agents_parent_agent_id_idx ON public.ai_agents(parent_agent_id);
CREATE INDEX IF NOT EXISTS ai_agents_created_at_idx ON public.ai_agents(created_at);

-- Add foreign key constraints
ALTER TABLE public.ai_agents 
ADD CONSTRAINT ai_agents_parent_agent_id_fkey 
FOREIGN KEY (parent_agent_id) REFERENCES public.ai_agents(id) ON DELETE SET NULL;

-- Add constraints
ALTER TABLE public.ai_agents 
ADD CONSTRAINT ai_agents_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255);

ALTER TABLE public.ai_agents 
ADD CONSTRAINT ai_agents_version_positive CHECK (version > 0);

ALTER TABLE public.ai_agents 
ADD CONSTRAINT ai_agents_usage_count_positive CHECK (usage_count >= 0);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_ai_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_agents_updated_at
    BEFORE UPDATE ON public.ai_agents
    FOR EACH ROW
    EXECUTE PROCEDURE update_ai_agents_updated_at();