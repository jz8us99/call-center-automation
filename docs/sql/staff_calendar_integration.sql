-- Staff Calendar Integration Schema
-- This table stores external calendar connections for staff members

-- Create calendar providers enum
CREATE TYPE calendar_provider AS ENUM ('google', 'outlook', 'calendly');

-- Create calendar credentials table
CREATE TABLE staff_calendar_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    provider calendar_provider NOT NULL,
    provider_user_id VARCHAR(255), -- External calendar user ID
    provider_email VARCHAR(255), -- Calendar email
    access_token TEXT, -- Encrypted access token
    refresh_token TEXT, -- Encrypted refresh token
    token_expires_at TIMESTAMP WITH TIME ZONE,
    calendar_id VARCHAR(255), -- Primary calendar ID to sync
    calendar_name VARCHAR(255), -- Calendar display name
    sync_enabled BOOLEAN DEFAULT true,
    sync_direction VARCHAR(20) DEFAULT 'bidirectional', -- 'inbound', 'outbound', 'bidirectional'
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_errors JSONB, -- Store any sync error details
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Note: Unique constraint on active connections enforced by unique index below
);

-- Create calendar sync events table
CREATE TABLE staff_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id UUID NOT NULL REFERENCES staff_calendar_credentials(id) ON DELETE CASCADE,
    external_event_id VARCHAR(255) NOT NULL, -- Event ID from external calendar
    title VARCHAR(500),
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_busy BOOLEAN DEFAULT true, -- Whether this blocks availability
    event_type VARCHAR(50) DEFAULT 'appointment', -- 'appointment', 'break', 'meeting', etc.
    attendees JSONB, -- Store attendee information
    location VARCHAR(255),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(255), -- RRULE for recurring events
    external_updated_at TIMESTAMP WITH TIME ZONE,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique external events per credential
    UNIQUE(credential_id, external_event_id)
);

-- Create availability slots table (computed from calendar events)
CREATE TABLE staff_availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    slot_type VARCHAR(50) DEFAULT 'appointment', -- 'appointment', 'break', 'lunch', etc.
    created_by_calendar BOOLEAN DEFAULT false, -- Whether this was created from calendar sync
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Note: Overlapping slot prevention would require btree_gist extension
    -- Can be enforced at application level or with custom constraint function
);

-- Create calendar sync log table
CREATE TABLE calendar_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id UUID NOT NULL REFERENCES staff_calendar_credentials(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'manual'
    sync_direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound', 'bidirectional'
    events_processed INTEGER DEFAULT 0,
    events_created INTEGER DEFAULT 0,
    events_updated INTEGER DEFAULT 0,
    events_deleted INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'partial'
    error_details JSONB,
    sync_duration_ms INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_staff_calendar_credentials_staff_provider ON staff_calendar_credentials(staff_id, provider);
CREATE INDEX idx_staff_calendar_credentials_business ON staff_calendar_credentials(business_id);

-- Partial unique index to ensure one active connection per staff per provider
CREATE UNIQUE INDEX idx_staff_calendar_credentials_unique_active 
ON staff_calendar_credentials(staff_id, provider) 
WHERE is_active = true;
CREATE INDEX idx_staff_calendar_events_credential ON staff_calendar_events(credential_id);
CREATE INDEX idx_staff_calendar_events_time_range ON staff_calendar_events(start_time, end_time);
CREATE INDEX idx_staff_availability_slots_staff_date ON staff_availability_slots(staff_id, slot_date);
CREATE INDEX idx_staff_availability_slots_business_date ON staff_availability_slots(business_id, slot_date);
CREATE INDEX idx_calendar_sync_logs_credential ON calendar_sync_logs(credential_id);

-- Enable Row Level Security
ALTER TABLE staff_calendar_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar credentials
CREATE POLICY "Users can manage their business calendar credentials" ON staff_calendar_credentials
    FOR ALL USING (
        business_id IN (
            SELECT id FROM business_profiles WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for calendar events
CREATE POLICY "Users can view their business calendar events" ON staff_calendar_events
    FOR ALL USING (
        credential_id IN (
            SELECT id FROM staff_calendar_credentials 
            WHERE business_id IN (
                SELECT id FROM business_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- RLS Policies for availability slots
CREATE POLICY "Users can manage their business availability slots" ON staff_availability_slots
    FOR ALL USING (
        business_id IN (
            SELECT id FROM business_profiles WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for sync logs
CREATE POLICY "Users can view their business sync logs" ON calendar_sync_logs
    FOR SELECT USING (
        credential_id IN (
            SELECT id FROM staff_calendar_credentials 
            WHERE business_id IN (
                SELECT id FROM business_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_staff_calendar_credentials_updated_at 
    BEFORE UPDATE ON staff_calendar_credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_calendar_events_updated_at 
    BEFORE UPDATE ON staff_calendar_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_availability_slots_updated_at 
    BEFORE UPDATE ON staff_availability_slots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();