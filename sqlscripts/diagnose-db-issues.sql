-- Database Diagnostic Script
-- Run this to identify what's causing the schema issues

SELECT '=== STEP 1: Check if tables exist ===' as diagnostic_step;

SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'clients', 
    'agent_types', 
    'business_types', 
    'agent_templates', 
    'business_type_agent_template_map'
  )
ORDER BY table_name;

SELECT '=== STEP 2: Check for duplicate agent_types ===' as diagnostic_step;

SELECT 
    type_code,
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 1 THEN 'DUPLICATE - THIS CAUSES THE ERROR' ELSE 'OK' END as status
FROM agent_types 
GROUP BY type_code
HAVING COUNT(*) > 1
ORDER BY count DESC;

SELECT '=== STEP 3: Check agent_types content ===' as diagnostic_step;

SELECT type_code, name, id FROM agent_types ORDER BY type_code;

SELECT '=== STEP 4: Check business_types content ===' as diagnostic_step;

SELECT type_code, name, id FROM business_types WHERE type_code IN ('dental', 'law_office') ORDER BY type_code;

SELECT '=== STEP 5: Check existing templates ===' as diagnostic_step;

SELECT 
    t.name as template_name,
    at.type_code as agent_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 1 THEN 'DUPLICATE' ELSE 'OK' END as status
FROM agent_templates t
JOIN agent_types at ON t.agent_type_id = at.id
GROUP BY t.name, at.type_code
ORDER BY count DESC;

SELECT '=== STEP 6: Check clients table structure ===' as diagnostic_step;

SELECT 
    column_name,
    data_type,
    CASE WHEN column_name IN (
        'business_address', 'business_website', 'contact_person_name', 
        'products_services', 'payment_methods', 'common_questions'
    ) THEN 'NEW COLUMN' ELSE 'EXISTING' END as column_status
FROM information_schema.columns
WHERE table_name = 'clients' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== STEP 7: Check for foreign key constraint issues ===' as diagnostic_step;

SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('agent_templates', 'business_type_agent_template_map')
ORDER BY tc.table_name;

SELECT '=== DIAGNOSTIC COMPLETE ===' as diagnostic_step;