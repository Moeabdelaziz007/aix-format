/**
 * ✍️ Real Ed25519 signing for AIX manifests.
 *
 * Uses @noble/ed25519 (pure JS, audited, edge/worker safe) for the
 * signing primitive and @noble/hashes/sha256 for canonical hashing.
 * Both have zero native bindings, so this works on Vercel Edge, Node,
 * and Cloudflare Workers identically.
 *
 * AIX signing protocol (v0.369.0):
 *   1. canonicalize payload via RFC 8785 (JCS).
 *   2. SHA-256 the canonical bytes → 32-byte digest.
 *   3. Ed25519 sign the digest → 64-byte signature.
 *   4. Encode public key + signature as base64url for the manifest.
 *
 * Verification reverses steps 1-4. The verifier must use the same
 * canonicalizer (this module guarantees that).
 *
 * Provenance: extracted from
 * iqra/src/lib/iqra/14-aix/ed25519_signer.ts. Edge-safe codecs and
 * the @noble/ed25519 `etc` hash hooks preserved verbatim.
 */

import * as ed25519 from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { canonicalizeJSONBytes } from './canonical.js';

// @noble/ed25519 v2.3 exposes two hash hooks on `etc`:
//   - sha512Sync(...messages: Uint8Array[]): Uint8Array  → drives sign() / verify()
//   - sha512Async(...messages: Uint8Array[]): Promise<Uint8Array> → drives *Async()
//
// There is NO `hashes` namespace on this version of the library; the
// earlier code that wrote to `ed25519.hashes.sha512` threw on import
// (`Cannot set properties of undefined`). We wire the @noble/hashes
// SHA-512 implementation into the two `etc` hooks so callers can use
// the sync API (`sign` / `verify`) safely on Node, Vercel Edge, and
// Cloudflare Workers — none of which ship an ambient SHA-512.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(ed25519 as any).etc.sha512Sync = (...m: Uint8Array[]): Uint8Array =>
  sha512(concat(m));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(ed25519 as any).etc.sha512Async = async (...m: Uint8Array[]): Promise<Uint8Array> =>
  sha512(concat(m));

function concat(arrs: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const a of arrs) len += a.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrs) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

// ── base64url helpers (no Buffer dependency, edge-safe) ───────────────────────

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  // btoa is available on Edge/Workers/modern Node.
  const b64 = typeof btoa === 'function'
    ? btoa(bin)
    : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') +
    '==='.slice((b64url.length + 3) % 4);
  if (typeof atob === 'function') {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('hexToBytes: odd length');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface Ed25519KeyPair {
  /** 32-byte raw secret key (seed). */
  privateKey: Uint8Array;
  /** 32-byte raw public key. */
  publicKey: Uint8Array;
}

export interface Ed25519KeyPairB64 {
  privateKey: string;
  publicKey: string;
}

export interface SignedPayload<T> {
  payload: T;
  /** SHA-256 of the canonical JSON bytes, hex-encoded. */
  payload_hash: string;
  signature: {
    algorithm: 'Ed25519';
    value: string; // base64url
    canonicalization: 'JCS';
  };
  publicKey: {
    algorithm: 'Ed25519';
    value: string; // base64url
    encoding: 'base64url';
  };
}

// ── Core API ─────────────────────────────────────────────────────────────────

/** Generate a fresh Ed25519 keypair using the runtime CSPRNG. */
export function generateKeyPair(): Ed25519KeyPair {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

/** Generate a keypair and return its base64url-encoded form. */
export function generateKeyPairB64(): Ed25519KeyPairB64 {
  const kp = generateKeyPair();
  return {
    privateKey: bytesToBase64Url(kp.privateKey),
    publicKey: bytesToBase64Url(kp.publicKey),
  };
}

/** Derive the public key from a raw 32-byte secret. */
export function publicKeyFromPrivate(privateKey: Uint8Array): Uint8Array {
  return ed25519.getPublicKey(privateKey);
}

/** Sign the SHA-256 digest of the canonical JSON of `payload`. */
export function signPayload<T>(payload: T, privateKey: Uint8Array): SignedPayload<T> {
  const canonical = canonicalizeJSONBytes(payload);
  const digest = sha256(canonical);
  const sig = ed25519.sign(digest, privateKey);
  const pub = ed25519.getPublicKey(privateKey);
  return {
    payload,
    payload_hash: bytesToHex(digest),
    signature: {
      algorithm: 'Ed25519',
      value: bytesToBase64Url(sig),
      canonicalization: 'JCS',
    },
    publicKey: {
      algorithm: 'Ed25519',
      value: bytesToBase64Url(pub),
      encoding: 'base64url',
    },
  };
}

/**
 * Verify that `signature` was produced by the holder of the private
 * key matching `publicKey`, over the canonical JSON of `payload`.
 *
 * Returns true only when:
 *   - the recomputed canonical digest matches `payload_hash`, AND
 *   - the Ed25519 verification succeeds against that digest.
 */
export function verifySignedPayload<T>(signed: SignedPayload<T>): boolean {
  try {
    const canonical = canonicalizeJSONBytes(signed.payload);
    const digest = sha256(canonical);
    if (bytesToHex(digest) !== signed.payload_hash) return false;
    const sig = base64UrlToBytes(signed.signature.value);
    const pub = base64UrlToBytes(signed.publicKey.value);
    return ed25519.verify(sig, digest, pub);
  } catch {
    return false;
  }
}

/** Low-level: sign arbitrary bytes (rarely needed; prefer signPayload). */
export function signBytes(bytes: Uint8Array, privateKey: Uint8Array): Uint8Array {
  const digest = sha256(bytes);
  return ed25519.sign(digest, privateKey);
}

/** Low-level: verify arbitrary bytes. */
export function verifyBytes(bytes: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
  try {
    const digest = sha256(bytes);
    return ed25519.verify(signature, digest, publicKey);
  } catch {
    return false;
  }
}

export const codec = {
  bytesToBase64Url,
  base64UrlToBytes,
  bytesToHex,
  hexToBytes,
};
