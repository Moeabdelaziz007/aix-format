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

## [1.3.0] — 2026-04-29
### Added
- AIX Schema v1.3 with ABOM integrity hashing
- KYC identity attributes
- MCP discovery generator
- Security auditing protocol

### Breaking
- `abom.apis` → `abom.capabilities`
- `identity_layer` now required
- `integrity_hash` now required
