# Architecture Decision Records — AIX-Format

> **Owner:** Mohamed Abdelaziz  
> This file records binding architectural decisions. All agents and contributors must respect decisions recorded here. To propose a change to any decision, open a PR modifying this file with a new ADR status.

---

## ADR-001 — Schema-First: `aix.schema.json` is the Single Source of Truth

| Field | Value |
|-------|-------|
| **Status** | ✅ Accepted |
| **Date** | 2026-04-29 |
| **Applies to** | `schemas/aix.schema.json`, `types/parser.d.ts`, `core/parser.ts` |

### Decision

`schemas/aix.schema.json` (JSON Schema 2020-12, unified modular) is the **authoritative source of truth** for all AIX document structures in v1.3+.

`types/parser.d.ts` and any runtime type checks in `core/parser.ts` are **derived artifacts** — they must be generated from or aligned with the schema, not maintained independently.

### Consequences

- `npm run generate:types:unified` regenerates `types/parser.d.ts` from `schemas/aix.schema.json`.
- The CI job `schema-drift-check` fails if committed `types/parser.d.ts` diverges from regenerated output.
- **No agent or human should edit `types/parser.d.ts` directly** — edit the schema, then regenerate.
- Runtime validators in `parser.ts` that check schema fields must reference schema `$defs` names, not invent new field names.

### Alternatives Considered

- **TS-first** (generate schema from TypeScript): Rejected for v1.3 because schema was defined first and is already comprehensive. May revisit in v2.0.
- **Dual maintenance**: Rejected — this is what caused the current drift problem between schema and types.

---

## ADR-002 — TokenBucket / Rate-Limiting is Out-of-Scope for `core/`

| Field | Value |
|-------|-------|
| **Status** | ✅ Accepted |
| **Date** | 2026-04-29 |
| **Applies to** | `core/error_handler.js`, `core/parser.ts`, any new core files |

### Decision

`TokenBucket` and any rate-limiting logic **must not** be added to `core/` unless:
1. A specific, real usage in CLI or Studio runtime is identified (not theoretical), **AND**
2. This ADR is updated with the concrete use case and approved by Mohamed.

The pattern has been added and removed multiple times (PR #16 → PR #18 → PR #23 → PR #24 → PR #39 draft), creating oscillation and test maintenance burden without real benefit.

### Consequences

- `core/error_handler.js` does **not** export `TokenBucket`.
- Tests must not import or test `TokenBucket` from core.
- If rate-limiting is ever needed, it should be implemented **outside** core (e.g., as middleware in Studio or as an optional CLI flag), not as a core primitive.
- Jules must not restore `TokenBucket` to core without a new ADR.

### Alternatives Considered

- **Keep TokenBucket in core as optional**: Rejected — adds complexity and test surface with no current consumer.
- **External rate-limiting library**: Preferred path if the need arises in the future.

---

## ADR-003 — Studio Build Configuration is a Protected Zone

| Field | Value |
|-------|-------|
| **Status** | ✅ Accepted |
| **Date** | 2026-04-29 |
| **Applies to** | `apps/studio/` build infrastructure |

### Decision

Following the Tailwind v4 migration and multiple build-error cycles, Studio build configuration files are designated as a **High-Risk Protected Zone** (see `AGENT_GOVERNANCE.md` Section 6).

The current baseline is:
- **Tailwind CSS v4** with `@import 'tailwindcss'` in `globals.css` (no `tailwind.config.ts`)
- **Next.js** with no `experimental.externalDir`
- **Pi SDK** loaded via `next/script` with `strategy="afterInteractive"`
- **CSS variables** defined in `globals.css` under `:root`

Any deviation from this baseline requires a PR with explicit documentation of why the baseline is being changed.

### Consequences

- Agents may not change `globals.css`, `next.config.ts`, or Pi SDK integration without a PR reviewed by Mohamed.
- Build errors in Studio caused by agent changes to these files will result in immediate rollback.

---

---

## ADR-004 — Modular Schema Architecture ($ref)

| Field | Value |
|-------|-------|
| **Status** | ✅ Accepted |
| **Date** | 2026-05-01 |
| **Applies to** | `schemas/aix-enhanced.schema.json`, `schemas/modules/*.json` |

### Decision

To resolve the "Accumulation Pattern" (Snowball Schema), `aix-enhanced.schema.json` is refactored into a **Modular Architecture**. 

Core namespaces (Meta, Persona, Security, Identity, Economics, ABOM, MCP, Memory, LiveVoice, BlackBox) must be maintained in standalone files under `schemas/modules/`. The root schema must reference these via `$ref`.

### Consequences

- **Scalability**: New protocol features must be added as separate modules.
- **Versioning**: Individual modules can be versioned independently (e.g., `identity.v2.schema.json`).
- **Validation**: Core parser logic should ideally validate against the root schema, which resolves all `$ref` pointers.
- **Maintenance**: Developers can work on specific protocol layers without touching the monolithic root file.

### Alternatives Considered

- **Keep Monolithic**: Rejected — the file exceeded 1,400 lines and became unreadable during the v1.3 PR integration.
- **External Hosting**: Considered hosting modules on `axiomid.app/schemas`, but kept local for CI/CD offline validation.

---

## ADR-005 — Registry-First Frontend (Zero-Mock Policy)

| Field | Value |
|-------|-------|
| **Status** | ✅ Accepted |
| **Date** | 2026-05-01 |
| **Applies to** | `apps/studio/src/app/marketplace`, `apps/studio/src/hooks/useRegistry.ts` |

### Decision

AIX Studio adopts a **Zero-Mock Policy** for production-readiness. The Frontend must always prioritize data from the **Sovereign Registry** (Vercel KV/Redis) over static `SAMPLE_DATA`.

Marketplace and User Agent views must be unified behind the `useRegistry` and `useMarketplace` hooks, both of which now fetch from live API endpoints (`/api/registry`, `/api/marketplace`).

### Consequences

- **Authenticity**: Users see real, deployed agents, not hardcoded examples.
- **E2E Integrity**: Testing the UI now inherently tests the Registry and Redis connection.
- **State Consistency**: Deleting an agent in "My Agents" correctly reflects in the "Marketplace" (if public).

### Alternatives Considered

- **Local Storage Fallback**: Rejected — Sovereign agents must be registry-backed for machine-to-machine (M2M) discovery.

---

## How to Add a New ADR

1. Copy the template below.
2. Open a PR modifying **only this file** with your proposed ADR.
3. Mohamed reviews and changes status to `✅ Accepted` or `❌ Rejected`.

```markdown
## ADR-NNN — Title

| Field | Value |
|-------|-------|
| **Status** | 🔄 Proposed |
| **Date** | YYYY-MM-DD |
| **Applies to** | files/modules |

### Decision
...

### Consequences
...

### Alternatives Considered
...
```
