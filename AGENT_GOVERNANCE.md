# ⚖️ AGENT GOVERNANCE — AIX-Format

> **Version:** 1.3 · **Owner:** Mohamed Abdelaziz · **Date:** 2026-05-01  
> This document is the **authoritative policy** for all AI agents operating in this repository (Antigravity, Jules, Claude, Gemini, Copilot, or any future agent).  
> Agents **must** read and follow this file before taking any action. It overrides any internal default behavior.

---

## 🧬 0. DNA Integrity (Sovereign Identity) - v1.3 NEW

1. **Manifest Integrity:** Any modification to `AXIOM.md` **MUST** be followed by a DNA re-signature using `dna-sign`. An unsigned AXIOM.md is considered invalid.
2. **Genesis Signature:** The `genesis_hash` is the immutable root of the agent's identity. Any drift between the hash and content results in immediate state revocation.
3. **Rust/Go Nucleus:** Crypto and safety logic are delegated to Rust. Orchestration and behavioral speed are delegated to Go.

---

## 1. Guiding Principles

1. **Human-in-the-loop for High Risk.** No agent may merge, push, or deploy changes to High-Risk zones without an explicit human approval (Mohamed).
2. **Reversibility first.** Prefer reversible changes. Never squash history or force-push to `main`.
3. **No silent drift.** Every change to schema, types, or parser must be traceable. Agents must document *why* they changed something, not just *what*.
4. **Minimal footprint.** Do the smallest change that solves the problem. Do not refactor unrelated code in the same PR.
5. **Provenance visibility.** PRs from AI agents must include `Co-authored-by` or a label so origin is always visible in commit history.

---

## 2. Risk Tier Table

| Tier | Zone / Files | Agent Action | Human Approval |
|------|-------------|--------------|----------------|
| 🔴 **HIGH** | `security/`, `economics/`, Pi KYC logic, `identity_layer/`, `apps/studio/app/layout.tsx`, `apps/studio/app/globals.css`, `apps/studio/next.config.ts`, Pi SDK integration, `AgenticKycSetup`, `LiveValidator`, any file touching private keys or tokens | **Open PR only** — no direct push. PR must include a `# ⚠️ HIGH-RISK` section with full impact analysis. | **Required** — Mohamed must approve before merge |
| 🟡 **MEDIUM** | `core/parser.ts`, `core/parser.js`, `core/error_handler.js`, `core/memory.js`, ABOM logic, `schemas/aix.schema.json`, `types/parser.d.ts`, any workspace `package.json` | PR required. Must pass full test suite (`npm test`) + schema-drift CI check. | Spot-check by Mohamed |
| 🟢 **LOW** | `docs/`, `examples/`, `README.md`, `CHANGELOG.md`, comments, UI copy, animation-only CSS, test fixtures, `*.md` files (except this file and `ARCH_DECISIONS.md`) | May propose directly in PR without special review | Not required — auto-merge allowed if CI passes |

---

## 3. Allowed Actions

Agents **MAY** do the following without special approval:

- Add or improve tests under `tests/`
- Update documentation and `*.md` files (except governance/arch files)
- Fix typos, comments, and dead code in non-critical files
- Add new `examples/`
- Improve error messages (text only, no logic changes)
- Add CI annotations or labels
- Refactor code that has full test coverage and the refactor does not change public API surface

---

## 4. Restricted Actions

Agents **MUST** open a PR with explicit `[RESTRICTED]` tag and wait for human review before:

- Modifying `core/parser.ts` or `core/parser.js` logic
- Changing `schemas/aix.schema.json` in any way (add/remove/rename fields)
- Updating `types/parser.d.ts` manually (it must be generated — see `ARCH_DECISIONS.md`)
- Changing any workspace `package.json` (adding/removing/upgrading dependencies)
- Modifying Studio layout, global CSS, or `next.config.ts`
- Touching `AgenticKycSetup` or `LiveValidator` components
- Adding new rate-limiting or token-bucket patterns to core (see `ARCH_DECISIONS.md` ADR-002)
- Changing `pre_commit_script.sh` or any script in `scripts/`

---

## 5. Forbidden Actions ❌

Agents **MUST NEVER** do the following under any circumstances:

- Execute or modify scripts that call `git commit`, `git push`, `git reset`, `git rebase`, or any destructive git command
- Read, log, print, or include in any output: API keys, Pi Network secrets, JWT tokens, `.env` values, or any credential
- Add new secrets or credentials to any file (use environment variables via Vercel/GitHub Secrets only)
- Modify or delete `.github/workflows/` files without explicit instruction from Mohamed
- Modify `AGENT_GOVERNANCE.md` or `ARCH_DECISIONS.md` without explicit instruction from Mohamed
- Force-push to `main` or any protected branch
- Remove or downgrade security-related dependencies without justification
- Add HTTP endpoints that bypass the existing identity/auth layer
- Re-introduce `TokenBucket` or any rate-limiting into `core/` without a new ADR decision (see ADR-002)
- Create or execute `submit.py`, `finish.js`, or any script that auto-commits/deploys

---

## 6. Studio Protected Zone

The following Studio files are designated **High-Risk UI Build Zone**:

```
apps/studio/app/layout.tsx
apps/studio/app/globals.css
apps/studio/next.config.ts
apps/studio/app/(auth)/
apps/studio/components/AgenticKycSetup.tsx
apps/studio/components/LiveValidator.tsx
apps/studio/lib/pi-sdk*.ts
```

Rules for this zone:
- Any PR touching these files must have title format: `chore(studio): <action> — [HIGH-RISK ZONE]`
- Must include: what changed, why, rollback plan
- Must pass: `npm run build --workspace=studio` locally before opening PR
- Jules must NOT touch these files unless Mohamed explicitly says: "Jules, please work on Studio layout"

---

## 7. Schema & Types Policy (Summary)

Full details in `ARCH_DECISIONS.md`. Short version:

> `schemas/aix.schema.json` is the **single source of truth**.  
> `types/parser.d.ts` is **generated**, not hand-written.  
> If you need to change types → change the schema first → run `npm run generate:types:unified` → commit both.

The CI `schema-drift-check` job will **block any PR** where `types/parser.d.ts` diverges from what the schema would generate.

---

## 8. Jules-Specific Instructions

If you are `google-labs-jules[bot]`, these rules apply specifically to you:

1. **Always read this file and `ARCH_DECISIONS.md` at the start of every task.**
2. **Check the Risk Tier of every file you plan to touch before touching it.**
3. **Never open more than 2 PRs simultaneously** without Mohamed confirming the previous ones.
4. **TokenBucket is OUT of scope** — do not add, restore, or reference it in core. See ADR-002.
5. **`types/parser.d.ts` is read-only for you** — do not edit it manually. If schema changes are needed, update `schemas/aix.schema.json` and note in your PR that `npm run generate:types:unified` must be run.
6. **Studio files in Section 6 above** — you may not touch them unless explicitly instructed.
7. When a task requires High-Risk changes, **stop and create a PR with a TODO** asking Mohamed to review before proceeding.

---

## 9. Violation Handling

- PRs that violate Forbidden rules will be **closed immediately** without merge.
- PRs that violate Restricted rules without proper review will be **reverted**.
- Patterns of violation will result in stricter prompt constraints for the offending agent.

---

*This governance document is inspired by enterprise AI code governance frameworks (SIG, Snyk, Cycode) and adapted to the specific architecture of AIX-Format v1.3.*
