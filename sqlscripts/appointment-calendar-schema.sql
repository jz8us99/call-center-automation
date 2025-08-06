-- ===============================================
-- APPOINTMENT CALENDAR SYSTEM SCHEMA
-- ===============================================
-- Step 5: Comprehensive calendar system for staff scheduling
-- Features: office hours, holidays, staff availability, calendar integrations

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS appointment_bookings CASCADE;
DROP TABLE IF EXISTS calendar_integrations CASCADE;
DROP TABLE IF EXISTS staff_availability CASCADE;
DROP TABLE IF EXISTS holidays CASCADE;
DROP TABLE IF EXISTS office_hours CASCADE;

-- ===============================================
-- TABLE 1: OFFICE HOURS
-- ===============================================
-- Store business-wide working hours by day of week
CREATE TABLE office_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    user_id UUID NOT NULL, -- For RLS
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT office_hours_time_check CHECK (end_time > start_time),
    CONSTRAINT office_hours_unique_day UNIQUE (business_id, day_of_week)
);

-- Create indexes
CREATE INDEX idx_office_hours_business_id ON office_hours(business_id);
CREATE INDEX idx_office_hours_user_id ON office_hours(user_id);
CREATE INDEX idx_office_hours_day_of_week ON office_hours(day_of_week);

-- ===============================================
-- TABLE 2: HOLIDAYS
-- ===============================================
-- Store business holiday closures
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    user_id UUID NOT NULL, -- For RLS
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_recurring BOOLEAN DEFAULT false, -- For annual holidays
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT holidays_unique_date UNIQUE (business_id, holiday_date)
);

-- Create indexes
CREATE INDEX idx_holidays_business_id ON holidays(business_id);
CREATE INDEX idx_holidays_user_id ON holidays(user_id);
CREATE INDEX idx_holidays_date ON holidays(holiday_date);
CREATE INDEX idx_holidays_year ON holidays(EXTRACT(year FROM holiday_date));

-- ===============================================
-- TABLE 3: STAFF AVAILABILITY
-- ===============================================
-- Store staff-customized availability (overrides office hours)
CREATE TABLE staff_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL,
    user_id UUID NOT NULL, -- For RLS
    availability_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT true,
    is_override BOOLEAN DEFAULT false, -- True if manually overridden
    reason VARCHAR(255), -- Vacation, meeting, etc.
    notes TEXT,
    source VARCHAR(50) DEFAULT 'manual', -- manual, google, calendly, outlook
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT staff_availability_time_check CHECK (
        (is_available = false) OR 
        (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
    ),
    CONSTRAINT staff_availability_unique_date UNIQUE (staff_id, availability_date)
);

-- Create indexes
CREATE INDEX idx_staff_availability_staff_id ON staff_availability(staff_id);
CREATE INDEX idx_staff_availability_user_id ON staff_availability(user_id);
CREATE INDEX idx_staff_availability_date ON staff_availability(availability_date);
CREATE INDEX idx_staff_availability_year ON staff_availability(EXTRACT(year FROM availability_date));
CREATE INDEX idx_staff_availability_source ON staff_availability(source);

-- ===============================================
-- TABLE 4: CALENDAR INTEGRATIONS
-- ===============================================
-- Store calendar integration tokens and settings
CREATE TABLE calendar_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL,
    user_id UUID NOT NULL, -- For RLS
    provider VARCHAR(50) NOT NULL, -- google, outlook, calendly
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}', -- Provider-specific settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT calendar_integrations_provider_check CHECK (provider IN ('google', 'outlook', 'calendly')),
    CONSTRAINT calendar_integrations_unique_provider UNIQUE (staff_id, provider)
);

-- Create indexes
CREATE INDEX idx_calendar_integrations_staff_id ON calendar_integrations(staff_id);
CREATE INDEX idx_calendar_integrations_user_id ON calendar_integrations(user_id);
CREATE INDEX idx_calendar_integrations_provider ON calendar_integrations(provider);
CREATE INDEX idx_calendar_integrations_sync_enabled ON calendar_integrations(sync_enabled);

-- ===============================================
-- TABLE 5: APPOINTMENT BOOKINGS
-- ===============================================
-- Store booked appointments (future-proof for booking system)
CREATE TABLE appointment_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL,
    user_id UUID NOT NULL, -- For RLS
    customer_id UUID, -- References customers table (to be created)
    service_id UUID, -- References services table (to be created)
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled, no_show
    title VARCHAR(255),
    notes TEXT,
    customer_name VARCHAR(255), -- Fallback if no customer_id
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    booking_source VARCHAR(50) DEFAULT 'manual', -- manual, online, phone, walk_in
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT appointment_bookings_time_check CHECK (end_time > start_time),
    CONSTRAINT appointment_bookings_status_check CHECK (status IN (
        'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
    )),
    CONSTRAINT appointment_bookings_duration_check CHECK (duration_minutes > 0)
);

-- Create indexes
CREATE INDEX idx_appointment_bookings_staff_id ON appointment_bookings(staff_id);
CREATE INDEX idx_appointment_bookings_user_id ON appointment_bookings(user_id);
CREATE INDEX idx_appointment_bookings_date ON appointment_bookings(appointment_date);
CREATE INDEX idx_appointment_bookings_status ON appointment_bookings(status);
CREATE INDEX idx_appointment_bookings_customer_id ON appointment_bookings(customer_id);
CREATE INDEX idx_appointment_bookings_service_id ON appointment_bookings(service_id);
CREATE INDEX idx_appointment_bookings_created_at ON appointment_bookings(created_at);

-- ===============================================
-- ROW LEVEL SECURITY (RLS)
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE office_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_bookings ENABLE ROW LEVEL SECURITY;

-- Office Hours Policies
CREATE POLICY "office_hours_user_policy" ON office_hours
    FOR ALL USING (auth.uid() = user_id);

-- Holidays Policies
CREATE POLICY "holidays_user_policy" ON holidays
    FOR ALL USING (auth.uid() = user_id);

-- Staff Availability Policies
CREATE POLICY "staff_availability_user_policy" ON staff_availability
    FOR ALL USING (auth.uid() = user_id);

-- Calendar Integrations Policies
CREATE POLICY "calendar_integrations_user_policy" ON calendar_integrations
    FOR ALL USING (auth.uid() = user_id);

-- Appointment Bookings Policies
CREATE POLICY "appointment_bookings_user_policy" ON appointment_bookings
    FOR ALL USING (auth.uid() = user_id);

-- ===============================================
-- STORED FUNCTIONS
-- ===============================================

-- Function to get staff availability for a date range
CREATE OR REPLACE FUNCTION get_staff_availability(
    p_staff_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_user_id UUID
)
RETURNS TABLE (
    availability_date DATE,
    is_available BOOLEAN,
    start_time TIME,
    end_time TIME,
    reason VARCHAR(255),
    source VARCHAR(50),
    is_holiday BOOLEAN,
    holiday_name VARCHAR(255)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS date
    ),
    staff_availability_data AS (
        SELECT 
            ds.date as availability_date,
            COALESCE(sa.is_available, true) as is_available,
            sa.start_time,
            sa.end_time,
            sa.reason,
            COALESCE(sa.source, 'default') as source,
            CASE WHEN h.holiday_date IS NOT NULL THEN true ELSE false END as is_holiday,
            h.holiday_name
        FROM date_series ds
        LEFT JOIN staff_availability sa ON sa.availability_date = ds.date 
            AND sa.staff_id = p_staff_id 
            AND sa.user_id = p_user_id
        LEFT JOIN holidays h ON h.holiday_date = ds.date 
            AND h.user_id = p_user_id
    )
    SELECT * FROM staff_availability_data ORDER BY availability_date;
END;
$$;

-- Function to check for appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflict(
    p_staff_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO conflict_count
    FROM appointment_bookings
    WHERE staff_id = p_staff_id
        AND appointment_date = p_appointment_date
        AND status NOT IN ('cancelled', 'no_show')
        AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
        AND (
            (start_time < p_end_time AND end_time > p_start_time)
        );
    
    RETURN conflict_count > 0;
END;
$$;

-- Function to get office hours for a business
CREATE OR REPLACE FUNCTION get_office_hours(p_user_id UUID)
RETURNS TABLE (
    day_of_week INTEGER,
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oh.day_of_week,
        oh.start_time,
        oh.end_time,
        oh.is_active
    FROM office_hours oh
    WHERE oh.user_id = p_user_id
    ORDER BY oh.day_of_week;
END;
$$;

-- ===============================================
-- TRIGGERS FOR UPDATED_AT
-- ===============================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_office_hours_updated_at BEFORE UPDATE ON office_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_availability_updated_at BEFORE UPDATE ON staff_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_integrations_updated_at BEFORE UPDATE ON calendar_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_bookings_updated_at BEFORE UPDATE ON appointment_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- SAMPLE DATA (Optional - for testing)
-- ===============================================

-- Insert sample office hours (Monday-Friday 9AM-5PM)
-- INSERT INTO office_hours (business_id, user_id, day_of_week, start_time, end_time) VALUES
-- ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, '09:00:00', '17:00:00'),
-- ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 2, '09:00:00', '17:00:00'),
-- ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 3, '09:00:00', '17:00:00'),
-- ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 4, '09:00:00', '17:00:00'),
-- ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 5, '09:00:00', '17:00:00');

-- Insert sample holidays
-- INSERT INTO holidays (business_id, user_id, holiday_date, holiday_name, description) VALUES
-- ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2025-01-01', 'New Year''s Day', 'Office closed for New Year'),
-- ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2025-12-25', 'Christmas Day', 'Office closed for Christmas');

-- ===============================================
-- COMMENTS AND DOCUMENTATION
-- ===============================================

COMMENT ON TABLE office_hours IS 'Business-wide working hours by day of week';
COMMENT ON TABLE holidays IS 'Business holiday closures and special dates';
COMMENT ON TABLE staff_availability IS 'Individual staff availability overrides';
COMMENT ON TABLE calendar_integrations IS 'External calendar integration tokens';
COMMENT ON TABLE appointment_bookings IS 'Scheduled appointments and bookings';

COMMENT ON FUNCTION get_staff_availability IS 'Returns staff availability for date range including holidays';
COMMENT ON FUNCTION check_appointment_conflict IS 'Checks for appointment time conflicts';
COMMENT ON FUNCTION get_office_hours IS 'Returns office hours for a business';

-- Schema creation completed successfully
SELECT 'Appointment Calendar System schema created successfully!' as result;