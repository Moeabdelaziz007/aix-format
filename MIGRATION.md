# Migration Guide — Sovereign Core Packages

One-page guide for migrating downstream consumers (iqra, aix-agent-skills, the studio runtime, third-party agents) to the new `@axiom/*` canonical packages. The full architecture lives in [`docs/rfc/RFC-001-canonical-core.md`](./docs/rfc/RFC-001-canonical-core.md); this file is the operational summary.

## What changed

Two canonical packages now ship from this repo as the single sources of truth for their concept:

| Package | Owns | Status |
|---|---|---|
| `@axiom/schema` | AIX JSON Schema, TypeScript types, version pins, DID type guards | shipped (Phase 1.1) |
| `@axiom/identity` | RFC 8785 JCS, Ed25519 sign/verify, DID translator, Pi Network claim | shipped (Phase 1.2) |

The `axiom-format` repo also now ships:

- [`AXIOM.md`](./AXIOM.md) — the Sovereign Stack constitution (read first by every agent).
- A four-job Core CI (`core-ci.yml`): lint, typecheck, unit smoke, cross-package contract.
- A schema drift check (`axiom-schema-codegen.yml`) — the rich TS types and the generated mirror cannot diverge silently.

`AXIOM_AUTHORITY` is a single locked const exported from `@axiom/schema/version`; `@axiom/identity` imports it rather than redefining. A contract test fails the build if the two packages ever disagree.

## Who is affected

| Consumer | What to do |
|---|---|
| `iqra` (`src/lib/iqra/14-aix/`) | Replace local files with thin re-export shims for one minor release, then delete. See L2 migration below. |
| `aix-agent-skills` (constitutional runtime) | Import from `@axiom/identity` directly. Drop the local `trust-chain.ts` once `@axiom/trustchain` (Phase 1.3) ships. |
| Studio / third-party agents | Replace any direct AIX type imports with `@axiom/schema`. Replace any homegrown Ed25519 + canonicalization with `@axiom/identity`. |
| Pure docs consumers | No action. |

Anything that was reading `iqra/src/lib/iqra/14-aix/types.ts` directly today continues to work. The shim period is one minor release; pin behaviour will not change.

## How to migrate

### 1. Types and version pins

```diff
- import type { AIXManifest, AxiomDID } from 'iqra/14-aix/types';
- import { AIX_FORMAT_VERSION } from 'iqra/14-aix/version';
+ import type { AIXManifest, AxiomDID } from '@axiom/schema';
+ import { AIX_FORMAT_VERSION, AXIOM_AUTHORITY } from '@axiom/schema';
```

The JSON schema itself is also available as a sub-export:

```ts
import schema from '@axiom/schema/schema.json' assert { type: 'json' };
```

### 2. Identity primitives

```diff
- import { canonicalizeJSON } from 'iqra/14-aix/canonical';
- import { signPayload, verifySignedPayload } from 'iqra/14-aix/ed25519_signer';
- import { toAxiomDID, translateDID } from 'iqra/14-aix/did_translator';
- import { createPiClaim } from 'iqra/14-aix/pi_network_claim';
+ import { canonicalizeJSON } from '@axiom/identity/canonical';
+ import { signPayload, verifySignedPayload } from '@axiom/identity/ed25519';
+ import { toAxiomDID, translateDID } from '@axiom/identity/did';
+ import { createPiClaim } from '@axiom/identity/pi';
```

A rich single import also works:

```ts
import { signPayload, toAxiomDID, createPiClaim } from '@axiom/identity';
```

### 3. Sign + verify a manifest (before / after)

Before:

```ts
import { signManifest } from 'iqra/14-aix/manifest_exporter';
const signed = signManifest(manifest, privateKey);
```

After:

```ts
import { signPayload, verifySignedPayload } from '@axiom/identity';
const signed = signPayload(manifest, privateKey);
const ok = verifySignedPayload(signed);   // true on untampered round-trip
```

The output shape is unchanged: `{ payload, payload_hash, signature, publicKey }` with `signature.algorithm === 'Ed25519'` and `signature.canonicalization === 'JCS'`.

### 4. Verify a Pi Network domain claim (before / after)

Before:

```ts
import { verifyPiClaim } from 'iqra/14-aix/pi_network_claim';
const ok = verifyPiClaim(artifact);
```

After:

```ts
import { verifyPiClaim } from '@axiom/identity/pi';
const result = verifyPiClaim(artifact);
//   { ok: true } | { ok: false, reason: 'BAD_SIGNATURE' | 'DID_DOMAIN_MISMATCH' | 'BAD_URL' | 'BAD_URL_SCHEME' | 'URL_HOST_MISMATCH' }
```

Note: the return shape moved from a plain boolean to a tagged result so callers can route on the failure reason without re-deriving it.

## What CI guarantees on every PR

`core-ci.yml` runs four jobs in parallel on every PR that touches the core packages or the lockfile:

1. **Lint** — `axiom-lint` dogfooded against the canonical sources.
2. **Typecheck** — `tsc --noEmit` per package; emitted `.d.ts` files must compile cleanly.
3. **Unit smoke** — `node:test` over the per-package `test/*.test.ts` files. JCS edge cases, sign/verify round-trips, DID translation, Pi claim happy path + rejection paths.
4. **Cross-package contract** — `packages/axiom-identity/test/contract.test.ts` imports from both packages plus reads the raw schema JSON. It fails the build if any of the following drift:
   - `AXIOM_AUTHORITY` differs between the two packages.
   - The schema's `identity_layer.authority.const` differs from `AXIOM_AUTHORITY`.
   - Identity-emitted DIDs fail the schema-shipped `isAxiomDID` / `isDID` guards.
   - Signed-payload algorithm or encoding enums fall outside the schema's `$defs.Signature` / `$defs.PublicKey` enums.

A separate workflow (`axiom-schema-codegen.yml`) keeps `packages/axiom-schema/src/types.gen.ts` in sync with `schemas/aix.schema.json` via `json-schema-to-typescript`.

If any of those four jobs fail, the PR is not safe to merge. There is no override flag.

## Questions

If a downstream integration breaks during migration, open an issue against `aix-format` with a minimal reproduction. The shim period for the iqra-side files is one minor release; after that, the local copies are removed.
