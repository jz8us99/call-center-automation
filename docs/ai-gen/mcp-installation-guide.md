# MCP Server Installation in Claude Code Desktop

## ✅ Installation Complete

Your custom MCP server has been successfully installed in Claude Code desktop!

## What was installed:

### 1. MCP Server: `call-center-automation`
- **Location**: `C:\repo\call-center-automation\docs\ai-gen\working_mcp_server.py`
- **Status**: ✅ Active in Claude Code
- **Tools Available**:
  - `get_call_stats` - Get current call center statistics
  - `create_ticket` - Create support tickets with priority levels
  - `get_retell_agents` - List all deployed Retell AI agents
  - `deploy_agent` - Deploy new Retell AI agent configurations
  - `get_call_logs` - Retrieve recent call logs and analytics

### 2. Configuration
- **Config file**: `C:\Users\jz8us\AppData\Roaming\Claude\claude_desktop_config.json`
- **Server name**: `call-center-automation`
- **Runtime**: Python 3.12.10

## How to use:

1. **Restart Claude Code** desktop application to load the new MCP server
2. The tools will be available in your Claude Code sessions
3. You can now use commands like:
   - "Get me the current call center statistics"
   - "Create a support ticket for login issues with high priority"
   - "Show me all my deployed Retell AI agents"
   - "Deploy a new dental reception agent called 'Sunshine Dental AI'"
   - "Get the last 5 call logs from the system"

## Available Tools:

### 🔵 get_call_stats
Returns current call center metrics including:
- Total calls today
- Average wait time
- Calls in queue
- Available/busy agents
- Customer satisfaction score

### 🎫 create_ticket
Creates support tickets with:
- Title and description
- Priority levels: low, medium, high, urgent
- Automatic ticket ID generation
- Timestamp and assignment queue

### 🤖 get_retell_agents
Lists all deployed Retell AI agents:
- Agent IDs and names
- Business types (dental, medical, restaurant, general)
- Current status and activity
- Phone numbers and call statistics

### 🚀 deploy_agent
Deploys new Retell AI agent configurations:
- Supports multiple business types
- Generates deployment IDs
- Provides estimated completion times
- Sets up webhook URLs automatically

### 📞 get_call_logs
Retrieves recent call logs:
- Configurable number of logs (default: 10)
- Call durations and timestamps
- Caller information and agent assignments
- Call status and sentiment analysis

## Configuration Details:

```json
{
  "call-center-automation": {
    "command": "C:\\Users\\jz8us\\AppData\\Local\\Programs\\Python\\Python312\\python.exe",
    "args": [
      "C:\\repo\\call-center-automation\\docs\\ai-gen\\working_mcp_server.py"
    ]
  }
}
```

## Next Steps:

1. **Restart Claude Code** to activate the MCP server
2. Test the tools by asking Claude to get call stats or create tickets
3. Extend the server by adding more tools as needed
4. Monitor MCP logs in Claude's log directory if issues occur

## Troubleshooting:

- **Server logs**: Check `C:\Users\jz8us\AppData\Roaming\Claude\logs\`
- **Test server**: Run the Python file directly to check for syntax errors
- **Verify paths**: Ensure Python and server file paths are correct