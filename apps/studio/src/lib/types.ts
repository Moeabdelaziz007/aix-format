// ⚠️ NO `any` POLICY — all types must be explicit.
// Run: cd apps/studio && npx tsc --noEmit before every commit.

export type DeployStatus = 
  'idle' | 'deploying' | 'deployed' | 'failed';

export interface DeploymentRecord {
  agentId: string;
  deployedAt: string;
  endpointUrl: string;      // e.g. https://axiomid.app/agents/{did}
  mcpUrl: string;           // e.g. https://axiomid.app/api/mcp-discovery
  status: DeployStatus;
  txHash?: string;          // wallet tx hash (for PROMPT 3)
  network?: string;         // 'ethereum' | 'polygon' (for PROMPT 3)
  signature?: string;       // Web3 signature
  signer?: string;          // Address of the signer
}

export interface RegistryEntry extends McpAgent {
  publishedAt: string;
  yaml: string;
}

export interface AgentRecord {
  id: string;
  name: string;
  role: string;
  createdAt: string;
  yaml: string;
  did?: string;
  kyc_tier?: 'unverified' | 'basic' | 'verified' | 'institutional';
  abom?: AbomRecord;
  deployment?: DeploymentRecord;
  // Extended fields for UI state (kept as optional to maintain compatibility with MISSION 9)
  color?: string;
  status?: 'online' | 'offline' | 'busy';
  successRate?: number;
  tasksCompleted?: number;
  published?: boolean;
}

export type NormalizedAgent = AgentRecord & { isMock: boolean };

export interface AbomRecord {
  capabilities: string[];
  integrity_hash: string;
  generated_by: string;
  timestamp: string;
  model?: {
    provider: string;
    name: string;
    version?: string;
  };
  dataset?: {
    sources: string[];
    cutoff_date?: string;
  };
  governance?: {
    license: string;
    contact?: string;
  };
}

export interface McpAgent {
  did: string;
  name: string;
  role: string;
  capabilities: string[];
  kyc_tier: string;
  specVersion: string;
}

export interface McpDiscoveryResponse {
  mcpVersion: string;
  generated: string;
  totalAgents: number;
  agents: McpAgent[];
}

export interface AgentSkill {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface AbomManifest {
  bom_format: 'CycloneDX' | 'SPDX';
  spec_version: string;
  risk_level: 'low' | 'medium' | 'high';
  integrity_hash: string;
  dependencies: string[];
}

export interface McpPrompt {
  name: string;
  description?: string;
}

export interface Manifest {
  meta: {
    name: string;
    version: string;
    format_version: string;
    author: string;
    description: string;
  };
  persona: {
    role: string;
    instructions: string;
    tone: string;
  };
  skills: AgentSkill[];
  security: {
    checksum: {
      algorithm: string;
      value: string;
    }
  };
  identity_layer: {
    id: string;
    authority: string;
    issuedAt: string;
    kyc_tier?: number;
  };
  economics: {
    pricing_model: string;
    currency: string;
  };
  abom: AbomManifest;
  mcp: {
    prompts: McpPrompt[];
  }
}

export interface PiUser {
  uid: string;
  username: string;
}

export interface AuthResult {
  user: PiUser;
  accessToken: string;
}

// ─── New Deployment Types ──────────────────────────────────────────────────
export type DeployTarget = 'vercel' | 'custom';

export interface DeployConfig {
  token?: string;
  projectName?: string;
  endpointUrl?: string;
}

export interface DeployRequest {
  agentId: string;
  target: DeployTarget;
  config: DeployConfig;
  yaml: string;
}

export interface DeployResponse {
  deployUrl: string;
  status: 'deployed' | 'failed';
  error?: string;
}
