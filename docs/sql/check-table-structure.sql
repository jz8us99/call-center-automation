-- Diagnostic script to check current table structure
-- Run this first to see what fields are missing

-- Check if the table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'agent_configurations_scoped'
        ) 
        THEN 'Table EXISTS' 
        ELSE 'Table DOES NOT EXIST' 
    END as table_status;

-- If table exists, show current structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('call_scripts_prompt', 'call_scripts', 'voice_settings', 'call_routing', 'basic_info_prompt', 'agent_personality', 'custom_instructions') 
        THEN '✅ REQUIRED FOR CALL SCRIPTS'
        ELSE '📝 Optional'
    END as field_importance
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agent_configurations_scoped'
ORDER BY 
    CASE 
        WHEN column_name IN ('call_scripts_prompt', 'call_scripts', 'voice_settings', 'call_routing', 'basic_info_prompt', 'agent_personality', 'custom_instructions') 
        THEN 1 
        ELSE 2 
    END,
    ordinal_position;

-- Check for missing required fields
WITH required_fields AS (
    SELECT unnest(ARRAY[
        'call_scripts_prompt',
        'call_scripts', 
        'voice_settings',
        'call_routing',
        'basic_info_prompt',
        'agent_personality',
        'custom_instructions'
    ]) as field_name
),
existing_fields AS (
    SELECT column_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'agent_configurations_scoped'
)
SELECT 
    rf.field_name,
    CASE 
        WHEN ef.column_name IS NOT NULL 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM required_fields rf
LEFT JOIN existing_fields ef ON rf.field_name = ef.column_name
ORDER BY 
    CASE WHEN ef.column_name IS NULL THEN 1 ELSE 2 END,
    rf.field_name;

-- Show sample data if table has records
SELECT 
    COUNT(*) as total_records,
    COUNT(call_scripts_prompt) as records_with_scripts_prompt,
    COUNT(call_scripts) as records_with_scripts_data
FROM public.agent_configurations_scoped
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'agent_configurations_scoped'
);