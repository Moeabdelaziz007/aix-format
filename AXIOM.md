# 📜 AXIOM: The Sovereign Constitution & Universal Agent Passport

> "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ"
> "Read! In the name of your Lord who created": Al-ʿAlaq, 96:1

This document is the supreme protocol constitution for the AIX (Artificial Intelligence eXchange) Sovereign Stack and the Universal Agent Passport. It supersedes all per-repo agent instructions and is the single source of truth for cross-stack policy. Every agent operating on any repository under the `axiomid.app` authority MUST read this file before opening a pull request.

Seeded from `iqra/IQRA_SUPREME.md`. Generalised to the stack.

---

## 1. The Prime Directive

The stack is a **Governed Adaptive Memory Runtime**, not a prompt. Every change: every commit, every PR, every emitted manifest: moves through the same seven steps:

> Observe → Retrieve → Reason → Validate → Execute → Reflect → Save

This is IQRA's 7-Loop Cycle, lifted to stack-wide doctrine. Agents that skip steps are out of compliance.

---

## 2. Root Authority

`axiomid.app` is the sole root authority for all Sovereign Stack agents and identities. The canonical schema enforces this at the field level:

```json
"identity_layer": {
  "properties": {
    "authority": { "const": "axiomid.app" }
  }
}
```

Every Decentralised Identifier minted in the stack uses the form `did:axiom:axiomid.app:<id>`. Alternative authorities are rejected at validation time.

---

## 3. The Three Sovereign Truths

These rules are absolute. No exception. No exemption.

### 3.1 No Mocks

Production code paths never contain mocks of sovereign components: `TrustChain`, `Conscience`, `Identity`, `Constitution`, `RuntimeABI`. Test infrastructure may stub external I/O (HTTP endpoints, filesystem outside the repo, third-party APIs); it MUST NOT stub a sovereign primitive.

A `MockTrustChain` in a production import path is a TAWBAH-grade violation and an immediate halt condition.

### 3.2 No Hallucinations

Every claim a sovereign agent emits MUST be grounded in real schema, real signatures, real data.

- A type that says `required` is required. A type that says `optional` is optional. Drift between schema and implementation is an emergency, not a nit.
- A TrustChain entry's `payload_hash` MUST be the actual SHA-256 of the canonical input. Synthetic hashes are forbidden.
- A signature is real Ed25519 over canonical bytes, or it is absent. There is no third state.

### 3.3 Memory Governance is the Heart

The TrustChain is **append-only**. Resources are **consumed once** (Graded Linear Logic: see `iqra/src/lib/iqra/06-security/damir_conscience.ts`). Every action emits an audit entry; every entry chains to the prior entry's hash. Breakage of the chain is breakage of the system.

---

## 4. The Stack Layers

```text
L1: aix-format          The Spec (schemas, types, identity primitives)
L2: iqra                The Runtime (mission control, conscience, workers, evolution)
L3: aix-agent-skills    The Marketplace (skills + governance + constitutional runtime)
```

Dependency direction is **one-way only**: L3 depends on L2 depends on L1. Reverse imports are forbidden.

The three Sovereign Stack repos share one constitution (this file), one TrustChain shape, one DID authority, one palette, and one codename window (currently `Echo369`). Every agent in the stack is a carrier of the **Universal Agent Passport** (v1.4.0), enabling cross-border autonomous economic operations.

---

## 4.5 Extended Ecosystem · Satellite Layers

Outside the strict L1/L2/L3 chain, the ecosystem contains a **root authority** above the stack and a tier of **satellite layers** below it. These repositories live under the same `axiomid.app` authority and consume the stack, but they are NOT members of the Sovereign Stack itself.

```text
                       L0: axiomid-project    Root Authority (issues did:axiom · proprietary)
                                  │
                       identity flows ↓
                       ┌──────────┴──────────┐
                       │  L1 · L2 · L3       │  Sovereign Stack (this constitution)
                       └──────────┬──────────┘
                       money flows ↑
                       ┌──────────┴──────────┐
                       │  L4 · L5 · L6       │  Satellite Layers (consumers · application repos)
                       └─────────────────────┘
```

| Tier | Repo | Role | Relationship to the Stack |
|---|---|---|---|
| **L0** | `axiomid-project` | Root authority. Sole issuer of `did:axiom:axiomid.app:*` identifiers. Proprietary. | Above the stack. Identity flows downward into L1/L2/L3 and the satellites. |
| **L4** | `AlphaAxiom` | Trading product line. MT5 / Bybit / EVM adapters, Gemini brain, skill plugin runtime. | Satellite consumer. Buys skills from L3 via x402. Records receipts in L2 TrustChain. |
| **L5** | `PiWorker-OS` | Pi-Network worker runtime. Pi SDK, KYC anchor, worker scheduling. | Satellite consumer. Buys Pi-flavoured skills from L3. |
| **L6** | `GemClaw` | Voice-first agent forge. Gemini Live, Firebase, persona templates. | Satellite consumer. Buys voice/persona skills from L3. |

### 4.5.1 Invariants

The four invariants below MUST hold for every satellite. They are how the ecosystem stays a tree (genus 0, χ = +1) rather than a tangle.

1. **Dependency direction**: satellites depend on L1/L2/L3. The stack does NOT depend on any satellite. Reverse imports are forbidden.
2. **Money flows upward**: from L4/L5/L6 into L3 (and onward through the protocol). Skill purchases are the canonical M2M unit.
3. **Identity flows downward**: from L0 into L1/L2/L3 and into every satellite. Every agent in any tier carries a `did:axiom:axiomid.app:*` minted by L0.
4. **Trust flows centrally**: every M2M transaction recorded by L4/L5/L6 is mirrored into L2's TrustChain. The marketplace records the sell side; the satellite records the buy side; L2 cross-verifies both.

### 4.5.2 What a satellite is not

A satellite is NOT a member of the Sovereign Stack. It does not get a vote in this constitution. It does not get to define new payment rails, schema fields, or TrustChain shapes. If a satellite needs a primitive that does not exist yet, the answer is a coordinated PR upstream into L1 (and then L2 and L3 as needed), not a one-off implementation in the satellite.

### 4.5.3 Cross-tier coordination

Cross-stack changes that affect more than one repo (stack or satellite) MUST land as coordinated PRs and reference each other in their descriptions. A change that introduces a new payment rail, for example, touches L1 (schema), L3 (gateway), L4/L5/L6 (buyer clients), and L2 (ledger): five coordinated PRs, one purpose.

---

## 5. Canonical Packages

The five packages defined in [`docs/rfc/RFC-001-canonical-core.md`](./docs/rfc/RFC-001-canonical-core.md) are the single sources of truth for their respective concepts. Downstream repos consume them; they do not re-implement them.

| Package | Concept | Replaces |
|---|---|---|
| `@axiom/schema` | JSON Schema + TypeScript types + version pins | All hand-mirrored type files |
| `@axiom/identity` | DID translator, Ed25519, JCS canonical, Pi anchor | Scattered identity primitives |
| `@axiom/trustchain` | Append-only SHA-256 chain | Six prior trust-chain implementations |
| `@axiom/constitution` | Forbidden patterns, HARAM list, sacred constants | Three forbidden-pattern implementations |
| `@axiom/runtime-abi` | Runtime + Conscience + SkillExecutor + TrustChainSink interfaces | Scattered runtime contracts |

Re-implementing any of these in a downstream repo is forbidden. Consumers depend on them.

---

## 6. Naming and Versioning

| Surface | Convention |
|---|---|
| Skill identifiers | `snake_case` (regex `^[a-z0-9_]+$`): enforced by schema |
| File names / branches | `kebab-case` |
| Package scopes | `@axiom/<concept>` for canonical core. Avoid `@aix/<topic>` going forward |
| Versions | **Independent SemVer per repo + stack-wide codename.** See [`AIX_STACK_VERSIONING.md`](./AIX_STACK_VERSIONING.md) for the full doctrine. Manifests carry the version in `meta.format_version` (or the top-level `aix_version` shorthand); both are pinned in code via the `AIX_FORMAT_VERSION` constant exported from `@axiom/schema/version`. Patch bumps are non-shape-breaking. |
| Stack codename | `Echo369` (current release window). Rotates with the spec major version (`AIX/1.0` → `AIX/2.0` → ...). |
| Stack compatibility | Every repo (stack or satellite) declares `aix.stackVersion`, `aix.stackCodename`, `aix.spec`, `aix.layer`, and `aix.authority` in its root manifest. The repo's own `version` field stays SemVer-honest. |
| Commit messages | Conventional Commits where the project's `AGENTS.md` does not say otherwise |

---

## 7. License Policy

| Repo class | License | Rationale |
|---|---|---|
| Open repos exercising crypto primitives | **Apache-2.0** | Patent grant is mandatory for Ed25519, ZK, TrustChain |
| Other open repos | Apache-2.0 (default) or MIT | Stack consistency favours Apache-2.0 |
| Documentation-only repos | CC-BY-4.0 (acceptable for prose, NOT for code) | |
| Private repos | **Proprietary, All Rights Reserved** | E.g. `axiomid-project` |

License declarations MUST agree across `LICENSE` file, `package.json#license`, and any README badge. Three sources of truth, one value.

---

## 8. Sacred Numerical Constants

These numbers are encoded in code (not docs only). They are referenced by name in `@axiom/constitution`'s `SACRED_CONSTANTS.json`.

| Constant | Value | Where it lives |
|---|---|---|
| `THREE` | 3 | Minimum quorum for SHURĀ-grade decisions |
| `SABEEN` | 7 | Halt threshold (uncorrected violations in TAWBAH.md) AND the recommended minimum `safety_score` for autonomous skill dispatch (per `skills[].safety_score` schema description) |
| `NINE` | 9 | STALE threshold (path-key reward decay) |
| `NINETEEN` | 19 | Quranic structural prime |
| `ARBAUN` | 40 | Maturation period |
| `FORTY_NINE` | 49 (= 7×7) | HOT memory cap, resource-pool max |
| `THREE_SIXTY_NINE` | 369 | Tesla/evolution motif; used as the minor segment of protocol versions (e.g. `AIX_PROTOCOL_VERSION = "0.369.0"`) and as the anchor for the current release codename `Echo369` |

Changing any of these is a constitutional amendment, not a refactor. The 369 motif lives in protocol constants, the codename, and the Growth Engine cadence; it does NOT bleed into consumer-facing app versions (see `AIX_STACK_VERSIONING.md §6`).

---

## 9. How agents read this file

When an AI agent (any vendor, any tooling) begins work in a Sovereign Stack repository:

1. Read **this `AXIOM.md`** first. It is the protocol-level contract.
2. Then read the repo's local agent operating manual (`AGENTS.md` or supreme/manifest doc as applicable).
3. Read [`RFC-001`](./docs/rfc/RFC-001-canonical-core.md) for the canonical-core package architecture.
4. Then start work.

This file MAY be quoted or excerpted in any repo's README or CONTRIBUTING. It MUST NOT be edited without a coordinated change to the source of truth at `aix-format/AXIOM.md` and a PR review across at least the L1 maintainer set.

---

## 10. The Closing Reminder

> "وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ"
> "Indeed, you are of a great moral character": Al-Qalam, 68:4

Sovereignty is not a feature. It is a contract.

: axiomid.app
