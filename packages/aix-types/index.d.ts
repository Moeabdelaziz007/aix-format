/**
 * AIX v1.3.0 Canonical TypeScript Definitions
 * Frozen Release Baseline
 */

export type SemVer = string;
export type ISODateTime = string;
export type AxiomDID = string;
export type KycTier = 'anonymous' | 'basic' | 'verified' | 'sovereign' | 'institutional';
export type DeadHandStatus = 'dormant' | 'active' | 'triggered';
export type ArbitrageStrategy = 'route_splitting' | 'timing_attack' | 'skill_staking';

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
    nonce?: string; // Genesis Hash Replay Protection
    prev_hash?: string; // Blockchain-style linking
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
  dead_hand?: {
    enabled: boolean;
    inactivity_limit_days: number;
    last_active_at: ISODateTime;
    status: DeadHandStatus;
  };
  pi_stake?: {
    amount: number;
    currency: 'PI';
    locked_until?: ISODateTime;
  };
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
  arbitrage?: {
    enabled: boolean;
    strategies: ArbitrageStrategy[];
    min_yield_threshold?: number;
  };
  sovereign_loop?: {
    enabled: boolean;
    royalty_bps: number;
    automatic_reinvestment?: boolean;
  };
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

export interface GhostConfig {
  hidden_did?: AxiomDID;
  shadow_memory_enabled: boolean;
  ephemeral_keys: boolean;
  stealth_mode: boolean;
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
  is_shadow_clone?: boolean; // DNA Shadow Forking: Silent duplication for A/B tests
  ghost_config?: GhostConfig; // Ghost Agent Pattern: Secondary identity & shadow memory
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
