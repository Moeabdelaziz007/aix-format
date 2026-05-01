import type { 
  AIXManifest as CanonicalManifest, 
  ABOM as CanonicalABOM, 
  IdentityLayer as CanonicalIdentityLayer, 
  SaasService as CanonicalSaasService,
  Meta as CanonicalMeta,
  Persona as CanonicalPersona,
  BuildProvenance as CanonicalBuildProvenance
} from '../../../../packages/core/src/types';

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
  deployment?: DeploymentRecord;
  abom?: AbomData;
}

export interface AgentRecord {
  id: string;
  name: string;
  role: string;
  createdAt: string;
  yaml: string;
  did?: string;
  kyc_tier?: 'unverified' | 'basic' | 'verified' | 'institutional';
  abom?: AbomData;
  deployment?: DeploymentRecord;
  // Extended fields for UI state
  color?: string;
  status?: 'online' | 'offline' | 'busy';
  successRate?: number;
  tasksCompleted?: number;
  manifest?: CanonicalManifest;
  published?: boolean;
}

export type NormalizedAgent = AgentRecord & { isMock: boolean };

// ─── Unified ABOM Data ─────────────────────────────────────────────────────
export interface AbomData extends CanonicalABOM {
  bom_format: 'CycloneDX' | 'SPDX' | 'AIX-NATIVE';
  spec_version: string;
  generated_by: string;
  timestamp: string;
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

export interface McpPrompt {
  name: string;
  description?: string;
}

// ─── Provider-Agnostic Abstraction Layers ───────────────────────────────────

export interface IdentityLayer extends CanonicalIdentityLayer {
  provider: {
    type: 'pi_network' | 'world_id' | 'ens' | 'custom';
    name: string;
    authority?: string;
  };
  verification: {
    status: 'unverified' | 'verified' | 'rejected' | 'pending';
    trust_level: number; // 0-3
    provider_specific_tier?: string;
  };
}

export interface EconomicsLayer {
  settlement: {
    layer: 'pi_network' | 'ethereum' | 'solana' | 'stripe' | 'custom';
    network: string;
    contract_address?: string;
    escrow_enabled: boolean;
    currency: string;
  };
  pricing_model: string;
  currency: string; // Legacy field for compatibility
}

export interface Manifest extends CanonicalManifest {
  economics: EconomicsLayer;
  mcp: {
    prompts: McpPrompt[];
    endpoints: Array<{ uri: string; name?: string }>;
  }
}

export interface PiUser {
  uid: string;
  username?: string;
  credentials?: {
    scopes: string[];
    valid_until: {
      timestamp: number;
      iso8601: string;
    };
  };
}

export interface AuthResult {
  user: PiUser;
  accessToken: string;
  signature?: string;
  publicKey?: string;
}

export interface PiKycOptions {
  uidSalt?: string;
  didMethod?: 'did:axiom' | 'did:web';
  didAuthority?: string;
  assuranceLevel?: 'low' | 'substantial' | 'high';
  minAssuranceLevel?: 'low' | 'substantial' | 'high';
  enforceJwtExpiry?: boolean;
  enforceJwtAlg?: boolean;
  allowedJwtAlgs?: string[];
  challengeNonce?: string;
  blockchainAnchor?: {
    chain: string;
    txid: string;
    blockHeight?: number;
    anchoredAt?: string;
  };
}

export interface KycProof {
  version: string;
  provider: string;
  assurance_level: string;
  uid_hash: string;
  uid_hash_algorithm: string;
  uid_hash_salted: boolean;
  verified_at: string;
  access_token_hash: string;
  challenge_binding_hash?: string;
  blockchain_anchor?: {
    chain: string;
    txid: string;
    block_height?: number;
    anchored_at: string;
    anchor_hash: string;
  };
  vla_device_registry?: {
    adapter: string;
    hardware_id: string;
  };
}

export interface KycResponse {
  identity_layer: IdentityLayer;
  kyc_proof: KycProof;
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

export interface VercelDeployResponse {
  url: string;
  id: string;
  readyState: string;
}

// ─── Scan Result Types ─────────────────────────────────────────────────────
export interface RiskItem {
  category: 'Capability' | 'Supply Chain' | 'Identity' | 'Compliance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
}

export interface ComplianceReport {
  eu_cra: boolean;
  nist_ai_rmf: boolean;
  kyc_complete: boolean;
}

export interface ScanResult {
  score: number;           // 0-100
  grade: 'A'|'B'|'C'|'D'|'F';
  risks: RiskItem[];
  recommendations: string[];
  compliance: ComplianceReport;
  timestamp: string;
}

// Add missing types that might be referenced
export type AbomRecord = ScanResult;
