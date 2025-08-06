-- Safe Schema Fix - Step by Step Approach
-- Run each section separately to identify issues

-- =====================================================
-- STEP 1: Check what tables exist
-- =====================================================
-- Run this first to see what we're working with
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('clients', 'agent_types', 'business_types', 'agent_templates', 'business_type_agent_template_map');

-- =====================================================
-- STEP 2: Check if problematic data exists
-- =====================================================
-- Check for duplicate templates that might cause the subquery error
SELECT name, COUNT(*) as count 
FROM agent_templates 
WHERE name IN ('Dental Office Receptionist', 'Law Office Receptionist')
GROUP BY name
HAVING COUNT(*) > 1;

-- =====================================================  
-- STEP 3: Safe cleanup (only run if step 2 shows duplicates)
-- =====================================================
-- Only delete if there are actual duplicates
-- DELETE FROM business_type_agent_template_map WHERE template_id IN (
--   SELECT id FROM agent_templates 
--   WHERE name IN ('Dental Office Receptionist', 'Law Office Receptionist')
-- );
-- 
-- DELETE FROM agent_templates 
-- WHERE name IN ('Dental Office Receptionist', 'Law Office Receptionist');

-- =====================================================
-- STEP 4: Check clients table structure
-- =====================================================
-- See what columns already exist in clients table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 5: Add missing columns one by one (safer approach)
-- =====================================================
-- Add columns individually to see which one fails

-- Basic contact fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_website VARCHAR;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person_name VARCHAR;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person_role VARCHAR;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person_phone VARCHAR;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person_email VARCHAR;

-- JSONB fields for comprehensive data
ALTER TABLE clients ADD COLUMN IF NOT EXISTS products_services JSONB DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pricing_information JSONB DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS return_policy TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}';

-- Business-specific fields  
ALTER TABLE clients ADD COLUMN IF NOT EXISTS insurance_accepted JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS service_areas JSONB DEFAULT '[]';

-- File and media fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_documents JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_images JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS logo_url VARCHAR;

-- Content fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS common_questions JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS appointment_types JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS staff_information JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS promotional_content TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS compliance_notes TEXT;