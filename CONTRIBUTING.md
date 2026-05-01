# Contributing to AIX Sovereign Protocol

Welcome to the future of sovereign, machine-to-machine AI. We are building the foundational format for portable, secure, and monetizable AI agents. 

We operate on the principles of **10x Moonshot thinking**, **First Principles engineering**, and **Rigorous Mathematical Logic**.

## 🚀 How to Contribute

### 1. The AIX Standard (Core)
We are constantly refining the AIX JSON Schema (`schemas/aix.schema.json`). If you find an edge case in agent identity, economics, or risk scoring, open a PR with:
- The schema change.
- A "Golden Manifest" in `tests/golden_manifests/` demonstrating the use case.
- Updated validation logic in `packages/aix-core`.

### 2. The Studio (Next.js)
The AIX Studio is our flagship IDE for agent builders. Areas of focus:
- **Voice Wizard**: Enhancing the STT/LLM/TTS pipeline.
- **ABOM Scanner**: Improving forensic detection of supply-chain risks.
- **Identity UI**: Streamlining Pi Network KYC and did:axiom management.

### 3. MCP Servers
Build and register new MCP servers that agents can use to interact with the world.

## 🛠 Development Workflow

### Setup
```bash
git clone https://github.com/Moeabdelaziz007/aix-format.git
npm install
npm run studio:dev
```

### Before EVERY commit — Non-negotiable:
1.  **Build Validation**: `cd apps/studio && npm run build` (must pass).
2.  **Type Check**: `npx tsc --noEmit` (must pass).
3.  **Route Scan**: `node --loader ts-node/esm scripts/validate-routes.ts`.

### Commit format:
We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(studio): ...`
- `fix(core): ...`
- `docs(arch): ...`

## 🛡 Code Standards & Rules
- **Directives**: `'use client'` must be the first line on all hook/browser files.
- **Aliases**: Always use `@/` alias; never use relative imports.
- **Storage**: `localStorage` only inside `useEffect` + `try/catch`.
- **Typing**: `AgentRecord` must always be imported from `@/lib/types`.
- **BOM Logic**: Use `capabilities`, never `apis` (v1.3 standard).

---

*“The best way to predict the future is to architect it.”*
