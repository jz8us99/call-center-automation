# Admin API Testing Guide

## Overview
This document provides instructions for testing the admin API endpoints that have been implemented to work with real Supabase profile data.

## Prerequisites
1. Ensure your Supabase database has the `profiles` table with required columns
2. Run the SQL script in `ensure-profiles-schema.sql` to add missing columns
3. Make sure you have an admin user in the profiles table with `role = 'admin'`

## API Endpoints Created

### User Management APIs

#### 1. GET /api/admin/users
- **Purpose**: Fetch all users from profiles table
- **Auth Required**: Yes (Admin only)
- **Returns**: List of all user profiles

#### 2. POST /api/admin/users
- **Purpose**: Create new user profile
- **Auth Required**: Yes (Admin only)
- **Body**: User profile data (name, email, phone, etc.)

#### 3. GET /api/admin/users/[userId]
- **Purpose**: Fetch specific user by ID
- **Auth Required**: Yes (Admin only)
- **Returns**: Single user profile

#### 4. PUT /api/admin/users/[userId]
- **Purpose**: Update user profile
- **Auth Required**: Yes (Admin only)
- **Body**: Updated user profile data

#### 5. DELETE /api/admin/users/[userId]
- **Purpose**: Delete user profile
- **Auth Required**: Yes (Admin only)

#### 6. POST /api/admin/users/[userId]/upgrade
- **Purpose**: Upgrade user's pricing tier
- **Auth Required**: Yes (Admin only)
- **Body**: `{ "newTier": "basic|premium|enterprise" }`

### Pricing Management APIs

#### 1. GET /api/admin/pricing
- **Purpose**: Fetch all pricing tiers (currently mock data)
- **Auth Required**: Yes (Admin only)
- **Returns**: List of pricing tiers

#### 2. POST /api/admin/pricing
- **Purpose**: Create new pricing tier
- **Auth Required**: Yes (Admin only)
- **Body**: Pricing tier data

#### 3. PUT /api/admin/pricing/[tierId]
- **Purpose**: Update pricing tier
- **Auth Required**: Yes (Admin only)
- **Body**: Updated pricing tier data

## Updated Pages

### 1. User Management Page (`/admin/users`)
- **Real Data**: Now fetches users from Supabase profiles table via API
- **Search**: Real-time filtering by name, email, phone, business
- **CRUD Operations**: Create, update, delete users using API calls
- **Form Validation**: Proper form handling with loading states

### 2. AI Agent Configuration Page (`/admin/users/[userId]/agent-config`)
- **Real Data**: Fetches specific user data from Supabase
- **Upgrade Function**: Uses real API to upgrade user tiers
- **Permission Management**: Real-time tier-based permission display

### 3. Pricing Configuration Page (`/admin/pricing`)
- **API Integration**: Uses endpoints for pricing management
- **Form Handling**: Proper form submission for tier creation/updates

## Testing Flow

### Complete Admin Workflow Test:
1. **Access Admin Dashboard**: `http://localhost:19080/admin`
2. **User Management**: Click "User Management" button
3. **View Users**: Should show real users from profiles table
4. **Search Users**: Test filtering functionality
5. **Create User**: Click "Add New User" and create a test user
6. **Edit User**: Click edit button and modify user details
7. **Configure AI Agents**: Click "Configure" button for a user
8. **Upgrade Tier**: Test the upgrade functionality
9. **Pricing Config**: Go to pricing configuration page

## Database Requirements

### Required Profiles Table Columns:
```sql
- id (UUID, Primary Key)
- user_id (UUID, References auth.users)
- email (VARCHAR)
- full_name (VARCHAR)
- phone_number (VARCHAR)
- role (VARCHAR) - 'user' or 'admin'
- pricing_tier (VARCHAR) - 'basic', 'premium', 'enterprise'
- agent_types_allowed (TEXT[])
- is_active (BOOLEAN)
- business_name (VARCHAR)
- business_type (VARCHAR)
- is_super_admin (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Sample Admin User:
```sql
INSERT INTO profiles (
  user_id, email, full_name, role, is_super_admin, 
  pricing_tier, agent_types_allowed, is_active
) VALUES (
  'your-auth-user-id', 'admin@example.com', 'Admin User', 
  'admin', true, 'enterprise', 
  ARRAY['inbound_call', 'outbound_appointment', 'outbound_marketing', 'customer_support'], 
  true
);
```

## Error Handling
- All API endpoints include proper error handling
- Authentication and authorization checks
- Graceful fallbacks for development mode
- User-friendly error messages

## Security Features
- Row Level Security (RLS) policies
- Admin-only access to management endpoints
- Proper authentication checks
- Input validation and sanitization

## Development vs Production
- Development mode bypasses authentication for easier testing
- Production mode requires proper authentication
- All mock data replaced with real Supabase queries
- Proper error handling for both environments