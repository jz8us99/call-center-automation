-- Fix staff_availability table schema
-- This script ensures the table exists with proper structure

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create staff_calendars table if it doesn't exist
CREATE TABLE IF NOT EXISTS staff_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  default_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, year)
);

-- Create staff_availability table if it doesn't exist
CREATE TABLE IF NOT EXISTS staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID REFERENCES staff_calendars(id) ON DELETE CASCADE,
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

-- Fix existing table if it has wrong structure
DO $$ 
BEGIN
    -- Check if the table exists but is missing columns
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_name='staff_availability' 
               AND table_schema='public') THEN
        
        -- Add calendar_id column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='staff_availability' 
                       AND column_name='calendar_id'
                       AND table_schema='public') THEN
            ALTER TABLE staff_availability 
            ADD COLUMN calendar_id UUID REFERENCES staff_calendars(id) ON DELETE CASCADE;
        END IF;

        -- Add date column if missing  
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='staff_availability' 
                       AND column_name='date'
                       AND table_schema='public') THEN
            ALTER TABLE staff_availability 
            ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
        END IF;

        -- Add other missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='staff_availability' 
                       AND column_name='start_time'
                       AND table_schema='public') THEN
            ALTER TABLE staff_availability 
            ADD COLUMN start_time TIME;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='staff_availability' 
                       AND column_name='end_time'
                       AND table_schema='public') THEN
            ALTER TABLE staff_availability 
            ADD COLUMN end_time TIME;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='staff_availability' 
                       AND column_name='is_available'
                       AND table_schema='public') THEN
            ALTER TABLE staff_availability 
            ADD COLUMN is_available BOOLEAN DEFAULT true;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='staff_availability' 
                       AND column_name='is_override'
                       AND table_schema='public') THEN
            ALTER TABLE staff_availability 
            ADD COLUMN is_override BOOLEAN DEFAULT false;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='staff_availability' 
                       AND column_name='staff_id'
                       AND table_schema='public') THEN
            ALTER TABLE staff_availability 
            ADD COLUMN staff_id UUID NOT NULL;
        END IF;
    END IF;
END $$;

-- Ensure constraints exist
DO $$
BEGIN
    -- Add unique constraint for staff_calendars if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'staff_calendars' 
                   AND constraint_type = 'UNIQUE'
                   AND constraint_name = 'staff_calendars_staff_id_year_key') THEN
        ALTER TABLE staff_calendars 
        ADD CONSTRAINT staff_calendars_staff_id_year_key UNIQUE(staff_id, year);
    END IF;

    -- Add unique constraint for staff_availability if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'staff_availability' 
                   AND constraint_type = 'UNIQUE'
                   AND constraint_name = 'staff_availability_calendar_id_date_key') THEN
        ALTER TABLE staff_availability 
        ADD CONSTRAINT staff_availability_calendar_id_date_key UNIQUE(calendar_id, date);
    END IF;
EXCEPTION
    WHEN others THEN
        -- If constraint already exists or other error, continue
        NULL;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_availability_calendar_id ON staff_availability(calendar_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff_id ON staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_date ON staff_availability(date);
CREATE INDEX IF NOT EXISTS idx_staff_calendars_staff_id ON staff_calendars(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_calendars_user_id ON staff_calendars(user_id);

-- Create the stored function for generating default availability
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
BEGIN
  -- Get or create calendar for this staff/year
  -- First try to get existing calendar
  SELECT id INTO v_calendar_id 
  FROM staff_calendars 
  WHERE staff_id = p_staff_id AND year = p_year;
  
  -- If not found, create new one
  IF v_calendar_id IS NULL THEN
    INSERT INTO staff_calendars (staff_id, user_id, year, default_generated)
    VALUES (p_staff_id, p_user_id, p_year, true)
    RETURNING id INTO v_calendar_id;
  ELSE
    -- Update existing calendar
    UPDATE staff_calendars 
    SET default_generated = true 
    WHERE id = v_calendar_id;
  END IF;
  
  -- Generate availability for the entire year
  v_date := DATE(p_year || '-01-01');
  v_end_date := DATE(p_year || '-12-31');
  
  WHILE v_date <= v_end_date LOOP
    -- Get day of week (0=Sunday, 6=Saturday)
    v_day_of_week := EXTRACT(DOW FROM v_date);
    v_is_weekend := v_day_of_week = 0 OR v_day_of_week = 6;
    
    -- Insert availability record (with safe duplicate handling)
    BEGIN
      INSERT INTO staff_availability (
        calendar_id, 
        staff_id, 
        date, 
        start_time, 
        end_time, 
        is_available,
        is_override
      ) VALUES (
        v_calendar_id,
        p_staff_id,
        v_date,
        CASE WHEN NOT v_is_weekend THEN '09:00:00'::TIME ELSE NULL END,
        CASE WHEN NOT v_is_weekend THEN '17:00:00'::TIME ELSE NULL END,
        NOT v_is_weekend,
        false
      );
    EXCEPTION
      WHEN unique_violation THEN
        -- Record already exists, skip
        NULL;
    END;
    
    v_date := v_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN v_calendar_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;