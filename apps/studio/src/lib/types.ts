export interface AgentManifest {
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
  skills: Array<{
    name: string;
    description: string;
  }>;
  security: {
    checksum: {
      algorithm: string;
      value: string;
    };
  };
  identity_layer: {
    id: string;
    authority: string;
    issuedAt: string;
  };
  economics: {
    pricing_model: string;
    token: string;
  };
  abom: {
    bom_format: string;
    spec_version: string;
    risk_level: string;
    integrity_hash: string;
    dependencies: string[];
  };
  mcp?: {
    prompts: any[];
    resources?: any[];
    tools?: any[];
  };
}

export interface AgentRecord {
  id: string;
  manifest: AgentManifest;
  createdAt: string;
  updatedAt: string;
  status: "online" | "offline" | "busy";
  color?: string;
  successRate?: number;
  tasksCompleted?: number;
}
