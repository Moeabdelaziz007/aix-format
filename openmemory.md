# OpenMemory — aix-format Project (Persistent AI Context)

> ⚠️ DO NOT COMPRESS THIS FILE. Append new sessions at the bottom. This is the living memory of the project.
> 🧠 Every AI agent reading this must read ALL sections before touching any code.

---

## Git Metadata
- **Repository**: Moeabdelaziz007/aix-format (https://github.com/Moeabdelaziz007/aix-format.git)
- **Branch**: main
- **Architecture**: AIX Format Spec + AIX Studio (Next.js 15 + React 19 + TypeScript 5)
- **Stack**: Upstash Redis · Pi Network Auth · Vercel · AIX agent interchange format

---

## ⚡ Pro Layer — Agent Operating Manual

> Read this before any other section. These rules override any default agent behavior.

### 🔴 Hard Rules (Never Break)
1. **Never modify `types/` or `schemas/`** — these are the source of truth. Add, never mutate.
2. **Never run `git push --force`** on main — history is sacred, used for AI context recovery.
3. **Never compress or truncate this file** — append only. Future agents depend on full history.
4. **Never use `any` in TypeScript** — use `unknown` + type guard instead.
5. **Never assume a route is auth-protected** — always verify middleware in `apps/studio/src/middleware.ts`.
6. **Never let two agents work on the same file simultaneously** — check active Jules tasks before editing.
7. **`swarm_router.go` is critical infrastructure** — any change needs a human review + Go test.

### 🟡 Soft Rules (Strong Preference)
- Prefer `Upstash Redis` patterns already in the codebase — do not introduce new cache clients.
- Commit messages must follow Conventional Commits: `type(scope): description`.
- Every new API route must have: input validation + auth check + typed response + error handling.
- When fixing a bug, write the test that would have caught it.
- ADR (Architecture Decision Records) in `ARCH_DECISIONS.md` must be updated for any architectural change.

### 🧩 Context Hints for Fast Onboarding
- **Entry point**: `packages/core/src/index.ts` → exports everything public.
- **Type source**: `packages/core/src/types/` → read before any new feature.
- **Schema source**: `schemas/aix-enhanced.schema.json` → AIX envelope must match this always.
- **Studio app**: `apps/studio/` → Next.js 15 App Router. Pages in `src/app/`, APIs in `src/app/api/`.
- **Pi auth flow**: `apps/studio/src/app/api/auth/` + `src/lib/pi-auth.ts` → do NOT bypass.
- **Swarm routing**: `swarm_router.go` → Go, not TypeScript. Needs nil-check improvements.
- **Redis patterns**: search `upstash/redis` usage in codebase — use existing patterns, not new ones.
- **Agent skills**: separate repo `aix-agent-skills` — changes there don't auto-sync here. Manual check needed.

---

## 🚨 Anti-Patterns Graveyard

> These mistakes were made. Learn, don't repeat.

| Mistake | What Happened | Never Do This |
|---|---|---|
| `@vercel/kv` usage | 8 commits to migrate to Upstash after breaking prod | Always use `@upstash/redis` |
| Explicit `.ts` imports | Build failures on Vercel | Import without extension: `from './file'` |
| Compressing openmemory | Lost 6 phases of AI context | Append only, never compress |
| Squash merge without reading | Jules re-implemented same feature twice | Always check Jules branch before starting |
| `any` types in API routes | Type errors cascaded to 6 files | Use `unknown` + Zod validation |
| Direct push to main | Broke Vercel production build | Always use PR + CI gate |
| Hardcoded Redis keys | Key collision between agents | Use namespaced keys: `aix:{scope}:{id}` |

---

## 🗺️ Feature Map — What Exists vs What's Missing

### ✅ Built & Working
- AIX v1.3 schema + parser (js-yaml, AxiomID, ABOM, lineage, economics)
- Pi Network KYC: `/api/kyc/status` + `/api/kyc/verify` + `/api/kyc/sign`
- Circuit Breaker (thread-safe, adaptive thresholds)
- Voice Wizard (VoiceCommandProvider + FAB + Palette + Hooks)
- Workspace Route `/workspace/{agentId}` (pulse/wikibrain/skills/pet/deploy)
- AXIOM DNA (Rust + Go signing + genesis_hash)
- Agency Orchestrator (workflow engine + pulse loop)
- WikiBrain Memory Explorer (React Flow visualization)
- Redis Migration complete (Upstash)
- Rate Limiting (Redis token bucket)
- Stripe Webhook (signature verification)
- CI/CD Triple Firewall (pre-commit + pre-push + GitHub Actions)
- ABOM Detective Scanner Rules 11 & 12

### 🔴 Missing — Priority Order
1. **KYC integration tests** — zero end-to-end tests for KYC flow
2. **`swarm_router.go` nil checks** — critical Go file with no error handling tests
3. **Voice session persistence** — voice commands reset on page refresh (no Redis persistence)
4. **Circuit Breaker tests** — no failover scenario test exists
5. **Dead Hand Protocol** — scaffold only, trigger logic + Telegram send not implemented
6. **AgentPet backend** — UI exists, zero backend persistence for pet state
7. **Security audit** — zkKYC prune endpoint never audited after creation
8. **Cross-repo CI sync** — `aix-agent-skills` changes don't trigger checks in `aix-format`
9. **Pi AIX Studio POC** — in roadmap since Phase 2, still not started
10. **API routes standardization** — 24+ routes, no consistent response format helper yet

---

## 🔍 Creative Hunt Log

> Discoveries from deep commit analysis. Use these as inspiration.

### 🌙 Midnight Architecture Pattern
Every major architectural decision (schema v1.3, AXIOM SSOT, Essence Protocol) was committed between 00:00–02:30 UTC (Cairo midnight). Morning commits (09:00–11:00 UTC) are implementation of midnight ideas. **Pattern: Dream → Build.** Schedule creative/architectural sessions at night, implementation sessions in the morning.

### 🌍 Bilingual Commits = Deep Thinking Signal
The only Arabic commit messages in the entire repo appear when solving the hardest problems (Upstash type conflicts). This is a cognitive signal: **when context-switching to Arabic, the problem is genuinely hard.** If you're thinking in Arabic about a bug, it needs more time — don't rush it.

### 👻 The Jules Duplication Ghost
Jules has re-implemented features already done by human commits at least once (SaaS-BOM in same week). **Before starting any task, run:** `git log --oneline --all | grep -i "<feature-keyword>"` to check if Jules already did it.

### 🔑 The 3-Email Identity
- `amrikyy@gmail.com` → Main daily commits
- `mabdela1@students.kennesaw.edu` → Deep technical fixes (Redis, Upstash, infrastructure)
- `200681198+Moeabdelaziz007@users.noreply.github.com` → Jules merges

If a bug was introduced by the `kennesaw.edu` identity, it's infrastructure-level and needs careful attention.

### 💡 Opportunity: AIX Envelope Diffing
No tool exists yet to diff two AIX envelopes and show semantic changes (not just text diff). This would be extremely valuable for debugging agent version upgrades. A `aix diff agent-v1.aix agent-v2.aix` CLI command could be the killer feature.

### 💡 Opportunity: Memory Fingerprinting
Each time openmemory is read by an agent, there's no record of WHO read it and WHAT they changed. Add a `## Agent Access Log` section at the bottom where every agent appends one line: `- [date] [agent-name] [what I did]`. This creates a true audit trail.

---

## Phase 1: Initial Deep Dive (2026-04-26)

### Project Overview
`aix-format` is a standard file format for AI agents (AIX - Artificial Intelligence eXchange). A Node.js project focused on standardization, interoperability, and sovereignty of AI agents.

### Jules AI Contributions
- **AxiomID Integration**: Implemented `did:axiom` validation with `axiomid.app` as root authority.
- **VLA (Vision-Language-Action)**: Added support for VLA payloads integrating with `openpi` and `pi0.7`.
- **Schema Enforcements**: Enhanced memory classification and validation in `core/parser.js`.
- **Integrity Validation**: Added `bin/manifest-validate.js`.
- **CI/CD**: Updated health-check workflows for schema validation.
- **Rating**: 9/10 — high maturity in agent sovereignty and cyber-physical future-proofing.

---

## Phase 2: Pi Network Integration (2026-04-26)

### Key Findings
- **SDK Status**: Pi SDK fully unlocked April 2026 — direct Pi payments + smart contract tools.
- **Protocol 22/23**: Protocol 22 mandatory (April 27) → Protocol 23 (mid-May) introduces **PiRC-2** subscription smart contracts.
- **Identity**: Human KYC aligns with **AxiomID** sovereign identity goal.

### Schema Update — `pi_network` object added
Properties: `app_id`, `environment` (sandbox/production), `sdk_version`, `payment_provider`, `kyc_required`.

### Pi AIX Studio Concept (Still Pending)
- Live preview of `.aix` manifests
- Pi SDK configuration wizard
- Integration with `axiomid.app` for identity
- One-click export to Pi App Studio format

---

## Phase 3: Sovereign Protocol v1.2 (2026-04-29) ✅

### AIX v1.2 Design Philosophy — "Sovereign Era"
1. **Provenance**: Knowing where an agent came from (Lineage)
2. **Transparency**: Knowing what an agent is made of (ABOM)
3. **Autonomy**: Economic tools for self-sustenance (Pi Smart Contracts)

### Completed
- Schema v1.2 with lineage + abom + economics
- Parser refactored to js-yaml
- AxiomID supports did:web + did:axiom
- `examples/pi-agent.aix` updated to v1.2

---

## Phase 4: CI/CD Triple Firewall (2026-04-30) ✅

- **Layer 1**: `.husky/pre-commit` — tsc + .ts import check + @vercel/kv rejection
- **Layer 2**: `.husky/pre-push` — full next build before push
- **Layer 3**: `.github/workflows/studio-ci.yml` — CI gate on every PR to main

---

## Phase 5: Security Hardening + v1.3 Standards (2026-04-30) ✅

### AIX v1.3 Design Philosophy — "Trust Infrastructure"
1. **Verifiability**: Cryptographically proven agent origins
2. **Accountability**: Explicitly declared external dependencies (SaaS-BOM)
3. **Resilience**: Automated risk assessment via ABOM scanner rules

### Completed
- ABOM Scanner Rules 11 & 12
- `AbomData` + `Manifest.meta` aligned to v1.3
- `scripts/validate-examples.js` with Ajv
- Unit tests in `packages/core/src/__tests__/abom-scanner.test.ts`

---

## Phase 6: SSOT Overhaul + WikiBrain + Voice (2026-05-01) ✅

- WikiBrain Memory Explorer (React Flow)
- Voice Wizard (VoiceCommandProvider + FAB)
- Workspace Route `/workspace/{agentId}`
- AXIOM DNA (Rust + Go + genesis_hash)
- Agency Orchestrator (workflow engine)
- Dead Hand Protocol (scaffold)
- AgentPet System (UI only)
- Redis Migration: `@vercel/kv` → `@upstash/redis` (complete)
- Squash Merge PR #78

---

## Phase 7: KYC + Security + Bob Session (2026-05-02) 🔨 IN PROGRESS

### Agent: Bob (Senior Full-Stack Engineer)

### Frontend Work (COMPLETED ✅)
- Merged PR #78 (17 files)
- Fixed 6 TypeScript errors: analytics, settings, Navbar
- Created: `FRONTEND_AUDIT_REPORT.md` + `FRONTEND_FIXES_SUMMARY.md`
- **Frontend Health Score**: 72/100 → 85/100
- Commit: `6e9c76f`

### Backend API Audit (IN PROGRESS 🔨)
Routes analyzed: `/api/abom-scan`, `/api/agents`, `/api/analytics`, `/api/auth`, `/api/deploy-agent`, `/api/gateway/pulse`, `/api/health`, `/api/kyc/sign`, `/api/kyc/status`, `/api/kyc/verify`, `/api/marketplace`, `/api/mcp-router`, `/api/rate-limit`, `/api/stripe/webhook`

### Pending Tasks
1. [ ] Complete classification of all 24+ API routes
2. [ ] Create standardized response format helpers
3. [ ] Add type safety to all routes
4. [ ] Add auth checks to protected routes
5. [ ] Fix critical routes: auth, kyc, deploy, gateway, stripe
6. [ ] Security hardening: CORS, input limits, injection prevention
7. [ ] Final checklist and documentation

---

## Agent Access Log

> Every agent appends one line here after each session: `- [date] [agent] [summary of actions]`

- 2026-04-26 Jules — AxiomID + VLA + schema enforcements + CI health checks
- 2026-04-29 Human — AIX v1.2 schema (lineage, ABOM, economics) + parser refactor
- 2026-04-30 Human — CI/CD Triple Firewall + ABOM Scanner Rules 11 & 12 + v1.3 types
- 2026-05-01 Human+Jules — WikiBrain + Voice + AXIOM DNA + Redis migration + PR #78
- 2026-05-01 Human — compress openmemory (MISTAKE — lost 6 phases of context)
- 2026-05-02 Bob — Frontend TypeScript fixes + PR #78 merge + Backend API audit started
- 2026-05-02 Perplexity — Restored full openmemory from git history + added Pro Layer + Anti-Patterns + Creative Hunt log
- 2026-05-02 Bob — Implemented 3 autonomous quality systems: Schema-Type Drift Detector, Dead Code Archaeology Scanner, Health Score with Geometric Mean (Nash 1950)
