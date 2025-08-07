-- Insurance Management Schema
-- For healthcare businesses to manage accepted insurance providers

-- Create insurance_providers table (master list)
CREATE TABLE IF NOT EXISTS insurance_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(255) NOT NULL UNIQUE,
    provider_code VARCHAR(50),
    provider_type VARCHAR(100), -- 'medical', 'dental', 'vision', 'mental_health'
    website VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_accepted_insurance table (what each business accepts)
CREATE TABLE IF NOT EXISTS business_accepted_insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insurance_provider_id UUID NOT NULL REFERENCES insurance_providers(id) ON DELETE CASCADE,
    
    -- Business-specific insurance details
    policy_notes TEXT, -- Special notes about this insurance
    copay_amount DECIMAL(10,2),
    requires_referral BOOLEAN DEFAULT false,
    network_status VARCHAR(50), -- 'in-network', 'out-of-network', 'preferred'
    effective_date DATE,
    expiration_date DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(business_id, insurance_provider_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_insurance_providers_type ON insurance_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_insurance_providers_active ON insurance_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_business_insurance_business_id ON business_accepted_insurance(business_id);
CREATE INDEX IF NOT EXISTS idx_business_insurance_user_id ON business_accepted_insurance(user_id);
CREATE INDEX IF NOT EXISTS idx_business_insurance_provider_id ON business_accepted_insurance(insurance_provider_id);
CREATE INDEX IF NOT EXISTS idx_business_insurance_active ON business_accepted_insurance(is_active);

-- Enable RLS
ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_accepted_insurance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for insurance_providers (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view insurance providers" ON insurance_providers
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for business_accepted_insurance
CREATE POLICY "Users can view their business insurance" ON business_accepted_insurance
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their business insurance" ON business_accepted_insurance
    FOR ALL USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_insurance_providers_updated_at BEFORE UPDATE ON insurance_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_accepted_insurance_updated_at BEFORE UPDATE ON business_accepted_insurance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert common insurance providers
INSERT INTO insurance_providers (provider_name, provider_code, provider_type) VALUES
-- Medical Insurance
('Blue Cross Blue Shield', 'BCBS', 'medical'),
('Aetna', 'AETNA', 'medical'),
('Cigna', 'CIGNA', 'medical'),
('UnitedHealthcare', 'UHC', 'medical'),
('Humana', 'HUMANA', 'medical'),
('Kaiser Permanente', 'KAISER', 'medical'),
('Anthem', 'ANTHEM', 'medical'),
('Medicare', 'MEDICARE', 'medical'),
('Medicaid', 'MEDICAID', 'medical'),
('Tricare', 'TRICARE', 'medical'),

-- Dental Insurance
('Delta Dental', 'DELTA', 'dental'),
('MetLife Dental', 'METLIFE', 'dental'),
('Cigna Dental', 'CIGNA_DENTAL', 'dental'),
('Aetna Dental', 'AETNA_DENTAL', 'dental'),
('Guardian Dental', 'GUARDIAN', 'dental'),

-- Vision Insurance
('VSP Vision Care', 'VSP', 'vision'),
('EyeMed', 'EYEMED', 'vision'),
('Davis Vision', 'DAVIS', 'vision'),

-- Mental Health
('Better Help Insurance', 'BETTERHELP', 'mental_health'),
('Talkspace Insurance', 'TALKSPACE', 'mental_health')
ON CONFLICT (provider_name) DO NOTHING;

-- Grant permissions
GRANT ALL ON insurance_providers TO authenticated;
GRANT ALL ON insurance_providers TO service_role;
GRANT ALL ON business_accepted_insurance TO authenticated;
GRANT ALL ON business_accepted_insurance TO service_role;

-- Success message
SELECT 'Insurance management schema created successfully!' as result;