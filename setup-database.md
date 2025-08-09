# Database Setup Instructions

## Error: "Agent type not found"

This error occurs because the required Supabase tables don't exist yet. Follow these steps to set up your database:

## Step 1: Run SQL Migrations in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the following SQL scripts in order:

### First, run the business_profiles table migration:

```sql
-- Run this SQL in Supabase SQL Editor
-- File: supabase/migrations/20240108_ensure_business_profiles.sql

-- Ensure business_profiles table exists
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Basic business information
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    business_description TEXT,
    
    -- Contact information
    business_phone VARCHAR(50),
    business_email VARCHAR(255),
    business_website VARCHAR(255),
    business_address TEXT,
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Contact person
    contact_person_name VARCHAR(255),
    contact_person_role VARCHAR(100),
    contact_person_phone VARCHAR(50),
    contact_person_email VARCHAR(255),
    
    -- Additional business details
    years_in_business INTEGER,
    number_of_employees INTEGER,
    
    -- Business content
    support_content TEXT,
    business_documents JSONB DEFAULT '[]',
    document_sections JSONB DEFAULT '[]',
    business_locations JSONB DEFAULT '[]',
    accepted_insurances TEXT[] DEFAULT '{}',
    payment_methods TEXT[] DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON public.business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_active ON public.business_profiles(is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_business_profiles_updated_at ON public.business_profiles;
CREATE TRIGGER update_business_profiles_updated_at 
    BEFORE UPDATE ON public.business_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.business_profiles TO authenticated;

-- Enable RLS
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.business_profiles;
CREATE POLICY "Users can view their own business profile" ON public.business_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own business profile" ON public.business_profiles;
CREATE POLICY "Users can insert their own business profile" ON public.business_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own business profile" ON public.business_profiles;
CREATE POLICY "Users can update their own business profile" ON public.business_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own business profile" ON public.business_profiles;
CREATE POLICY "Users can delete their own business profile" ON public.business_profiles
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
```

### Second, run the agent tables migration:

```sql
-- Run this SQL in Supabase SQL Editor
-- File: supabase/migrations/20240108_create_agent_tables.sql

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

-- Add missing columns to existing agent_types table if they don't exist
DO $$ 
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_types' AND column_name = 'updated_at') THEN
        ALTER TABLE public.agent_types ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_types' AND column_name = 'created_at') THEN
        ALTER TABLE public.agent_types ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_types' AND column_name = 'is_active') THEN
        ALTER TABLE public.agent_types ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add icon column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_types' AND column_name = 'icon') THEN
        ALTER TABLE public.agent_types ADD COLUMN icon VARCHAR(50);
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_types' AND column_name = 'description') THEN
        ALTER TABLE public.agent_types ADD COLUMN description TEXT;
    END IF;
END $$;

-- Insert the new agent types
INSERT INTO public.agent_types (type_code, name, description, icon) 
VALUES 
    ('inbound_receptionist', 'Inbound Receptionist', 'Professional phone receptionist handling incoming calls, routing, and scheduling', '📞'),
    ('inbound_customer_support', 'Inbound Customer Support', 'Dedicated support agent for handling customer issues, complaints, and technical assistance', '🛠️'),
    ('outbound_follow_up', 'Outbound Follow-up', 'Follow-up agent for appointment confirmations, reminders, and post-service check-ins', '📅'),
    ('outbound_marketing', 'Outbound Marketing', 'Marketing agent for lead generation, sales calls, and promotional campaigns', '📈')
ON CONFLICT (type_code) 
DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    updated_at = TIMEZONE('utc', NOW());

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

-- Grant permissions
GRANT ALL ON public.agent_types TO authenticated;
GRANT ALL ON public.agent_configurations_scoped TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.agent_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_configurations_scoped ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agent_types (everyone can read)
DROP POLICY IF EXISTS "Allow read access to agent_types" ON public.agent_types;
CREATE POLICY "Allow read access to agent_types" ON public.agent_types
    FOR SELECT
    TO authenticated
    USING (true);

-- Create RLS policies for agent_configurations_scoped
DROP POLICY IF EXISTS "Users can view their own agent configurations" ON public.agent_configurations_scoped;
CREATE POLICY "Users can view their own agent configurations" ON public.agent_configurations_scoped
    FOR SELECT
    TO authenticated
    USING (
        client_id IN (
            SELECT id FROM public.business_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own agent configurations" ON public.agent_configurations_scoped;
CREATE POLICY "Users can insert their own agent configurations" ON public.agent_configurations_scoped
    FOR INSERT
    TO authenticated
    WITH CHECK (
        client_id IN (
            SELECT id FROM public.business_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own agent configurations" ON public.agent_configurations_scoped;
CREATE POLICY "Users can update their own agent configurations" ON public.agent_configurations_scoped
    FOR UPDATE
    TO authenticated
    USING (
        client_id IN (
            SELECT id FROM public.business_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own agent configurations" ON public.agent_configurations_scoped;
CREATE POLICY "Users can delete their own agent configurations" ON public.agent_configurations_scoped
    FOR DELETE
    TO authenticated
    USING (
        client_id IN (
            SELECT id FROM public.business_profiles 
            WHERE user_id = auth.uid()
        )
    );
```

## Step 2: Test the Database Setup

After running both SQL migrations, you can test if everything works by making a POST request to your seed endpoint:

```bash
curl -X POST http://localhost:19080/api/seed-agent-types
```

Or visit: http://localhost:19080/api/seed-agent-types in your browser

## Step 3: Verify Agent Types

You can verify the agent types were created by checking:

```bash
curl http://localhost:19080/api/agent-types
```

You should see the four new agent types:
- Inbound Receptionist
- Inbound Customer Support  
- Outbound Follow-up
- Outbound Marketing

## Step 4: Test Saving Agent Configuration

Now try to save an agent configuration in the UI at http://localhost:19080/configuration

The "Agent type not found" error should be resolved!

## Troubleshooting

If you still get errors:

1. **Check Supabase connection**: Make sure your `.env.local` has the correct Supabase URL and keys
2. **Verify table creation**: Go to Supabase Dashboard > Table Editor to see if tables were created
3. **Check RLS policies**: Make sure you're authenticated when testing
4. **Look at browser console**: Check for any JavaScript errors
5. **Check server logs**: Look at terminal output for API errors