/**
 * 🧬 AIX Manifest Types — hand-authored rich TypeScript surface.
 *
 * The hand-authored surface in this file augments the codegen output
 * in `./types.gen.ts` with Axiom-specific richness that
 * `json-schema-to-typescript` cannot express:
 *
 *   - Template-literal DID types (`did:axiom:axiomid.app:${string}`)
 *     that catch typos at compile time.
 *   - Runtime type guards (`isAxiomDID`, `isDID`) backed by the same
 *     regex the schema enforces.
 *   - Tight enum types where the codegen would emit `string`.
 *
 * Generated types still ship at `@axiom/schema/generated` for
 * consumers that want the raw schema mirror. Most callers should
 * import from the package root and get this file's enriched surface.
 *
 * If the AIX spec changes, update `schemas/aix.schema.json` FIRST,
 * run `pnpm --filter @axiom/schema codegen`, then update this file
 * to match. The codegen CI ratchet (axiom-schema-codegen.yml) blocks
 * any PR that lets the generated mirror drift from the schema.
 *
 * Provenance: original hand-mirror lived at
 * iqra/src/lib/iqra/14-aix/types.ts and is replaced by this package
 * in Phase 1.1 of RFC-001 (see aix-format/docs/rfc).
 */

import { AXIOM_AUTHORITY } from './version';

// ── Primitive aliases ─────────────────────────────────────────────────────────

/** Semantic versioning string (e.g. 1.0.0, 0.369.0, 2.0.0-beta.1). */
export type SemVer = string;

/** ISO 8601 date-time string (e.g. 2026-04-29T20:00:00Z). */
export type ISODateTime = string;

/** UUID v4 string. */
export type UUIDv4 = string;

/** AIX-native DID — `did:axiom:axiomid.app:<id>`. */
export type AxiomDID = `did:axiom:axiomid.app:${string}`;

/** Any W3C DID method we currently accept on the identity layer. */
export type DID = AxiomDID | `did:web:${string}` | `did:pi:${string}` | `did:${string}:${string}`;

/** Cryptographic key/signature algorithms supported by AIX. */
export type SigAlgorithm = 'Ed25519' | 'secp256k1';

// ── Crypto material ───────────────────────────────────────────────────────────

export interface PublicKey {
  algorithm: SigAlgorithm;
  /** Base64url-encoded public key bytes (default) or hex when stated. */
  value: string;
  encoding?: 'base64url' | 'hex';
}

export interface Signature {
  algorithm: SigAlgorithm;
  /** Base64url-encoded signature bytes over the canonical payload hash. */
  value: string;
  /** JSON canonicalization scheme used before hashing. Default: JCS (RFC 8785). */
  canonicalization?: 'JCS' | 'RFC8785';
}

// ── meta ──────────────────────────────────────────────────────────────────────

export interface MetaLineageEntry {
  version: SemVer;
  parent_version?: SemVer;
  created: ISODateTime;
  notes?: string;
}

export interface AIXMeta {
  version: SemVer;
  format_version?: '1.0' | '1.2' | '1.3';
  id: UUIDv4 | DID;
  name: string;
  description?: string;
  created: ISODateTime;
  updated?: ISODateTime;
  author: string;
  license?: string;
  homepage?: string;
  repository?: string;
  documentation?: string;
  framework?: string;
  language?: string;
  runtime_version?: string;
  tags?: string[];
  icon?: string;
  lineage?: MetaLineageEntry[];
}

// ── persona ───────────────────────────────────────────────────────────────────

export interface AIXPersona {
  role: string;
  tone?: string;
  style?: string;
  instructions: string;
  constraints?: string[];
  personality_traits?: Record<string, string>;
  example_responses?: Array<Record<string, unknown>>;
}

// ── identity_layer ────────────────────────────────────────────────────────────

export interface ZKProof {
  /** Groth16 proof object as produced by snarkjs. */
  proof: Record<string, unknown>;
  /** Public inputs to the proof — decimal-encoded field elements as strings. */
  publicSignals: string[];
  /** Unique proof identifier used to prevent replay attacks (>=32 chars). */
  nullifier: string;
  timestamp?: ISODateTime;
  /** Circuit identifier (e.g. pkyc-v1). */
  circuit?: string;
}

/**
 * AxiomID Identity block. `axiomid.app` is the Root Authority for all
 * issued identities; the `authority` field is locked to that constant
 * by the schema (`identity_layer.authority` is `const: "axiomid.app"`)
 * so any consumer that mints an alternative authority is rejected.
 *
 * Required fields per schema: `id`, `authority`, `issuedAt`. All other
 * fields are optional; their absence simply means the runtime has not
 * recorded that signal yet.
 */
export interface AIXIdentityLayer {
  id: DID;
  /** Root authority. Locked to `axiomid.app` by the schema. */
  authority: typeof AXIOM_AUTHORITY;
  issuedAt: ISODateTime;
  expiresAt?: ISODateTime;
  /**
   * Pi Network KYC tier. `0`/`unverified`, `1`/`basic`, `2`/`verified`,
   * `3`/`sovereign`. Stored as either the integer (when machine-set by
   * the KYC verifier) or the string label (when authored by hand).
   */
  kyc_tier?: number | string;
  /** Has the authority verified this identity at any tier above 0? */
  verified?: boolean;
  publicKey?: PublicKey;
  signature?: Signature;
  /**
   * SHA-256 hex (64 chars) of a Pi Network UID, binding this DID to a
   * verified Pi user without revealing the UID itself. Produced by
   * `pi-kyc.hashPiUid()`.
   */
  pi_uid_anchor?: string;
  /**
   * Optional zero-knowledge KYC proof attesting to identity properties
   * without revealing the underlying data. Replay protection is
   * handled at verification time via the nullifier registry.
   */
  zk_proof?: ZKProof;
}

// ── security ──────────────────────────────────────────────────────────────────

export interface AIXSecurity {
  level: number;
  authentication?: Record<string, unknown>;
  capabilities?: string[];
  checksum?: string;
  compliance?: string[];
  encryption?: Record<string, unknown>;
  guardian_logic?: Record<string, unknown>;
  signature?: Signature;
}

// ── trustchain ────────────────────────────────────────────────────────────────

export interface AIXTrustChainEntry {
  action: string;
  actor_did: DID;
  /** SHA-256 hex (64 chars). */
  payload_hash: string;
  timestamp: ISODateTime;
  prev_hash: string;
  human_approved?: boolean;
}

export interface AIXTrustChain {
  entries: AIXTrustChainEntry[];
}

// ── evolution ─────────────────────────────────────────────────────────────────

export interface AIXEvolution {
  loops_completed?: number;
  last_improved?: ISODateTime;
  lessons?: string[];
  trust_delta?: number;
  version_lineage?: string[];
}

// ── pi_network ────────────────────────────────────────────────────────────────

export interface AIXPiNetwork {
  app_id: string;
  environment: 'sandbox' | 'production';
  sdk_version?: string;
  payment_provider?: string;
  kyc_required?: boolean;
}

// ── abom ──────────────────────────────────────────────────────────────────────

export interface AIXAbomDependency {
  name: string;
  version?: string;
  source?: string;
  license?: string;
}

export interface AIXAbom {
  base_models?: AIXAbomDependency[];
  training_datasets?: AIXAbomDependency[];
  plugins?: AIXAbomDependency[];
  saas_dependencies?: AIXAbomDependency[];
}

// ── meta_arbiter ──────────────────────────────────────────────────────────────

export interface AIXMetaArbiterConfig {
  activation_threshold?: number;
  concurrent_systems_limit?: number;
  response_time_target_sec?: number;
  resource_allocation_ratio?: number;
  growth_milestones_enabled?: boolean;
  coordination_strategy?:
    | 'sequential'
    | 'parallel'
    | 'hierarchical'
    | 'collaborative'
    | 'competitive';
  decision_criteria?: {
    urgency?: number;
    complexity?: number;
    resource_availability?: number;
    user_preference?: number;
    system_capability?: number;
  };
  alert_thresholds?: {
    response_time_sec?: number;
    accuracy?: number;
    error_rate?: number;
    resource_usage?: number;
  };
  growth_milestone_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  [extra: string]: unknown;
}

// ── Open / progressive sections ──────────────────────────────────────────────
// These sections exist in the schema but their TS surface is not yet
// fully authored. Declared as opaque records so future emitters can
// fill them progressively without breaking type-safety here.

export type AIXOpaqueSection = Record<string, unknown>;

// ── Top-level manifest ────────────────────────────────────────────────────────

export interface AIXManifest {
  /** Optional shorthand for the targeted AIX schema version (e.g. "0.369.0"). */
  aix_version?: SemVer;

  meta: AIXMeta;
  persona: AIXPersona;
  security: AIXSecurity;
  identity_layer: AIXIdentityLayer;

  trustchain?: AIXTrustChain;
  evolution?: AIXEvolution;
  pi_network?: AIXPiNetwork;
  abom?: AIXAbom;
  meta_arbiter?: AIXMetaArbiterConfig;

  apis?: AIXOpaqueSection;
  mcp?: AIXOpaqueSection;
  memory?: AIXOpaqueSection;
  topology?: AIXOpaqueSection;
  skills?: AIXOpaqueSection;
  live_voice?: AIXOpaqueSection;
  economics?: AIXOpaqueSection;
  requirements?: AIXOpaqueSection;
}

// ── Utility guards ────────────────────────────────────────────────────────────

const AXIOM_DID_RE = /^did:axiom:axiomid\.app:[a-zA-Z0-9._\-]+$/;

export function isAxiomDID(value: unknown): value is AxiomDID {
  return typeof value === 'string' && AXIOM_DID_RE.test(value);
}

const DID_RE = /^did:[a-z0-9]+:[a-zA-Z0-9._%\-]+(:[a-zA-Z0-9._%\-]+)*$/;

export function isDID(value: unknown): value is DID {
  return typeof value === 'string' && DID_RE.test(value);
}
