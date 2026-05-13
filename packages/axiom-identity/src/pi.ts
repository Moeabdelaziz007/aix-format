/**
 * 🥧 Pi Network Domain Claim — sovereign verification for axiomid.app
 *
 * Pi Network's dev browser allows a developer to "claim" a domain by
 * proving control of it. The claim flow (as used for axiomid.app):
 *
 *   1. Generate (or load) the agent's Ed25519 keypair (this module
 *      uses the signer in `./ed25519.js`).
 *   2. Produce a canonical claim manifest covering:
 *        { domain, owner_did, app_id, environment, issued_at, nonce }
 *   3. Sign the canonical JSON of the manifest with the Ed25519 key.
 *   4. Publish the signature + public key at the well-known endpoint
 *        https://<domain>/.well-known/pi-claim.json
 *      so Pi's verifier (or any third party) can fetch & verify.
 *
 * This module produces and verifies that artifact deterministically.
 * No network calls. The caller is responsible for hosting the JSON at
 * the well-known path. We keep the cryptography here so the same code
 * is used to claim, rotate keys, and verify external claims.
 *
 * Provenance: extracted from
 * iqra/src/lib/iqra/14-aix/pi_network_claim.ts. Strict DID-domain
 * binding and well-known URL host check preserved verbatim — both
 * were security fixes added in iqra after a prior loose match
 * accepted attacker-controlled origins.
 */

import { signPayload, verifySignedPayload, generateKeyPair } from './ed25519.js';
import type { SignedPayload } from './ed25519.js';
import { toAxiomDID, AXIOM_AUTHORITY } from './did.js';
import type { AxiomDID } from '@axiom/schema';

export interface PiClaimManifest {
  domain: string;
  owner_did: AxiomDID;
  app_id: string;
  environment: 'sandbox' | 'production';
  issued_at: string;
  nonce: string;
  /** Optional human-readable note shown in the Pi dev browser console. */
  note?: string;
}

export interface PiClaimArtifact extends SignedPayload<PiClaimManifest> {
  /** Convenience: the URL where this artifact is expected to live. */
  well_known_url: string;
}

export interface PiClaimInput {
  domain?: string; // defaults to axiomid.app
  owner_id: string; // the bare id portion, e.g. "iqra-sovereign"
  app_id: string;
  environment: 'sandbox' | 'production';
  privateKey: Uint8Array;
  /** Optional override; otherwise we use Date.now(). */
  issued_at?: Date;
  /** Optional override; otherwise we generate a 16-byte hex nonce. */
  nonce?: string;
  note?: string;
}

function randomNonceHex(bytes: number = 16): string {
  const buf = new Uint8Array(bytes);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(buf);
  } else {
    // No CSPRNG available; bail out rather than silently weakening.
    throw new Error('pi: no CSPRNG available in this runtime.');
  }
  let out = '';
  for (let i = 0; i < buf.length; i++) out += buf[i].toString(16).padStart(2, '0');
  return out;
}

/**
 * Build and sign a Pi Network domain-claim artifact for the agent.
 * The returned artifact is ready to be JSON.stringify'd and hosted at
 * `well_known_url`.
 */
export function createPiClaim(input: PiClaimInput): PiClaimArtifact {
  const domain = (input.domain ?? AXIOM_AUTHORITY).trim();
  if (!domain) throw new Error('createPiClaim: domain is required');

  const owner_did = toAxiomDID(input.owner_id);
  const issued_at = (input.issued_at ?? new Date()).toISOString();
  const nonce = input.nonce ?? randomNonceHex();

  const manifest: PiClaimManifest = {
    domain,
    owner_did,
    app_id: input.app_id,
    environment: input.environment,
    issued_at,
    nonce,
  };
  if (input.note) manifest.note = input.note;

  const signed = signPayload(manifest, input.privateKey);
  return {
    ...signed,
    well_known_url: `https://${domain}/.well-known/pi-claim.json`,
  };
}

/**
 * Verify an artifact fetched from a well-known URL. Returns:
 *   - ok: true only when signature verifies AND domain matches AND
 *         owner_did is rooted on the same domain.
 *   - reason: short failure tag on the ok=false path.
 */
export function verifyPiClaim(
  artifact: PiClaimArtifact,
): { ok: true } | { ok: false; reason: string } {
  if (!verifySignedPayload(artifact)) {
    return { ok: false, reason: 'BAD_SIGNATURE' };
  }
  const { domain, owner_did } = artifact.payload;

  // Strict DID format: must be exactly `did:axiom:<domain>:<id>` where
  // <id> follows the AIX-schema id charset. A loose substring match
  // (`owner_did.includes(`:${domain}:`)`) would accept hostile methods
  // like `did:evil:axiomid.app:x` simply because they contain the
  // domain as a path segment. We anchor on the full string instead.
  const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const STRICT_AXIOM_DID = new RegExp(
    `^did:axiom:${escapedDomain}:[a-zA-Z0-9._\\-]+$`,
  );
  if (!STRICT_AXIOM_DID.test(owner_did)) {
    return { ok: false, reason: 'DID_DOMAIN_MISMATCH' };
  }

  // Validate the well-known URL ends with the expected path AND its host
  // matches the claimed domain. The previous suffix-only check accepted
  // any host (e.g. https://attacker.example/.well-known/pi-claim.json
  // for a payload that claims domain=axiomid.app), which lets a signed
  // artifact misdirect verifiers to an attacker-controlled origin.
  if (!artifact.well_known_url.endsWith(`/.well-known/pi-claim.json`)) {
    return { ok: false, reason: 'BAD_URL' };
  }
  try {
    const url = new URL(artifact.well_known_url);
    if (url.protocol !== 'https:') {
      return { ok: false, reason: 'BAD_URL_SCHEME' };
    }
    if (url.hostname.toLowerCase() !== domain.toLowerCase()) {
      return { ok: false, reason: 'URL_HOST_MISMATCH' };
    }
  } catch {
    return { ok: false, reason: 'BAD_URL' };
  }
  return { ok: true };
}

/**
 * Convenience: generate a fresh keypair AND claim in one call. The
 * caller should persist `privateKey` securely (env var, KMS, etc.)
 * before publishing the artifact.
 */
export function bootstrapPiClaim(
  input: Omit<PiClaimInput, 'privateKey'>,
): { artifact: PiClaimArtifact; privateKey: Uint8Array; publicKey: Uint8Array } {
  const kp = generateKeyPair();
  const artifact = createPiClaim({ ...input, privateKey: kp.privateKey });
  return { artifact, privateKey: kp.privateKey, publicKey: kp.publicKey };
}
