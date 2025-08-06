-- Enhanced Job Type Management Schema
-- This creates a comprehensive system for managing business service types, job types, and staff assignments

-- Drop existing tables to recreate with enhanced structure
DROP TABLE IF EXISTS staff_job_assignments;
DROP TABLE IF EXISTS job_types;

-- Business Service Types (e.g., Dental, Medical, Handyman, etc.)
CREATE TABLE IF NOT EXISTS business_service_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type_code VARCHAR(50) UNIQUE NOT NULL, -- 'dental', 'medical', 'handyman', etc.
  service_type_name VARCHAR(100) NOT NULL, -- 'Dental Office', 'Medical Clinic', etc.
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Categories (optional grouping within service types)
CREATE TABLE IF NOT EXISTS job_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type_code VARCHAR(50) NOT NULL REFERENCES business_service_types(service_type_code),
  category_name VARCHAR(100) NOT NULL, -- 'Diagnostics', 'Repairs', 'Installation', etc.
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Job Types with durations and categories
CREATE TABLE IF NOT EXISTS job_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type_code VARCHAR(50) NOT NULL REFERENCES business_service_types(service_type_code),
  category_id UUID REFERENCES job_categories(id), -- Optional category
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Owner of custom job types
  
  -- Job Details
  job_name VARCHAR(200) NOT NULL,
  job_description TEXT,
  default_duration_minutes INTEGER NOT NULL DEFAULT 30, -- Default duration
  
  -- Pricing (optional)
  default_price DECIMAL(10,2),
  price_currency VARCHAR(3) DEFAULT 'USD',
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  is_system_default BOOLEAN DEFAULT true, -- System vs custom job types
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique job names per service type per user
  UNIQUE(service_type_code, job_name, user_id)
);

-- Staff to Job Type Assignments with custom durations
CREATE TABLE IF NOT EXISTS staff_job_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  job_type_id UUID NOT NULL REFERENCES job_types(id) ON DELETE CASCADE,
  
  -- Custom overrides for this staff member
  custom_duration_minutes INTEGER, -- Override default duration
  custom_price DECIMAL(10,2), -- Override default price
  proficiency_level VARCHAR(20) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'expert'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  notes TEXT, -- Additional notes about this assignment
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique assignments
  UNIQUE(staff_id, job_type_id)
);

-- Insert predefined business service types
INSERT INTO business_service_types (service_type_code, service_type_name, description) VALUES
('dental', 'Dental Office', 'Dental care and oral health services'),
('medical', 'Medical Clinic', 'General medical care and health services'),
('handyman', 'Handyman Services', 'Home repair and maintenance services'),
('contractor', 'Contractor Services', 'Construction and renovation services'),
('pet_grooming', 'Pet Grooming', 'Pet care and grooming services'),
('auto_service', 'Auto Service', 'Vehicle maintenance and repair services'),
('beauty_salon', 'Beauty Salon', 'Hair, nail, and beauty services'),
('fitness', 'Fitness Center', 'Fitness training and wellness services'),
('legal', 'Legal Services', 'Legal consultation and representation'),
('veterinary', 'Veterinary Clinic', 'Veterinary care for animals')
ON CONFLICT (service_type_code) DO NOTHING;

-- Insert job categories for different service types
INSERT INTO job_categories (service_type_code, category_name, description, display_order) VALUES
-- Dental categories
('dental', 'Preventive Care', 'Routine checkups and preventive treatments', 1),
('dental', 'Restorative', 'Fillings, crowns, and restorative procedures', 2),
('dental', 'Surgical', 'Extractions and oral surgery', 3),
('dental', 'Cosmetic', 'Aesthetic dental procedures', 4),
('dental', 'Orthodontics', 'Braces and teeth alignment', 5),

-- Medical categories
('medical', 'Diagnostics', 'Tests and examinations', 1),
('medical', 'Preventive', 'Vaccinations and health screenings', 2),
('medical', 'Treatment', 'Medical treatments and procedures', 3),
('medical', 'Consultation', 'Medical consultations and advice', 4),

-- Handyman categories
('handyman', 'Installation', 'Installing fixtures and equipment', 1),
('handyman', 'Repairs', 'Fixing and maintaining items', 2),
('handyman', 'Maintenance', 'Regular upkeep and servicing', 3),

-- Contractor categories
('contractor', 'Assessment', 'Evaluations and consultations', 1),
('contractor', 'Installation', 'Installing systems and structures', 2),
('contractor', 'Renovation', 'Remodeling and renovation work', 3),
('contractor', 'Inspection', 'Safety and quality inspections', 4)
ON CONFLICT DO NOTHING;

-- Insert comprehensive job types with realistic durations
INSERT INTO job_types (service_type_code, category_id, job_name, job_description, default_duration_minutes, default_price, is_system_default, display_order) VALUES

-- DENTAL OFFICE JOB TYPES
('dental', (SELECT id FROM job_categories WHERE service_type_code = 'dental' AND category_name = 'Preventive Care'), 'Teeth Cleaning', 'Professional teeth cleaning and plaque removal', 60, 120.00, true, 1),
('dental', (SELECT id FROM job_categories WHERE service_type_code = 'dental' AND category_name = 'Preventive Care'), 'Oral Exam', 'Comprehensive oral health examination', 30, 85.00, true, 2),
('dental', (SELECT id FROM job_categories WHERE service_type_code = 'dental' AND category_name = 'Preventive Care'), 'X-Ray Imaging', 'Dental X-rays for diagnosis', 15, 45.00, true, 3),
('dental', (SELECT id FROM job_categories WHERE service_type_code = 'dental' AND category_name = 'Preventive Care'), 'Fluoride Treatment', 'Fluoride application for cavity prevention', 20, 35.00, true, 4),

('dental', (SELECT id FROM job_categories WHERE service_type_code = 'dental' AND category_name = 'Restorative'), 'Tooth Filling', 'Cavity filling with composite or amalgam', 45, 165.00, true, 5),
('dental', (SELECT id FROM job_categories WHERE service_type_code = 'dental' AND category_name = 'Restorative'), 'Crown Placement', 'Dental crown installation', 90, 950.00, true, 6),
('dental', (SELECT id FROM job_categories WHERE service_type_code = 'dental' AND category_name = 'Restorative'), 'Root Canal', 'Root canal therapy treatment', 120, 850.00, true, 7),

('dental', (SELECT id FROM job_categories WHERE service_type_code = 'dental' AND category_name = 'Surgical'), 'Tooth Extraction', 'Simple or surgical tooth removal', 60, 175.00, true, 8),
('dental', (SELECT id FROM job_categories WHERE service_type_code = 'dental' AND category_name = 'Surgical'), 'Wisdom Tooth Removal', 'Wisdom tooth extraction', 90, 285.00, true, 9),

('dental', (SELECT id FROM job_categories WHERE service_type_code = 'dental' AND category_name = 'Cosmetic'), 'Teeth Whitening', 'Professional teeth whitening treatment', 75, 395.00, true, 10),
('dental', (SELECT id FROM job_categories WHERE service_type_code = 'dental' AND category_name = 'Cosmetic'), 'Veneer Consultation', 'Consultation for dental veneers', 45, 125.00, true, 11),

-- MEDICAL CLINIC JOB TYPES
('medical', (SELECT id FROM job_categories WHERE service_type_code = 'medical' AND category_name = 'Diagnostics'), 'Physical Exam', 'Comprehensive physical examination', 45, 185.00, true, 1),
('medical', (SELECT id FROM job_categories WHERE service_type_code = 'medical' AND category_name = 'Diagnostics'), 'Lab Test', 'Blood work and laboratory testing', 20, 125.00, true, 2),
('medical', (SELECT id FROM job_categories WHERE service_type_code = 'medical' AND category_name = 'Diagnostics'), 'Blood Pressure Check', 'Blood pressure monitoring', 15, 35.00, true, 3),
('medical', (SELECT id FROM job_categories WHERE service_type_code = 'medical' AND category_name = 'Diagnostics'), 'EKG', 'Electrocardiogram test', 25, 85.00, true, 4),

('medical', (SELECT id FROM job_categories WHERE service_type_code = 'medical' AND category_name = 'Preventive'), 'Flu Shot', 'Influenza vaccination', 15, 45.00, true, 5),
('medical', (SELECT id FROM job_categories WHERE service_type_code = 'medical' AND category_name = 'Preventive'), 'Annual Checkup', 'Yearly health screening', 60, 225.00, true, 6),
('medical', (SELECT id FROM job_categories WHERE service_type_code = 'medical' AND category_name = 'Preventive'), 'Vaccination', 'General immunizations', 20, 65.00, true, 7),

('medical', (SELECT id FROM job_categories WHERE service_type_code = 'medical' AND category_name = 'Consultation'), 'Specialist Consultation', 'Consultation with medical specialist', 60, 285.00, true, 8),
('medical', (SELECT id FROM job_categories WHERE service_type_code = 'medical' AND category_name = 'Consultation'), 'Follow-up Visit', 'Follow-up medical consultation', 30, 125.00, true, 9),

-- HANDYMAN SERVICES JOB TYPES
('handyman', (SELECT id FROM job_categories WHERE service_type_code = 'handyman' AND category_name = 'Installation'), 'TV Wall Mounting', 'Mount TV on wall with proper brackets', 90, 125.00, true, 1),
('handyman', (SELECT id FROM job_categories WHERE service_type_code = 'handyman' AND category_name = 'Installation'), 'Ceiling Fan Installation', 'Install and wire ceiling fan', 120, 185.00, true, 2),
('handyman', (SELECT id FROM job_categories WHERE service_type_code = 'handyman' AND category_name = 'Installation'), 'Smoke Detector Installation', 'Install and test smoke detectors', 45, 75.00, true, 3),
('handyman', (SELECT id FROM job_categories WHERE service_type_code = 'handyman' AND category_name = 'Installation'), 'Shelf Installation', 'Install wall shelves and brackets', 60, 85.00, true, 4),

('handyman', (SELECT id FROM job_categories WHERE service_type_code = 'handyman' AND category_name = 'Repairs'), 'Faucet Replacement', 'Replace kitchen or bathroom faucet', 75, 145.00, true, 5),
('handyman', (SELECT id FROM job_categories WHERE service_type_code = 'handyman' AND category_name = 'Repairs'), 'Drywall Patch Repair', 'Repair holes and cracks in drywall', 90, 125.00, true, 6),
('handyman', (SELECT id FROM job_categories WHERE service_type_code = 'handyman' AND category_name = 'Repairs'), 'Door Lock Repair', 'Fix or replace door locks', 45, 95.00, true, 7),
('handyman', (SELECT id FROM job_categories WHERE service_type_code = 'handyman' AND category_name = 'Repairs'), 'Toilet Repair', 'Fix toilet issues and leaks', 60, 115.00, true, 8),

-- CONTRACTOR SERVICES JOB TYPES
('contractor', (SELECT id FROM job_categories WHERE service_type_code = 'contractor' AND category_name = 'Assessment'), 'Site Evaluation', 'Assess construction site and requirements', 120, 285.00, true, 1),
('contractor', (SELECT id FROM job_categories WHERE service_type_code = 'contractor' AND category_name = 'Assessment'), 'Bathroom Remodel Consultation', 'Consultation for bathroom renovation', 90, 195.00, true, 2),
('contractor', (SELECT id FROM job_categories WHERE service_type_code = 'contractor' AND category_name = 'Assessment'), 'Kitchen Remodel Consultation', 'Consultation for kitchen renovation', 105, 225.00, true, 3),

('contractor', (SELECT id FROM job_categories WHERE service_type_code = 'contractor' AND category_name = 'Installation'), 'Kitchen Cabinet Installation', 'Install kitchen cabinets and hardware', 480, 1250.00, true, 4),
('contractor', (SELECT id FROM job_categories WHERE service_type_code = 'contractor' AND category_name = 'Installation'), 'Flooring Installation', 'Install hardwood or tile flooring', 600, 1850.00, true, 5),

('contractor', (SELECT id FROM job_categories WHERE service_type_code = 'contractor' AND category_name = 'Inspection'), 'Electrical Wiring Inspection', 'Inspect electrical systems for safety', 75, 175.00, true, 6),
('contractor', (SELECT id FROM job_categories WHERE service_type_code = 'contractor' AND category_name = 'Inspection'), 'Plumbing Inspection', 'Inspect plumbing systems', 60, 145.00, true, 7),

-- PET GROOMING JOB TYPES
('pet_grooming', NULL, 'Basic Wash & Dry', 'Basic pet bathing and drying service', 60, 45.00, true, 1),
('pet_grooming', NULL, 'Full Grooming Service', 'Complete grooming with cut and style', 120, 85.00, true, 2),
('pet_grooming', NULL, 'Nail Trimming', 'Pet nail cutting and filing', 20, 15.00, true, 3),
('pet_grooming', NULL, 'Flea Treatment', 'Flea bath and treatment', 75, 65.00, true, 4),
('pet_grooming', NULL, 'Teeth Cleaning', 'Pet dental cleaning service', 45, 125.00, true, 5);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_types_service_type ON job_types(service_type_code);
CREATE INDEX IF NOT EXISTS idx_job_types_user_id ON job_types(user_id);
CREATE INDEX IF NOT EXISTS idx_job_types_active ON job_types(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_job_assignments_staff ON staff_job_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_job_assignments_job_type ON staff_job_assignments(job_type_id);
CREATE INDEX IF NOT EXISTS idx_job_categories_service_type ON job_categories(service_type_code);

-- Add RLS policies
ALTER TABLE business_service_types ENABLE row_level_security;
ALTER TABLE job_categories ENABLE row_level_security;
ALTER TABLE job_types ENABLE row_level_security;
ALTER TABLE staff_job_assignments ENABLE row_level_security;

-- RLS policies for business_service_types (readable by all authenticated users)
CREATE POLICY "service_types_read" ON business_service_types FOR SELECT USING (auth.role() = 'authenticated');

-- RLS policies for job_categories (readable by all authenticated users)
CREATE POLICY "job_categories_read" ON job_categories FOR SELECT USING (auth.role() = 'authenticated');

-- RLS policies for job_types (users can read all system defaults + their own custom types)
CREATE POLICY "job_types_read" ON job_types FOR SELECT USING (
  auth.role() = 'authenticated' AND (is_system_default = true OR user_id = auth.uid())
);
CREATE POLICY "job_types_own_data" ON job_types FOR ALL USING (auth.uid() = user_id);

-- RLS policies for staff_job_assignments (users can only access their own staff assignments)
CREATE POLICY "staff_assignments_own_data" ON staff_job_assignments 
  FOR ALL USING (EXISTS (
    SELECT 1 FROM staff_members sm WHERE sm.id = staff_job_assignments.staff_id AND sm.user_id = auth.uid()
  ));