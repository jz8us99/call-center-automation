# Recreate Agent Configurations Table via API

If you prefer to use the existing API endpoint instead of running SQL directly, you can make a POST request to the endpoint that will recreate the table with the correct structure.

## Method 1: Using curl

```bash
curl -X POST http://localhost:19080/api/create-agent-config-table \
  -H "Content-Type: application/json"
```

## Method 2: Using the browser

1. Navigate to: `http://localhost:19080/api/create-agent-config-table`
2. The browser will make a GET request, but you need a POST request
3. Use browser developer tools console to make a POST request:

```javascript
fetch('/api/create-agent-config-table', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch((error) => console.error('Error:', error));
```

## Method 3: Using a REST client

Use Postman, Insomnia, or similar tool:
- URL: `http://localhost:19080/api/create-agent-config-table`
- Method: POST
- Headers: `Content-Type: application/json`
- Body: Empty

## What this endpoint does:

1. **Drops** the existing `agent_configurations_scoped` table (if it exists)
2. **Creates** a new table with the correct structure including:
   - `call_scripts_prompt` TEXT field
   - `call_scripts` JSONB field
   - `voice_settings` JSONB field  
   - `call_routing` JSONB field
   - All other required fields
3. **Sets up** indexes for performance
4. **Configures** Row Level Security (RLS) policies
5. **Tests** the new table by inserting a test record

⚠️ **Warning**: This will delete all existing agent configuration data. Use Option 2 (SQL script) if you want to preserve existing data.