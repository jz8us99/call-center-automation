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
CREATE POLICY "Users can view their own business profile" ON public.business_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own business profile" ON public.business_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own business profile" ON public.business_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own business profile" ON public.business_profiles
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());