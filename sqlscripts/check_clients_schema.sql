-- Check the actual schema of the clients table
-- Run this first to see what columns exist

SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check a sample row to see actual data
SELECT * FROM clients LIMIT 1;