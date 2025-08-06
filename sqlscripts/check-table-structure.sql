-- Check the actual structure of staff_availability table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'staff_availability' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if the table exists at all
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'staff_availability'
) as table_exists;

-- Check staff_calendars table structure too
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'staff_calendars' 
  AND table_schema = 'public'
ORDER BY ordinal_position;