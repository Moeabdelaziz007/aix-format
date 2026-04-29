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
  manifest?: any;
  color?: string;
  status?: 'online' | 'offline' | 'busy';
  successRate?: number;
  tasksCompleted?: number;
}

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
  skills: any[];
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
  abom: any;
  mcp: {
    prompts: any[];
  }
}
