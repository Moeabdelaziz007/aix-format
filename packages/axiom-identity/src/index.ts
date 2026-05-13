/**
 * 🆔 @axiom/identity — Canonical AIX identity primitives.
 *
 * Public surface (rich, single import):
 *   - canonical: `canonicalizeJSON`, `canonicalizeJSONBytes`
 *   - ed25519:   `generateKeyPair`, `signPayload`, `verifySignedPayload`,
 *                `signBytes`, `verifyBytes`, `codec`, plus types.
 *   - did:       `toAxiomDID`, `toWebDID`, `translateDID`, `isAxiomRooted`,
 *                `didId`, `AXIOM_AUTHORITY`.
 *   - pi:        `createPiClaim`, `verifyPiClaim`, `bootstrapPiClaim`,
 *                plus types.
 *
 * Sub-exports also available for tree-shaking:
 *   `@axiom/identity/canonical` `/ed25519` `/did` `/pi`.
 *
 * Constitutional alignment (AXIOM.md):
 *   - No mocks. Real Ed25519 via @noble/ed25519; real SHA-512 via
 *     @noble/hashes; no native bindings; edge-safe codecs.
 *   - No hallucinations. JCS canonicalization is RFC 8785 compliant
 *     and rejects unpaired surrogates / non-finite numbers.
 *   - Memory governance is the heart. Every signed payload carries
 *     its own canonical hash; verifySignedPayload recomputes from
 *     the payload, so tampering is detectable bit-exactly.
 */

export * from './canonical.js';
export * from './ed25519.js';
export * from './did.js';
export * from './pi.js';
