# Manual Database Setup Instructions

Since you're getting "more than one row returned by a subquery" error, here's how to fix it:

## Step 1: Fix the Subquery Issue

The error occurs in the `ai-agent-management-schema.sql` file in the INSERT statements for `agent_templates` and `business_type_agent_template_map`. 

### Quick Fix:

1. Open your database management tool (pgAdmin, psql, or Supabase dashboard)

2. Run this command to fix the issue:

```sql
-- Fix the subquery issue by adding LIMIT 1 to prevent multiple row returns
UPDATE ai-agent-management-schema.sql 

-- Or run these commands directly in your database:

-- Delete problematic records first
DELETE FROM business_type_agent_template_map;
DELETE FROM agent_templates WHERE name IN ('Dental Office Receptionist', 'Law Office Receptionist');

-- Re-insert with proper LIMIT clauses
INSERT INTO agent_templates (agent_type_id, name, description, category, template_data, prompt_template, call_scripts, voice_settings, call_routing, is_public)
VALUES 
(
  (SELECT id FROM agent_types WHERE type_code = 'inbound_call' LIMIT 1),
  'Dental Office Receptionist',
  'Optimized template for dental office reception and appointment scheduling',
  'healthcare',
  '{"business_type": "dental", "agent_type": "inbound_call"}',
  'You are a professional dental office receptionist for {business_name}.',
  '{"greeting": "Hello! Thank you for calling {business_name}."}',
  '{"speed": 0.95, "pitch": 1.0, "tone": "professional"}',
  '{"emergency_keywords": ["pain", "broken tooth", "bleeding"]}',
  true
);
```

## Step 2: Add Missing Columns to Clients Table

Since the comprehensive business information needs additional columns, run:

```sql
-- Add comprehensive business information columns
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_website VARCHAR,
ADD COLUMN IF NOT EXISTS contact_person_name VARCHAR,
ADD COLUMN IF NOT EXISTS contact_person_role VARCHAR,
ADD COLUMN IF NOT EXISTS contact_person_phone VARCHAR,
ADD COLUMN IF NOT EXISTS contact_person_email VARCHAR;
```

## Step 3: Alternative - Use JSON Storage (Recommended)

Since we've already implemented the API to store comprehensive data as JSON in the `support_content` field, you can skip the column additions and just ensure the basic schema is working.

## Step 4: Test the Setup

After fixing the schema, test with:

```bash
curl -X GET "http://localhost:3003/api/business-types"
```

This should return the list of business types without errors.

## Step 5: If Still Having Issues

If you continue to have database issues, you can:

1. **Use the existing schema**: The application will work with just the basic `clients` table and store comprehensive data as JSON
2. **Check your DATABASE_URL**: Make sure it's correctly configured in your environment
3. **Use the simplified approach**: The current implementation stores all comprehensive business data in the `support_content` field as JSON, which works with the existing database structure

## Current Status

The application is currently configured to:
- Store comprehensive business information as JSON in the existing `support_content` field
- Parse and return this data through the API endpoints
- Provide a full UI for entering all business details
- Support file uploads and website content extraction

The system will work even without the additional database columns, as we're using JSON storage for flexibility.