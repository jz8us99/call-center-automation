-- Business Locations Schema
-- Extends business profiles to support multiple locations

-- Create business_locations table
CREATE TABLE IF NOT EXISTS business_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Location details
    location_name VARCHAR(255) NOT NULL, -- e.g., "Downtown Branch", "Main Office"
    is_primary BOOLEAN DEFAULT false,
    
    -- Address information
    street_address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'US',
    
    -- Contact information
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Location-specific settings
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    business_hours JSONB DEFAULT '{}', -- Store weekly hours
    
    -- Location status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(business_id, location_name)
);

-- Create indexes for business_locations
CREATE INDEX IF NOT EXISTS idx_business_locations_business_id ON business_locations(business_id);
CREATE INDEX IF NOT EXISTS idx_business_locations_user_id ON business_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_business_locations_is_primary ON business_locations(is_primary);
CREATE INDEX IF NOT EXISTS idx_business_locations_is_active ON business_locations(is_active);

-- Enable RLS for business_locations
ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_locations
CREATE POLICY "Users can view their business locations" ON business_locations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their business locations" ON business_locations
    FOR ALL USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_locations_updated_at BEFORE UPDATE ON business_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add location_id to existing tables that need location context
-- Update staff_members table to include location_id
ALTER TABLE staff_members 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES business_locations(id);

-- Update appointments table to include location_id
ALTER TABLE appointment_bookings 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES business_locations(id);

-- Create indexes for new location references
CREATE INDEX IF NOT EXISTS idx_staff_members_location_id ON staff_members(location_id);
CREATE INDEX IF NOT EXISTS idx_appointment_bookings_location_id ON appointment_bookings(location_id);

-- Insert default location for existing businesses
INSERT INTO business_locations (business_id, user_id, location_name, is_primary, street_address, phone, email, website, is_active)
SELECT 
    bp.id as business_id,
    bp.user_id,
    'Main Location' as location_name,
    true as is_primary,
    bp.business_address as street_address,
    bp.business_phone as phone,
    bp.business_email as email,
    bp.business_website as website,
    true as is_active
FROM business_profiles bp
WHERE NOT EXISTS (
    SELECT 1 FROM business_locations bl 
    WHERE bl.business_id = bp.id
);

-- Grant permissions
GRANT ALL ON business_locations TO authenticated;
GRANT ALL ON business_locations TO service_role;

-- Success message
SELECT 'Business locations schema created successfully!' as result;