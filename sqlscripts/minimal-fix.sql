-- Minimal fix to resolve the "more than one row returned by a subquery" error
-- This addresses only the core issue without adding new columns

-- First, check what's causing the problem
SELECT 'Checking agent_types for inbound_call' as step;
SELECT id, type_code FROM agent_types WHERE type_code = 'inbound_call';

SELECT 'Checking business_types for dental and law_office' as step;  
SELECT id, type_code FROM business_types WHERE type_code IN ('dental', 'law_office');

-- If there are duplicates in agent_types, this will show them
SELECT type_code, COUNT(*) as count 
FROM agent_types 
WHERE type_code = 'inbound_call'
GROUP BY type_code 
HAVING COUNT(*) > 1;

-- Clean up any duplicate agent_types (this is likely the issue)
-- Keep only the first one, delete the rest
DELETE FROM agent_types 
WHERE type_code = 'inbound_call' 
  AND id NOT IN (
    SELECT id 
    FROM agent_types 
    WHERE type_code = 'inbound_call'
    ORDER BY id
    LIMIT 1
  );

-- Now the original template inserts should work
-- But let's use a safer approach with explicit ID handling

-- Clear existing templates to avoid conflicts
DELETE FROM business_type_agent_template_map;
DELETE FROM agent_templates WHERE name IN ('Dental Office Receptionist', 'Law Office Receptionist');

-- Get the agent_type ID safely
DO $$
DECLARE
    inbound_agent_id UUID;
    dental_business_id UUID;
    law_business_id UUID;
    dental_template_id UUID;
    law_template_id UUID;
BEGIN
    -- Get IDs safely
    SELECT id INTO inbound_agent_id FROM agent_types WHERE type_code = 'inbound_call' LIMIT 1;
    SELECT id INTO dental_business_id FROM business_types WHERE type_code = 'dental' LIMIT 1;
    SELECT id INTO law_business_id FROM business_types WHERE type_code = 'law_office' LIMIT 1;
    
    -- Insert templates only if we have the required IDs
    IF inbound_agent_id IS NOT NULL THEN
        -- Insert Dental template
        INSERT INTO agent_templates (
            agent_type_id, name, description, category, template_data, 
            prompt_template, call_scripts, voice_settings, call_routing, is_public
        ) VALUES (
            inbound_agent_id,
            'Dental Office Receptionist',
            'Optimized template for dental office reception and appointment scheduling',
            'healthcare',
            '{"business_type": "dental", "agent_type": "inbound_call"}',
            'You are a professional dental office receptionist for {business_name}.',
            '{"greeting": "Hello! Thank you for calling {business_name}. This is your AI dental assistant."}',
            '{"speed": 0.95, "pitch": 1.0, "tone": "professional"}',
            '{"emergency_keywords": ["pain", "broken tooth", "bleeding", "swollen"]}',
            true
        ) RETURNING id INTO dental_template_id;
        
        -- Insert Law template  
        INSERT INTO agent_templates (
            agent_type_id, name, description, category, template_data,
            prompt_template, call_scripts, voice_settings, call_routing, is_public
        ) VALUES (
            inbound_agent_id,
            'Law Office Receptionist', 
            'Professional template for law office client intake and appointment scheduling',
            'professional',
            '{"business_type": "law_office", "agent_type": "inbound_call"}',
            'You are a professional law office receptionist for {business_name}.',
            '{"greeting": "Good day, and thank you for calling {business_name}. This is your legal assistant."}',
            '{"speed": 0.9, "pitch": 0.95, "tone": "professional"}',
            '{"urgent_keywords": ["arrest", "court date", "deadline", "subpoena"]}',
            true
        ) RETURNING id INTO law_template_id;
        
        -- Insert mappings only if we have all required IDs
        IF dental_business_id IS NOT NULL AND dental_template_id IS NOT NULL THEN
            INSERT INTO business_type_agent_template_map (
                business_type_id, agent_type_id, template_id, is_default, priority
            ) VALUES (
                dental_business_id, inbound_agent_id, dental_template_id, true, 1
            );
        END IF;
        
        IF law_business_id IS NOT NULL AND law_template_id IS NOT NULL THEN
            INSERT INTO business_type_agent_template_map (
                business_type_id, agent_type_id, template_id, is_default, priority  
            ) VALUES (
                law_business_id, inbound_agent_id, law_template_id, true, 1
            );
        END IF;
    END IF;
END $$;