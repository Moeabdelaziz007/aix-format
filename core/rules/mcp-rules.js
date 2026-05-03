/**
 * MCP Section Validation Rules
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

export const mcpRules = [
  {
    name: 'mcp-servers-array',
    priority: 40,
    check: (data) => !data.mcp || (data.mcp.servers && Array.isArray(data.mcp.servers)),
    message: 'MCP servers must be an array'
  },
  {
    name: 'mcp-server-name',
    priority: 40,
    check: (data) => {
      if (!data.mcp?.servers) return true;
      return data.mcp.servers.every(s => s.name);
    },
    message: 'MCP server entries missing required name field'
  },
  {
    name: 'mcp-server-command',
    priority: 40,
    check: (data) => {
      if (!data.mcp?.servers) return true;
      return data.mcp.servers.every(s => s.command);
    },
    message: 'MCP server entries missing required command field'
  }
];

// Made with Bob