# Database Setup Instructions

## Overview
This guide will help you set up the required database tables for the Products & Services separation feature.

## What We're Adding
- `business_products` table - For products (items sold without appointments)
- `product_categories` table - For organizing products
- Sample data for different business types
- Proper indexes, RLS policies, and triggers

## Step 1: Execute the Database Setup

### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the content from `complete-database-setup.sql`
4. Click **Run**

### Option B: Using Command Line (if you have psql)
```bash
# Replace with your actual Supabase connection string
psql "postgresql://postgres:[password]@[host]:[port]/postgres" -f complete-database-setup.sql
```

## Step 2: Verify the Setup

After running the setup, execute the verification script:

### Using Supabase Dashboard
1. Go to **SQL Editor**
2. Copy and paste the content from `test-database-setup.sql`
3. Click **Run**
4. Check the results to ensure everything is working

## Step 3: Check for Issues

If you encounter any errors, they're likely to be:

### Common Issues and Solutions

1. **"relation auth.users does not exist"**
   - This means Supabase auth is not properly set up
   - Solution: Enable authentication in your Supabase project

2. **"permission denied"**
   - RLS policies may be too restrictive
   - Solution: Check your user permissions or temporarily disable RLS for setup

3. **"function gen_random_uuid() does not exist"**
   - UUID extension not enabled
   - Solution: Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

4. **"duplicate key value violates unique constraint"**
   - Sample data already exists
   - Solution: This is normal if you run the script multiple times

## Files Included

- `complete-database-setup.sql` - Main setup script
- `test-database-setup.sql` - Verification script
- `check-database-schema.sql` - Simple table existence check

## Expected Results

After successful setup, you should have:
- ✅ `business_products` table with proper structure
- ✅ `product_categories` table with sample categories
- ✅ Proper foreign key relationships
- ✅ RLS policies for security
- ✅ Indexes for performance
- ✅ Sample categories for dental, automotive, retail, healthcare, and beauty businesses

## Next Steps

Once the database is set up:
1. Test the Products tab in your application
2. Test the Services tab in your application
3. Verify data is saving correctly
4. Check that the workflow progression works

## Troubleshooting

If you encounter issues:
1. Run `check-database-schema.sql` to see what exists
2. Check the Supabase logs for detailed error messages
3. Verify your user has the necessary permissions
4. Ensure authentication is properly configured

## Sample Data Created

The script will create sample product categories for these business types:
- **Dental**: Oral Care Products, Dental Tools, Orthodontic Supplies, Whitening Products
- **Automotive**: Engine Parts, Body Parts, Fluids & Lubricants, Accessories, Tires & Wheels
- **Retail**: Electronics, Clothing, Home & Garden, Sports & Outdoors
- **Healthcare**: Medical Supplies, Wellness Products, Personal Care
- **Beauty**: Hair Care, Skincare, Makeup, Nail Care, Professional Tools