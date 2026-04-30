import { Manifest, AgentSkill, McpPrompt } from "@/lib/types";

/**
 * AIX to MCP Server Card Generator (2026 Roadmap Alignment)
 * Strictly follows RFC 8615 and the Agentic AI Foundation discovery spec.
 */

export interface MCPServerCard {
  mcp_version: string;
  name: string;
  version: string;
  description?: string;
  capabilities: {
    tools?: Array<{ name: string; description: string; inputSchema: object }>;
    resources?: Array<{ uri: string; name: string; description?: string }>;
    prompts?: Array<{ name: string; description?: string }>;
  };
  identity: {
    did: string;
    kyc_tier?: number;
    verified: boolean;
  };
  endpoints: Array<{
    type: "sse" | "http" | "stdio";
    uri: string;
  }>;
}

export interface AIXDiscovery {
  format_version: string;
  agent: {
    id: string;
    name: string;
    description?: string;
  };
  server_card: MCPServerCard;
  links: Array<{
    rel: string;
    href: string;
  }>;
}

/**
 * Extracts MCP capabilities from a core AIX manifest.
 */
export function generateMCPServerCard(aixManifest: Manifest, serverUri: string): MCPServerCard {
  const { meta, skills, identity_layer, mcp } = aixManifest;

  // 1. Extract Tools from Skills
  const tools = (skills || []).map((skill: AgentSkill) => ({
    name: skill.name,
    description: skill.description,
    inputSchema: skill.parameters || { type: "object", properties: {} }
  }));

  // 2. Resources (Optional, depends on ABOM dependencies in 2026 spec)
  const resources: Array<{ uri: string; name: string; description?: string }> = [];

  // 3. Build the Server Card
  return {
    mcp_version: "2026.1",
    name: meta.name,
    version: meta.version,
    description: meta.description,
    capabilities: {
      tools,
      resources,
      prompts: mcp?.prompts || []
    },
    identity: {
      did: identity_layer?.id || "did:unknown",
      kyc_tier: identity_layer?.kyc_tier || 0,
      verified: !!identity_layer?.id // Derived from presence of ID in updated schema
    },
    endpoints: [
      {
        type: "sse",
        uri: `${serverUri}/mcp/sse`
      }
    ]
  };
}

/**
 * Generates the .well-known/agent.aix.json discovery manifest.
 */
export function generateAIXDiscovery(aixManifest: Manifest, serverUri: string): AIXDiscovery {
  const card = generateMCPServerCard(aixManifest, serverUri);

  return {
    format_version: "1.3.0",
    agent: {
      id: aixManifest.identity_layer.id,
      name: aixManifest.meta.name,
      description: aixManifest.meta.description
    },
    server_card: card,
    links: [
      { rel: "self", href: `${serverUri}/.well-known/agent.aix.json` },
      { rel: "mcp-server", href: `${serverUri}/mcp/sse` },
      { rel: "manifest", href: `${serverUri}/agent.aix` }
    ]
  };
}

/**
 * Utility to format for .well-known deployment
 */
export function formatWellKnownDiscovery(discovery: AIXDiscovery) {
  return JSON.stringify(discovery, null, 2);
}
