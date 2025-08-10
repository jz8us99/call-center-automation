-- Create business_services table if it doesn't exist
CREATE TABLE IF NOT EXISTS business_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_type VARCHAR(100),
  service_name VARCHAR(255) NOT NULL,
  service_description TEXT,
  price DECIMAL(10, 2),
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for business_services
CREATE INDEX IF NOT EXISTS idx_business_services_user_id ON business_services(user_id);
CREATE INDEX IF NOT EXISTS idx_business_services_business_type ON business_services(business_type);
CREATE INDEX IF NOT EXISTS idx_business_services_user_type ON business_services(user_id, business_type);

-- Enable RLS
ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_services
CREATE POLICY "Users can view own business services" ON business_services
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own business services" ON business_services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business services" ON business_services
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own business services" ON business_services
  FOR DELETE USING (auth.uid() = user_id);

-- Check if business_products table exists and has correct structure
DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'business_products' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE business_products 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Update RLS policies for business_products if needed
DROP POLICY IF EXISTS "Users can view own business products" ON business_products;
CREATE POLICY "Users can view own business products" ON business_products
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can create own business products" ON business_products;
CREATE POLICY "Users can create own business products" ON business_products
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update own business products" ON business_products;
CREATE POLICY "Users can update own business products" ON business_products
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete own business products" ON business_products;
CREATE POLICY "Users can delete own business products" ON business_products
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for business_services
DROP TRIGGER IF EXISTS update_business_services_updated_at ON business_services;
CREATE TRIGGER update_business_services_updated_at
  BEFORE UPDATE ON business_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();