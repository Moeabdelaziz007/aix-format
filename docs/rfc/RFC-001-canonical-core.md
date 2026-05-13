# RFC-001 — Canonical Core Packages (Phase 1)

| Field | Value |
|---|---|
| Status | Proposed |
| Phase | 1 (build only) |
| Owner | aix-format maintainers |
| Created | 2026-05-13 |
| Supersedes | Scattered TrustChain / Identity / Forbidden-pattern implementations across L1 / L2 / L3 |

## 1. Summary

Extract five canonical packages from the Sovereign Stack into the L1 monorepo. Each package owns one concept end to end. L2 (iqra) and L3 (aix-agent-skills) become consumers, not re-implementers.

This RFC defines source-of-truth, public API surface, dependencies, semver baseline, and migration plan for each package. Implementation lands across Phases 1.0 through 1.5 as separate PRs.

## 2. Motivation

The pre-RFC audit found:

| Concept | Implementations across the stack |
|---|---|
| TrustChain | 6 (one is HMAC + shared secret, an active antipattern) |
| Forbidden patterns | 3 + a runtime markdown parser |
| AIX types | 1 canonical schema, 2 mirrors, 8 stale generated `.d.ts` |
| DID translator | 2 |
| Ed25519 signing | 4 partial attempts, 1 production-grade |

The drift is silent: changing the L1 schema does not break the L2 mirror, which is the worst kind of contract failure.

## 3. The five canonical packages

### 3.1 `@aix/schema`

- **Source of truth**: `aix-format/schemas/aix.schema.json` (unified, `$id: https://axiomid.app/schemas/aix.schema.json`).
- **Public API**: bundled JSON Schema + generated TypeScript types + version constants + DID type guards.
- **Codegen**: `json-schema-to-typescript` runs in CI. A `schema-type-sync` ratchet check fails the build on any drift between `schemas/aix.schema.json` and the emitted `dist/types.d.ts`.
- **Semver baseline**: `1.3.0` (aligns with `AIX_FORMAT_VERSION`).
- **Dependencies**: none.
- **Deferred**: `schemas/manifest.schema.json` (file-integrity, becomes `@aix/abom` later) and `schemas/topology.schema.json` (agent graph, becomes `@aix/topology` later). Both have zero callers today.

### 3.2 `@aix/identity`

- **Source of truth**: `iqra/src/lib/iqra/14-aix/{canonical, ed25519_signer, did_translator, pi_network_claim}.ts`.
- **Public API**: four sub-exports.
  - `@aix/identity/canonical` — RFC 8785 JCS, edge-safe, surrogate validation.
  - `@aix/identity/ed25519` — `@noble/ed25519` + `@noble/hashes`, base64url + hex codecs.
  - `@aix/identity/did` — `did:axiom` ↔ `did:web` translator.
  - `@aix/identity/pi` — Pi Network domain-claim flow (well-known endpoint).
- **Semver baseline**: `1.3.0`.
- **Dependencies**: `@aix/schema`, `@noble/ed25519@^2.3`, `@noble/hashes@^1.8`.
- **Deferred**: Groth16 ZK proofs (snarkjs ~1MB WASM) become `@aix/zk` in Phase 2. They stay in `aix-format/packages/aix-zkkyc/` for now.

### 3.3 `@aix/trustchain`

- **Source of truth**: `aix-agent-skills/aix-constitutional-runtime/src/skills/trust-chain.ts` (cleanest of the six existing implementations) + `iqra/src/lib/iqra/14-aix/trustchain_mapper.ts` for AIX manifest interop.
- **Public API**: `TrustChain` class (append, verifyIntegrity, getState, getRecent) + `mapToAIXSection` + tolerant `RuntimeTrustChainEntry` input shape.
- **Phase 1.3 addition**: every entry gains an optional Ed25519 `signature` field, signed via `@aix/identity/ed25519` over the entry's canonical bytes. Existing entries remain valid (signature is optional).
- **Persistence**: adapter pattern. Core class is in-memory (`initialState` / `getState`). File / Redis / Rust adapters ship as separate packages later.
- **Semver baseline**: `1.3.0`.
- **Dependencies**: `@aix/schema`. (Phase 1.3+ also `@aix/identity`.)

### 3.4 `@aix/constitution`

This package is intentionally **AIX-agnostic**, not IQRA-specific. Any sovereign runtime can consume it.

- **Source of truth**: four universals only.
  - `DASTŪR.md` (compact): the universal rules — no mocks, no hallucinations, no PII leakage, no privileged-action escalation, no shared-secret cryptography.
  - `HARAM_LIST.json`: structured regex with locales. Schema:
    ```ts
    { id, label_ar, label_en, severity, patterns: string[], references: string[], categories: string[] }
    ```
    `patterns` are regex source strings (JSON cannot hold native `RegExp` objects). The package compiles them into `RegExp` once at module load and exposes the compiled forms; `string[]` is what is on disk. Seed entries merge L2 `forbidden_patterns.ts` (12 regex) + L3 `purity-filter.ts HARAM_PATTERNS` (4 categories AR+EN) + L2 `damir_conscience.FORBIDDEN_INTENTIONS` (25 keywords AR+EN). Never parsed from markdown at runtime.
  - `SACRED_CONSTANTS.json`: pure numerical primitives `{ 3, 7, 9, 19, 40, 49, 369, 700 }`, no tafsir.
  - `VERSION.md`: semver + supersession.
- **Public API**: typed accessors for the four universals; no business logic.
- **Semver baseline**: `1.0.0` (new module, not version-aligned with the AIX format).
- **Dependencies**: none.
- **Not included**: `MĪTHĀQ`, `MURĀQABAH`, `FITRAH`, `POWERS`, `WISDOM_7`, `TAWBAH`, `SHŪRĀ`, `METAMORPHOSIS`, `REFLECTION`, `IQRA_RULES`, `FAILURES`, `ḤISĀB`. These are IQRA overlays and stay at `iqra/src/lib/iqra/00-manifest/`.

### 3.5 `@aix/runtime-abi`

- **Source of truth**: minimal interfaces extracted from `iqra/02-workers/protocol.ts` + `aix-agent-skills/aix-constitutional-runtime/src/runtime/standalone-runtime.ts` + types-only from `iqra/06-security/damir_conscience.ts`.
- **Public API**: four interfaces only.
  - `Runtime` — `execute(req: RuntimeRequest): Promise<RuntimeResponse>`.
  - `Conscience` — `check(action: Action): Promise<ConscienceVerdict>`.
  - `SkillExecutor` — `(input: unknown) => unknown`.
  - `TrustChainSink` — `append(entry: AppendInput): TrustEntry`.
- **Semver baseline**: `1.0.0`.
- **Dependencies**: `@aix/schema`, `@aix/trustchain`, `@aix/constitution`.
- **Not included**: `MemoryStore`, `Telemetry`, `Registry`. Deferred to Phase 2+ pending a dedicated memory audit (L2 alone has five overlapping implementations).

## 4. Build order

Sequential, one PR per phase:

| Phase | Scope | Estimate |
|---|---|---|
| 1.0 | Cleanup: drop 8 superseded files in L1 (see §6) | 1 day |
| 1.1 | `@aix/schema` + codegen ratchet | 3-5 days |
| 1.2 | `@aix/identity` (consumes 1.1) | 3 days |
| 1.3 | `@aix/trustchain` (consumes 1.2 for Ed25519 entry signatures) | 3 days |
| 1.4 | `@aix/constitution` (independent) | 4 days |
| 1.5 | `@aix/runtime-abi` (consumes 1.1, 1.3, 1.4) | 5 days |

Order matters: trustchain depends on identity for the signature field; runtime-abi ties the rest together.

## 5. Migration plan

### 5.1 L1 (aix-format)

- **Drop (Phase 1.0)**: `schemas/core/aix-enhanced.schema.json`, 6 of the 8 stale `types/*.d.ts` files (everything except `aix.d.ts` and `parser.d.ts`), `packages/aix-core/src/security/trust-chain.ts` (HMAC antipattern). See §6 for the precise list. The trust-chain delete is paired with a one-line edit to `packages/aix-core/src/security/index.ts:5` to drop the `export * from './trust-chain.js'` re-export so `@aix/core` still compiles; that edit lands in the same PR.
- **Drop (Phase 1.1, gated on metadata update)**: `types/aix.d.ts` (after `tsconfig.json` retargets the `@types/aix` path alias), `types/parser.d.ts` (after the root `package.json#types` entry is removed; the root is a monorepo coordinator, not a published types provider, so there is no replacement `types` value to set), `packages/aix-types/` (after `scripts/schema-type-sync.ts` is updated to read `@aix/schema`'s committed `src/types.gen.ts` as the canonical drift target), `schemas/core/aix.schema.json` (after `tests/schema_validation.test.js:26` is retargeted to `@aix/schema/schema.json`).
- **Drop (Phase 1.3, gated on `@aix/trustchain`)**: the two inline mock classes inside `tests/integration/signature-verification.test.ts` and `tests/integration/gateway-expectation-integration.test.ts`. Removal requires rewriting those tests against the real `@aix/trustchain` class, which does not exist until Phase 1.3, so the cleanup ships with the migration that makes it sound.
- **Rewrite (Phase 1.3)**: `apps/studio/src/lib/security-core.ts TrustChainManager` becomes a `@aix/trustchain` consumer. File stays on disk, implementation swapped.
- **Wrap**: `packages/aix-core/src/identity.ts` consumes `@aix/identity`. `packages/pi-kyc/` consumes `@aix/identity/pi`. `packages/aix-rust-core` exposes a `@aix/trustchain` adapter.
- **Keep**: `packages/aix-zkkyc/` (becomes `@aix/zk` in Phase 2).

### 5.2 L2 (iqra)

- Replace `iqra/14-aix/types.ts` with `import from '@aix/schema'`. Generated in CI, no hand mirror.
- `iqra/14-aix/{canonical, ed25519_signer, did_translator, pi_network_claim}.ts` → re-export shims from `@aix/identity` for one minor release, then removed.
- `iqra/06-security/security.ts` → consumer of `@aix/trustchain`.
- `iqra/06-security/did.ts` stays (W3C DIDDocument builder), consumes `@aix/identity`.
- `iqra/06-security/{forbidden_patterns, damir_conscience, filter}.ts` → consume `@aix/constitution` data; implementation stays in L2.
- `iqra/00-manifest/` → stays as IQRA overlay on top of `@aix/constitution`.
- `iqra/02-workers/protocol.ts` → implements `@aix/runtime-abi` interfaces.

### 5.3 L3 (aix-agent-skills)

- `aix-constitutional-runtime/src/skills/{trust-chain, legacy-trust-chain}.ts` → re-export from `@aix/trustchain`. Then `legacy-trust-chain.ts` deleted.
- `aix-constitutional-runtime/src/skills/purity-filter.ts` → consumes `@aix/constitution`.
- `aix-constitutional-runtime/src/runtime/standalone-runtime.ts` → implements `@aix/runtime-abi.Runtime`.
- `charter.rules.txt` → migrated into structured `@aix/constitution` governance rules.
- `skills/sovereign-constitution.md`, `skills/trust-chain.md`, `skills/aix-schema.md` → docs that point at the canonical packages.

## 6. Phase 1.0 cleanup PR (DROP list)

Single L1 PR. 8 files removed plus one one-line edit to `packages/aix-core/src/security/index.ts`, zero new behaviour. Every row below has been verified to have no live importer or tooling reference at the time of writing; files that DO still have callers are deferred to Phase 1.1 or Phase 1.3 (see §5.1 and the "Deferred" sub-tables below). L3 dupes (`legacy-trust-chain.ts`, `iqra-purity-filter.ts`) are removed in a separate L3 PR sequenced with L3 migration in Phase 1.3 / 1.4. `apps/studio/src/lib/security-core.ts TrustChainManager` is a rewrite, not a delete, tracked in §5.1.

| # | Path | Reason |
|---|---|---|
| 1 | `aix-format/schemas/core/aix-enhanced.schema.json` | Superseded by unified `aix.schema.json`. Verified zero callers. |
| 2-7 | `aix-format/types/{aix.schema, aix-v1.schema, aix-enhanced.schema, axiom-aix.schema, manifest.schema, pi_kyc_adapter}.d.ts` | Stale generated artifacts (6 files). Verified zero importers. The four schema mirrors (`aix.schema.d.ts`, `aix-v1.schema.d.ts`, `aix-enhanced.schema.d.ts`, `axiom-aix.schema.d.ts`) are subsumed by `@aix/schema` in Phase 1.1; `manifest.schema.d.ts` and `pi_kyc_adapter.d.ts` are removed without replacement (the former is the deferred separate-schema concern from §3.1, the latter is a stale adapter artefact). No re-emission needed. |
| 8 | `aix-format/packages/aix-core/src/security/trust-chain.ts` | HMAC + shared secret, in-memory static. Security antipattern. Hard delete, no shim. Same PR also drops the matching `export * from './trust-chain.js'` line in `packages/aix-core/src/security/index.ts:5` so `@aix/core` still compiles. |

Deferred to Phase 1.1 (each item has a live referrer that must move first):

| Path | Blocking reference |
|---|---|
| `aix-format/schemas/core/aix.schema.json` | `tests/schema_validation.test.js:26` reads this path. Retarget the test to `@aix/schema/schema.json`, then delete. |
| `aix-format/types/aix.d.ts` | `tsconfig.json` maps `@types/aix` to this file. Repoint the alias to `@aix/schema`, then delete. |
| `aix-format/types/parser.d.ts` | The root `package.json#types` declares this file as the package types entry. The root is a monorepo coordinator, not a published types provider; drop the `types` entry entirely (no external specifier replacement, which would be invalid for the `types` field), then delete. |
| `aix-format/packages/aix-types/` | `scripts/schema-type-sync.ts:29` hard-codes `packages/aix-types/index.d.ts` as the drift target. Migrate the checker to compare against `@aix/schema`'s committed `packages/axiom-schema/src/types.gen.ts` (the codegen source of truth, NOT a built artefact), then delete. |

Deferred to Phase 1.3 (requires `@aix/trustchain` to exist first):

| Path | Blocking reference |
|---|---|
| `tests/integration/signature-verification.test.ts MockTrustChain` (inline class) | Defined at line 13 of that test file and consumed by the same suite. Removal requires rewriting the test against `@aix/trustchain` (real `TrustChain` class). |
| `tests/integration/gateway-expectation-integration.test.ts TrustChain` (inline mock) | Same as above: inline class at line 69, consumed by the same suite. Migrate together with the first test in Phase 1.3. |

L3 cleanup (separate PR, Phase 1.3 / 1.4):

| Path | Reason |
|---|---|
| `aix-agent-skills/aix-constitutional-runtime/src/skills/legacy-trust-chain.ts` | Internal L3 dupe. Removed when L3 adopts `@aix/trustchain` (Phase 1.3) |
| `aix-agent-skills/aix-constitutional-runtime/src/skills/iqra-purity-filter.ts` | Internal L3 dupe of `purity-filter.ts`. Removed when L3 adopts `@aix/constitution` (Phase 1.4) |

## 7. Breaking changes

| Change | Shim policy |
|---|---|
| `iqra/14-aix/types.ts` removed | 1 minor release of re-export shims from `@aix/schema`. Removed in next major |
| `iqra/14-aix/{canonical, ed25519_signer, did_translator, pi_network_claim}.ts` removed | Same: 1 minor of shims, then removed |
| `aix-format/packages/aix-core/src/security/trust-chain.ts` removed | **No shim**. HMAC + shared secret is insecure; we do not soft-deprecate antipatterns |
| 1 L1 schema (`schemas/core/aix-enhanced.schema.json`) + 6 `.d.ts` deleted in Phase 1.0 | No shim. Zero importers verified for each path. The remaining 1 schema + 2 `.d.ts` + 1 dir live in §6's "Deferred to Phase 1.1" sub-table and ship with their matching metadata update, not as bare deletions. |
| `aix-agent-skills` legacy trust-chain + iqra-purity-filter | No shim. Internal L3 dupes |

Standard deprecation policy: one minor release of re-export shims for renames and moves. Hard delete (no shim) for security antipatterns and zero-importer files.

## 8. Success metrics

- TrustChain implementations: 6 → 1 (with adapters for persistence)
- Active AIX schemas: 18 → 1 (+ 2 deferred to future packages)
- Forbidden-pattern definitions: 3 + runtime parser → 1 structured JSON
- L2 `14-aix/types.ts` drift bomb defused via CI ratchet
- All five packages published as workspace packages in `aix-format/packages/`; npm publication once API freezes

## 9. Open risks

- **npm scope ownership** for `@aix/*`. The L1 maintainer must own (or transfer ownership of) the `@aix` scope before any of the five packages are published to the public registry.
- **Cross-repo CI**: when `@aix/schema` bumps, L2 and L3 must absorb the change. Mitigation is graduated:
  - *Phase 1.5 (manual coordination, no automation cost)*: every `@aix/*` package ships a `CHANGELOG.md` whose release entries include a checklist line — "Open dependency-bump PRs in `Moeabdelaziz007/iqra` and `Moeabdelaziz007/aix-agent-skills`." The Phase 1.5 `OWNERSHIP.md` codifies who owns each repo's update.
  - *Phase 2.0 (medium-term, ~1-2 days)*: enable Renovate or Dependabot in L2 and L3 against the `@aix/*` scope. Auto-creates the dependency PRs; no auto-merge.
  - *Phase 2.x (full automation, ~3-5 days)*: on `@aix/*` release, a GitHub Actions `workflow_dispatch` triggers L2 and L3 to open + test a bump PR end to end.
  Until Phase 2.0 lands, Phase 2 itself is blocked by this risk; the manual path keeps Phase 1 unblocked.
- **Author conventions**: contributors must learn which package owns which concept. Mitigation: a one-page `OWNERSHIP.md` shipped with Phase 1.5.
- **Phase 1.0 cleanup is L1-only**: §6 covers 14 L1 files. The 2 L3 dupes (`legacy-trust-chain.ts`, `iqra-purity-filter.ts`) ship in their own L3 PR alongside L3 migration. L2 cleanups are sequenced in their migration steps.

## 10. Next step

If this RFC is accepted, Phase 1.0 (cleanup PR in L1) opens immediately. Phase 1.1 (`@aix/schema`) follows once 1.0 merges.
