-- ===============================================
-- BOOKING SETTINGS SCHEMA 
-- ===============================================
-- Booking configuration and rules for the appointment system

-- Drop existing table if it exists
DROP TABLE IF EXISTS booking_settings CASCADE;

-- ===============================================
-- TABLE: BOOKING SETTINGS
-- ===============================================
-- Store business booking configuration and rules
CREATE TABLE booking_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    user_id UUID NOT NULL, -- For RLS
    
    -- Booking availability settings
    advance_booking_days INTEGER DEFAULT 90, -- How far in advance customers can book
    min_booking_notice_hours INTEGER DEFAULT 2, -- Minimum notice required for booking
    max_bookings_per_day INTEGER DEFAULT 20, -- Maximum bookings per day per business
    max_bookings_per_slot INTEGER DEFAULT 1, -- Maximum bookings per time slot
    
    -- Time slot settings
    default_slot_duration INTEGER DEFAULT 30, -- Default appointment duration in minutes
    slot_buffer_minutes INTEGER DEFAULT 15, -- Buffer time between appointments
    booking_window_start TIME DEFAULT '08:00:00', -- Earliest booking time
    booking_window_end TIME DEFAULT '18:00:00', -- Latest booking time
    
    -- Booking rules
    allow_same_day_booking BOOLEAN DEFAULT true,
    allow_weekend_booking BOOLEAN DEFAULT false,
    require_customer_info BOOLEAN DEFAULT true,
    require_phone_number BOOLEAN DEFAULT true,
    require_email_confirmation BOOLEAN DEFAULT true,
    
    -- Cancellation settings
    allow_customer_cancellation BOOLEAN DEFAULT true,
    cancellation_notice_hours INTEGER DEFAULT 24, -- Required notice for cancellation
    allow_customer_reschedule BOOLEAN DEFAULT true,
    reschedule_notice_hours INTEGER DEFAULT 12, -- Required notice for rescheduling
    
    -- Notification settings
    send_booking_confirmation BOOLEAN DEFAULT true,
    send_reminder_email BOOLEAN DEFAULT true,
    reminder_hours_before INTEGER DEFAULT 24, -- Send reminder X hours before appointment
    send_sms_reminders BOOLEAN DEFAULT false,
    
    -- Business rules
    blackout_dates JSONB DEFAULT '[]', -- Array of dates when booking is not allowed
    special_hours JSONB DEFAULT '{}', -- Special hours for specific dates
    booking_instructions TEXT, -- Special instructions shown to customers
    terms_and_conditions TEXT, -- Terms customers must agree to
    
    -- System settings
    online_booking_enabled BOOLEAN DEFAULT true,
    show_staff_names BOOLEAN DEFAULT true,
    show_prices BOOLEAN DEFAULT true,
    allow_service_selection BOOLEAN DEFAULT true,
    require_deposit BOOLEAN DEFAULT false,
    deposit_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT booking_settings_advance_days_check CHECK (advance_booking_days > 0),
    CONSTRAINT booking_settings_min_notice_check CHECK (min_booking_notice_hours >= 0),
    CONSTRAINT booking_settings_max_bookings_check CHECK (max_bookings_per_day > 0),
    CONSTRAINT booking_settings_duration_check CHECK (default_slot_duration > 0),
    CONSTRAINT booking_settings_buffer_check CHECK (slot_buffer_minutes >= 0),
    CONSTRAINT booking_settings_cancellation_check CHECK (cancellation_notice_hours >= 0),
    CONSTRAINT booking_settings_reschedule_check CHECK (reschedule_notice_hours >= 0),
    CONSTRAINT booking_settings_reminder_check CHECK (reminder_hours_before >= 0),
    CONSTRAINT booking_settings_deposit_check CHECK (deposit_percentage >= 0 AND deposit_percentage <= 100),
    CONSTRAINT booking_settings_unique_business UNIQUE (business_id, user_id)
);

-- Create indexes
CREATE INDEX idx_booking_settings_business_id ON booking_settings(business_id);
CREATE INDEX idx_booking_settings_user_id ON booking_settings(user_id);
CREATE INDEX idx_booking_settings_online_enabled ON booking_settings(online_booking_enabled);

-- ===============================================
-- ROW LEVEL SECURITY (RLS)
-- ===============================================

-- Enable RLS
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;

-- Booking Settings Policies
CREATE POLICY "booking_settings_user_policy" ON booking_settings
    FOR ALL USING (auth.uid() = user_id);

-- ===============================================
-- TRIGGERS FOR UPDATED_AT
-- ===============================================

-- Create trigger for updated_at
CREATE TRIGGER update_booking_settings_updated_at BEFORE UPDATE ON booking_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- STORED FUNCTIONS
-- ===============================================

-- Function to get booking settings with defaults
CREATE OR REPLACE FUNCTION get_booking_settings(p_user_id UUID, p_business_id UUID)
RETURNS TABLE (
    id UUID,
    advance_booking_days INTEGER,
    min_booking_notice_hours INTEGER,
    max_bookings_per_day INTEGER,
    max_bookings_per_slot INTEGER,
    default_slot_duration INTEGER,
    slot_buffer_minutes INTEGER,
    booking_window_start TIME,
    booking_window_end TIME,
    allow_same_day_booking BOOLEAN,
    allow_weekend_booking BOOLEAN,
    require_customer_info BOOLEAN,
    require_phone_number BOOLEAN,
    require_email_confirmation BOOLEAN,
    allow_customer_cancellation BOOLEAN,
    cancellation_notice_hours INTEGER,
    allow_customer_reschedule BOOLEAN,
    reschedule_notice_hours INTEGER,
    send_booking_confirmation BOOLEAN,
    send_reminder_email BOOLEAN,
    reminder_hours_before INTEGER,
    send_sms_reminders BOOLEAN,
    blackout_dates JSONB,
    special_hours JSONB,
    booking_instructions TEXT,
    terms_and_conditions TEXT,
    online_booking_enabled BOOLEAN,
    show_staff_names BOOLEAN,
    show_prices BOOLEAN,
    allow_service_selection BOOLEAN,
    require_deposit BOOLEAN,
    deposit_percentage DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bs.id,
        bs.advance_booking_days,
        bs.min_booking_notice_hours,
        bs.max_bookings_per_day,
        bs.max_bookings_per_slot,
        bs.default_slot_duration,
        bs.slot_buffer_minutes,
        bs.booking_window_start,
        bs.booking_window_end,
        bs.allow_same_day_booking,
        bs.allow_weekend_booking,
        bs.require_customer_info,
        bs.require_phone_number,
        bs.require_email_confirmation,
        bs.allow_customer_cancellation,
        bs.cancellation_notice_hours,
        bs.allow_customer_reschedule,
        bs.reschedule_notice_hours,
        bs.send_booking_confirmation,
        bs.send_reminder_email,
        bs.reminder_hours_before,
        bs.send_sms_reminders,
        bs.blackout_dates,
        bs.special_hours,
        bs.booking_instructions,
        bs.terms_and_conditions,
        bs.online_booking_enabled,
        bs.show_staff_names,
        bs.show_prices,
        bs.allow_service_selection,
        bs.require_deposit,
        bs.deposit_percentage
    FROM booking_settings bs
    WHERE bs.user_id = p_user_id 
        AND bs.business_id = p_business_id;
    
    -- If no settings found, return defaults
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            NULL::UUID as id,
            90 as advance_booking_days,
            2 as min_booking_notice_hours,
            20 as max_bookings_per_day,
            1 as max_bookings_per_slot,
            30 as default_slot_duration,
            15 as slot_buffer_minutes,
            '08:00:00'::TIME as booking_window_start,
            '18:00:00'::TIME as booking_window_end,
            true as allow_same_day_booking,
            false as allow_weekend_booking,
            true as require_customer_info,
            true as require_phone_number,
            true as require_email_confirmation,
            true as allow_customer_cancellation,
            24 as cancellation_notice_hours,
            true as allow_customer_reschedule,
            12 as reschedule_notice_hours,
            true as send_booking_confirmation,
            true as send_reminder_email,
            24 as reminder_hours_before,
            false as send_sms_reminders,
            '[]'::JSONB as blackout_dates,
            '{}'::JSONB as special_hours,
            NULL::TEXT as booking_instructions,
            NULL::TEXT as terms_and_conditions,
            true as online_booking_enabled,
            true as show_staff_names,
            true as show_prices,
            true as allow_service_selection,
            false as require_deposit,
            0.00::DECIMAL(5,2) as deposit_percentage;
    END IF;
END;
$$;

-- ===============================================
-- COMMENTS AND DOCUMENTATION
-- ===============================================

COMMENT ON TABLE booking_settings IS 'Business booking configuration and rules';
COMMENT ON FUNCTION get_booking_settings IS 'Returns booking settings with defaults if none exist';

-- Schema creation completed successfully
SELECT 'Booking Settings schema created successfully!' as result;