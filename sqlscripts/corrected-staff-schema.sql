-- Corrected Staff and Job Types Schema
-- This creates the database structure for staff management and dynamic job types

-- First, let's drop the old tables if they exist
DROP TABLE IF EXISTS job_title_categories CASCADE;
DROP TABLE IF EXISTS job_titles CASCADE;
DROP TABLE IF EXISTS staff_job_assignments CASCADE;
DROP TABLE IF EXISTS staff_members CASCADE;
DROP TABLE IF EXISTS job_types CASCADE;

-- Create job titles table (free text input by business owner)
CREATE TABLE job_titles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the enhanced staff_members table
CREATE TABLE staff_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  gender VARCHAR(20), -- 'Male', 'Female', 'Other'
  job_title_id UUID, -- References job_titles table
  job_category_id UUID, -- References job_categories table
  selected_job_types JSONB DEFAULT '[]'::jsonb, -- Array of selected job type IDs for this category
  schedule JSONB DEFAULT '{}'::jsonb, -- Weekly schedule
  specialties TEXT[], -- Array of specialties
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create business service types table
CREATE TABLE business_service_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type_code VARCHAR(50) UNIQUE NOT NULL,
  service_type_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job categories table
CREATE TABLE job_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type_code VARCHAR(50) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Create enhanced job types table
CREATE TABLE job_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type_code VARCHAR(50) NOT NULL,
  category_id UUID,
  user_id UUID,
  job_name VARCHAR(200) NOT NULL,
  job_description TEXT,
  default_duration_minutes INTEGER NOT NULL DEFAULT 30,
  default_price DECIMAL(10,2),
  price_currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  is_system_default BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create staff job assignments table
CREATE TABLE staff_job_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  job_type_id UUID NOT NULL,
  custom_duration_minutes INTEGER,
  custom_price DECIMAL(10,2),
  proficiency_level VARCHAR(20) DEFAULT 'intermediate',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE job_categories ADD CONSTRAINT fk_job_categories_service_type 
  FOREIGN KEY (service_type_code) REFERENCES business_service_types(service_type_code);

ALTER TABLE job_types ADD CONSTRAINT fk_job_types_service_type 
  FOREIGN KEY (service_type_code) REFERENCES business_service_types(service_type_code);

ALTER TABLE job_types ADD CONSTRAINT fk_job_types_category 
  FOREIGN KEY (category_id) REFERENCES job_categories(id);

ALTER TABLE staff_job_assignments ADD CONSTRAINT fk_staff_assignments_staff 
  FOREIGN KEY (staff_id) REFERENCES staff_members(id) ON DELETE CASCADE;

ALTER TABLE staff_job_assignments ADD CONSTRAINT fk_staff_assignments_job_type 
  FOREIGN KEY (job_type_id) REFERENCES job_types(id) ON DELETE CASCADE;

ALTER TABLE staff_members ADD CONSTRAINT fk_staff_members_job_title 
  FOREIGN KEY (job_title_id) REFERENCES job_titles(id) ON DELETE SET NULL;

ALTER TABLE staff_members ADD CONSTRAINT fk_staff_members_job_category 
  FOREIGN KEY (job_category_id) REFERENCES job_categories(id) ON DELETE SET NULL;

-- Add unique constraints
ALTER TABLE staff_job_assignments ADD CONSTRAINT uk_staff_job_assignment 
  UNIQUE (staff_id, job_type_id);

ALTER TABLE job_types ADD CONSTRAINT uk_job_types_per_user 
  UNIQUE (service_type_code, job_name, user_id);

ALTER TABLE job_titles ADD CONSTRAINT uk_job_titles_per_user 
  UNIQUE (user_id, title_name);

-- Insert business service types
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

-- Insert job categories
INSERT INTO job_categories (service_type_code, category_name, description, display_order) VALUES
-- Dental categories
('dental', 'Preventive Care', 'Routine checkups and preventive treatments', 1),
('dental', 'Restorative', 'Fillings, crowns, and restorative procedures', 2),
('dental', 'Surgical', 'Extractions and oral surgery', 3),
('dental', 'Cosmetic', 'Aesthetic dental procedures', 4),

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
('contractor', 'Renovation', 'Remodeling and renovation work', 3)
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

-- PET GROOMING JOB TYPES
('pet_grooming', NULL, 'Basic Wash & Dry', 'Basic pet bathing and drying service', 60, 45.00, true, 1),
('pet_grooming', NULL, 'Full Grooming Service', 'Complete grooming with cut and style', 120, 85.00, true, 2),
('pet_grooming', NULL, 'Nail Trimming', 'Pet nail cutting and filing', 20, 15.00, true, 3),
('pet_grooming', NULL, 'Flea Treatment', 'Flea bath and treatment', 75, 65.00, true, 4),
('pet_grooming', NULL, 'Teeth Cleaning', 'Pet dental cleaning service', 45, 125.00, true, 5);


-- Add performance indexes
CREATE INDEX idx_job_types_service_type ON job_types(service_type_code);
CREATE INDEX idx_job_types_user_id ON job_types(user_id);
CREATE INDEX idx_job_types_active ON job_types(is_active);
CREATE INDEX idx_staff_job_assignments_staff ON staff_job_assignments(staff_id);
CREATE INDEX idx_staff_job_assignments_job_type ON staff_job_assignments(job_type_id);
CREATE INDEX idx_job_categories_service_type ON job_categories(service_type_code);
CREATE INDEX idx_staff_members_user_id ON staff_members(user_id);
CREATE INDEX idx_staff_members_active ON staff_members(is_active);
CREATE INDEX idx_staff_members_job_title ON staff_members(job_title_id);
CREATE INDEX idx_staff_members_job_category ON staff_members(job_category_id);
CREATE INDEX idx_job_titles_user_id ON job_titles(user_id);
CREATE INDEX idx_job_titles_active ON job_titles(is_active);