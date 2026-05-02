# Changelog
Format: [Keep a Changelog](https://keepachangelog.com)

## [Unreleased]

## [1.3.2] - 2026-05-02

### 🚀 Pi Network Integration Layer
- **New:** 14 Pi Network API endpoints for comprehensive integration
- **New:** PiNetworkClient - unified client for Pi Developer Portal API
- **New:** QueueManager - bulk operations with progress tracking
- **New:** AIRemediator - AI-powered vulnerability remediation
- **New:** POST /api/marketplace/clone/:agentId - Deep clone with ownership transfer
- **New:** POST /api/pi/import-config - Import Pi app configuration
- **New:** POST /api/economics/project-revenue - Revenue projections & break-even
- **New:** GET /api/kyc/status-stream - SSE for real-time KYC updates
- **New:** POST /api/analytics/export-to-pi - Export to Pi Developer Dashboard
- **New:** POST /api/playground/pi-context - Inject Pi context for testing
- **New:** POST /api/pi/sandbox-test - Isolated testnet with mock KYC flows
- **New:** POST /api/pi/payment-setup - Smart contract & payment infrastructure
- **New:** POST /api/agents/bulk-deploy - Queue-based bulk deployment
- **New:** POST /api/abom-scan/remediate - AI-powered vulnerability fixes

### 🔧 CI/CD & Quality
- **New:** Health score baseline system with --init flag
- **New:** .health-score-baseline.json for tracking codebase health
- **Improved:** Health score now compares against baseline
- **Note:** Commits 4b661a2 and 8c3d8e4 are duplicates (network retry artifact)

### Added
- Agent detail page (agents/[id]/page.tsx)
- DiscoveryPreview component — MCP registry UI
- useLocalAgents hook — localStorage CRUD
- lib/types.ts — centralized TypeScript types
- GET /api/mcp-discovery — MCP discovery API
- aix-detective CLI scanner tool
- examples/test-agent.aix — reference file
- AXIOM.md — Single Source of Truth for agent definitions
- swarm_router.go — Go-based multi-agent coordination router
- DOCS_ESSENCE.md — System essence documentation
- DOCS_QUANTUM_TOPOLOGY.md — Quantum topology framework documentation

### Changed
- builder saves agent to localStorage after export
- ABOM field: `apis` renamed to `capabilities`

### Fixed
- LiveValidator Turbopack build errors (x3)
- useLocalAgents AgentRecord type mismatch
- 3 consecutive Vercel production failures

## [1.3.1] - 2026-05-02

### 🧪 Testing & Quality (PRs #85, #83)
- **New:** Comprehensive tests for `get_blackbox_logs` with invalid manifest paths
- **New:** Build provenance tests in signature.js for supply chain security
- **Improved:** Test coverage for security-critical components

### 🧹 Code Health & Refactoring (PRs #76, #75, #72)
- **Fixed:** Chained return formatting in scanner.js to prevent ASI bugs
- **Removed:** FIX comment from KycSignatureModal (cleanup)
- **Refactored:** Logger implementation with improved error handling
- **Fixed:** CI workflow issues and test imports

### ⚡ Performance Optimization (PR #67)
- **Optimized:** Registry fetch using Redis `mget` for batch operations
- **Improved:** Reduced latency in global registry queries
- **Enhanced:** Caching strategy for frequently accessed agent data

### 🏗️ Infrastructure & Architecture
- **New:** AXIOM.md as unified SSOT replacing fragmented agent definitions
- **New:** Go-based swarm router for multi-agent coordination
- **New:** Quantum topology documentation framework
- **New:** System essence documentation

### 🔧 Developer Experience
- **Fixed:** Studio outputFileTracingRoot configuration
- **Improved:** Test import paths and module resolution
- **Enhanced:** Build process stability

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
