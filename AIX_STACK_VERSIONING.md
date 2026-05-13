# AIX Stack Versioning: Independent SemVer + Echo369 Codenames

> 📜 Read [`AXIOM.md`](./AXIOM.md) first. This document is the canonical versioning doctrine for the AIX Sovereign Stack. It is referenced by `AXIOM.md §6` and is binding across all stack and satellite repositories.

## 1. The doctrine in one sentence

**Every repository in the AIX ecosystem versions itself independently using strict SemVer 2.0.0. Cross-repo coherence is communicated through a shared `aix.stackVersion` field plus a stack-wide release codename (currently `Echo369`).**

## 2. Why independent versioning

Industry consensus across Aspect Build, Microsoft Engineering Playbook, Lerna, Nx, Changesets, and the Streamdal monorepo retrospective converges on the same conclusion: when you have multiple repositories with separate release cadences and separate breaking-change semantics, **fixed cross-repo versioning is infeasible and misleading**. SemVer is non-negotiable for consumers; lying about a version (e.g. bumping `AlphaAxiom` from `0.1.0-alpha` to `0.369.0` to "match the stack") destroys the meaning of the major/minor/patch contract.

This stack has at least seven repositories with genuinely different maturity levels:

| Repo | Real maturity | Reported version |
|---|---|---|
| `aix-format` | Protocol spec, stable surface, codegen-locked | `0.369.0` (anchor) |
| `iqra` | Active runtime, pre-1.0 | `0.3.69` |
| `aix-agent-skills` | Marketplace, 57 skills shipped | `1.0.0` |
| `AlphaAxiom` | Alpha-stage trading product | `0.1.0-alpha` |
| `PiWorker-OS` | Pre-beta worker runtime | per-repo |
| `GemClaw` | Alpha voice forge | per-repo |
| `axiomid-project` | Proprietary identity surface | per-repo |

Forcing all seven to a single version number would either lie about the protocol (claiming `1.0.0` everywhere implies stability the satellites do not have) or lie about the satellites (claiming `0.369.0` implies a 369-minor history they do not have).

## 3. The three version surfaces

Every repo declares **three** version-shaped fields. They serve different audiences.

### 3.1 App version (SemVer, honest)

The repo's own `package.json#version` (or `Cargo.toml#version`, `pyproject.toml#version`, etc.). Strict SemVer. Bumps follow the change inside the repo:

- **MAJOR** when the public API breaks.
- **MINOR** when functionality is added in a backward-compatible way.
- **PATCH** for backward-compatible fixes.
- **Pre-release**: `-alpha`, `-beta`, `-rc.N`.

A consumer running `npm install <repo>` or reading the badge MUST get an answer that reflects reality. `0.1.0-alpha` means alpha. `1.0.0` means stable. `0.3.69` means 0.3.69.

### 3.2 AIX Stack compatibility (codename + spec ID)

A separate metadata block that says **"this repo speaks the AIX/1.0 spec, Echo369 release window"**. It lives in `package.json` (or equivalent) under a dedicated key, never inside `version`:

```jsonc
{
  "name": "AlphaAxiom",
  "version": "0.1.0-alpha",
  "aix": {
    "stackVersion": "0.369.0",
    "stackCodename": "Echo369",
    "spec": "AIX/1.0",
    "layer": "L4-satellite",
    "authority": "axiomid.app"
  }
}
```

This is analogous to a Java app declaring "Java EE 8" or a Linux package declaring `Provides: lsb >= 4.0`. The app version and the platform-compatibility version are deliberately decoupled.

### 3.3 README badges (the human-readable surface)

Each repo's README header carries three shields:

```markdown
[![AIX Stack](https://img.shields.io/badge/AIX_STACK-Echo369-39FF14)](https://github.com/Moeabdelaziz007/aix-format)
[![Spec](https://img.shields.io/badge/spec-AIX%2F1.0-blue)](https://github.com/Moeabdelaziz007/aix-format/blob/main/AXIOM.md)
[![Version](https://img.shields.io/badge/version-0.1.0--alpha-orange)](./CHANGELOG.md)
```

The first two badges are identical across every stack and satellite repo. The third is the repo's own honest SemVer.

## 4. The codename roadmap

Codenames mark **release windows of the AIX stack as a whole**, not of any single repo. They rotate when the protocol spec major version bumps (`AIX/1.0` → `AIX/2.0` → ...). Each window has a name with thematic continuity.

| Window | Codename | Spec | Theme |
|---|---|---|---|
| Current | **Echo369** | `AIX/1.0` | Tesla resonance · sacred 369 anchor · first sovereign mint |
| Next | Resonance | `AIX/2.0` | Multi-chain settlement matures · M2M economy live |
| Then | Sovereignty | `AIX/3.0` | Constitutional autonomy · L0 root authority self-issuing |

Window rotation requires a constitutional amendment (`AXIOM.md` change) coordinated across L1 maintainers.

## 5. Cross-stack version bumps

When `aix-format` bumps `AIX_FORMAT_VERSION` (the protocol anchor), downstream repos do one of three things:

1. **Update their `aix.stackVersion`** to track the new value (declares "I speak the new protocol").
2. **Pin to the old `aix.stackVersion`** (declares "I still speak the older spec; please use the older docs").
3. **Pre-release a major bump of their own** that consumes the new protocol (e.g. `iqra` going `0.3.69` → `0.4.0-rc.1` because it integrates a new L1 schema field).

What downstream repos MUST NOT do: bump their own SemVer in lockstep with `aix-format` for cosmetic reasons. The protocol anchor and the consumer's API contract are independent.

## 6. The 369 motif, preserved

The Tesla/369 motif is constitutionally meaningful (`AXIOM.md §8`). It is encoded in:

- `AIX_PROTOCOL_VERSION = "0.369.0"`: the protocol anchor itself.
- `sacred constants: THREE=3, SABEEN=7, NINE=9, NINETEEN=19, ARBAUN=40, FORTY_NINE=49, THREE_SIXTY_NINE=369`.
- `Echo369` codename for the current release window.
- The 369-day evolution cadence inside the IQRA Growth Engine.

It is **not** encoded in every repo's `package.json#version`. That would be vanity at the cost of SemVer correctness. The motif lives where it belongs: in the constants, the codename, the protocol anchor, and the cadence: not in the consumer-facing dependency version of a satellite app.

## 7. Migration guide for satellite repos

A satellite repo (e.g. `AlphaAxiom`, `PiWorker-OS`, `GemClaw`) joining the stack does the following, in one PR per repo:

1. Keep `package.json#version` honest. Do not bump for cosmetic alignment.
2. Add the `aix` metadata block (`stackVersion`, `stackCodename`, `spec`, `layer`, `authority`).
3. Add the three badges to the README header.
4. Add the cross-stack `YOU ARE HERE` nav row above the README hero.
5. Reference [`AXIOM.md`](https://github.com/Moeabdelaziz007/aix-format/blob/main/AXIOM.md) in the repo's `AGENTS.md`.
6. If the repo has an obvious cryptographic surface, switch its license to Apache-2.0 per `AXIOM.md §7`.

No version bump is required as part of this migration. The whole point of the doctrine is that joining the stack is metadata, not a `MAJOR.MINOR.PATCH` event.

## 8. The closing rule

If a versioning question is not answered here, fall back to **strict SemVer 2.0.0** and **independent per-repo evolution**. When in doubt, do not bump.

: `axiomid.app` · L1 protocol · Echo369 release window
