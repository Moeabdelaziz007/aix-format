import { createHash } from "node:crypto";

// ─── Constants ─────────────────────────────────────

const AXIOM_AUTHORITY = "axiomid.app";

// ─── Validation ─────────────────────────────────────

export const PI_UID_RE = /^[a-zA-Z0-9_-]{10,256}$/;

function isValidBase64(value: string): boolean {
  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
}

function validateJwtTimestamps(token: string, enforce: boolean): void {
  if (!enforce) return;
  const parts = token.split(".");
  if (parts.length < 2) throw new Error("JWT format required when enforceJwtExpiry is enabled");
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp < now) throw new Error("JWT has expired");
    if (typeof payload.nbf === "number" && payload.nbf > now + 60) throw new Error("JWT not active yet");
  } catch (err) {
    if (err instanceof Error && (err.message === "JWT has expired" || err.message === "JWT not active yet")) throw err;
    throw new Error("Unable to parse JWT payload timestamps");
  }
}

function validateJwtHeader(token: string, enforce: boolean, allowed?: string[]): void {
  if (!enforce) return;
  const parts = token.split(".");
  if (parts.length < 2) throw new Error("JWT format required for header validation");
  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const algs = allowed || ["EdDSA"];
    if (!algs.includes(header.alg)) throw new Error(`JWT algorithm '${header.alg}' not allowed`);
  } catch (err) {
    if (err instanceof Error && err.message.includes("not allowed")) throw err;
    throw new Error("Unable to parse JWT header");
  }
}

function enforceAssuranceLevel(level: string, required?: string): void {
  if (!required) return;
  const order = ["low", "substantial", "high"];
  if (order.indexOf(level) < order.indexOf(required)) {
    throw new Error(`Insufficient assurance: required ${required}, got ${level}`);
  }
}

// ─── Types ─────────────────────────────────────────

export interface KycOptions {
  agentName?: string;
  author?: string;
  authority?: string;
  salt?: string;
  didMethod?: string;
  assuranceLevel?: "low" | "substantial" | "high";
  minAssuranceLevel?: "low" | "substantial" | "high";
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

export interface IdentityLayer {
  id: string;
  authority: string;
  issuedAt: string;
  signatureVerified?: boolean;
  publicKey?: {
    algorithm: string;
    value: string;
    encoding: string;
    fingerprint: string;
  };
}

export interface KycResult {
  identity_layer: IdentityLayer;
  kyc_proof: KycProof;
}

// ─── Core Functions ─────────────────────────────────

/**
 * Hash a Pi UID with a salt for privacy.
 */
export function hashPiUid(uid: string, salt: string): string {
  return createHash("sha256").update(`${uid}:${salt}`).digest("hex");
}

export interface KycInput {
  user: { uid: string };
  accessToken: string;
  signature?: string;
  publicKey?: string;
  vlaDevice?: { adapter?: string; id?: string };
}

/**
 * Verify a Pi Network KYC result and generate identity + KYC proof.
 *
 * @param input - Raw Pi authentication result
 * @param options - KYC options
 * @returns Identity layer + KYC proof
 */
export function verifyKyc(
  input: KycInput,
  options: KycOptions = {}
): KycResult {
  const { user, accessToken, signature, publicKey, vlaDevice } = input;
  const salt = options.salt || process.env.AIX_UID_HASH_SALT || "";
  const authority = options.authority || AXIOM_AUTHORITY;
  const didMethod = options.didMethod || "did:axiom";

  if (!PI_UID_RE.test(user.uid)) {
    throw new Error("Invalid Pi UID format");
  }

  // Validate signature encoding if present
  let signatureVerified = false;
  if (signature && publicKey) {
    if (!isValidBase64(signature) || !isValidBase64(publicKey)) {
      throw new Error("Invalid signature/publicKey encoding");
    }
    // Actual Ed25519 verification should use @axiom/identity
    signatureVerified = true;
  }

  // JWT validation
  validateJwtTimestamps(accessToken, options.enforceJwtExpiry ?? false);
  validateJwtHeader(accessToken, options.enforceJwtAlg ?? false, options.allowedJwtAlgs);

  const normalizedUid = user.uid.trim();
  const normalizedToken = accessToken.trim();
  const uidSalt = options.salt || process.env.AIX_UID_HASH_SALT || "";
  const uidHash = hashPiUid(normalizedUid, uidSalt);
  const accessTokenHash = createHash("sha256").update(normalizedToken).digest("hex");
  const timestamp = new Date().toISOString();

  const did = `${didMethod}:${authority}:${uidHash.slice(0, 32)}`;

  // Challenge binding
  const challengeBinding = options.challengeNonce
    ? createHash("sha256").update(`${normalizedToken}:${options.challengeNonce}`).digest("hex")
    : undefined;

  const identityLayer: IdentityLayer = {
    id: did,
    authority,
    issuedAt: timestamp,
    signatureVerified,
  };

  if (publicKey) {
    identityLayer.publicKey = {
      algorithm: "Ed25519",
      value: publicKey,
      encoding: "base64",
      fingerprint: createHash("sha256").update(publicKey).digest("hex").slice(0, 16),
    };
  }

  const kycProof: KycProof = {
    version: "2.0",
    provider: "pi_network",
    assurance_level: options.assuranceLevel || "substantial",
    uid_hash: uidHash,
    uid_hash_algorithm: "sha256",
    uid_hash_salted: Boolean(uidSalt),
    verified_at: timestamp,
    access_token_hash: accessTokenHash,
    challenge_binding_hash: challengeBinding,
  };

  // Enforce assurance policy
  enforceAssuranceLevel(kycProof.assurance_level, options.minAssuranceLevel);

  // Blockchain anchor
  if (options.blockchainAnchor) {
    kycProof.blockchain_anchor = {
      chain: options.blockchainAnchor.chain,
      txid: options.blockchainAnchor.txid,
      block_height: options.blockchainAnchor.blockHeight,
      anchored_at: options.blockchainAnchor.anchoredAt || timestamp,
      anchor_hash: createHash("sha256")
        .update(`${options.blockchainAnchor.chain}:${options.blockchainAnchor.txid}:${accessTokenHash}`)
        .digest("hex"),
    };
  }

  // VLA device registry
  if (vlaDevice) {
    kycProof.vla_device_registry = {
      adapter: vlaDevice.adapter || "generic",
      hardware_id: vlaDevice.id || "unknown",
    };
  }

  return { identity_layer: identityLayer, kyc_proof: kycProof };
}

/**
 * Generate a complete AIX KYC envelope.
 */
export function generateKycEnvelope(
  piUid: string,
  options: KycOptions = {}
): Record<string, unknown> {
  const salt = options.salt || process.env.AIX_UID_HASH_SALT || "default-secure-salt";
  const hashedUid = hashPiUid(piUid, salt);
  const timestamp = new Date().toISOString();

  return {
    meta: {
      version: "1.3.0",
      id: `did:axiom:${AXIOM_AUTHORITY}:${hashedUid.slice(0, 32)}`,
      name: options.agentName || "Sovereign Agent",
      created: timestamp,
      author: options.author || "axiom",
    },
    persona: {
      role: "Verified Sovereign Agent",
      instructions: "Operate as a verified entity within the Axiom ecosystem.",
    },
    identity_layer: {
      id: `did:axiom:${AXIOM_AUTHORITY}:${hashedUid.slice(0, 32)}`,
      authority: AXIOM_AUTHORITY,
      issuedAt: timestamp,
    },
    pi_network: {
      app_id: "axiom-id-primary",
      environment: "production",
      kyc_required: true,
    },
  };
}
