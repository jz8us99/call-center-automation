-- Check current database schema and tables
-- This script will show what tables exist and their structure

-- Check if our main tables exist
SELECT 'clients' as table_name, EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'clients'
) as exists;

SELECT 'job_categories' as table_name, EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'job_categories'
) as exists;

SELECT 'job_types' as table_name, EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'job_types'
) as exists;

SELECT 'business_products' as table_name, EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'business_products'
) as exists;

SELECT 'product_categories' as table_name, EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'product_categories'
) as exists;

-- Show all public tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if gen_random_uuid() function exists
SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'gen_random_uuid'
) as gen_random_uuid_exists;