# AIX Studio v2.0 Route Map

Detailed inventory of all routes within the AIX Studio, their state management strategies, and associated API endpoints.

| Route | Purpose | State Source | APIs Used |
| :--- | :--- | :--- | :--- |
| `/` | Dashboard / Landing | Server (SSR) | `/api/health`, `/api/analytics` |
| `/builder` | Agent Manifest Architect | Local (useBuilderState) | `/api/abom-scan`, `/api/agents` |
| `/marketplace`| Agent Discovery | Server (React Query) | `/api/registry`, `/api/marketplace` |
| `/identity` | DID & Session Management | Local (useIdentity) | `/api/auth`, `/api/kyc/sign` |
| `/fleet` | User Agent Management | Server (React Query) | `/api/agents` |
| `/analytics` | System & Agent Metrics | Server (React Query) | `/api/analytics` |
| `/scan` | ABOM Risk Validator | Local | `/api/abom-scan` |
| `/spec` | Protocol Documentation | Static | `/api/spec` |
| `/mcp` | MCP Gateway Config | Local | `/api/mcp-router`, `/api/mcp-discovery` |
| `/playground` | Real-time Agent Testing | Local | `/api/mcp-router` |
| `/settings` | User Preferences | Local / Storage | - |

## State Management Standards
- **Global State**: Managed via `useIdentity` hook for sessions and `useRegistry` for global agent lists.
- **Form State**: Managed locally within screens using specialized state hooks (e.g., `useBuilderState`).
- **Data Fetching**: Standardized on **React Query** for caching and optimistic updates.

## Component Layering (v2.0)
Components are tagged with their specific architectural role:
- `// ROLE: screen` - Top-level page components.
- `// ROLE: layout` - Persistent structural elements (Nav, Sidebar).
- `// ROLE: widget` - Independent functional units (Agent Card, Stat Grid).
- `// ROLE: primitive` - Pure UI elements (Button, Input, Badge).
