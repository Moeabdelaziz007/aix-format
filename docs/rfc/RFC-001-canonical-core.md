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
| 1.0 | Cleanup: drop 18 superseded files in L1 (see §6) | 1 day |
| 1.1 | `@aix/schema` + codegen ratchet | 3-5 days |
| 1.2 | `@aix/identity` (consumes 1.1) | 3 days |
| 1.3 | `@aix/trustchain` (consumes 1.2 for Ed25519 entry signatures) | 3 days |
| 1.4 | `@aix/constitution` (independent) | 4 days |
| 1.5 | `@aix/runtime-abi` (consumes 1.1, 1.3, 1.4) | 5 days |

Order matters: trustchain depends on identity for the signature field; runtime-abi ties the rest together.

## 5. Migration plan

### 5.1 L1 (aix-format)

- **Drop**: `schemas/aix-enhanced.schema.json`, `schemas/core/aix.schema.json`, `schemas/core/aix-enhanced.schema.json`, `types/*.d.ts` (8 stale generated files), `packages/aix-types/`, `packages/aix-core/src/security/trust-chain.ts` (HMAC antipattern), `apps/studio/src/lib/security-core.ts TrustChainManager` (rewritten as consumer), 2 `MockTrustChain` test classes.
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

Single L1 PR. 14 files removed, zero new behaviour. L3 dupes (`legacy-trust-chain.ts`, `iqra-purity-filter.ts`) are removed in a separate L3 PR sequenced with L3 migration in Phase 1.3 / 1.4. `apps/studio/src/lib/security-core.ts TrustChainManager` is a rewrite, not a delete, and lands as a consumer-side change in Phase 1.3 (tracked in §5.1 Migration, not here).

| # | Path | Reason |
|---|---|---|
| 1 | `aix-format/schemas/aix-enhanced.schema.json` | Superseded by unified `aix.schema.json` |
| 2 | `aix-format/schemas/core/aix.schema.json` | Superseded |
| 3 | `aix-format/schemas/core/aix-enhanced.schema.json` | Superseded |
| 4-11 | `aix-format/types/{aix, aix.schema, aix-v1.schema, aix-enhanced.schema, axiom-aix.schema, manifest.schema, parser, pi_kyc_adapter}.d.ts` | Stale generated artifacts (8 files). Will be re-emitted from `@aix/schema` in Phase 1.1 |
| 12 | `aix-format/packages/aix-types/` (whole dir) | Trivial `index.d.ts` wrapper; subsumed by `@aix/schema` |
| 13 | `aix-format/packages/aix-core/src/security/trust-chain.ts` | HMAC + shared secret, in-memory static. Security antipattern. Hard delete, no shim |
| 14-15 | `aix-format/tests/integration/{signature-verification, gateway-expectation-integration}.test.ts MockTrustChain` | Mock classes replaced by real `@aix/trustchain` |

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
| 3 L1 schemas + 8 `.d.ts` deleted | No shim. Zero importers in current code |
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
