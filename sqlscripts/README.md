# SQL Scripts Documentation

This folder contains all SQL scripts for the call center automation system. Each script serves a specific purpose in setting up and maintaining the database schema.

## Core Setup Scripts

### 🔧 Essential Setup
- **`complete-database-setup.sql`** - Comprehensive database setup with all tables
- **`essential-schema.sql`** - Core tables required for basic functionality
- **`database-migrations.sql`** - Database migration scripts for updates
- **`ensure-profiles-schema.sql`** - User profiles and authentication setup

### 🏢 Business Management
- **`add-business-columns.sql`** - Additional business information columns
- **`business-profile-schema.sql`** - Business profile and settings tables

### 👥 Staff & Job Management
- **`staff-schema.sql`** - Staff member tables and relationships
- **`corrected-staff-schema.sql`** - Updated staff table structure
- **`enhanced-job-management-schema.sql`** - Comprehensive job management system
- **`job-titles-schema.sql`** - Job titles and categories
- **`staff-job-types-schema.sql`** - Staff job type assignments

### 📅 Calendar & Appointments
- **`setup-appointment-tables.sql`** - **[MAIN]** Complete appointment system setup
- **`office-hours-schema.sql`** - Business operating hours table
- **`holidays-schema.sql`** - Business holidays and closures
- **`appointment-booking-schema.sql`** - Appointment booking system
- **`appointment-calendar-schema.sql`** - Calendar integration tables
- **`booking-settings-schema.sql`** - Booking configuration and rules
- **`staff-calendar-schema.sql`** - Individual staff calendars

### 🤖 AI Agent Management
- **`ai-agent-management-schema.sql`** - AI agent configuration and management

### 🛍️ Products & Services
- **`products-schema.sql`** - Business products and services catalog

### 🏥 Industry-Specific
- **`dental-rbac-schema.sql`** - Role-based access control for dental practices

## Diagnostic & Maintenance Scripts

### 🔍 Diagnostics
- **`check-database-schema.sql`** - Verify database schema integrity
- **`diagnose-db-issues.sql`** - Identify and diagnose database problems
- **`test-database-setup.sql`** - Test database configuration

### 🔧 Fix Scripts
- **`fix-schema-issues.sql`** - General schema issue fixes
- **`safe-schema-fix.sql`** - Safe schema corrections
- **`minimal-fix.sql`** - Minimal required fixes
- **`missing-tables-fix.sql`** - Create missing tables

## Usage Instructions

### 1. Initial Setup
For a new installation, run these scripts in order:
```sql
-- 1. Core setup
\i sqlscripts/essential-schema.sql

-- 2. Appointment system (includes office hours & holidays)
\i sqlscripts/setup-appointment-tables.sql

-- 3. Staff management
\i sqlscripts/enhanced-job-management-schema.sql

-- 4. AI agents
\i sqlscripts/ai-agent-management-schema.sql
```

### 2. Quick Appointment System Setup
If you only need the appointment system:
```sql
\i sqlscripts/setup-appointment-tables.sql
```

### 3. Diagnostics
To check your database health:
```sql
\i sqlscripts/check-database-schema.sql
\i sqlscripts/diagnose-db-issues.sql
```

### 4. Fixing Issues
If you encounter database issues:
```sql
-- Try safe fixes first
\i sqlscripts/safe-schema-fix.sql

-- For missing tables
\i sqlscripts/missing-tables-fix.sql

-- For more comprehensive fixes
\i sqlscripts/fix-schema-issues.sql
```

## Important Notes

### 🚨 Production Safety
- Always backup your database before running any scripts
- Test scripts in a development environment first
- Scripts marked with `DROP TABLE` are destructive - use with caution
- RLS (Row Level Security) policies are included for data protection

### 🔑 Required Environment Variables
Ensure these are set in your Supabase project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 📋 Dependencies
- PostgreSQL 12+
- Supabase Auth system
- UUID extension (usually enabled by default)

## Recent Updates

### 2025-08-05 - Appointment System Fix
- ✅ Fixed `setup-appointment-tables.sql` - Complete appointment system setup
- ✅ Updated `office-hours-schema.sql` - Business hours with RLS policies
- ✅ Updated `holidays-schema.sql` - Holiday management with proper constraints
- ✅ API endpoints now use correct Supabase admin client

### Schema Features
- **RLS Policies**: All tables have Row Level Security enabled
- **Triggers**: Automatic `updated_at` timestamp updates
- **Indexes**: Optimized for query performance
- **Constraints**: Data integrity validation
- **UUID Primary Keys**: Secure, unique identifiers

## Troubleshooting

### Common Issues
1. **"Table does not exist" errors**
   - Run the appropriate schema creation script
   - Check if the table name is correct in your API calls

2. **"Permission denied" errors**
   - Verify RLS policies are correctly configured
   - Ensure service role key is set properly

3. **"Invalid UUID" errors**
   - Check that user_id and business_id are valid UUIDs
   - Verify authentication is working correctly

### Getting Help
- Check the main project README.md
- Review API endpoint documentation in `/src/app/api/`
- Examine component implementations in `/src/components/`