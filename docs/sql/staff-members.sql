-- Create staff_members table if not exists
CREATE TABLE IF NOT EXISTS public.staff_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    gender TEXT,
    title TEXT,
    job_categories UUID[] DEFAULT '{}',
    job_types UUID[] DEFAULT '{}',
    schedule JSONB DEFAULT '{}',
    specialties TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    bio TEXT,
    profile_image_url TEXT,
    certifications JSONB DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    availability_schedule JSONB DEFAULT '{}',
    hourly_rate DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    start_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- Policy for users to access their own staff members
CREATE POLICY "Users can access their own staff members" ON public.staff_members
    FOR ALL USING (auth.uid() = user_id);

-- Policy for service role to access all staff members
CREATE POLICY "Service role can access all staff members" ON public.staff_members
    FOR ALL USING (auth.role() = 'service_role');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS staff_members_user_id_idx ON public.staff_members(user_id);
CREATE INDEX IF NOT EXISTS staff_members_is_active_idx ON public.staff_members(is_active);
CREATE INDEX IF NOT EXISTS staff_members_first_name_idx ON public.staff_members(first_name);
CREATE INDEX IF NOT EXISTS staff_members_last_name_idx ON public.staff_members(last_name);
CREATE INDEX IF NOT EXISTS staff_members_email_idx ON public.staff_members(email);
CREATE INDEX IF NOT EXISTS staff_members_title_idx ON public.staff_members(title);

-- Add constraints
ALTER TABLE public.staff_members 
ADD CONSTRAINT staff_members_first_name_length CHECK (char_length(first_name) >= 1 AND char_length(first_name) <= 100);

ALTER TABLE public.staff_members 
ADD CONSTRAINT staff_members_last_name_length CHECK (char_length(last_name) >= 1 AND char_length(last_name) <= 100);

ALTER TABLE public.staff_members 
ADD CONSTRAINT staff_members_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.staff_members 
ADD CONSTRAINT staff_members_hourly_rate_positive CHECK (hourly_rate > 0 OR hourly_rate IS NULL);

ALTER TABLE public.staff_members 
ADD CONSTRAINT staff_members_commission_rate_valid CHECK (commission_rate >= 0 AND commission_rate <= 100 OR commission_rate IS NULL);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_staff_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_members_updated_at
    BEFORE UPDATE ON public.staff_members
    FOR EACH ROW
    EXECUTE PROCEDURE update_staff_members_updated_at();