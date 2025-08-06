-- Test script to verify database setup is working correctly
-- Run this after executing complete-database-setup.sql

-- Test 1: Check all required tables exist
SELECT 'TEST 1: Checking required tables exist' as test_name;

SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = t.table_name
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
FROM (
    VALUES 
    ('business_products'),
    ('product_categories'),
    ('job_categories'),
    ('job_types'),
    ('clients')
) AS t(table_name)
ORDER BY table_name;

-- Test 2: Check foreign key relationships
SELECT 'TEST 2: Checking foreign key relationships' as test_name;

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('business_products', 'product_categories')
ORDER BY tc.table_name, kcu.column_name;

-- Test 3: Check RLS policies exist
SELECT 'TEST 3: Checking RLS policies' as test_name;

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('business_products', 'product_categories')
ORDER BY tablename, policyname;

-- Test 4: Check indexes exist
SELECT 'TEST 4: Checking indexes' as test_name;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('business_products', 'product_categories')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Test 5: Check sample data
SELECT 'TEST 5: Checking sample product categories' as test_name;

SELECT 
    business_type,
    COUNT(*) as category_count
FROM product_categories 
GROUP BY business_type
ORDER BY business_type;

-- Test 6: Check triggers exist
SELECT 'TEST 6: Checking triggers' as test_name;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    trigger_schema
FROM information_schema.triggers 
WHERE event_object_table IN ('business_products', 'product_categories')
AND trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Test 7: Check table structure for business_products
SELECT 'TEST 7: Business products table structure' as test_name;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'business_products'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 8: Check table structure for product_categories
SELECT 'TEST 8: Product categories table structure' as test_name;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'product_categories'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 9: Test insert capability (will be rolled back)
SELECT 'TEST 9: Testing insert capability' as test_name;

BEGIN;

-- Try to insert a test product category
INSERT INTO product_categories (business_type, category_name, category_description, display_order) 
VALUES ('test', 'Test Category', 'This is a test category', 999);

-- Try to insert a test product (this will fail if we don't have a valid user_id)
-- We'll use a placeholder UUID for testing
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
        INSERT INTO business_products (
            user_id, 
            business_type, 
            product_name, 
            product_description, 
            price, 
            price_currency
        ) 
        SELECT 
            id,
            'test',
            'Test Product',
            'This is a test product',
            29.99,
            'USD'
        FROM auth.users 
        LIMIT 1;
        
        RAISE NOTICE 'Test product inserted successfully';
    ELSE
        RAISE NOTICE 'No users found in auth.users, skipping product insert test';
    END IF;
END $$;

-- Clean up test data
DELETE FROM business_products WHERE business_type = 'test';
DELETE FROM product_categories WHERE business_type = 'test';

ROLLBACK;

SELECT 'Database setup verification completed!' as final_status;