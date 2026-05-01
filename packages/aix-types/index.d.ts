/**
 * AIX v1.3.0 Canonical TypeScript Definitions
 * Frozen Release Baseline
 */

export type SemVer = string;
export type ISODateTime = string;
export type AxiomDID = string;

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

export interface IdentityLayer {
  id: AxiomDID;
  authority: "axiomid.app";
  issuedAt: ISODateTime;
  kyc_tier: 0 | 1 | 2 | 3 | 'unverified' | 'basic' | 'verified' | 'institutional';
  verified: boolean;
  publicKey?: PublicKey;
  signature?: Signature;
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
  monetization?: any;
}
