# Changelog
Format: [Keep a Changelog](https://keepachangelog.com)

## [Unreleased]
### Added
- Agent detail page (agents/[id]/page.tsx)
- DiscoveryPreview component — MCP registry UI
- useLocalAgents hook — localStorage CRUD
- lib/types.ts — centralized TypeScript types
- GET /api/mcp-discovery — MCP discovery API
- aix-detective CLI scanner tool
- examples/test-agent.aix — reference file

### Changed
- builder saves agent to localStorage after export
- ABOM field: `apis` renamed to `capabilities`

### Fixed
- LiveValidator Turbopack build errors (x3)
- useLocalAgents AgentRecord type mismatch
- 3 consecutive Vercel production failures

## [1.3.0] - 2026-04-30

### 🎨 Studio UX & Routing
- **New:** Full fix for `/analytics` and `/settings` routes.
- **New:** Added `postbuild` path verification script to prevent broken links in production.
- **Improved:** Enhanced Hydration in `/my-agents` with skeleton/empty/error states.
- **Improved:** Converted `.well-known/agent.aix.json` into a dynamic route.
- **Unified:** Studio version set to v1.3.0.

### 🗄️ Persistence & Infrastructure (KV → Upstash Redis)
- **Migration:** Full migration from `@vercel/kv` to `@upstash/redis` for sessions and registry.
- **New:** Implemented `TokenBucket` adapter for Upstash to manage API rate limiting.

### 🥧 Pi Network Auth/KYC & Health
- **Integration:** Initialized Pi SDK in `WalletProvider`.
- **Hooks:** Added `usePiAuth` and `usePiKyc` for reactive identity management.
- **Health:** Added `/api/health` endpoint for monitoring SDK and service status.

### 🛡️ ABOM Risk & Security
- **Security:** Rewrote ABOM scanner in TypeScript for improved safety and validation.
- **Adapter:** Implemented `PiKycAdapter` linking ABOM risks to developer KYC status.
- **Hardening:** Hardened deployment API with integrity hash enforcement.

### 🚀 CI/CD & Vercel
- **Fix:** Corrected Vercel `rootDirectory` configuration to `apps/studio`.
- **Build:** Aligned Node version to 18+ and removed blocking security audits in CI.
