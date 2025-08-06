-- Staff and Job Types Schema
-- This creates the database structure for staff management and dynamic job types

-- Job Types table (predefined job types for different business types)
CREATE TABLE IF NOT EXISTS job_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_type VARCHAR(100) NOT NULL, -- matches business_type from clients table
  job_type_name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Members table
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  gender VARCHAR(20), -- 'Male', 'Female', 'Other'
  title VARCHAR(100), -- e.g., Assistant, Technician, Hygienist
  job_types JSONB DEFAULT '[]'::jsonb, -- Array of job type IDs
  schedule JSONB DEFAULT '{}'::jsonb, -- Weekly schedule
  specialties TEXT[], -- Array of specialties
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert predefined job types for different business types
INSERT INTO job_types (business_type, job_type_name, description) VALUES
-- Dental Office
('dental_practice', 'General Dentistry', 'General dental procedures and checkups'),
('dental_practice', 'Teeth Cleaning', 'Professional teeth cleaning and hygiene'),
('dental_practice', 'Root Canal', 'Root canal therapy and endodontic treatment'),
('dental_practice', 'Cosmetic Dentistry', 'Cosmetic dental procedures and smile enhancement'),
('dental_practice', 'Orthodontics', 'Braces, aligners, and teeth straightening'),
('dental_practice', 'Oral Surgery', 'Tooth extractions and oral surgical procedures'),
('dental_practice', 'Pediatric Dentistry', 'Dental care for children and teens'),

-- Medical Practice
('medical_practice', 'General Medicine', 'General medical consultations and checkups'),
('medical_practice', 'Urgent Care', 'Urgent medical care and minor emergencies'),
('medical_practice', 'Preventive Care', 'Preventive health screenings and vaccinations'),
('medical_practice', 'Chronic Disease Management', 'Management of chronic conditions'),
('medical_practice', 'Physical Examination', 'Annual physicals and health assessments'),

-- Mental Health
('mental_health', 'Individual Therapy', 'One-on-one therapy sessions'),
('mental_health', 'Group Therapy', 'Group therapy sessions'),
('mental_health', 'Family Counseling', 'Family and couples counseling'),
('mental_health', 'PTSD Treatment', 'PTSD and trauma therapy'),
('mental_health', 'Addiction Counseling', 'Substance abuse and addiction treatment'),

-- Legal Services
('legal_services', 'Personal Injury', 'Personal injury legal cases'),
('legal_services', 'Family Law', 'Divorce, custody, and family legal matters'),
('legal_services', 'Criminal Defense', 'Criminal defense representation'),
('legal_services', 'Business Law', 'Business legal services and contracts'),
('legal_services', 'Real Estate Law', 'Real estate transactions and disputes'),

-- Auto Services
('auto_service', 'Oil Change', 'Oil change and basic maintenance'),
('auto_service', 'Brake Service', 'Brake repair and replacement'),
('auto_service', 'Engine Repair', 'Engine diagnostics and repair'),
('auto_service', 'Transmission Service', 'Transmission repair and maintenance'),
('auto_service', 'Tire Service', 'Tire installation and repair'),

-- Beauty Salon
('beauty_salon', 'Hair Cut & Style', 'Hair cutting and styling'),
('beauty_salon', 'Hair Coloring', 'Hair coloring and highlights'),
('beauty_salon', 'Manicure/Pedicure', 'Nail care services'),
('beauty_salon', 'Facial Treatment', 'Facial and skincare treatments'),
('beauty_salon', 'Hair Treatment', 'Deep conditioning and hair treatments'),

-- Veterinary
('veterinary', 'Wellness Exam', 'Routine pet health examinations'),
('veterinary', 'Vaccinations', 'Pet vaccinations and immunizations'),
('veterinary', 'Surgery', 'Pet surgical procedures'),
('veterinary', 'Emergency Care', 'Emergency pet medical care'),
('veterinary', 'Dental Care', 'Pet dental cleaning and care'),

-- Fitness/Gym
('fitness_center', 'Personal Training', 'One-on-one fitness training'),
('fitness_center', 'Group Fitness', 'Group fitness classes'),
('fitness_center', 'Nutrition Counseling', 'Nutrition planning and counseling'),
('fitness_center', 'Physical Therapy', 'Rehabilitation and physical therapy');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_types_business_type ON job_types(business_type);
CREATE INDEX IF NOT EXISTS idx_staff_members_user_id ON staff_members(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_active ON staff_members(is_active);

-- Add RLS policies
ALTER TABLE job_types ENABLE row_level_security;
ALTER TABLE staff_members ENABLE row_level_security;

-- RLS policy for job_types (readable by all authenticated users)
CREATE POLICY "job_types_read" ON job_types FOR SELECT USING (auth.role() = 'authenticated');

-- RLS policy for staff_members (users can only access their own staff)
CREATE POLICY "staff_members_own_data" ON staff_members 
  FOR ALL USING (auth.uid() = user_id);