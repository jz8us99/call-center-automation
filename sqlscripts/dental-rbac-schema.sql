-- Enhanced Database Schema for Dental Office Role-Based Access Control
-- This creates the database structure for role-based staff management and job hierarchy

-- Drop existing tables if they exist (careful in production!)
DROP TABLE IF EXISTS staff_job_assignments CASCADE;
DROP TABLE IF EXISTS job_types CASCADE;
DROP TABLE IF EXISTS job_categories CASCADE;
DROP TABLE IF EXISTS job_titles CASCADE;
DROP TABLE IF EXISTS staff_members CASCADE;
DROP TABLE IF EXISTS business_roles CASCADE;

-- Create business roles table
CREATE TABLE business_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_code VARCHAR(20) UNIQUE NOT NULL,
  role_name VARCHAR(50) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb, -- Store permissions as JSON
  hierarchy_level INTEGER NOT NULL, -- 1=Owner, 2=Admin, 3=Staff, 4=Viewer
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO business_roles (role_code, role_name, description, permissions, hierarchy_level) VALUES
('owner', 'Owner', 'Full control including business deletion and ownership transfer', 
 '{"manage_staff": true, "configure_jobs": true, "configure_business": true, "delete_business": true, "transfer_ownership": true, "assign_roles": true}'::jsonb, 1),
('admin', 'Admin', 'Can manage staff and configure settings but cannot delete business', 
 '{"manage_staff": true, "configure_jobs": true, "configure_business": true, "delete_business": false, "transfer_ownership": false, "assign_roles": true}'::jsonb, 2),
('staff', 'Staff', 'Can view own schedule and assigned job types only', 
 '{"manage_staff": false, "configure_jobs": false, "configure_business": false, "delete_business": false, "transfer_ownership": false, "assign_roles": false}'::jsonb, 3),
('viewer', 'Viewer', 'Read-only access to business and appointment information', 
 '{"manage_staff": false, "configure_jobs": false, "configure_business": false, "delete_business": false, "transfer_ownership": false, "assign_roles": false}'::jsonb, 4);

-- Create job titles table (e.g., Hygienist, Assistant, Dentist)
CREATE TABLE job_titles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Business owner
  title_name VARCHAR(100) NOT NULL,
  description TEXT,
  required_qualifications TEXT[],
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job categories table (e.g., Cleaning, Exams, Treatment)
CREATE TABLE job_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_title_id UUID NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job types table (e.g., Regular Cleaning, Deep Cleaning, Root Canal)
CREATE TABLE job_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_category_id UUID NOT NULL,
  user_id UUID NOT NULL, -- Business owner
  job_name VARCHAR(200) NOT NULL,
  job_description TEXT,
  default_duration_minutes INTEGER NOT NULL DEFAULT 30,
  default_price DECIMAL(10,2),
  price_currency VARCHAR(3) DEFAULT 'USD',
  required_staff_roles TEXT[], -- Array of role codes that can perform this job
  equipment_needed TEXT[],
  preparation_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced staff members table with roles
CREATE TABLE staff_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Business owner
  auth_user_id UUID, -- If staff member has their own login
  role_code VARCHAR(20) NOT NULL DEFAULT 'staff',
  job_title_id UUID, -- Primary job title
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  gender VARCHAR(20),
  hire_date DATE,
  employment_status VARCHAR(20) DEFAULT 'active', -- active, inactive, terminated
  hourly_rate DECIMAL(8,2),
  salary_annual DECIMAL(10,2),
  schedule JSONB DEFAULT '{}'::jsonb,
  qualifications TEXT[],
  certifications TEXT[],
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff job type assignments (which staff can perform which job types)
CREATE TABLE staff_job_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  job_type_id UUID NOT NULL,
  proficiency_level VARCHAR(20) DEFAULT 'intermediate', -- beginner, intermediate, expert
  custom_duration_minutes INTEGER,
  custom_rate DECIMAL(8,2),
  is_primary BOOLEAN DEFAULT false, -- Is this a primary responsibility?
  certification_required BOOLEAN DEFAULT false,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  assigned_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE job_categories ADD CONSTRAINT fk_job_categories_title 
  FOREIGN KEY (job_title_id) REFERENCES job_titles(id) ON DELETE CASCADE;

ALTER TABLE job_types ADD CONSTRAINT fk_job_types_category 
  FOREIGN KEY (job_category_id) REFERENCES job_categories(id) ON DELETE CASCADE;

ALTER TABLE staff_members ADD CONSTRAINT fk_staff_role 
  FOREIGN KEY (role_code) REFERENCES business_roles(role_code);

ALTER TABLE staff_members ADD CONSTRAINT fk_staff_job_title 
  FOREIGN KEY (job_title_id) REFERENCES job_titles(id);

ALTER TABLE staff_job_assignments ADD CONSTRAINT fk_staff_assignments_staff 
  FOREIGN KEY (staff_id) REFERENCES staff_members(id) ON DELETE CASCADE;

ALTER TABLE staff_job_assignments ADD CONSTRAINT fk_staff_assignments_job_type 
  FOREIGN KEY (job_type_id) REFERENCES job_types(id) ON DELETE CASCADE;

-- Add unique constraints
ALTER TABLE staff_job_assignments ADD CONSTRAINT uk_staff_job_assignment 
  UNIQUE (staff_id, job_type_id);

ALTER TABLE job_titles ADD CONSTRAINT uk_job_titles_per_user 
  UNIQUE (user_id, title_name);

ALTER TABLE job_categories ADD CONSTRAINT uk_job_categories_per_title 
  UNIQUE (job_title_id, category_name);

ALTER TABLE job_types ADD CONSTRAINT uk_job_types_per_category 
  UNIQUE (job_category_id, job_name);

-- Insert sample dental office job structure
INSERT INTO job_titles (user_id, title_name, description, display_order) VALUES
-- Replace 'sample-user-id' with actual user UUID when implementing
('00000000-0000-0000-0000-000000000000', 'Hygienist', 'Dental hygienist responsible for cleanings and preventive care', 1),
('00000000-0000-0000-0000-000000000000', 'Assistant', 'Dental assistant supporting various procedures', 2),
('00000000-0000-0000-0000-000000000000', 'Dentist', 'Licensed dentist performing examinations and treatments', 3),
('00000000-0000-0000-0000-000000000000', 'Receptionist', 'Front desk staff handling appointments and patient communication', 4);

-- Insert job categories
INSERT INTO job_categories (job_title_id, category_name, description, display_order) VALUES
-- Hygienist categories
((SELECT id FROM job_titles WHERE title_name = 'Hygienist' LIMIT 1), 'Cleaning', 'Teeth cleaning and oral hygiene services', 1),
((SELECT id FROM job_titles WHERE title_name = 'Hygienist' LIMIT 1), 'Preventive', 'Preventive oral health treatments', 2),

-- Assistant categories
((SELECT id FROM job_titles WHERE title_name = 'Assistant' LIMIT 1), 'Support', 'Supporting dental procedures', 1),
((SELECT id FROM job_titles WHERE title_name = 'Assistant' LIMIT 1), 'Exams', 'Examination support and preparation', 2),

-- Dentist categories
((SELECT id FROM job_titles WHERE title_name = 'Dentist' LIMIT 1), 'Exams', 'Dental examinations and consultations', 1),
((SELECT id FROM job_titles WHERE title_name = 'Dentist' LIMIT 1), 'Treatment', 'Dental treatments and procedures', 2),
((SELECT id FROM job_titles WHERE title_name = 'Dentist' LIMIT 1), 'Surgery', 'Oral surgery procedures', 3),

-- Receptionist categories
((SELECT id FROM job_titles WHERE title_name = 'Receptionist' LIMIT 1), 'Administrative', 'Administrative and scheduling tasks', 1);

-- Insert comprehensive job types
INSERT INTO job_types (job_category_id, user_id, job_name, job_description, default_duration_minutes, default_price, required_staff_roles) VALUES

-- Hygienist - Cleaning
((SELECT id FROM job_categories WHERE category_name = 'Cleaning' AND job_title_id = (SELECT id FROM job_titles WHERE title_name = 'Hygienist' LIMIT 1) LIMIT 1), 
 '00000000-0000-0000-0000-000000000000', 'Regular Cleaning', 'Standard teeth cleaning and plaque removal', 45, 120.00, '{"staff", "admin", "owner"}'),
 
((SELECT id FROM job_categories WHERE category_name = 'Cleaning' AND job_title_id = (SELECT id FROM job_titles WHERE title_name = 'Hygienist' LIMIT 1) LIMIT 1), 
 '00000000-0000-0000-0000-000000000000', 'Deep Cleaning', 'Scaling and root planing for gum disease', 60, 250.00, '{"staff", "admin", "owner"}'),

-- Hygienist - Preventive
((SELECT id FROM job_categories WHERE category_name = 'Preventive' AND job_title_id = (SELECT id FROM job_titles WHERE title_name = 'Hygienist' LIMIT 1) LIMIT 1), 
 '00000000-0000-0000-0000-000000000000', 'Fluoride Treatment', 'Fluoride application for cavity prevention', 20, 45.00, '{"staff", "admin", "owner"}'),

-- Assistant - Support
((SELECT id FROM job_categories WHERE category_name = 'Support' AND job_title_id = (SELECT id FROM job_titles WHERE title_name = 'Assistant' LIMIT 1) LIMIT 1), 
 '00000000-0000-0000-0000-000000000000', 'Chairside Assistance', 'Assisting dentist during procedures', 30, 0.00, '{"staff", "admin", "owner"}'),

-- Assistant - Exams
((SELECT id FROM job_categories WHERE category_name = 'Exams' AND job_title_id = (SELECT id FROM job_titles WHERE title_name = 'Assistant' LIMIT 1) LIMIT 1), 
 '00000000-0000-0000-0000-000000000000', 'X-Ray Setup', 'Preparing and taking dental X-rays', 15, 85.00, '{"staff", "admin", "owner"}'),

-- Dentist - Exams
((SELECT id FROM job_categories WHERE category_name = 'Exams' AND job_title_id = (SELECT id FROM job_titles WHERE title_name = 'Dentist' LIMIT 1) LIMIT 1), 
 '00000000-0000-0000-0000-000000000000', 'Comprehensive Exam', 'Complete dental examination', 45, 200.00, '{"admin", "owner"}'),

-- Dentist - Treatment
((SELECT id FROM job_categories WHERE category_name = 'Treatment' AND job_title_id = (SELECT id FROM job_titles WHERE title_name = 'Dentist' LIMIT 1) LIMIT 1), 
 '00000000-0000-0000-0000-000000000000', 'Root Canal', 'Root canal therapy treatment', 90, 850.00, '{"admin", "owner"}'),
 
((SELECT id FROM job_categories WHERE category_name = 'Treatment' AND job_title_id = (SELECT id FROM job_titles WHERE title_name = 'Dentist' LIMIT 1) LIMIT 1), 
 '00000000-0000-0000-0000-000000000000', 'Crown Placement', 'Dental crown installation', 60, 950.00, '{"admin", "owner"}'),

-- Receptionist - Administrative
((SELECT id FROM job_categories WHERE category_name = 'Administrative' AND job_title_id = (SELECT id FROM job_titles WHERE title_name = 'Receptionist' LIMIT 1) LIMIT 1), 
 '00000000-0000-0000-0000-000000000000', 'Appointment Scheduling', 'Schedule and manage patient appointments', 15, 0.00, '{"staff", "admin", "owner"}');

-- Add performance indexes
CREATE INDEX idx_staff_members_user_id ON staff_members(user_id);
CREATE INDEX idx_staff_members_role ON staff_members(role_code);
CREATE INDEX idx_staff_members_job_title ON staff_members(job_title_id);
CREATE INDEX idx_job_titles_user_id ON job_titles(user_id);
CREATE INDEX idx_job_types_user_id ON job_types(user_id);
CREATE INDEX idx_job_types_category ON job_types(job_category_id);
CREATE INDEX idx_staff_job_assignments_staff ON staff_job_assignments(staff_id);
CREATE INDEX idx_staff_job_assignments_job_type ON staff_job_assignments(job_type_id);