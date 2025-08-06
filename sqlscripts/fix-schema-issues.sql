-- Fix for "more than one row returned by a subquery" error
-- This script addresses the duplicate key issues in the schema

-- First, let's clean up any potential duplicates and fix the INSERT statements

-- Clear existing data that might cause conflicts
DELETE FROM business_type_agent_template_map;
DELETE FROM agent_templates;

-- Re-insert agent templates with proper error handling
INSERT INTO agent_templates (
  agent_type_id,
  name,
  description,
  category,
  template_data,
  prompt_template,
  call_scripts,
  voice_settings,
  call_routing,
  is_public
) VALUES 
-- Dental Office + Inbound Call Agent template
(
  (SELECT id FROM agent_types WHERE type_code = 'inbound_call' LIMIT 1),
  'Dental Office Receptionist',
  'Optimized template for dental office reception and appointment scheduling',
  'healthcare',
  '{"business_type": "dental", "agent_type": "inbound_call"}',
  'You are a professional dental office receptionist for {business_name}. You are warm, professional, and knowledgeable about dental procedures. Your role is to:
- Greet patients warmly and professionally
- Schedule dental appointments and check-ups
- Answer questions about dental procedures and insurance
- Handle appointment confirmations and reminders
- Route urgent dental emergencies appropriately
- Collect patient information accurately
- Maintain HIPAA compliance at all times',
  '{"greeting": "Hello! Thank you for calling {business_name}. This is your AI dental assistant. How may I help you today?", "appointment_booking": "I would be happy to help you schedule your dental appointment. What type of service are you looking for?", "emergency": "I understand this is a dental emergency. Let me connect you with our emergency line immediately."}',
  '{"speed": 0.95, "pitch": 1.0, "tone": "professional", "voice_id": "dental_female"}',
  '{"emergency_keywords": ["pain", "broken tooth", "bleeding", "swollen"], "business_hours": {"monday": "8:00-17:00", "tuesday": "8:00-17:00"}, "escalation_triggers": ["insurance_question", "complex_procedure"]}',
  true
),
-- Law Office + Inbound Call Agent template  
(
  (SELECT id FROM agent_types WHERE type_code = 'inbound_call' LIMIT 1),
  'Law Office Receptionist',
  'Professional template for law office client intake and appointment scheduling',
  'professional',
  '{"business_type": "law_office", "agent_type": "inbound_call"}',
  'You are a professional law office receptionist for {business_name}. You maintain strict confidentiality and professionalism. Your role is to:
- Greet clients and potential clients professionally
- Schedule consultations and appointments with attorneys
- Handle general inquiries about legal services
- Collect basic client information while maintaining confidentiality
- Route urgent legal matters appropriately
- Provide general information about practice areas
- Maintain attorney-client privilege and confidentiality',
  '{"greeting": "Good day, and thank you for calling {business_name}. This is your legal assistant. How may I assist you today?", "consultation_booking": "I would be happy to schedule a consultation with one of our attorneys. May I ask what area of law you need assistance with?", "confidentiality": "Please note that this initial conversation is not attorney-client privileged. For confidential matters, I will connect you directly with an attorney."}',
  '{"speed": 0.9, "pitch": 0.95, "tone": "professional", "voice_id": "legal_professional"}',
  '{"urgent_keywords": ["arrest", "court date", "deadline", "subpoena"], "practice_areas": ["family_law", "criminal_defense", "personal_injury"], "escalation_triggers": ["urgent_legal_matter", "existing_client"]}',
  true
)
ON CONFLICT DO NOTHING;

-- Insert business type to agent template mappings with LIMIT 1 to avoid multiple row errors
INSERT INTO business_type_agent_template_map (
  business_type_id,
  agent_type_id,
  template_id,
  is_default,
  priority
) VALUES 
-- Dental Office templates
(
  (SELECT id FROM business_types WHERE type_code = 'dental' LIMIT 1),
  (SELECT id FROM agent_types WHERE type_code = 'inbound_call' LIMIT 1),
  (SELECT id FROM agent_templates WHERE name = 'Dental Office Receptionist' LIMIT 1),
  true,
  1
),
-- Law Office templates
(
  (SELECT id FROM business_types WHERE type_code = 'law_office' LIMIT 1),
  (SELECT id FROM agent_types WHERE type_code = 'inbound_call' LIMIT 1),
  (SELECT id FROM agent_templates WHERE name = 'Law Office Receptionist' LIMIT 1),
  true,
  1
)
ON CONFLICT DO NOTHING;

-- Add the missing columns to the clients table if they don't exist
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_website VARCHAR,
ADD COLUMN IF NOT EXISTS contact_person_name VARCHAR,
ADD COLUMN IF NOT EXISTS contact_person_role VARCHAR,
ADD COLUMN IF NOT EXISTS contact_person_phone VARCHAR,
ADD COLUMN IF NOT EXISTS contact_person_email VARCHAR,
ADD COLUMN IF NOT EXISTS products_services JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pricing_information JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS return_policy TEXT,
ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS insurance_accepted JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS service_areas JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS business_documents JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS business_images JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS logo_url VARCHAR,
ADD COLUMN IF NOT EXISTS common_questions JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS appointment_types JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS staff_information JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS promotional_content TEXT,
ADD COLUMN IF NOT EXISTS compliance_notes TEXT;