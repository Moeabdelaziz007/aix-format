import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";

// Define the server
const server = new Server(
  {
    name: "aix-blackbox-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// We define tools for Regulators/Auditors
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
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "get_blackbox_logs") {
    const manifestPath = args?.manifestPath as string;

    try {
      const content = await fs.readFile(path.resolve(manifestPath), "utf-8");
      const manifest = JSON.parse(content);

      // In a real scenario, this might query an external immutable datastore
      const logs = manifest.black_box?.traces || [];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              agent_id: manifest.meta?.id,
              agent_name: manifest.meta?.name,
              total_logs: logs.length,
              traces: logs
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error reading manifest or logs: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === "verify_abom_compliance") {
    const manifestPath = args?.manifestPath as string;

    try {
      const content = await fs.readFile(path.resolve(manifestPath), "utf-8");
      const manifest = JSON.parse(content);

      const abom = manifest.abom;
      const traces = manifest.black_box?.traces || [];

      const isCompliant = abom && traces.length > 0 && traces.every((t: any) => t.signature);

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
    } catch (error: any) {
       return {
        content: [
          {
            type: "text",
            text: `Error verifying compliance: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Tool not found: ${name}`);
});

// Start the server
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AIX Blackbox MCP Server running on stdio");
}

run().catch(console.error);
