-- Staff Calendar System Database Schema
-- Extends the existing AI Agent Management system with appointment scheduling

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Staff Calendar Tables
-- =====================================================

-- Staff calendars table - one record per staff member per year
CREATE TABLE IF NOT EXISTS staff_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL, -- References staff table
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Business owner
  year INTEGER NOT NULL,
  default_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint to ensure one calendar per staff per year
  UNIQUE(staff_id, year)
);

-- Staff availability table - detailed availability records
CREATE TABLE IF NOT EXISTS staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID REFERENCES staff_calendars(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL, -- Denormalized for performance
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true,
  is_override BOOLEAN DEFAULT false, -- True if overriding default availability
  reason TEXT, -- Optional reason (vacation, sick, meeting, etc.)
  notes TEXT, -- Additional notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint to prevent duplicate entries for same date
  UNIQUE(calendar_id, date)
);

-- Business holidays table - company-wide holidays
CREATE TABLE IF NOT EXISTS business_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL, -- References clients table
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  holiday_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT false, -- If true, applies every year
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint to prevent duplicate holidays for same business on same date
  UNIQUE(business_id, holiday_date)
);

-- Staff calendar configuration table - stores calendar settings per staff
CREATE TABLE IF NOT EXISTS staff_calendar_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Default working hours (when not overridden)
  default_start_time TIME DEFAULT '09:00:00',
  default_end_time TIME DEFAULT '17:00:00',
  
  -- Working days (bit flags: Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64)
  working_days INTEGER DEFAULT 31, -- Mon-Fri = 1+2+4+8+16 = 31
  
  -- Break/lunch settings
  lunch_break_start TIME,
  lunch_break_end TIME,
  
  -- Buffer time between appointments
  buffer_minutes INTEGER DEFAULT 15,
  
  -- Maximum advance booking days
  max_advance_days INTEGER DEFAULT 90,
  
  -- Calendar is configured and ready
  is_configured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One config per staff member
  UNIQUE(staff_id)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Staff calendars indexes
CREATE INDEX IF NOT EXISTS idx_staff_calendars_staff_id ON staff_calendars(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_calendars_user_id ON staff_calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_calendars_year ON staff_calendars(year);

-- Staff availability indexes
CREATE INDEX IF NOT EXISTS idx_staff_availability_calendar_id ON staff_availability(calendar_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff_id ON staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_date ON staff_availability(date);
CREATE INDEX IF NOT EXISTS idx_staff_availability_date_range ON staff_availability(date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_staff_availability_is_available ON staff_availability(is_available);

-- Business holidays indexes
CREATE INDEX IF NOT EXISTS idx_business_holidays_business_id ON business_holidays(business_id);
CREATE INDEX IF NOT EXISTS idx_business_holidays_user_id ON business_holidays(user_id);
CREATE INDEX IF NOT EXISTS idx_business_holidays_date ON business_holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_business_holidays_recurring ON business_holidays(is_recurring);

-- Staff calendar configs indexes
CREATE INDEX IF NOT EXISTS idx_staff_calendar_configs_staff_id ON staff_calendar_configs(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_calendar_configs_user_id ON staff_calendar_configs(user_id);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE staff_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_calendar_configs ENABLE ROW LEVEL SECURITY;

-- Staff calendars policies
CREATE POLICY "Users can view their own staff calendars" ON staff_calendars
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own staff calendars" ON staff_calendars
  FOR ALL USING (user_id = auth.uid());

-- Staff availability policies
CREATE POLICY "Users can view their staff availability" ON staff_availability
  FOR SELECT USING (
    calendar_id IN (SELECT id FROM staff_calendars WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage their staff availability" ON staff_availability
  FOR ALL USING (
    calendar_id IN (SELECT id FROM staff_calendars WHERE user_id = auth.uid())
  );

-- Business holidays policies
CREATE POLICY "Users can view their business holidays" ON business_holidays
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their business holidays" ON business_holidays
  FOR ALL USING (user_id = auth.uid());

-- Staff calendar configs policies
CREATE POLICY "Users can view their staff calendar configs" ON staff_calendar_configs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their staff calendar configs" ON staff_calendar_configs
  FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- Triggers for updated_at
-- =====================================================

-- Create triggers for updated_at columns
CREATE TRIGGER update_staff_calendars_updated_at BEFORE UPDATE ON staff_calendars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_availability_updated_at BEFORE UPDATE ON staff_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_holidays_updated_at BEFORE UPDATE ON business_holidays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_calendar_configs_updated_at BEFORE UPDATE ON staff_calendar_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Utility Functions
-- =====================================================

-- Function to generate default availability for a staff member
CREATE OR REPLACE FUNCTION generate_default_staff_availability(
  p_staff_id UUID,
  p_user_id UUID,
  p_year INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_calendar_id UUID;
  v_config_record RECORD;
  v_date DATE;
  v_end_date DATE;
  v_day_of_week INTEGER;
  v_working_days INTEGER;
  v_is_holiday BOOLEAN;
BEGIN
  -- Get or create calendar for this staff/year
  INSERT INTO staff_calendars (staff_id, user_id, year, default_generated)
  VALUES (p_staff_id, p_user_id, p_year, true)
  ON CONFLICT (staff_id, year) 
  DO UPDATE SET default_generated = true
  RETURNING id INTO v_calendar_id;
  
  -- Get staff calendar configuration
  SELECT * INTO v_config_record
  FROM staff_calendar_configs
  WHERE staff_id = p_staff_id;
  
  -- If no config exists, create default
  IF NOT FOUND THEN
    INSERT INTO staff_calendar_configs (staff_id, user_id)
    VALUES (p_staff_id, p_user_id);
    
    SELECT * INTO v_config_record
    FROM staff_calendar_configs
    WHERE staff_id = p_staff_id;
  END IF;
  
  -- Generate availability for the entire year
  v_date := DATE(p_year || '-01-01');
  v_end_date := DATE(p_year || '-12-31');
  v_working_days := v_config_record.working_days;
  
  WHILE v_date <= v_end_date LOOP
    -- Get day of week (1=Monday, 7=Sunday)
    v_day_of_week := EXTRACT(ISODOW FROM v_date);
    
    -- Check if this day is a working day (bit flag check)
    -- Convert to power of 2: Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64
    DECLARE
      day_flag INTEGER := POWER(2, v_day_of_week - 1);
    BEGIN
      -- Check if this is a holiday
      SELECT EXISTS(
        SELECT 1 FROM business_holidays 
        WHERE user_id = p_user_id 
        AND holiday_date = v_date
      ) INTO v_is_holiday;
      
      -- Insert availability record
      INSERT INTO staff_availability (
        calendar_id, 
        staff_id, 
        date, 
        start_time, 
        end_time, 
        is_available,
        is_override,
        reason
      ) VALUES (
        v_calendar_id,
        p_staff_id,
        v_date,
        CASE 
          WHEN (v_working_days & day_flag) > 0 AND NOT v_is_holiday 
          THEN v_config_record.default_start_time 
          ELSE NULL 
        END,
        CASE 
          WHEN (v_working_days & day_flag) > 0 AND NOT v_is_holiday 
          THEN v_config_record.default_end_time 
          ELSE NULL 
        END,
        (v_working_days & day_flag) > 0 AND NOT v_is_holiday,
        false,
        CASE 
          WHEN v_is_holiday THEN 'Holiday' 
          WHEN (v_working_days & day_flag) = 0 THEN 'Non-working day'
          ELSE NULL 
        END
      )
      ON CONFLICT (calendar_id, date) DO NOTHING;
    END;
    
    v_date := v_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN v_calendar_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get staff availability for a date range
CREATE OR REPLACE FUNCTION get_staff_availability_range(
  p_staff_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN,
  is_override BOOLEAN,
  reason TEXT,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.date,
    sa.start_time,
    sa.end_time,
    sa.is_available,
    sa.is_override,
    sa.reason,
    sa.notes
  FROM staff_availability sa
  JOIN staff_calendars sc ON sa.calendar_id = sc.id
  WHERE sa.staff_id = p_staff_id
    AND sa.date BETWEEN p_start_date AND p_end_date
  ORDER BY sa.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if staff is available at specific date/time
CREATE OR REPLACE FUNCTION is_staff_available(
  p_staff_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  v_availability RECORD;
BEGIN
  -- Get availability for the specific date
  SELECT * INTO v_availability
  FROM staff_availability sa
  JOIN staff_calendars sc ON sa.calendar_id = sc.id
  WHERE sa.staff_id = p_staff_id
    AND sa.date = p_date;
  
  -- If no record found, not available
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if staff is available and time slot fits within working hours
  RETURN v_availability.is_available 
    AND v_availability.start_time IS NOT NULL
    AND v_availability.end_time IS NOT NULL
    AND p_start_time >= v_availability.start_time
    AND p_end_time <= v_availability.end_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some common holidays as examples
INSERT INTO business_holidays (business_id, user_id, holiday_date, holiday_name, description, is_recurring) 
SELECT 
  c.id as business_id,
  c.user_id,
  DATE('2024-01-01') as holiday_date,
  'New Year''s Day' as holiday_name,
  'New Year''s Day Holiday' as description,
  true as is_recurring
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM business_holidays bh 
  WHERE bh.business_id = c.id 
  AND bh.holiday_date = DATE('2024-01-01')
);

INSERT INTO business_holidays (business_id, user_id, holiday_date, holiday_name, description, is_recurring) 
SELECT 
  c.id as business_id,
  c.user_id,
  DATE('2024-07-04') as holiday_date,
  'Independence Day' as holiday_name,
  'Independence Day Holiday' as description,
  true as is_recurring
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM business_holidays bh 
  WHERE bh.business_id = c.id 
  AND bh.holiday_date = DATE('2024-07-04')
);

INSERT INTO business_holidays (business_id, user_id, holiday_date, holiday_name, description, is_recurring) 
SELECT 
  c.id as business_id,
  c.user_id,
  DATE('2024-12-25') as holiday_date,
  'Christmas Day' as holiday_name,
  'Christmas Day Holiday' as description,
  true as is_recurring
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM business_holidays bh 
  WHERE bh.business_id = c.id 
  AND bh.holiday_date = DATE('2024-12-25')
);