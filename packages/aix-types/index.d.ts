/**
 * AIX v1.3.0 Canonical TypeScript Definitions
 * Frozen Release Baseline
 */

export type SemVer = string;
export type ISODateTime = string;
export type AxiomDID = string;
export type KycTier = 'anonymous' | 'basic' | 'verified' | 'sovereign' | 'institutional';

export interface PublicKey {
  algorithm: 'Ed25519' | 'secp256k1';
  value: string;
  encoding?: 'base64url' | 'hex';
}

export interface Signature {
  algorithm: 'Ed25519' | 'secp256k1';
  value: string;
  canonicalization?: 'JCS' | 'RFC8785';
}

export interface Meta {
  version: SemVer;
  id: AxiomDID | string;
  name: string;
  description?: string;
  created: ISODateTime;
  updated?: ISODateTime;
  author: string;
  format_version: "1.3.0" | "1.2.0";
  type: 'persona' | 'utility' | 'saas' | 'hybrid' | 'infra';
  tags?: string[];
  license?: string;
}

export interface Persona {
  role: string;
  name?: string;
  instructions: string;
  tone?: string;
  style?: string;
  constraints?: string[];
  personality_traits?: Record<string, string>;
  temperature?: number;
}

export interface Security {
  checksum: {
    algorithm: 'sha256' | 'sha512' | 'blake3';
    value: string;
  };
  sandboxed: boolean;
  level?: 'standard' | 'high' | 'sovereign';
  signature?: {
    algorithm: string;
    value: string;
    public_key?: string;
    signer?: string;
    timestamp?: ISODateTime;
  };
}

export interface IdentityProvider {
  type: 'pi_network' | 'world_id' | 'ens' | 'did_web' | 'axiom_id' | 'custom';
  name: string;
  authority?: string;
  chain_id?: string;
}

export interface Verification {
  status: 'unverified' | 'basic' | 'verified' | 'institutional' | 'sovereign';
  trust_level: 0 | 1 | 2 | 3;
  kyc_tier?: KycTier;
  proof_url?: string;
  is_perpetual?: boolean; // pKYC: Continuous monitoring enabled
  zk_proof?: {
    circuit_id: string;
    nullifier?: string;
    verified: boolean;
  };
  delegated_to?: AxiomDID[]; // Delegated Credentials for AI agents
}

export interface IdentityLayer {
  id: AxiomDID;
  provider: IdentityProvider;
  verification: Verification;
  issuedAt: ISODateTime;
  expiresAt?: ISODateTime;
  publicKey?: PublicKey;
  signature?: Signature;
}

export interface Economics {
  settlement: {
    layer: 'pi_network' | 'ethereum' | 'solana' | 'stripe' | 'mcp_internal' | 'custom';
    network: string;
    escrow_enabled?: boolean;
    currency?: string;
    address?: string;
  };
  pricing_model: 'free' | 'pay_per_call' | 'subscription' | 'builder' | 'pro';
  revenue_routing?: {
    base_price?: number;
    risk_multiplier_enabled?: boolean;
    quota_limit?: number;
    platform_fee_percent?: number;
  };
  tiers?: Array<{
    name: string;
    features: string[];
    monthly_price?: number;
  }>;
}

export interface SaasService {
  name: string;
  provider: string;
  version?: string;
  endpoints?: string[];
  data_flow?: string[];
  compliance_tier: 'low' | 'medium' | 'high' | 'critical';
}

export interface BuildProvenance {
  builder_id: string;
  build_type: string;
  verified: boolean;
  timestamp?: ISODateTime;
  materials?: Array<{ uri: string; digest: Record<string, string> }>;
}

export interface ABOM {
  integrity_hash: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  model?: {
    name: string;
    provider: string;
  };
  saas_services?: SaasService[];
  governance: {
    human_oversight: boolean;
    policy_url?: string;
  };
}

export interface AgentSkill {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface McpPrompt {
  name: string;
  description?: string;
  arguments?: Array<{ name: string; description?: string; required?: boolean }>;
}

export interface AIXManifest {
  meta: Meta;
  persona: Persona;
  security: Security;
  identity_layer: IdentityLayer;
  skills?: any[];
  apis?: any[];
  mcp?: {
    endpoints: Array<{ uri: string; name?: string }>;
  };
  abom: ABOM;
  build_provenance?: BuildProvenance;
  economics: Economics;
}

export interface RegistryEntry {
  did: string;
  name: string;
  role: string;
  capabilities: string[];
  kyc_tier: KycTier;
  risk_score: number;
  specVersion: string;
  publishedAt: string;
  yaml: string;
}
