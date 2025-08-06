-- Comprehensive Database Setup for Appointment System
-- Run this script to create all necessary tables for the appointment system

-- First, ensure the update function exists (may already exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- OFFICE HOURS TABLE
-- =====================================================

-- Drop existing table if it exists (use with caution in production)
-- DROP TABLE IF EXISTS office_hours CASCADE;

CREATE TABLE IF NOT EXISTS office_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure unique day per user/business
    UNIQUE(user_id, business_id, day_of_week)
);

-- Create indexes for office_hours
CREATE INDEX IF NOT EXISTS idx_office_hours_user_id ON office_hours(user_id);
CREATE INDEX IF NOT EXISTS idx_office_hours_business_id ON office_hours(business_id);
CREATE INDEX IF NOT EXISTS idx_office_hours_day_of_week ON office_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_office_hours_is_active ON office_hours(is_active);

-- Enable RLS for office_hours
ALTER TABLE office_hours ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own office hours" ON office_hours;
DROP POLICY IF EXISTS "Users can insert own office hours" ON office_hours;
DROP POLICY IF EXISTS "Users can update own office hours" ON office_hours;
DROP POLICY IF EXISTS "Users can delete own office hours" ON office_hours;

-- Create RLS policies for office_hours
CREATE POLICY "Users can view own office hours" ON office_hours
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own office hours" ON office_hours
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own office hours" ON office_hours
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own office hours" ON office_hours
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for office_hours
DROP TRIGGER IF EXISTS update_office_hours_updated_at ON office_hours;
CREATE TRIGGER update_office_hours_updated_at 
    BEFORE UPDATE ON office_hours 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HOLIDAYS TABLE  
-- =====================================================

-- Drop existing table if it exists (use with caution in production)
-- DROP TABLE IF EXISTS holidays CASCADE;

CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure unique holiday per user/business/date
    UNIQUE(user_id, business_id, holiday_date)
);

-- Create indexes for holidays
CREATE INDEX IF NOT EXISTS idx_holidays_user_id ON holidays(user_id);
CREATE INDEX IF NOT EXISTS idx_holidays_business_id ON holidays(business_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_holidays_recurring ON holidays(is_recurring);

-- Enable RLS for holidays
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own holidays" ON holidays;
DROP POLICY IF EXISTS "Users can insert own holidays" ON holidays;
DROP POLICY IF EXISTS "Users can update own holidays" ON holidays;
DROP POLICY IF EXISTS "Users can delete own holidays" ON holidays;

-- Create RLS policies for holidays
CREATE POLICY "Users can view own holidays" ON holidays
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own holidays" ON holidays
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holidays" ON holidays
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own holidays" ON holidays
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for holidays
DROP TRIGGER IF EXISTS update_holidays_updated_at ON holidays;
CREATE TRIGGER update_holidays_updated_at 
    BEFORE UPDATE ON holidays 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions for authenticated users
GRANT ALL ON office_hours TO authenticated;
GRANT ALL ON office_hours TO service_role;
GRANT ALL ON holidays TO authenticated;
GRANT ALL ON holidays TO service_role;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Appointment system tables created successfully!';
    RAISE NOTICE 'Tables created: office_hours, holidays';
    RAISE NOTICE 'RLS policies and triggers configured';
END $$;