-- Migration Script: Create business_profiles table and migrate data from clients table
-- Execute this in Supabase SQL Editor

-- Step 1: Create the business_profiles table
CREATE TABLE IF NOT EXISTS business_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    business_address TEXT,
    business_phone VARCHAR(50) NOT NULL,
    business_email VARCHAR(255),
    business_website VARCHAR(255),
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    
    -- Contact Person Information
    contact_person_name VARCHAR(255),
    contact_person_role VARCHAR(100),
    contact_person_phone VARCHAR(50),
    contact_person_email VARCHAR(255),
    
    -- Business Details (JSON for flexibility)
    support_content TEXT, -- Store comprehensive business data as JSON
    logo_url TEXT,
    
    -- Business Configuration
    business_hours JSONB DEFAULT '{}',
    service_areas TEXT[],
    specialties TEXT[],
    certifications TEXT[],
    payment_methods TEXT[],
    insurance_accepted TEXT[],
    
    -- Status and Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_business UNIQUE(user_id),
    CONSTRAINT valid_email CHECK (business_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR business_email IS NULL),
    CONSTRAINT valid_phone CHECK (LENGTH(business_phone) >= 10)
);

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_business_name ON business_profiles(business_name);
CREATE INDEX IF NOT EXISTS idx_business_profiles_business_type ON business_profiles(business_type);
CREATE INDEX IF NOT EXISTS idx_business_profiles_active ON business_profiles(is_active) WHERE is_active = true;

-- Step 3: Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_profiles_updated_at
    BEFORE UPDATE ON business_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Migrate data from clients table to business_profiles table
-- First, let's do a safer migration by checking what columns actually exist

DO $$ 
DECLARE
    has_contact_phone BOOLEAN := FALSE;
    has_created_at BOOLEAN := FALSE;
    has_updated_at BOOLEAN := FALSE;
    migration_query TEXT;
BEGIN
    -- Check if columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'contact_phone'
    ) INTO has_contact_phone;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'created_at'
    ) INTO has_created_at;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'updated_at'
    ) INTO has_updated_at;
    
    -- Build migration query based on available columns
    migration_query := 'INSERT INTO business_profiles (
        user_id,
        business_name,
        business_type,
        business_phone,
        business_email,
        timezone,
        support_content,
        contact_person_name,
        contact_person_phone,
        contact_person_email,
        created_at,
        updated_at
    )
    SELECT 
        user_id,
        COALESCE(business_name, ''Unnamed Business'') as business_name,
        business_type,';
    
    -- Add phone field based on availability
    IF has_contact_phone THEN
        migration_query := migration_query || '
        COALESCE(contact_phone, ''0000000000'') as business_phone,';
    ELSE
        migration_query := migration_query || '
        ''0000000000'' as business_phone,';
    END IF;
    
    migration_query := migration_query || '
        contact_email as business_email,
        COALESCE(timezone, ''America/New_York'') as timezone,
        support_content,
        
        -- Extract contact person info from support_content JSON if available
        CASE 
            WHEN support_content IS NOT NULL AND support_content != '''' AND support_content != ''null'' THEN
                COALESCE(
                    (support_content::json->>''contact_person_name''),
                    ''Business Owner''
                )
            ELSE ''Business Owner''
        END as contact_person_name,
        
        CASE 
            WHEN support_content IS NOT NULL AND support_content != '''' AND support_content != ''null'' THEN
                (support_content::json->>''contact_person_phone'')
            ELSE ';
    
    IF has_contact_phone THEN
        migration_query := migration_query || 'contact_phone';
    ELSE
        migration_query := migration_query || 'NULL';
    END IF;
    
    migration_query := migration_query || '
        END as contact_person_phone,
        
        CASE 
            WHEN support_content IS NOT NULL AND support_content != '''' AND support_content != ''null'' THEN
                (support_content::json->>''contact_person_email'')
            ELSE contact_email
        END as contact_person_email,';
    
    -- Add timestamp fields based on availability
    IF has_created_at THEN
        migration_query := migration_query || '
        COALESCE(created_at, NOW()) as created_at,';
    ELSE
        migration_query := migration_query || '
        NOW() as created_at,';
    END IF;
    
    IF has_updated_at THEN
        migration_query := migration_query || '
        COALESCE(updated_at, NOW()) as updated_at';
    ELSE
        migration_query := migration_query || '
        NOW() as updated_at';
    END IF;
    
    migration_query := migration_query || '
    FROM clients
    WHERE user_id IS NOT NULL 
      AND business_name IS NOT NULL';
    
    -- Add phone constraint only if column exists
    IF has_contact_phone THEN
        migration_query := migration_query || '
      AND contact_phone IS NOT NULL';
    END IF;
    
    migration_query := migration_query || '
    ON CONFLICT (user_id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        business_type = EXCLUDED.business_type,
        business_phone = EXCLUDED.business_phone,
        business_email = EXCLUDED.business_email,
        timezone = EXCLUDED.timezone,
        support_content = EXCLUDED.support_content,
        updated_at = NOW()';
    
    -- Execute the migration
    RAISE NOTICE 'Executing migration query...';
    EXECUTE migration_query;
    
    RAISE NOTICE 'Migration completed successfully!';
    
END $$;

-- Step 5: Add Row Level Security (RLS) policies
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own business profile
CREATE POLICY "Users can view own business profile" ON business_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own business profile
CREATE POLICY "Users can insert own business profile" ON business_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own business profile
CREATE POLICY "Users can update own business profile" ON business_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own business profile
CREATE POLICY "Users can delete own business profile" ON business_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Step 6: Create a view for easy business profile access with parsed JSON
CREATE OR REPLACE VIEW business_profiles_detailed AS
SELECT 
    bp.*,
    
    -- Parse JSON support_content for easier access
    CASE 
        WHEN support_content IS NOT NULL AND support_content != '' THEN
            (support_content::json->>'basic_support_content')
        ELSE NULL
    END as basic_support_content,
    
    CASE 
        WHEN support_content IS NOT NULL AND support_content != '' THEN
            (support_content::json->>'business_address')
        ELSE NULL
    END as parsed_business_address,
    
    CASE 
        WHEN support_content IS NOT NULL AND support_content != '' THEN
            (support_content::json->>'business_website')
        ELSE NULL
    END as parsed_business_website,
    
    CASE 
        WHEN support_content IS NOT NULL AND support_content != '' THEN
            (support_content::json->'products_services')
        ELSE '{}'::json
    END as products_services,
    
    CASE 
        WHEN support_content IS NOT NULL AND support_content != '' THEN
            (support_content::json->'pricing_information')
        ELSE '{}'::json
    END as pricing_information
    
FROM business_profiles bp;

-- Step 7: Verification queries (run these to check migration success)
-- Check migrated data count
-- SELECT 'Clients table count:' as info, COUNT(*) as count FROM clients
-- UNION ALL
-- SELECT 'Business profiles count:' as info, COUNT(*) as count FROM business_profiles;

-- Check sample migrated data
-- SELECT 
--     user_id, 
--     business_name, 
--     business_type, 
--     business_phone, 
--     business_email,
--     created_at
-- FROM business_profiles 
-- ORDER BY created_at DESC 
-- LIMIT 5;

-- Step 8: Update foreign key references (if needed)
-- Note: You'll need to update other tables that reference clients.id to reference business_profiles.id
-- This depends on your specific schema. Common tables that might need updating:

-- Example (uncomment and modify as needed):
-- ALTER TABLE appointments ADD COLUMN new_business_id UUID REFERENCES business_profiles(id);
-- UPDATE appointments SET new_business_id = bp.id 
-- FROM business_profiles bp, clients c 
-- WHERE appointments.business_id = c.id AND bp.user_id = c.user_id;
-- ALTER TABLE appointments DROP COLUMN business_id;
-- ALTER TABLE appointments RENAME COLUMN new_business_id TO business_id;

-- Step 9: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON business_profiles TO authenticated;
GRANT SELECT ON business_profiles_detailed TO authenticated;
-- Note: No sequence to grant since we use UUID with gen_random_uuid()

-- Migration completed successfully!
-- Remember to:
-- 1. Update your application code to use business_profiles instead of clients
-- 2. Test the migration thoroughly
-- 3. Update any foreign key references in other tables
-- 4. Consider keeping the clients table for backward compatibility initially