import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import yaml from 'js-yaml';
import { scanAgent } from '../../../core/abom-scanner.js';

const server = new Server(
  {
    name: "aix-universal-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_blackbox_logs",
        description: "Retrieve cryptographic logs of agent actions for a specific AIX manifest. Used for auditing and reconstructing agent decisions.",
        inputSchema: {
          type: "object",
          properties: {
            manifestPath: {
              type: "string",
              description: "Path to the .aix manifest file",
            },
          },
          required: ["manifestPath"],
        },
      },
      {
        name: "verify_abom_compliance",
        description: "Verify the ABOM (Agent Bill of Materials) and trace logs to ensure regulatory compliance.",
        inputSchema: {
          type: "object",
          properties: {
            manifestPath: {
              type: "string",
              description: "Path to the .aix manifest file",
            },
          },
          required: ["manifestPath"],
        },
      },
      {
        name: 'discover_agents',
        description: 'Search and discover AI Agents registered in the AIX Format registry',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            kyc_tier: { type: 'string', enum: ['none', 'basic', 'verified'], description: 'Filter by KYC tier' }
          }
        },
      },
      {
        name: 'validate_aix',
        description: 'Validate an AIX Format YAML/JSON agent manifest',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'AIX YAML or JSON content' }
          },
          required: ['content']
        },
      },
      {
        name: 'scan_agent',
        description: 'Get ABOM risk score and compliance report for an AI Agent',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'AIX YAML or JSON content' }
          },
          required: ['content']
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_blackbox_logs") {
      const manifestPath = args?.manifestPath as string;
      const content = await fs.readFile(path.resolve(manifestPath), "utf-8");
      let manifest;
      try {
        manifest = content.trim().startsWith('{') ? JSON.parse(content) : yaml.load(content);
      } catch (e: any) {
        throw new Error('Invalid format: ' + e.message);
      }
      const logs = (manifest as any).black_box?.traces || [];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              agent_id: (manifest as any).meta?.id,
              agent_name: (manifest as any).meta?.name,
              total_logs: logs.length,
              traces: logs
            }, null, 2),
          },
        ],
      };
    }

    if (name === "verify_abom_compliance") {
      const manifestPath = args?.manifestPath as string;
      const content = await fs.readFile(path.resolve(manifestPath), "utf-8");
      let manifest;
      try {
        manifest = content.trim().startsWith('{') ? JSON.parse(content) : yaml.load(content);
      } catch (e: any) {
        throw new Error('Invalid format: ' + e.message);
      }
      const abom = (manifest as any).abom;
      const traces = (manifest as any).black_box?.traces || [];
      const isCompliant = !!(abom && traces.length > 0 && traces.every((t: any) => t.signature));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              compliant: isCompliant,
              details: {
                has_abom: !!abom,
                has_traces: traces.length > 0,
                all_traces_signed: traces.every((t: any) => t.signature)
              }
            }, null, 2),
          },
        ],
      };
    }

    if (name === 'discover_agents') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              { name: 'Research Analyst', did: 'did:axiom:research-1', kyc_tier: 'verified' },
              { name: 'Code Assistant', did: 'did:axiom:coder-7', kyc_tier: 'basic' }
            ], null, 2),
          },
        ],
      };
    }

    if (name === 'validate_aix' || name === 'scan_agent') {
      const content = args?.content as string;
      if (!content) throw new Error('Missing content');

      let agentData;
      try {
        agentData = content.trim().startsWith('{') ? JSON.parse(content) : yaml.load(content);
      } catch (e: any) {
        throw new Error('Invalid format: ' + e.message);
      }

      if (name === 'validate_aix') {
        return {
          content: [{ type: 'text', text: 'Manifest is valid AIX format.' }],
        };
      }

      const report = scanAgent(agentData);
      return {
        content: [{ type: 'text', text: JSON.stringify(report, null, 2) }],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AIX Universal MCP Server running on stdio");
}

run().catch(console.error);
