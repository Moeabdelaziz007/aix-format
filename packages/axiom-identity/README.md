# @axiom/identity

Canonical AIX identity primitives. The second canonical core package per [RFC-001](../../docs/rfc/RFC-001-canonical-core.md). Ships:

- **RFC 8785 JCS** — deterministic JSON canonicalization with surrogate validation. Two parties producing the same logical object always produce the same canonical byte string.
- **Ed25519** — real `@noble/ed25519` signing and verification. Sign canonical JSON, get a `SignedPayload<T>` carrying the SHA-256 hash, the base64url signature, and the base64url public key. Verify reverses the chain.
- **DID translator** — lossless conversion between `did:axiom:axiomid.app:<id>` and `did:web:axiomid.app:<id>`. The `<id>` segment is preserved byte-for-byte; only the method prefix swaps.
- **Pi Network domain claim** — full claim/verify flow for the well-known endpoint `https://<domain>/.well-known/pi-claim.json`. Strict DID-domain binding and URL host check are enforced.

Zero native bindings. Works on Node, Vercel Edge, Cloudflare Workers identically.

## What this package replaces

| Old location | Replacement |
|---|---|
| `iqra/src/lib/iqra/14-aix/canonical.ts` | `@axiom/identity/canonical` |
| `iqra/src/lib/iqra/14-aix/ed25519_signer.ts` | `@axiom/identity/ed25519` |
| `iqra/src/lib/iqra/14-aix/did_translator.ts` | `@axiom/identity/did` |
| `iqra/src/lib/iqra/14-aix/pi_network_claim.ts` | `@axiom/identity/pi` |
| Scattered Ed25519 attempts in `aix-format/packages/aix-core` | wrapper over this package |
| Pi-KYC primitives in `aix-format/packages/pi-kyc` | wrapper over `@axiom/identity/pi` |

## Usage

### Sign and verify a manifest

```ts
import { generateKeyPair, signPayload, verifySignedPayload } from '@axiom/identity';

const { privateKey } = generateKeyPair();
const signed = signPayload({ hello: 'world' }, privateKey);

console.log(signed.payload_hash);        // sha256 hex of canonical JSON
console.log(signed.signature.value);      // base64url Ed25519 signature
console.log(signed.publicKey.value);      // base64url public key

const ok = verifySignedPayload(signed);   // true
```

### Translate between DID forms

```ts
import { toAxiomDID, toWebDID, translateDID } from '@axiom/identity';

const axiom = toAxiomDID('iqra-sovereign');
//   "did:axiom:axiomid.app:iqra-sovereign"

const { web, id } = translateDID(axiom);
//   web: "did:web:axiomid.app:iqra-sovereign"
//   id:  "iqra-sovereign"
```

### Canonicalize a payload

```ts
import { canonicalizeJSON, canonicalizeJSONBytes } from '@axiom/identity/canonical';

canonicalizeJSON({ b: 2, a: 1 });
// '{"a":1,"b":2}'

canonicalizeJSON({ unicode: '😀' });
// '{"unicode":"😀"}'   (valid surrogate pair preserved)

canonicalizeJSON({ bad: '\uD800' });
// throws TypeError: JCS: lone high surrogate at index 0 (U+D800)
```

### Issue and verify a Pi Network domain claim

```ts
import { bootstrapPiClaim, verifyPiClaim } from '@axiom/identity/pi';

const { artifact, privateKey } = bootstrapPiClaim({
  owner_id: 'iqra-sovereign',
  app_id: 'pi-app-xxxx',
  environment: 'production',
});

// host artifact at https://axiomid.app/.well-known/pi-claim.json
// then anywhere:
const result = verifyPiClaim(artifact);   // { ok: true }
```

## Constitutional alignment

This package implements the **Three Sovereign Truths** from [`AXIOM.md`](../../AXIOM.md):

1. **No Mocks** — real Ed25519, real SHA-512, real SHA-256, no shims.
2. **No Hallucinations** — JCS rejects non-finite numbers, BigInts, lone surrogates, and circular structures. The verifier recomputes the canonical digest before checking the signature; tampering on either side breaks verification deterministically.
3. **Memory Governance is the Heart** — every `SignedPayload` carries the canonical hash inline. Two parties cannot disagree on what was signed.

## Provenance

All four modules are extracted verbatim from `iqra/src/lib/iqra/14-aix/`:

- `canonical.ts` ← `canonical.ts`
- `ed25519.ts` ← `ed25519_signer.ts`
- `did.ts` ← `did_translator.ts` (with `AXIOM_AUTHORITY` now sourced from `@axiom/schema/version`)
- `pi.ts` ← `pi_network_claim.ts`

The iqra-side files become re-export shims in Phase 1.2's L2 migration, then are removed in the next minor release.
