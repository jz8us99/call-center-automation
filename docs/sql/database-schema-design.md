# AI Voice Agent Configuration System - Database Schema Design

## Overview
This document outlines the database schema design for the new AI voice agent configuration system with appointment booking and call management features.

## Existing Tables
Based on codebase analysis, we have these existing tables:
- `customer_call_logs` - Stores call records and analytics
- `profiles` - User profile and role management  
- `agent_configs` - Basic agent-to-user mapping

## New Tables Required

### 1. Agent Configurations (Enhanced)
```sql
-- Enhanced agent configuration table
CREATE TABLE agent_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id VARCHAR NOT NULL, -- Retell agent ID
  agent_name VARCHAR NOT NULL,
  
  -- Business Information
  business_name VARCHAR NOT NULL,
  business_address TEXT,
  business_phone VARCHAR,
  business_email VARCHAR,
  business_website VARCHAR,
  business_type VARCHAR, -- 'clinic', 'dental', 'general'
  
  -- Contact Person
  contact_person_name VARCHAR,
  contact_person_role VARCHAR,
  contact_person_phone VARCHAR,
  contact_person_email VARCHAR,
  
  -- Agent Behavior Settings
  greeting_message TEXT,
  call_script TEXT,
  voice_settings JSONB, -- Voice configuration from Retell
  language VARCHAR DEFAULT 'en-US',
  
  -- Call Routing Settings
  forward_number VARCHAR, -- Office number for call forwarding
  forward_enabled BOOLEAN DEFAULT false,
  voicemail_enabled BOOLEAN DEFAULT true,
  voicemail_greeting TEXT,
  
  -- Business Hours
  business_hours JSONB, -- Store weekly schedule
  timezone VARCHAR DEFAULT 'UTC',
  
  -- Status and Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agent_configurations_user_id ON agent_configurations(user_id);
CREATE INDEX idx_agent_configurations_agent_id ON agent_configurations(agent_id);
CREATE UNIQUE INDEX idx_agent_configurations_unique ON agent_configurations(user_id, agent_id);
```

### 2. Staff Management
```sql
-- Staff members for scheduling
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_configuration_id UUID NOT NULL REFERENCES agent_configurations(id) ON DELETE CASCADE,
  
  -- Staff Information
  staff_name VARCHAR NOT NULL,
  staff_role VARCHAR, -- 'doctor', 'hygienist', 'nurse', 'receptionist'
  staff_email VARCHAR,
  staff_phone VARCHAR,
  
  -- Availability Settings
  is_bookable BOOLEAN DEFAULT true,
  default_appointment_duration INTEGER DEFAULT 30, -- minutes
  buffer_time_before INTEGER DEFAULT 0, -- minutes
  buffer_time_after INTEGER DEFAULT 0, -- minutes
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_staff_members_user_id ON staff_members(user_id);
CREATE INDEX idx_staff_members_agent_config ON staff_members(agent_configuration_id);
```

### 3. Staff Availability
```sql
-- Weekly recurring availability for staff
CREATE TABLE staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  
  -- Day and Time
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Break times (lunch, etc.)
  break_start_time TIME,
  break_end_time TIME,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_staff_availability_staff_member ON staff_availability(staff_member_id);
CREATE INDEX idx_staff_availability_day ON staff_availability(day_of_week);
```

### 4. Staff Time Off
```sql
-- Time off, holidays, out-of-office periods
CREATE TABLE staff_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  
  -- Time Off Details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME, -- For partial day off
  end_time TIME, -- For partial day off
  is_full_day BOOLEAN DEFAULT true,
  
  -- Reason and Notes
  reason VARCHAR, -- 'vacation', 'sick', 'conference', 'other'
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_staff_time_off_staff_member ON staff_time_off(staff_member_id);
CREATE INDEX idx_staff_time_off_dates ON staff_time_off(start_date, end_date);
```

### 5. Appointments
```sql
-- Appointment bookings made through AI agent
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id),
  call_log_id UUID REFERENCES customer_call_logs(id), -- Link to the call that made the booking
  
  -- Patient Information
  patient_name VARCHAR NOT NULL,
  patient_phone VARCHAR NOT NULL,
  patient_email VARCHAR,
  
  -- Appointment Details
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  appointment_type VARCHAR, -- 'consultation', 'cleaning', 'checkup', 'procedure'
  
  -- Status and Notes
  status VARCHAR NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'
  notes TEXT,
  special_requests TEXT,
  
  -- Confirmation and Reminders
  confirmation_sent BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_staff_member ON appointments(staff_member_id);
CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_call_log ON appointments(call_log_id);
```

### 6. Voicemails
```sql
-- Voicemail recordings and messages
CREATE TABLE voicemails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  agent_configuration_id UUID NOT NULL REFERENCES agent_configurations(id),
  call_log_id UUID REFERENCES customer_call_logs(id), -- Link to the call
  
  -- Caller Information
  caller_name VARCHAR,
  caller_phone VARCHAR NOT NULL,
  caller_email VARCHAR,
  
  -- Voicemail Content
  recording_url VARCHAR, -- URL to audio file
  transcript TEXT, -- AI-generated transcript
  duration_seconds INTEGER,
  
  -- Message Details
  message_type VARCHAR DEFAULT 'voicemail', -- 'voicemail', 'callback_request', 'information_request'
  priority VARCHAR DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  subject VARCHAR, -- AI-generated subject line
  
  -- Status
  status VARCHAR DEFAULT 'unread', -- 'unread', 'read', 'archived', 'deleted'
  is_urgent BOOLEAN DEFAULT false,
  
  -- Metadata
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_voicemails_user_id ON voicemails(user_id);
CREATE INDEX idx_voicemails_agent_config ON voicemails(agent_configuration_id);
CREATE INDEX idx_voicemails_status ON voicemails(status);
CREATE INDEX idx_voicemails_received_at ON voicemails(received_at);
CREATE INDEX idx_voicemails_call_log ON voicemails(call_log_id);
```

### 7. Call Scripts
```sql
-- Customizable call scripts for different scenarios
CREATE TABLE call_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  agent_configuration_id UUID REFERENCES agent_configurations(id),
  
  -- Script Details
  script_name VARCHAR NOT NULL,
  script_type VARCHAR NOT NULL, -- 'greeting', 'appointment', 'information', 'emergency', 'after_hours'
  script_content TEXT NOT NULL,
  
  -- Conditions for using this script
  conditions JSONB, -- When to use this script (time of day, day of week, etc.)
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_call_scripts_user_id ON call_scripts(user_id);
CREATE INDEX idx_call_scripts_agent_config ON call_scripts(agent_configuration_id);
CREATE INDEX idx_call_scripts_type ON call_scripts(script_type);
```

## Row Level Security (RLS) Policies

Each table should have RLS policies to ensure users can only access their own data:

```sql
-- Example RLS policy for agent_configurations
ALTER TABLE agent_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own agent configurations" 
ON agent_configurations 
FOR ALL 
USING (auth.uid() = user_id);

-- Similar policies needed for all tables with user_id
```

## Data Relationships

```
auth.users (1) -> profiles (1)
auth.users (1) -> agent_configurations (*)  
agent_configurations (1) -> staff_members (*)
staff_members (1) -> staff_availability (*)
staff_members (1) -> staff_time_off (*)
staff_members (1) -> appointments (*)
agent_configurations (1) -> voicemails (*)
agent_configurations (1) -> call_scripts (*)
customer_call_logs (1) -> appointments (0..1) -- Optional link
customer_call_logs (1) -> voicemails (0..1) -- Optional link
```

## Next Steps

1. Create migration scripts for each table
2. Set up RLS policies for data security
3. Create database functions for complex queries (availability checking, appointment scheduling)
4. Set up triggers for automatic timestamps and data validation
5. Create database views for common query patterns