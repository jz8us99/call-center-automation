-- Simple fix for staff calendar tables
-- This version avoids ON CONFLICT by checking for existing records first

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop and recreate tables if they exist with wrong structure
DROP TABLE IF EXISTS staff_availability CASCADE;
DROP TABLE IF EXISTS staff_calendars CASCADE;

-- Create staff_calendars table
CREATE TABLE staff_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  default_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, year)
);

-- Create staff_availability table
CREATE TABLE staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES staff_calendars(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true,
  is_override BOOLEAN DEFAULT false,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(calendar_id, date)
);

-- Add indexes
CREATE INDEX idx_staff_calendars_staff_id ON staff_calendars(staff_id);
CREATE INDEX idx_staff_calendars_user_id ON staff_calendars(user_id);
CREATE INDEX idx_staff_calendars_year ON staff_calendars(year);
CREATE INDEX idx_staff_availability_calendar_id ON staff_availability(calendar_id);
CREATE INDEX idx_staff_availability_staff_id ON staff_availability(staff_id);
CREATE INDEX idx_staff_availability_date ON staff_availability(date);

-- Create simple function for generating calendar
CREATE OR REPLACE FUNCTION generate_default_staff_availability(
  p_staff_id UUID,
  p_user_id UUID,
  p_year INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_calendar_id UUID;
  v_date DATE;
  v_end_date DATE;
  v_day_of_week INTEGER;
  v_is_weekend BOOLEAN;
  v_existing_calendar UUID;
BEGIN
  -- Check if calendar already exists
  SELECT id INTO v_existing_calendar
  FROM staff_calendars 
  WHERE staff_id = p_staff_id AND year = p_year;
  
  IF v_existing_calendar IS NOT NULL THEN
    -- Calendar exists, return it
    RETURN v_existing_calendar;
  END IF;
  
  -- Create new calendar
  INSERT INTO staff_calendars (staff_id, user_id, year, default_generated)
  VALUES (p_staff_id, p_user_id, p_year, true)
  RETURNING id INTO v_calendar_id;
  
  -- Generate availability for the year
  v_date := DATE(p_year || '-01-01');
  v_end_date := DATE(p_year || '-12-31');
  
  WHILE v_date <= v_end_date LOOP
    v_day_of_week := EXTRACT(DOW FROM v_date);
    v_is_weekend := (v_day_of_week = 0 OR v_day_of_week = 6);
    
    -- Only insert if record doesn't exist
    IF NOT EXISTS (SELECT 1 FROM staff_availability WHERE calendar_id = v_calendar_id AND date = v_date) THEN
      INSERT INTO staff_availability (
        calendar_id, 
        staff_id, 
        date, 
        start_time, 
        end_time, 
        is_available
      ) VALUES (
        v_calendar_id,
        p_staff_id,
        v_date,
        CASE WHEN NOT v_is_weekend THEN '09:00:00'::TIME ELSE NULL END,
        CASE WHEN NOT v_is_weekend THEN '17:00:00'::TIME ELSE NULL END,
        NOT v_is_weekend
      );
    END IF;
    
    v_date := v_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN v_calendar_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;