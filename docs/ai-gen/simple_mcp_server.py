#!/usr/bin/env python3
"""
Simple MCP Server for testing Claude Code integration
"""

import asyncio
import json
from mcp import server, types


# Create server instance
app = server.Server("simple-call-center")


@app.list_tools()
async def list_tools() -> list[types.Tool]:
    """List available tools"""
    return [
        types.Tool(
            name="get_call_stats",
            description="Get current call center statistics",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        types.Tool(
            name="create_ticket",
            description="Create a support ticket",
            inputSchema={
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Ticket title"
                    },
                    "description": {
                        "type": "string", 
                        "description": "Ticket description"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "urgent"],
                        "description": "Ticket priority"
                    }
                },
                "required": ["title", "description"]
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    """Handle tool calls"""
    
    if name == "get_call_stats":
        stats = {
            "total_calls_today": 127,
            "average_wait_time": "3:45",
            "calls_in_queue": 8,
            "available_agents": 15,
            "busy_agents": 7,
            "satisfaction_score": 4.2
        }
        return [types.TextContent(
            type="text", 
            text=json.dumps(stats, indent=2)
        )]
    
    elif name == "create_ticket":
        title = arguments.get("title", "")
        description = arguments.get("description", "")
        priority = arguments.get("priority", "medium")
        
        ticket_id = f"TICKET-{abs(hash(title + description)) % 10000:04d}"
        
        ticket = {
            "ticket_id": ticket_id,
            "title": title,
            "description": description,
            "priority": priority,
            "status": "open",
            "created_at": "2024-01-16T12:00:00Z",
            "assigned_to": "auto-assignment-queue"
        }
        
        return [types.TextContent(
            type="text",
            text=f"Created ticket {ticket_id}\n\n" + json.dumps(ticket, indent=2)
        )]
    
    else:
        raise ValueError(f"Unknown tool: {name}")


async def main():
    # Import here to avoid issues with event loop
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream)


if __name__ == "__main__":
    asyncio.run(main())