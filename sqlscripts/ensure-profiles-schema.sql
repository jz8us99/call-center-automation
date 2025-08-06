-- Ensure profiles table has all necessary columns for admin system
-- Run this in your Supabase SQL editor to add missing columns

-- First, let's see if the profiles table exists and what columns it has
-- You can run this to check: SELECT * FROM information_schema.columns WHERE table_name = 'profiles';

-- Add missing columns to profiles table if they don't exist
-- Note: You should check which columns already exist before running these

-- Add phone_number column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number VARCHAR;
  END IF;
END $$;

-- Add pricing_tier column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'pricing_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pricing_tier VARCHAR DEFAULT 'basic' CHECK (pricing_tier IN ('basic', 'premium', 'enterprise'));
  END IF;
END $$;

-- Add agent_types_allowed column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'agent_types_allowed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN agent_types_allowed TEXT[] DEFAULT ARRAY['inbound_call'];
  END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add business_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN business_name VARCHAR;
  END IF;
END $$;

-- Add business_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'business_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN business_type VARCHAR;
  END IF;
END $$;

-- Ensure we have proper indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_pricing_tier ON profiles(pricing_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Update existing profiles to have default values if they're null
UPDATE profiles 
SET 
  pricing_tier = COALESCE(pricing_tier, 'basic'),
  agent_types_allowed = COALESCE(agent_types_allowed, ARRAY['inbound_call']),
  is_active = COALESCE(is_active, true)
WHERE 
  pricing_tier IS NULL 
  OR agent_types_allowed IS NULL 
  OR is_active IS NULL;

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies for profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.user_id = auth.uid() 
      AND (admin_profile.role = 'admin' OR admin_profile.is_super_admin = true)
    )
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.user_id = auth.uid() 
      AND (admin_profile.role = 'admin' OR admin_profile.is_super_admin = true)
    )
  );

DROP POLICY IF EXISTS "Admins can insert all profiles" ON profiles;
CREATE POLICY "Admins can insert all profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.user_id = auth.uid() 
      AND (admin_profile.role = 'admin' OR admin_profile.is_super_admin = true)
    )
  );

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.user_id = auth.uid() 
      AND (admin_profile.role = 'admin' OR admin_profile.is_super_admin = true)
    )
  );