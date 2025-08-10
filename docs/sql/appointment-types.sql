-- Create appointment_types table
CREATE TABLE IF NOT EXISTS public.appointment_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    duration_minutes INTEGER DEFAULT 30 NOT NULL,
    buffer_before_minutes INTEGER DEFAULT 0 NOT NULL,
    buffer_after_minutes INTEGER DEFAULT 0 NOT NULL,
    price DECIMAL(10,2),
    deposit_required DECIMAL(10,2) DEFAULT 0,
    advance_booking_days INTEGER DEFAULT 1 NOT NULL,
    max_advance_booking_days INTEGER DEFAULT 90 NOT NULL,
    same_day_booking BOOLEAN DEFAULT true,
    online_booking_enabled BOOLEAN DEFAULT true,
    requires_specific_staff BOOLEAN DEFAULT false,
    allowed_staff_ids UUID[] DEFAULT '{}',
    new_customer_only BOOLEAN DEFAULT false,
    returning_customer_only BOOLEAN DEFAULT false,
    requires_referral BOOLEAN DEFAULT false,
    booking_instructions TEXT,
    color_code TEXT DEFAULT '#3B82F6',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;

-- Policy for users to access their own appointment types
CREATE POLICY "Users can access their own appointment types" ON public.appointment_types
    FOR ALL USING (auth.uid() = user_id);

-- Policy for service role to access all appointment types
CREATE POLICY "Service role can access all appointment types" ON public.appointment_types
    FOR ALL USING (auth.role() = 'service_role');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS appointment_types_user_id_idx ON public.appointment_types(user_id);
CREATE INDEX IF NOT EXISTS appointment_types_business_id_idx ON public.appointment_types(business_id);
CREATE INDEX IF NOT EXISTS appointment_types_category_idx ON public.appointment_types(category);
CREATE INDEX IF NOT EXISTS appointment_types_is_active_idx ON public.appointment_types(is_active);
CREATE INDEX IF NOT EXISTS appointment_types_display_order_idx ON public.appointment_types(display_order);

-- Add constraints
ALTER TABLE public.appointment_types 
ADD CONSTRAINT appointment_types_duration_positive CHECK (duration_minutes > 0);

ALTER TABLE public.appointment_types 
ADD CONSTRAINT appointment_types_advance_booking_positive CHECK (advance_booking_days >= 0);

ALTER TABLE public.appointment_types 
ADD CONSTRAINT appointment_types_max_advance_booking_positive CHECK (max_advance_booking_days >= advance_booking_days);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_appointment_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointment_types_updated_at
    BEFORE UPDATE ON public.appointment_types
    FOR EACH ROW
    EXECUTE PROCEDURE update_appointment_types_updated_at();