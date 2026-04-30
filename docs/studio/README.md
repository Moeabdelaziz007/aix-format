# AIX Studio — Developer Guide
Live: https://axiomid.app

## Pages
  / → Homepage
  /builder → 5-step agent builder
  /agents/[id] → Agent detail + MCP preview
  /my-agents → Saved agents library
  /marketplace → Public agent discovery
  /spec → Interactive spec viewer
  /network → Network status

## API Routes
  GET /api/mcp-discovery → MCP agent registry JSON

## Key Files
  src/hooks/useLocalAgents.ts → localStorage CRUD
  src/lib/types.ts → All TypeScript interfaces
  src/lib/mcp-generator.ts → MCP data generator
  src/components/studio/DiscoveryPreview.tsx → MCP UI

## Build
  cd apps/studio && npm run build
