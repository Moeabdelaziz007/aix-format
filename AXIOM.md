# 📜 AXIOM — The Sovereign Constitution

> "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ"
> "Read! In the name of your Lord who created" — Al-ʿAlaq, 96:1

This document is the supreme protocol constitution for the AIX (Artificial Intelligence eXchange) Sovereign Stack. It supersedes all per-repo agent instructions and is the single source of truth for cross-stack policy. Every agent operating on any repository under the `axiomid.app` authority MUST read this file before opening a pull request.

Seeded from `iqra/IQRA_SUPREME.md`. Generalised to the stack.

---

## 1. The Prime Directive

The stack is a **Governed Adaptive Memory Runtime**, not a prompt. Every change — every commit, every PR, every emitted manifest — moves through the same seven steps:

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

The TrustChain is **append-only**. Resources are **consumed once** (Graded Linear Logic — see `iqra/src/lib/iqra/06-security/damir_conscience.ts`). Every action emits an audit entry; every entry chains to the prior entry's hash. Breakage of the chain is breakage of the system.

---

## 4. The Stack Layers

```text
L1 — aix-format          The Spec (schemas, types, identity primitives)
L2 — iqra                The Runtime (mission control, conscience, workers, evolution)
L3 — aix-agent-skills    The Marketplace (skills + governance + constitutional runtime)
```

Dependency direction is **one-way only**: L3 depends on L2 depends on L1. Reverse imports are forbidden.

Adjacent product repos live under the same authority but are not in the strict Sovereign Stack:
- `axiomid-project` — proprietary identity-authority surface
- `PiWorker` — Pi-Network worker runtime
- `AlphaAxiom` — trading product line

Cross-stack changes that affect more than one repo MUST land as coordinated PRs and reference each other in their descriptions.

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
| Skill identifiers | `snake_case` (regex `^[a-z0-9_]+$`) — enforced by schema |
| File names / branches | `kebab-case` |
| Package scopes | `@axiom/<concept>` for canonical core. Avoid `@aix/<topic>` going forward |
| Versions | SemVer. Manifests carry the version in `meta.format_version` (or the top-level `aix_version` shorthand); both are pinned in code via the `AIX_FORMAT_VERSION` constant exported from `@axiom/schema/version`. Patch bumps are non-shape-breaking |
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
| `THREE_SIXTY_NINE` | 369 | Tesla/evolution motif; used as the minor segment of protocol versions (e.g. `AIX_PROTOCOL_VERSION = "0.369.0"`) |

Changing any of these is a constitutional amendment, not a refactor.

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
> "Indeed, you are of a great moral character" — Al-Qalam, 68:4

Sovereignty is not a feature. It is a contract.

— axiomid.app
