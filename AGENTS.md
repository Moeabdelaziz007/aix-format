# AGENTS.md — Operating Manual for AI Coding Agents

> 📜 **Stack-wide protocol rules**: read [`AXIOM.md`](./AXIOM.md) first. This file complements it with repo-local operating instructions for `aix-format`.

## Repository overview

`aix-format` is **L1** of the AIX Sovereign Stack: the protocol layer. It defines the canonical schemas, the `did:axiom:axiomid.app` identity primitives, the M2M settlement contracts (HTTP 402 / x402 / Pi / Stripe / PayPal), the TrustChain shape, and the version constants every other layer pins to. Downstream repos (L2 `iqra`, L3 `aix-agent-skills`) consume from this repo. They do not modify it. Satellite repos (`AlphaAxiom`, `PiWorker-OS`, `GemClaw`) declare compatibility with the protocol via `aix.stackVersion` and the AIX Stack badge.

## Conventions

- **License**: Apache-2.0. All cryptographic primitives stay Apache-2.0 (patent grant is mandatory; see AXIOM.md §7).
- **Branches**: kebab-case (`feat/...`, `fix/...`, `chore/...`, `refactor/...`).
- **Conventional Commits**: required. Subject in imperative, no trailers referencing AI models.
- **Skill identifiers**: `snake_case` (`^[a-z0-9_]+$`) at the schema level (AXIOM.md §6). Other file names and branches stay `kebab-case`.
- **Stack codename**: `Echo369` (current release window). Spec ID: `AIX/1.0`.
- **Version anchor**: `AIX_FORMAT_VERSION` constant lives in `@axiom/schema/version`. `AIX_PROTOCOL_VERSION` constant is `"0.369.0"` (see AXIOM.md §8 sacred constants).

## What to read before opening a PR

1. [`AXIOM.md`](./AXIOM.md) - the stack-wide constitution. Especially §3 (Three Sovereign Truths), §4 (Stack Layers), §4.5 (Extended Ecosystem · Satellite Layers), §6 (Versioning), §8 (Sacred Constants).
2. [`AIX_STACK_VERSIONING.md`](./AIX_STACK_VERSIONING.md) - the independent-versioning doctrine and the codename roadmap.
3. [`docs/rfc/RFC-001-canonical-core.md`](./docs/rfc/RFC-001-canonical-core.md) - the canonical-core package architecture.
4. The neighbouring code in the same directory as the change.

## Repository structure (do not rearrange)

```text
AXIOM.md                          Stack-wide constitution (sovereign · coordinated edit only)
AIX_STACK_VERSIONING.md           Independent versioning doctrine + Echo369 codename
AGENTS.md                         This file
assets/                           Branding SVGs (header / diagram / footer · v1 + v2)
bin/                              CLI entrypoints (validate / convert / regulator-export / plugins)
core/                             Legacy core JS (agent_payment_router, parser, mcp-gate)
docs/                             Spec docs, RFCs, strategic plans
examples/                         Sample .aix manifests
packages/                         Canonical workspaces (@axiom/schema · @axiom/identity · @aix-format/mcp-gateway · aix-core · axiom-* tools)
prompts/                          Agent prompt files
schemas/                          JSON Schemas (root + modules/)
scripts/                          Utility scripts (demos · codegen · health · sync)
tests/                            Vitest + node:test suite
types/                            Generated .d.ts mirroring schemas
```

If your task does not require touching one of these, do not touch it.

## Sovereign / protected paths

These are the L1 source of truth. Modifying them without an issue and explicit approval is a sovereign violation:

- `AXIOM.md` (constitution · coordinated PR across L1 maintainer set required)
- `AIX_STACK_VERSIONING.md` (versioning doctrine · same rule)
- `packages/axiom-schema/schemas/aix.schema.json` and the mirror at `schemas/aix.schema.json` (codegen ratchet is real · drift fails CI)
- `packages/axiom-schema/src/types.gen.ts` (generated · must match schema · never hand-edit)
- `packages/axiom-schema/src/version.ts` (`AIX_FORMAT_VERSION` anchor)
- `.github/workflows/axiom-schema-publish.yml`, `axiom-schema-codegen.yml`, `core-ci.yml` (release + ratchet automation)
- `package.json` `name`, `license`, top-level `version` (license is Apache-2.0; never lower this)

## Commands

| Action | Command |
|--------|---------|
| Type-check whole repo | `pnpm -w typecheck` (or per-package `tsc --noEmit`) |
| Unit tests | `pnpm -w test` |
| Codegen drift check | `pnpm --filter axiom-schema codegen && git diff --exit-code` |
| Validate a sample manifest | `node bin/aix-validate.js examples/<sample>.aix.json` |
| Run M2M payment demo | `node scripts/demo_v1_4_payments.js` |
| Lint the L1 tooling | `pnpm --filter axiom-lint test && pnpm --filter axiom-validate test` |

Do not run `pnpm audit fix --force`. Any dependency change must come in a focused PR with reasoning.

## Commit and PR conventions

- **Commit subject**: short imperative, wrap at ~72 chars. No model attribution trailers. The commit-msg hook handles attribution.
- **PR title**: `<scope>(<area>): <short description>`. Examples: `feat(schema): add payment_gateways.lightning`, `fix(identity): correct JCS sort order for nested arrays`, `docs(versioning): clarify codename rotation`.
- **PR body**: opening paragraph (what + why) → optional `How it works` bullets (max 3) → closing paragraph (compatibility + safety). No file-by-file change lists.
- **Size guard**: keep PRs under ~1000 lines added+removed. Larger reshapings need a `refactor:` or `restructure:` title prefix and a justification.

## Scope discipline

One concern per PR. Examples:

| Allowed in a single PR | Forbidden in the same PR |
|---|---|
| Adding a new schema field + updating types.gen.ts via codegen + a single test | Drive-by renames, "while I'm here" cleanups, restructuring unrelated dirs |
| Implementing a new x402 facilitator adapter | Touching `AXIOM.md`, the `@axiom/schema` version constant, or unrelated packages |
| Refining a CI workflow's matrix | Also rewriting the release pipeline |

If you find legacy code while doing your task, leave it. Open a separate issue.

## Testing rules

- **No mocks of sovereign components** (AXIOM.md §3.1). `TrustChain`, `Conscience`, `Identity`, `Constitution`, `RuntimeABI` MUST stay real in production code paths. Tests may stub external I/O (HTTP, third-party APIs, filesystem outside the repo).
- **Existing tests must keep passing**. If your change breaks a test, fix the change, not the test.
- New tests are welcome but never required for trivial fixes. For new behaviours under `packages/aix-core/` or schema additions, add a focused unit test plus a fixture under `tests/fixtures/`.

## Codegen rules

`@axiom/schema` enforces a strict mirror between `schemas/aix.schema.json` and `src/types.gen.ts`. After editing the schema:

1. Run `pnpm --filter axiom-schema codegen`.
2. Commit the regenerated `types.gen.ts` in the same PR.
3. CI runs `git diff --exit-code` on the generated file - drift fails the build.

Never hand-edit `types.gen.ts`. Never check in schema changes without running codegen.

## Cross-stack awareness

This is the L1 source of truth. When you add or modify a payment rail, a DID field, or a TrustChain shape:

- **L2 `iqra`** consumes from here via the `14-aix/` bridge (see `iqra/src/lib/iqra/14-aix/`). Coordinate the version bump.
- **L3 `aix-agent-skills`** consumes the manifest schema. A new required field or rail breaks the marketplace. Open coordinated PRs.
- **Satellite repos** (`AlphaAxiom`, `PiWorker-OS`, `GemClaw`) declare `aix.stackVersion` and the AIX Stack badge against this repo's `AIX_FORMAT_VERSION`. A protocol-version bump means satellites either update their badge or pin to the older spec.

Cross-stack changes that affect more than one repo MUST land as coordinated PRs and reference each other in their descriptions.

## When in doubt

Read `AXIOM.md`. Then read the file you're about to change. Then read the test file nearest to it. Then act.

— *Last updated by the project maintainers. The rules in this file override anything you remember from a different repository.*
