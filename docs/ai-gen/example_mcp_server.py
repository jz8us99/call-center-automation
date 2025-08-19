#!/usr/bin/env python3
"""
Example MCP Server for Call Center Automation
This server provides tools for managing call center operations.
"""

import asyncio
import json
from typing import Any, Dict, List, Optional
from mcp.server import Server
from mcp.types import (
    Resource,
    Tool,
    TextContent,
    ListResourcesResult,
    ListToolsResult,
    ReadResourceResult,
    CallToolResult,
)


class CallCenterMCPServer:
    def __init__(self):
        self.server = Server("call-center-automation")
        self.setup_handlers()
    
    def setup_handlers(self):
        """Set up MCP protocol handlers"""
        
        @self.server.list_resources()
        async def list_resources() -> ListResourcesResult:
            """List available resources"""
            return ListResourcesResult(
                resources=[
                    Resource(
                        uri="call-center://stats",
                        name="Call Center Statistics",
                        description="Current call center statistics and metrics",
                        mimeType="application/json"
                    ),
                    Resource(
                        uri="call-center://agents",
                        name="Agent Status",
                        description="Current status of all call center agents",
                        mimeType="application/json"
                    ),
                ]
            )
        
        @self.server.read_resource()
        async def read_resource(uri: str) -> ReadResourceResult:
            """Read a specific resource"""
            if uri == "call-center://stats":
                stats = {
                    "total_calls_today": 150,
                    "average_wait_time": "2:30",
                    "calls_in_queue": 5,
                    "active_agents": 12,
                    "resolved_tickets": 89
                }
                return ReadResourceResult(
                    contents=[TextContent(type="text", text=json.dumps(stats, indent=2))]
                )
            elif uri == "call-center://agents":
                agents = {
                    "agents": [
                        {"id": 1, "name": "Sarah", "status": "available", "calls_today": 23},
                        {"id": 2, "name": "Mike", "status": "on_call", "calls_today": 18},
                        {"id": 3, "name": "Emma", "status": "break", "calls_today": 15},
                    ]
                }
                return ReadResourceResult(
                    contents=[TextContent(type="text", text=json.dumps(agents, indent=2))]
                )
            else:
                raise ValueError(f"Unknown resource: {uri}")
        
        @self.server.list_tools()
        async def list_tools() -> ListToolsResult:
            """List available tools"""
            return ListToolsResult(
                tools=[
                    Tool(
                        name="schedule_callback",
                        description="Schedule a callback for a customer",
                        inputSchema={
                            "type": "object",
                            "properties": {
                                "customer_phone": {
                                    "type": "string",
                                    "description": "Customer phone number"
                                },
                                "preferred_time": {
                                    "type": "string",
                                    "description": "Preferred callback time (ISO format)"
                                },
                                "reason": {
                                    "type": "string",
                                    "description": "Reason for callback"
                                }
                            },
                            "required": ["customer_phone", "preferred_time", "reason"]
                        }
                    ),
                    Tool(
                        name="get_customer_history",
                        description="Get customer interaction history",
                        inputSchema={
                            "type": "object",
                            "properties": {
                                "customer_id": {
                                    "type": "string",
                                    "description": "Customer ID or phone number"
                                }
                            },
                            "required": ["customer_id"]
                        }
                    ),
                    Tool(
                        name="update_agent_status",
                        description="Update agent availability status",
                        inputSchema={
                            "type": "object",
                            "properties": {
                                "agent_id": {
                                    "type": "string",
                                    "description": "Agent ID"
                                },
                                "status": {
                                    "type": "string",
                                    "enum": ["available", "busy", "break", "offline"],
                                    "description": "New agent status"
                                }
                            },
                            "required": ["agent_id", "status"]
                        }
                    )
                ]
            )
        
        @self.server.call_tool()
        async def call_tool(name: str, arguments: Dict[str, Any]) -> CallToolResult:
            """Execute a tool"""
            if name == "schedule_callback":
                customer_phone = arguments["customer_phone"]
                preferred_time = arguments["preferred_time"]
                reason = arguments["reason"]
                
                # Mock scheduling logic
                callback_id = f"CB_{hash(customer_phone + preferred_time) % 10000}"
                
                result = {
                    "success": True,
                    "callback_id": callback_id,
                    "message": f"Callback scheduled for {customer_phone} at {preferred_time}",
                    "reason": reason
                }
                
                return CallToolResult(
                    content=[TextContent(type="text", text=json.dumps(result, indent=2))]
                )
            
            elif name == "get_customer_history":
                customer_id = arguments["customer_id"]
                
                # Mock customer history
                history = {
                    "customer_id": customer_id,
                    "total_interactions": 5,
                    "last_contact": "2024-01-15T10:30:00Z",
                    "interactions": [
                        {
                            "date": "2024-01-15T10:30:00Z",
                            "type": "phone_call",
                            "duration": "15:30",
                            "agent": "Sarah",
                            "resolution": "billing_inquiry_resolved"
                        },
                        {
                            "date": "2024-01-10T14:15:00Z",
                            "type": "email",
                            "agent": "Mike",
                            "resolution": "product_question_answered"
                        }
                    ]
                }
                
                return CallToolResult(
                    content=[TextContent(type="text", text=json.dumps(history, indent=2))]
                )
            
            elif name == "update_agent_status":
                agent_id = arguments["agent_id"]
                status = arguments["status"]
                
                result = {
                    "success": True,
                    "agent_id": agent_id,
                    "new_status": status,
                    "timestamp": "2024-01-16T12:00:00Z"
                }
                
                return CallToolResult(
                    content=[TextContent(type="text", text=json.dumps(result, indent=2))]
                )
            
            else:
                raise ValueError(f"Unknown tool: {name}")
    
    async def run(self):
        """Run the MCP server"""
        from mcp.server.stdio import stdio_server
        
        async with stdio_server() as streams:
            await self.server.run(streams[0], streams[1])


async def main():
    """Main entry point"""
    server = CallCenterMCPServer()
    await server.run()


if __name__ == "__main__":
    asyncio.run(main())