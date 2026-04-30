# OpenMemory - aix-format Project

## Git Metadata
- **Repository**: Moeabdelaziz007/aix-format (https://github.com/Moeabdelaziz007/aix-format.git)
- **Branch**: main
- **Last Commit Hash**: a19cbd37b4dca31e287df114a7467a99bc6dca14

## Initial Codebase Deep Dive (2026-04-26)
### Project Overview
`aix-format` is a standard file format for AI agents (AIX - Artificial Intelligence eXchange). It's a Node.js project focused on standardization, interoperability, and sovereignty of AI agents.

### Jules AI Contributions (Last 2 Days)
- **AxiomID Integration**: Implemented `did:axiom` validation with `axiomid.app` as the root authority.
- **VLA (Vision-Language-Action)**: Added support for VLA payloads, integrating with runtimes like `openpi` and `pi0.7`.
- **Schema Enforcements**: Enhanced memory classification and validation logic in `core/parser.js`.
- **Integrity Validation**: Added `bin/manifest-validate.js` for checking manifest integrity.
- **CI/CD**: Updated health-check workflows for schema validation.

### Analysis & Rating
- **Logic**: The regex for AxiomID is robust. The parser handles authority checks correctly.
- **Structure**: Modular design with clear separation between core logic, schemas, and CLI tools.
- **Rating**: 9/10. The work demonstrates high maturity in agent sovereignty and future-proofing for cyber-physical systems.

## Memory Search Logs
- Search 1: Grep AxiomID -> Found implementation in `core/parser.js` and schemas.
- Search 2: Grep VLA -> Found support in `ROADMAP.md` and `aix-enhanced.schema.json`.

## Pi Network Integration Research (2026-04-26)
### Key Findings
- **SDK Status**: Pi SDK is fully unlocked as of April 2026, allowing direct Pi payments and smart contract tools.
- **Pi App Studio**: New "Customize App with Pi AI" feature allows streamlined SDK integration.
- **Protocol 22/23**: Protocol 22 mandatory upgrade (April 27) prepares for Protocol 23 (mid-May), which introduces **PiRC-2** subscription smart contracts.
- **Identity**: Strong focus on human identity verification (KYC), which aligns with the **AxiomID** sovereign identity goal.

### Phase 2: Schema & Example Implementation (Completed 2026-04-26)
- **Schema Update**: Added `pi_network` object to `aix-enhanced.schema.json`.
  - Properties: `app_id`, `environment` (sandbox/production), `sdk_version`, `payment_provider`, `kyc_required`.
- **Currency Support**: Added `PI` to pricing examples.
- **Example Created**: `examples/pi-agent.aix` demonstrates a fully compliant Pi-integrated agent.

### Phase 3: Pi Dev Studio App (In Progress)
- **Concept**: "Pi AIX Studio" - A visual builder for AIX manifests targeting Pi Developers.
- **Features**:
  - Live preview of `.aix` manifests.
  - Pi SDK configuration wizard.
  - Integration with `axiomid.app` for identity.
  - One-click export to Pi App Studio format.

## Phase 4: Sovereign Protocol v1.2 (Completed 2026-04-29)
### Key Accomplishments
- **Schema Evolution (v1.2)**:
  - **Agent Lineage**: Added `lineage` to `meta` for genealogical tracking.
  - **ABOM (Agent Bill of Materials)**: Introduced root-level `abom` for supply chain transparency.
  - **Economics Layer**: Consolidated pricing into `economics` root, adding `pi_smart_contract` for Pi Network M2M settlements.
- **Core Parser Upgrades**:
  - Refactored `AIXParser` to use `js-yaml` for robust multi-format support.
  - Added validation logic for new Sovereign structures (`lineage`, `abom`, `economics`).
  - Enhanced AxiomID DID parser to support `did:web` alongside `did:axiom`.
- **Validation & Examples**:
  - Updated `examples/pi-agent.aix` to v1.2 standard.
  - Verified v1.2 compatibility with `bin/aix-validate.js`.

### Implementation Progress
- [x] Analyze Jules AI contributions (Rating: 9/10).
- [x] Update Parser logic for Pi Network validation.
- [x] Update JSON Schema with Pi definitions.
- [x] Create `examples/pi-agent.aix`.
- [x] Evolve Schema to v1.2 (Lineage, ABOM, Economics).
- [x] Refactor Parser for v1.2 structures and `js-yaml` robustness.
- [ ] Design and build "Pi AIX Studio" POC.

### AIX v1.2 Design Philosophy
The "Sovereign Era" update focuses on the three pillars of AI independence:
1. **Provenance**: Knowing where an agent came from (Lineage).
2. **Transparency**: Knowing what an agent is made of (ABOM).
3. **Autonomy**: Providing the economic tools for self-sustenance (Pi Smart Contracts).

## CI/CD & Development Workflow Guardrails (Implemented 2026-04-30)

To solve the root problem of broken production builds on Vercel, a "Triple Firewall" was implemented to protect the `main` branch. This ensures that every push to `main` is validated at multiple stages, preventing broken code from being deployed.

### Layer 1: Pre-commit Hook (Local)

- **File**: `.husky/pre-commit`
- **Trigger**: Before a `git commit` is created.
- **Actions**:
    1.  **TypeScript Check**: Runs `npx tsc --noEmit` within `apps/studio` to catch type errors.
    2.  **Import Validation**: Rejects commits containing explicit `.ts` imports (`from './file.ts'`).
    3.  **Dependency Validation**: Rejects commits that import the deprecated `@vercel/kv` package.
- **Purpose**: To catch common, low-level errors at the earliest possible stage.

### Layer 2: Pre-push Hook (Local)

- **File**: `.husky/pre-push`
- **Trigger**: Before `git push` sends commits to the remote repository.
- **Action**:
    1.  **Production Build**: Runs `npm run build` within `apps/studio`.
- **Purpose**: To act as a final local gate, ensuring the application builds successfully before the code is shared. If the build fails, the push is aborted.

### Layer 3: GitHub Branch Protection (Remote)

- **Files**: `.github/workflows/studio-ci.yml` and GitHub Repository Settings.
- **Trigger**: On any Pull Request targeting the `main` branch.
- **Actions**:
    1.  **CI Workflow**: The `studio-ci.yml` workflow executes a job named `studio-build-check`.
    2.  **CI Steps**: This job installs dependencies, runs a TypeScript check (`tsc --noEmit`), and performs a full production build (`next build`).
    3.  **Branch Protection Rule**: The `main` branch is protected in GitHub settings to require the `studio-build-check` status check to pass before merging and to require a Pull Request for all changes.
- **Purpose**: To provide a definitive, server-side guarantee that code merged into `main` is valid and buildable.

### Supporting Scripts
- **`apps/studio/package.json`**: A script `check:all` was added to run `tsc`, `lint`, and `build` sequentially for a complete local check.
