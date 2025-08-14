# Retell Deployment Fix

## Issues Found and Fixed

### 1. Database Schema Mismatch
**Problem**: The `RetellDeploymentService` was trying to query the `ai_agents` table with a `business_id` column that doesn't exist.

**Fix**: Updated the service to use the correct table (`agent_configurations_scoped`) with the correct field names (`client_id` instead of `business_id`).

### 2. Missing Database Tables
**Problem**: The deployment service references tables that don't exist: `retell_agents`, `agent_deployments`, `phone_assignments`.

**Fix**: Created SQL script to create these tables with proper structure and RLS policies.

### 3. Field Name Mismatches
**Problem**: The service was using field names from the old schema that don't match the current `agent_configurations_scoped` table.

**Fix**: Updated field mappings:
- `config.name` → `config.agent_name`
- `config.system_prompt` → `config.basic_info_prompt`
- `config.call_script?.greeting` → `config.call_scripts?.greeting_script`
- `config.business_id` → `config.client_id`

### 4. Agent Type Filtering
**Problem**: The service was filtering by `type` field which doesn't exist in the new schema.

**Fix**: Updated to join with `agent_types` table and filter by `agent_types.type_code`.

## Files Modified

1. **`src/lib/services/retell-deployment-service.ts`**
   - Fixed database queries to use correct table and fields
   - Added environment variable validation
   - Updated field mappings for agent configurations

## Files Created

1. **`docs/sql/create-retell-tables.sql`**
   - Creates `retell_agents` table
   - Creates `agent_deployments` table  
   - Creates `phone_assignments` table
   - Adds proper indexes and RLS policies

2. **`src/app/api/retell/validate/route.ts`**
   - Validation endpoint to check deployment readiness
   - Checks environment variables
   - Checks database table existence
   - Lists available agent configurations

## Steps to Fix

### 1. Create Missing Database Tables
Run the SQL script to create the required tables:
```sql
-- Run the contents of docs/sql/create-retell-tables.sql
```

### 2. Set Environment Variables
Make sure these environment variables are set:
```bash
RETELL_API_KEY=your_retell_api_key
RETELL_LLM_ID=your_llm_id (optional, defaults to 'default')
NEXT_PUBLIC_BASE_URL=http://localhost:19080
```

### 3. Validate Setup
Test the validation endpoint:
```bash
curl "http://localhost:19080/api/retell/validate?businessId=YOUR_BUSINESS_ID"
```

### 4. Test Deployment
1. Go to Settings > Business > AI Agents Setup
2. Ensure you have at least one agent with type "Inbound Receptionist" or "Inbound Customer Support"
3. Click "Deploy to Retell" button

## Expected Flow

1. **Router Agent Deployment**: Creates a router agent with function calling capabilities
2. **Role Agent Deployment**: Creates specific agents for receptionist/support roles
3. **Phone Number Assignment**: Assigns or purchases a phone number for the router agent
4. **Database Storage**: Stores deployment information in `retell_agents` table

## Troubleshooting

### Error: "RETELL_API_KEY environment variable is required"
- Add `RETELL_API_KEY=your_api_key` to your `.env.local` file

### Error: "No active agent configurations found"
- Make sure you have created and saved at least one agent in Step 6
- Check that the agent status is set to active
- Run the validation endpoint to see available configurations

### Error: "Table 'retell_agents' does not exist"
- Run the SQL script: `docs/sql/create-retell-tables.sql`

### Error: "column business_id does not exist"
- The fixes in `retell-deployment-service.ts` should resolve this
- If you still see this error, check that the service file was properly updated

## Testing

Use the validation endpoint to check your setup:
```bash
GET /api/retell/validate?businessId=YOUR_BUSINESS_ID
```

This will return:
- Environment variable status
- Database table existence
- Available agent configurations
- Overall readiness for deployment

## Next Steps

After applying these fixes:
1. Restart your development server
2. Run the validation endpoint
3. Create an agent configuration in Step 6
4. Try the "Deploy to Retell" button
5. Check the console for any remaining errors