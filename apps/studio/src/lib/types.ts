export interface AgentRecord {
  id: string;
  name: string;
  role: string;
  createdAt: string;   // ISO 8601
  yaml: string;        // raw .aix file content
  did?: string;        // did:aix:<hash>
  kyc_tier?: 'unverified' | 'basic' | 'verified' | 'institutional';
  abom?: AbomRecord;
  manifest: Manifest;  // Parsed manifest
  color?: string;
  successRate?: number;
  tasksCompleted?: number;
}

export interface Manifest {
  meta: {
    name: string;
    description: string;
    version: string;
    role: string;
    format_version?: string;
    author?: string;
  };
  persona: {
    role: string;
    instructions: string;
    tone?: string;
  };
  identity_layer: {
    id: string;
    kyc_tier?: number;
    verified?: boolean;
    authority?: string;
    issuedAt?: string;
  };
  skills: Array<{
    name: string;
    description: string;
    parameters?: object;
  }>;
  economics: {
    pricing_model: string;
    currency: string;
  };
  security?: {
    checksum?: {
      algorithm: string;
      value: string;
    };
    signature?: {
      algorithm: string;
      value: string;
      public_key: string;
    };
  };
  abom?: {
    bom_format: string;
    spec_version: string;
    risk_level: string;
    integrity_hash: string;
    dependencies: string[];
  };
  status?: string;
  color?: string;
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
