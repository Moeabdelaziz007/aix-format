# Baseline Release: AIX → Axiom transition, v0.369.0-baseline

**Tag**: `v0.369.0-baseline`
**Date**: 2026-05-13
**Repo**: `Moeabdelaziz007/aix-format` (will transfer to org `AIX-Format` post-rename)

This release captures the snapshot of `main` immediately AFTER the wave of changes that landed the canonical-core groundwork and BEFORE any further restructuring. The purpose is twofold:

1. Give consumers a stable reference point to pin against if anything breaks downstream.
2. Establish a smoke-suite that future PRs must clear to be allowed into `main`.

---

## What changed in this wave

| PR | Scope | Reference |
|---|---|---|
| #156 | RFC-001 Canonical Core (`@axiom/schema`, `/identity`, `/trustchain`, `/constitution`, `/runtime-abi`) — the contract for Phase 1 | `docs/rfc/RFC-001-canonical-core.md` |
| #154 | Schema v0.369.0 optional fields (`aix_version`, `skills[].safety_score`, `identity_layer.zk_proof`, `identity_layer.pi_uid_anchor`, `economics.wallets[].x402_endpoint`) | `schemas/aix.schema.json` |
| #159 | `@axiom/schema` canonical package (Phase 1.1) | `packages/axiom-schema/` |
| #161 | `AXIOM.md` as the Sovereign Stack constitution | `AXIOM.md` |
| #162 | `@axiom/identity` canonical package (Phase 1.2) | `packages/axiom-identity/` |
| #160 | Four unified check tools: `@axiom/lint`, `/validate`, `/health`, `/autofix` (replace 13 scattered legacy guards) | `packages/axiom-{lint,validate,health,autofix}/` |

Also stabilised in the iqra repo (sibling work):
- iqra Go engine post-refactor: package split, FFT migration, graceful shutdown + checkpoint, broader test coverage, TwoNN parameter-free LID estimator. Tracked under iqra PRs #43-#46 + the H6 branch.

---

## Migration impact (consumer-facing)

### Manifests
- **Backward compatible.** All new schema fields are optional. Manifests authored before this wave validate unchanged.
- New fields may now appear in manifests produced after this wave. Consumers that don't recognise them must ignore unknown keys (the schema permits `additionalProperties: true` on most blocks; check your blocks).

### `bin/aix-validate.js`
- Now wraps its top-level body in an `async` IIFE. Older callers that scripted around it should still work — exit code semantics are unchanged.

### `core/parser.js`
- `parser.parse()` is now `async` (it awaits the rule registry). If you were calling it without `await`, you got a `Promise` and would have crashed downstream. Add `await`.

### TypeScript types
- `types/parser.d.ts` is now strictly regenerated from `schemas/aix.schema.json`. Hand-editing this file is gated by `schema-drift-check.yml` and will fail CI.

### Unified check tools (new)
- Four new packages under `packages/axiom-*/`. They are workspace-local, not yet published to npm. Phase 2.2 will move to a `dist/` build + npm publish.

### Removed
- HMAC-with-shared-secret TrustChain implementation (`packages/aix-core/src/security/trust-chain.ts` HMAC variant) — superseded by the SHA-256 + Ed25519 variant under `@axiom/trustchain`. No deprecation shim — the HMAC variant was an internal anti-pattern; consumers should use `@axiom/trustchain`.

---

## Rollback plan

If a consumer needs to roll back to a pre-baseline state:

1. Pin against the previous release tag (whichever predated the wave):
   ```
   "aix-format": "github:Moeabdelaziz007/aix-format#<previous-tag-or-sha>"
   ```
2. Or check out `main` at commit `b9543cf` (the README-only edit immediately before the canonical-core work) and freeze there.

If a SPECIFIC change in this wave broke you, the migration table above maps each scope to its PR. You can revert any single PR individually (they were merged in order; reverting #162 first, then #160, then #159, then #161, then #156 is the safe order if you need to peel back the whole stack).

---

## What the Smoke Gate enforces (12 scenarios)

Every PR MUST clear `scripts/smoke.mjs` before merge. The categories:

**Parsing (4)** — the parser still accepts what it accepted, still rejects what it rejected:
1. Parses a valid YAML manifest from `examples/`.
2. Parses a valid JSON manifest from `tests/golden_manifests/`.
3. Rejects a syntactically-malformed JSON manifest.
4. Round-trips the v0.369.0 optional-fields fixture without dropping data.

**Schema validation (5)** — the canonical schema and its drift gates are intact:
5. `schemas/aix.schema.json` parses as JSON with no syntax errors.
6. `validateAgainstSchema` accepts the medium-risk golden manifest.
7. `validateAgainstSchema` flags a manifest missing required `meta`.
8. `types/parser.d.ts` carries the codegen header (drift canary).
9. Every fixture under `tests/fixtures/schema/` validates clean.

**CI gates (3)** — the new check tools and the legacy CLI both run:
10. `axiom-lint` clean on the four `@axiom/*` packages (dogfood, zero errors).
11. `bin/aix-validate.js` runs without crashing on a sample manifest (no `TypeError`, no `EISDIR`, no missing-module).
12. `axiom-health` dead-code score is computable on this workspace (sanity check that the health engine doesn't throw on real input).

Each scenario is sub-second. The whole suite ran in ~280ms locally on the baseline commit.

---

## How to use

```bash
# Run locally before pushing
node --experimental-strip-types scripts/smoke.mjs

# JSON output for tooling
node --experimental-strip-types scripts/smoke.mjs --json > smoke-report.json
```

CI runs the same command on every PR. Exit code 0 = pass, 1 = at least one scenario regressed, 2 = the runner itself crashed.

---

## Not in this baseline (deferred to the next wave)

- `@axiom/trustchain` canonical package (Phase 1.3).
- `@axiom/constitution` package (Phase 1.4).
- `@axiom/runtime-abi` package (Phase 1.5).
- Cross-repo bridge `iqra` ↔ `aix-format` (Phase 2.x).
- Repo transfers to the `AIX-Format` GitHub org (post org-slug rename).
- Publishing the `@axiom/*` packages to a registry (Phase 2.2).
