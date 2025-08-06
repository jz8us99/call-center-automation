-- Office Hours table schema
-- This table stores business operating hours for each user/business

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_office_hours_user_id ON office_hours(user_id);
CREATE INDEX IF NOT EXISTS idx_office_hours_business_id ON office_hours(business_id);
CREATE INDEX IF NOT EXISTS idx_office_hours_day_of_week ON office_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_office_hours_is_active ON office_hours(is_active);

-- RLS (Row Level Security) policies
ALTER TABLE office_hours ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own office hours
CREATE POLICY "Users can view own office hours" ON office_hours
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own office hours
CREATE POLICY "Users can insert own office hours" ON office_hours
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own office hours  
CREATE POLICY "Users can update own office hours" ON office_hours
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own office hours
CREATE POLICY "Users can delete own office hours" ON office_hours
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_office_hours_updated_at 
    BEFORE UPDATE ON office_hours 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON office_hours TO authenticated;
GRANT ALL ON office_hours TO service_role;