-- Appointment Booking System Database Schema
-- Extends the staff calendar system with complete appointment booking functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Appointment System Tables
-- =====================================================

-- Customers table - store customer information
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL, -- References clients table
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Business owner
  
  -- Customer details
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  
  -- Address information
  street_address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'US',
  
  -- Customer preferences and notes
  preferences JSONB DEFAULT '{}', -- Scheduling preferences, communication preferences
  medical_notes TEXT, -- For healthcare businesses
  allergies TEXT,
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  
  -- Insurance information (for healthcare)
  insurance_provider VARCHAR(200),
  insurance_policy_number VARCHAR(100),
  insurance_group_number VARCHAR(100),
  
  -- Customer status and metadata
  is_active BOOLEAN DEFAULT true,
  customer_since DATE DEFAULT CURRENT_DATE,
  last_appointment_date DATE,
  total_appointments INTEGER DEFAULT 0,
  no_show_count INTEGER DEFAULT 0,
  late_cancel_count INTEGER DEFAULT 0,
  
  -- Marketing preferences
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(business_id, email),
  UNIQUE(business_id, phone)
);

-- Appointment types table - define services/appointment types
CREATE TABLE IF NOT EXISTS appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL, -- References clients table
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Appointment type details
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- e.g., 'consultation', 'treatment', 'follow-up'
  
  -- Duration and scheduling
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_before_minutes INTEGER DEFAULT 0, -- Prep time before appointment
  buffer_after_minutes INTEGER DEFAULT 0, -- Clean-up time after appointment
  
  -- Pricing
  price DECIMAL(10,2),
  deposit_required DECIMAL(10,2) DEFAULT 0,
  
  -- Booking rules
  advance_booking_days INTEGER DEFAULT 1, -- Minimum days in advance
  max_advance_booking_days INTEGER DEFAULT 90, -- Maximum days in advance
  same_day_booking BOOLEAN DEFAULT true,
  online_booking_enabled BOOLEAN DEFAULT true,
  
  -- Staff requirements
  requires_specific_staff BOOLEAN DEFAULT false,
  allowed_staff_ids JSONB DEFAULT '[]', -- Array of staff IDs who can perform this service
  
  -- Customer requirements
  new_customer_only BOOLEAN DEFAULT false,
  returning_customer_only BOOLEAN DEFAULT false,
  requires_referral BOOLEAN DEFAULT false,
  
  -- Display and availability
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  booking_instructions TEXT,
  color_code VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for calendar display
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(business_id, name)
);

-- Appointments table - main appointment records
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL, -- References clients table
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Business owner
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL, -- References staff table
  appointment_type_id UUID REFERENCES appointment_types(id),
  
  -- Appointment scheduling
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Appointment details
  title VARCHAR(300),
  notes TEXT, -- Internal notes for staff
  customer_notes TEXT, -- Notes from customer
  preparation_instructions TEXT, -- What customer should do before appointment
  
  -- Status management
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'in_progress', 'completed', 
    'cancelled', 'no_show', 'rescheduled'
  )),
  
  -- Booking information
  booking_source VARCHAR(50) DEFAULT 'online', -- 'online', 'phone', 'walk-in', 'admin'
  booked_by UUID REFERENCES auth.users(id), -- Who created the appointment
  booking_ip_address INET,
  
  -- Confirmation and reminders
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  customer_confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Check-in and completion
  checked_in_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Cancellation information
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  cancelled_by_customer BOOLEAN DEFAULT false,
  
  -- Rescheduling tracking
  original_appointment_id UUID REFERENCES appointments(id),
  reschedule_count INTEGER DEFAULT 0,
  
  -- Payment information
  total_amount DECIMAL(10,2) DEFAULT 0,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'partial', 'paid', 'refunded', 'cancelled'
  )),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(200),
  
  -- Follow-up information
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints to prevent double booking
  UNIQUE(staff_id, appointment_date, start_time)
);

-- Appointment history table - track all changes to appointments
CREATE TABLE IF NOT EXISTS appointment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  
  -- Change tracking
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'cancelled', 'rescheduled', 'completed'
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- What changed
  field_name VARCHAR(100), -- Which field was changed
  old_value TEXT, -- Previous value
  new_value TEXT, -- New value
  change_reason TEXT, -- Why the change was made
  
  -- Full record snapshot for major changes
  appointment_snapshot JSONB, -- Complete appointment data at time of change
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointment reminders table - manage reminder scheduling
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  business_id UUID NOT NULL,
  
  -- Reminder details
  reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('email', 'sms', 'call')),
  send_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hours_before INTEGER NOT NULL, -- How many hours before appointment
  
  -- Message content
  subject VARCHAR(300),
  message_template TEXT,
  message_variables JSONB DEFAULT '{}',
  
  -- Delivery tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'delivered', 'failed', 'cancelled'
  )),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  
  -- Response tracking
  customer_responded BOOLEAN DEFAULT false,
  customer_response TEXT,
  response_action VARCHAR(50), -- 'confirmed', 'rescheduled', 'cancelled'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointment feedback table - collect customer feedback
CREATE TABLE IF NOT EXISTS appointment_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL,
  
  -- Ratings (1-5 scale)
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  staff_rating INTEGER CHECK (staff_rating BETWEEN 1 AND 5),
  facility_rating INTEGER CHECK (facility_rating BETWEEN 1 AND 5),
  scheduling_rating INTEGER CHECK (scheduling_rating BETWEEN 1 AND 5),
  
  -- Written feedback
  positive_feedback TEXT,
  improvement_suggestions TEXT,
  would_recommend BOOLEAN,
  
  -- Feedback metadata
  feedback_source VARCHAR(50) DEFAULT 'email', -- 'email', 'sms', 'website', 'phone'
  is_anonymous BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business appointment settings table - configure appointment rules per business
CREATE TABLE IF NOT EXISTS business_appointment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Booking window settings
  min_advance_hours INTEGER DEFAULT 24, -- Minimum hours in advance for booking
  max_advance_days INTEGER DEFAULT 90, -- Maximum days in advance for booking
  same_day_booking_enabled BOOLEAN DEFAULT true,
  
  -- Time slot settings
  slot_duration_minutes INTEGER DEFAULT 30, -- Default appointment slot duration
  buffer_between_appointments INTEGER DEFAULT 15, -- Buffer time between appointments
  
  -- Booking limits
  max_appointments_per_day INTEGER, -- Limit appointments per day
  max_appointments_per_customer_per_day INTEGER DEFAULT 1,
  
  -- Cancellation policy
  cancellation_hours_before INTEGER DEFAULT 24, -- Hours before appointment for free cancellation
  late_cancellation_fee DECIMAL(10,2) DEFAULT 0,
  no_show_fee DECIMAL(10,2) DEFAULT 0,
  
  -- Confirmation settings
  auto_confirm_appointments BOOLEAN DEFAULT true,
  require_customer_confirmation BOOLEAN DEFAULT false,
  confirmation_timeout_hours INTEGER DEFAULT 24,
  
  -- Reminder settings
  send_email_reminders BOOLEAN DEFAULT true,
  send_sms_reminders BOOLEAN DEFAULT false,
  reminder_hours_before JSONB DEFAULT '[24, 2]', -- Array of hours before appointment
  
  -- Online booking settings
  online_booking_enabled BOOLEAN DEFAULT true,
  require_customer_account BOOLEAN DEFAULT false,
  allow_guest_booking BOOLEAN DEFAULT true,
  booking_page_message TEXT,
  
  -- Payment settings
  require_deposit BOOLEAN DEFAULT false,
  default_deposit_percentage DECIMAL(5,2) DEFAULT 0,
  payment_required_at_booking BOOLEAN DEFAULT false,
  
  -- Working hours override (if different from staff working hours)
  override_staff_hours BOOLEAN DEFAULT false,
  booking_start_time TIME DEFAULT '09:00:00',
  booking_end_time TIME DEFAULT '17:00:00',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(business_id, email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(business_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

-- Appointment types indexes
CREATE INDEX IF NOT EXISTS idx_appointment_types_business_id ON appointment_types(business_id);
CREATE INDEX IF NOT EXISTS idx_appointment_types_user_id ON appointment_types(user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_types_active ON appointment_types(is_active);
CREATE INDEX IF NOT EXISTS idx_appointment_types_category ON appointment_types(category);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_type_id ON appointments(appointment_type_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_date, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_date ON appointments(staff_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_date ON appointments(customer_id, appointment_date);

-- Appointment history indexes
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment_id ON appointment_history(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_changed_at ON appointment_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_appointment_history_action ON appointment_history(action);

-- Appointment reminders indexes
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment_id ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_send_at ON appointment_reminders(send_at);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_status ON appointment_reminders(status);

-- Appointment feedback indexes
CREATE INDEX IF NOT EXISTS idx_appointment_feedback_appointment_id ON appointment_feedback(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_feedback_customer_id ON appointment_feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointment_feedback_business_id ON appointment_feedback(business_id);

-- Business appointment settings indexes
CREATE INDEX IF NOT EXISTS idx_business_appointment_settings_business_id ON business_appointment_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_business_appointment_settings_user_id ON business_appointment_settings(user_id);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_appointment_settings ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "Users can view their business customers" ON customers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their business customers" ON customers
  FOR ALL USING (user_id = auth.uid());

-- Appointment types policies
CREATE POLICY "Users can view their appointment types" ON appointment_types
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their appointment types" ON appointment_types
  FOR ALL USING (user_id = auth.uid());

-- Appointments policies
CREATE POLICY "Users can view their business appointments" ON appointments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their business appointments" ON appointments
  FOR ALL USING (user_id = auth.uid());

-- Allow public booking for scheduled appointments (for booking interface)
CREATE POLICY "Public can create appointments" ON appointments
  FOR INSERT WITH CHECK (status = 'scheduled');

-- Appointment history policies
CREATE POLICY "Users can view their appointment history" ON appointment_history
  FOR SELECT USING (
    appointment_id IN (SELECT id FROM appointments WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage their appointment history" ON appointment_history
  FOR ALL USING (
    appointment_id IN (SELECT id FROM appointments WHERE user_id = auth.uid())
  );

-- Appointment reminders policies
CREATE POLICY "Users can view their appointment reminders" ON appointment_reminders
  FOR SELECT USING (
    appointment_id IN (SELECT id FROM appointments WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage their appointment reminders" ON appointment_reminders
  FOR ALL USING (
    appointment_id IN (SELECT id FROM appointments WHERE user_id = auth.uid())
  );

-- Service role can manage reminders (for automated sending)
CREATE POLICY "Service role can manage reminders" ON appointment_reminders
  FOR ALL USING (auth.role() = 'service_role');

-- Appointment feedback policies
CREATE POLICY "Users can view their appointment feedback" ON appointment_feedback
  FOR SELECT USING (
    appointment_id IN (SELECT id FROM appointments WHERE user_id = auth.uid())
  );

CREATE POLICY "Customers can create feedback" ON appointment_feedback
  FOR INSERT WITH CHECK (true); -- Allow anyone to create feedback

CREATE POLICY "Users can manage their appointment feedback" ON appointment_feedback
  FOR ALL USING (
    appointment_id IN (SELECT id FROM appointments WHERE user_id = auth.uid())
  );

-- Business appointment settings policies
CREATE POLICY "Users can view their appointment settings" ON business_appointment_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their appointment settings" ON business_appointment_settings
  FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- Triggers for updated_at
-- =====================================================

-- Create triggers for updated_at columns
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_types_updated_at BEFORE UPDATE ON appointment_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_reminders_updated_at BEFORE UPDATE ON appointment_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_appointment_settings_updated_at BEFORE UPDATE ON business_appointment_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Utility Functions
-- =====================================================

-- Function to get available time slots for a staff member on a specific date
CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_staff_id UUID,
  p_date DATE,
  p_duration_minutes INTEGER DEFAULT 30,
  p_buffer_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
  slot_time TIME,
  slot_end_time TIME,
  is_available BOOLEAN
) AS $$
DECLARE
  v_availability RECORD;
  v_current_time TIME;
  v_slot_end TIME;
  v_working_start TIME;
  v_working_end TIME;
  v_lunch_start TIME;
  v_lunch_end TIME;
  v_has_conflict BOOLEAN;
BEGIN
  -- Get staff availability for the date
  SELECT * INTO v_availability
  FROM staff_availability sa
  JOIN staff_calendars sc ON sa.calendar_id = sc.id
  WHERE sa.staff_id = p_staff_id
    AND sa.date = p_date
    AND sa.is_available = true;
  
  -- If no availability record found, return empty
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  v_working_start := v_availability.start_time;
  v_working_end := v_availability.end_time;
  
  -- Get lunch break times from staff config
  SELECT lunch_break_start, lunch_break_end 
  INTO v_lunch_start, v_lunch_end
  FROM staff_calendar_configs
  WHERE staff_id = p_staff_id;
  
  -- Generate time slots
  v_current_time := v_working_start;
  
  WHILE v_current_time + (p_duration_minutes || ' minutes')::INTERVAL <= v_working_end LOOP
    v_slot_end := v_current_time + (p_duration_minutes || ' minutes')::INTERVAL;
    
    -- Check if slot conflicts with lunch break
    v_has_conflict := false;
    IF v_lunch_start IS NOT NULL AND v_lunch_end IS NOT NULL THEN
      IF v_current_time < v_lunch_end AND v_slot_end > v_lunch_start THEN
        v_has_conflict := true;
      END IF;
    END IF;
    
    -- Check for existing appointments
    IF NOT v_has_conflict THEN
      SELECT EXISTS(
        SELECT 1 FROM appointments 
        WHERE staff_id = p_staff_id 
          AND appointment_date = p_date
          AND status NOT IN ('cancelled', 'no_show')
          AND (
            (start_time <= v_current_time AND end_time > v_current_time) OR
            (start_time < v_slot_end AND end_time >= v_slot_end) OR
            (start_time >= v_current_time AND end_time <= v_slot_end)
          )
      ) INTO v_has_conflict;
    END IF;
    
    -- Return the slot
    slot_time := v_current_time;
    slot_end_time := v_slot_end;
    is_available := NOT v_has_conflict;
    
    RETURN NEXT;
    
    -- Move to next slot
    v_current_time := v_current_time + ((p_duration_minutes + p_buffer_minutes) || ' minutes')::INTERVAL;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if an appointment slot is available
CREATE OR REPLACE FUNCTION is_appointment_slot_available(
  p_staff_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_staff_available BOOLEAN := false;
  v_has_conflict BOOLEAN := false;
BEGIN
  -- Check if staff is available during this time
  SELECT is_staff_available(p_staff_id, p_date, p_start_time, p_end_time) INTO v_staff_available;
  
  IF NOT v_staff_available THEN
    RETURN false;
  END IF;
  
  -- Check for conflicting appointments
  SELECT EXISTS(
    SELECT 1 FROM appointments 
    WHERE staff_id = p_staff_id 
      AND appointment_date = p_date
      AND status NOT IN ('cancelled', 'no_show')
      AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
      AND (
        (start_time <= p_start_time AND end_time > p_start_time) OR
        (start_time < p_end_time AND end_time >= p_end_time) OR
        (start_time >= p_start_time AND end_time <= p_end_time)
      )
  ) INTO v_has_conflict;
  
  RETURN NOT v_has_conflict;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create appointment history record
CREATE OR REPLACE FUNCTION create_appointment_history(
  p_appointment_id UUID,
  p_action VARCHAR(50),
  p_changed_by UUID DEFAULT NULL,
  p_field_name VARCHAR(100) DEFAULT NULL,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_history_id UUID;
  v_appointment_snapshot JSONB;
BEGIN
  -- Get current appointment data for snapshot
  SELECT to_jsonb(a.*) INTO v_appointment_snapshot
  FROM appointments a
  WHERE a.id = p_appointment_id;
  
  -- Insert history record
  INSERT INTO appointment_history (
    appointment_id,
    action,
    changed_by,
    field_name,
    old_value,
    new_value,
    change_reason,
    appointment_snapshot
  ) VALUES (
    p_appointment_id,
    p_action,
    p_changed_by,
    p_field_name,
    p_old_value,
    p_new_value,
    p_change_reason,
    v_appointment_snapshot
  ) RETURNING id INTO v_history_id;
  
  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update customer appointment statistics
CREATE OR REPLACE FUNCTION update_customer_appointment_stats(p_customer_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE customers SET
    total_appointments = (
      SELECT COUNT(*) FROM appointments 
      WHERE customer_id = p_customer_id 
      AND status IN ('completed', 'scheduled', 'confirmed')
    ),
    last_appointment_date = (
      SELECT MAX(appointment_date) FROM appointments 
      WHERE customer_id = p_customer_id 
      AND status = 'completed'
    ),
    no_show_count = (
      SELECT COUNT(*) FROM appointments 
      WHERE customer_id = p_customer_id 
      AND status = 'no_show'
    ),
    late_cancel_count = (
      SELECT COUNT(*) FROM appointments 
      WHERE customer_id = p_customer_id 
      AND status = 'cancelled'
      AND cancelled_at > (appointment_date + start_time - INTERVAL '24 hours')
    )
  WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default appointment types for common businesses
INSERT INTO appointment_types (business_id, user_id, name, description, duration_minutes, price) 
SELECT 
  c.id as business_id,
  c.user_id,
  'General Consultation' as name,
  'Initial consultation and assessment' as description,
  30 as duration_minutes,
  100.00 as price
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM appointment_types at 
  WHERE at.business_id = c.id 
  AND at.name = 'General Consultation'
);

-- Insert default business appointment settings
INSERT INTO business_appointment_settings (business_id, user_id)
SELECT 
  c.id as business_id,
  c.user_id
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM business_appointment_settings bas 
  WHERE bas.business_id = c.id
);