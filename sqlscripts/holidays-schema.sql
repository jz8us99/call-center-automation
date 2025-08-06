-- Holidays table schema
-- This table stores business holidays and closure dates

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_holidays_user_id ON holidays(user_id);
CREATE INDEX IF NOT EXISTS idx_holidays_business_id ON holidays(business_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_holidays_recurring ON holidays(is_recurring);

-- RLS (Row Level Security) policies
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own holidays
CREATE POLICY "Users can view own holidays" ON holidays
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own holidays
CREATE POLICY "Users can insert own holidays" ON holidays
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own holidays  
CREATE POLICY "Users can update own holidays" ON holidays
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own holidays
CREATE POLICY "Users can delete own holidays" ON holidays
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_holidays_updated_at 
    BEFORE UPDATE ON holidays 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON holidays TO authenticated;
GRANT ALL ON holidays TO service_role;