-- Create business_services table if not exists
CREATE TABLE IF NOT EXISTS public.business_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    business_type TEXT,
    service_name TEXT NOT NULL,
    service_description TEXT,
    category_id UUID,
    price DECIMAL(10,2),
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;

-- Policy for users to access their own services
CREATE POLICY "Users can access their own business services" ON public.business_services
    FOR ALL USING (auth.uid() = user_id);

-- Policy for service role to access all services
CREATE POLICY "Service role can access all business services" ON public.business_services
    FOR ALL USING (auth.role() = 'service_role');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS business_services_user_id_idx ON public.business_services(user_id);
CREATE INDEX IF NOT EXISTS business_services_business_type_idx ON public.business_services(business_type);
CREATE INDEX IF NOT EXISTS business_services_category_id_idx ON public.business_services(category_id);
CREATE INDEX IF NOT EXISTS business_services_is_active_idx ON public.business_services(is_active);
CREATE INDEX IF NOT EXISTS business_services_service_name_idx ON public.business_services(service_name);

-- Add constraints
ALTER TABLE public.business_services 
ADD CONSTRAINT business_services_service_name_length CHECK (char_length(service_name) >= 1 AND char_length(service_name) <= 255);

ALTER TABLE public.business_services 
ADD CONSTRAINT business_services_duration_positive CHECK (duration_minutes > 0 OR duration_minutes IS NULL);

ALTER TABLE public.business_services 
ADD CONSTRAINT business_services_price_positive CHECK (price >= 0 OR price IS NULL);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_business_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_services_updated_at
    BEFORE UPDATE ON public.business_services
    FOR EACH ROW
    EXECUTE PROCEDURE update_business_services_updated_at();