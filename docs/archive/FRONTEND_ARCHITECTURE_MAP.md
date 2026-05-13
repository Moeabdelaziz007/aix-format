# AIX Studio Frontend Architecture Map

**Version:** 1.0  
**Last Updated:** 2026-05-02  
**Maintainer:** AIX Studio Team

---

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Component Hierarchy](#component-hierarchy)
4. [Route Mapping](#route-mapping)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [State Management](#state-management)
7. [API Integration Matrix](#api-integration-matrix)
8. [Inter-Module Dependencies](#inter-module-dependencies)

---

## Overview

AIX Studio is a Next.js 14 application using the App Router architecture. The frontend is organized into a modular structure with clear separation of concerns between pages, components, hooks, and utilities.

### Technology Stack

```
┌─────────────────────────────────────────┐
│         AIX Studio Frontend             │
├─────────────────────────────────────────┤
│ Framework:    Next.js 14 (App Router)   │
│ Language:     TypeScript 5.x            │
│ Styling:      Tailwind CSS 3.x          │
│ UI Library:   Radix UI + Framer Motion  │
│ State:        React Hooks + Context     │
│ Auth:         Pi Network + RainbowKit   │
│ Payment:      Stripe                    │
│ Testing:      Vitest + Playwright       │
└─────────────────────────────────────────┘
```

---

## Directory Structure

```
apps/studio/src/
│
├── app/                          # Next.js App Router (Pages & API)
│   ├── (routes)/                 # 25 page routes
│   │   ├── page.tsx              # Home/Landing
│   │   ├── marketplace/          # Agent marketplace
│   │   ├── my-agents/            # User's agents
│   │   ├── builder/              # Agent builder
│   │   ├── workspace/[agentId]/  # Agent workspace
│   │   ├── agents/[id]/          # Agent details
│   │   ├── skills/               # Skills management
│   │   ├── mcp/                  # MCP servers
│   │   ├── plugins/              # Plugin marketplace
│   │   ├── fleet/                # Fleet management
│   │   ├── analytics/            # Analytics dashboard
│   │   ├── settings/             # User settings
│   │   ├── identity/             # DID/KYC
│   │   ├── pricing/              # Pricing plans
│   │   ├── playground/           # Testing playground
│   │   ├── pulse/                # Pulse monitoring
│   │   ├── space/                # Memory space
│   │   ├── scan/                 # Security scanning
│   │   ├── deploy/               # Deployment
│   │   ├── network-status/       # Network health
│   │   ├── design-system/        # Design showcase
│   │   └── spec/                 # AIX spec viewer
│   │
│   └── api/                      # API Routes (63 endpoints)
│       ├── agents/               # Agent CRUD & operations
│       ├── marketplace/          # Marketplace operations
│       ├── kyc/                  # KYC verification
│       ├── mcp-discovery/        # MCP discovery
│       ├── voice-wizard/         # Voice operations
│       ├── compression/          # Compression analysis
│       ├── economics/            # Cost calculations
│       ├── stripe/               # Payment processing
│       └── [other]/              # 40+ more endpoints
│
├── components/                   # React Components (180+ files)
│   ├── agents/                   # ✅ Unified agent components
│   │   └── AgentCard/            # Modular card system
│   │       ├── AgentCard.tsx     # Main component
│   │       ├── AgentCard.types.ts
│   │       └── sub/              # Sub-components
│   │           ├── KYABadge.tsx
│   │           ├── TrustScore.tsx
│   │           ├── RatingStars.tsx
│   │           └── PriceBadge.tsx
│   │
│   ├── marketplace/              # ⚠️ Legacy marketplace components
│   │   ├── AgentCard.tsx         # [DUPLICATE - TO DEPRECATE]
│   │   ├── KYABadge.tsx          # [DUPLICATE - TO DEPRECATE]
│   │   ├── AgentDetailModal.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SkillCard.tsx
│   │   ├── MCPCard.tsx
│   │   ├── PluginCard.tsx
│   │   └── APICard.tsx
│   │
│   ├── studio/                   # Studio-specific components
│   │   ├── AgentCard.tsx         # [DUPLICATE - TO DEPRECATE]
│   │   ├── VoiceOrb.tsx          # Full-featured voice UI
│   │   ├── SetupWizard.tsx       # Onboarding wizard
│   │   ├── AgenticKycSetup.tsx   # KYC setup flow
│   │   ├── LiveValidator.tsx     # Real-time validation
│   │   ├── DeployModal.tsx       # Deployment modal
│   │   ├── DiscoveryPreview.tsx  # MCP discovery
│   │   ├── BOMVisualizer.tsx     # Bill of materials
│   │   ├── DNABadge.tsx          # DNA verification badge
│   │   ├── DIDCard.tsx           # Decentralized ID card
│   │   ├── FeaturedAgentCard.tsx # Featured agent display
│   │   ├── GlobalVoiceCommand.tsx
│   │   ├── GlobalVoiceCommandPalette.tsx
│   │   ├── GlobalVoiceFAB.tsx
│   │   ├── IntelligenceStream.tsx
│   │   ├── KycSignatureModal.tsx
│   │   ├── SovereignAether.tsx
│   │   ├── SovereignAetherClient.tsx
│   │   ├── VoiceWizard.tsx
│   │   ├── WalletButton.tsx
│   │   └── AgentInteraction.tsx
│   │
│   ├── shared/                   # Reusable UI primitives
│   │   ├── AgentPet.tsx          # Pet avatar component
│   │   ├── Badge.tsx             # Badge component
│   │   ├── Button.tsx            # Button component
│   │   ├── Card.tsx              # Card component
│   │   ├── Input.tsx             # Input component
│   │   ├── Layout.tsx            # Layout wrapper
│   │   ├── PageHeader.tsx        # Page header
│   │   ├── PiConnectButton.tsx   # Pi Network connect
│   │   ├── Typography.tsx        # Typography system
│   │   ├── WikiBrain.tsx         # Knowledge base UI
│   │   ├── Guidance.tsx          # Tooltip/guidance
│   │   └── index.ts              # Barrel export
│   │
│   ├── layout/                   # Layout components
│   │   ├── Navbar.tsx            # Main navigation
│   │   ├── Sidebar.tsx           # Sidebar navigation
│   │   ├── SovereignStatusBar.tsx # Status bar
│   │   └── LiveActivityTicker.tsx # Activity ticker
│   │
│   ├── home/                     # Landing page sections
│   │   ├── HeroSection.tsx       # Hero section
│   │   ├── AgentsDashboard.tsx   # Agents preview
│   │   ├── LiveSection.tsx       # Live demo
│   │   ├── Testimonials.tsx      # User testimonials
│   │   └── LiveActivityTicker.tsx
│   │
│   ├── animations/               # Animation utilities
│   │   ├── FadeIn.tsx            # Fade-in animation
│   │   └── ParticleBackground.tsx # Particle effects
│   │
│   ├── providers/                # Context providers
│   │   ├── VoiceCommandProvider.tsx # Voice commands
│   │   └── WalletProvider.tsx    # Wallet connection
│   │
│   ├── builder/                  # Builder-specific
│   │   ├── MetaForm.tsx          # Metadata form
│   │   └── PersonaEditor.tsx     # Persona editor
│   │
│   └── docs/                     # Documentation components
│       └── DocClientComponents.tsx
│
├── hooks/                        # Custom React Hooks
│   ├── useAbom.ts                # ABOM scanning
│   ├── useAuth.ts                # Authentication
│   ├── useBuilderState.ts        # Builder state
│   ├── useDeployment.ts          # Deployment operations
│   ├── useGlobalVoice.ts         # Global voice commands
│   ├── useIdentity.ts            # Identity management
│   ├── useKyc.ts                 # KYC operations
│   ├── useKycSign.ts             # KYC signing
│   ├── useLocalAgents.ts         # Local agent storage
│   ├── useLocalStorage.ts        # LocalStorage wrapper
│   ├── useMarketplace.ts         # Marketplace operations
│   ├── useRegistry.ts            # Registry operations
│   ├── useScrollAnimation.ts     # Scroll animations
│   ├── useSettings.ts            # Settings management
│   ├── useVoiceCommands.ts       # Voice command parsing
│   ├── useVoiceWizard.ts         # Voice wizard
│   └── zkkycTool.ts              # zkKYC utilities
│
├── lib/                          # Utilities & Helpers
│   ├── abom-scanner.ts           # ABOM scanning logic
│   ├── ai-remediate.ts           # AI remediation
│   ├── aix-core-mock.ts          # Core mocks
│   ├── api-helpers.ts            # API utilities
│   ├── builder-validation.ts     # Builder validation
│   ├── did.ts                    # DID utilities
│   ├── logger.ts                 # Logging
│   ├── marketplace-api.ts        # Marketplace API client
│   ├── marketplace.ts            # Marketplace logic
│   ├── mcp-generator.ts          # MCP generation
│   ├── mock-agents.ts            # Mock data
│   ├── monitoring.ts             # Monitoring utilities
│   ├── pi-network.ts             # Pi Network SDK
│   ├── plans.ts                  # Pricing plans
│   ├── pricing.ts                # Pricing logic
│   ├── queue.ts                  # Queue management
│   ├── rate-limit.ts             # Rate limiting
│   ├── redis.ts                  # Redis client
│   ├── registry.ts               # Registry client
│   ├── security.ts               # Security utilities
│   ├── types.ts                  # Type definitions
│   ├── utils.ts                  # General utilities
│   ├── version.ts                # Version info
│   ├── wallet-config.ts          # Wallet configuration
│   └── pricing/                  # Pricing module
│       ├── constants.ts
│       ├── engine.ts
│       ├── types.ts
│       └── utils.ts
│
├── sections/                     # Landing page sections
│   ├── Hero.tsx                  # Hero section
│   ├── Features.tsx              # Features section
│   ├── FeaturedAgents.tsx        # Featured agents
│   ├── HowItWorks.tsx            # How it works
│   ├── LiveDemo.tsx              # Live demo
│   ├── Pricing.tsx               # Pricing section
│   ├── QuickAccessGrid.tsx       # Quick access
│   ├── TrustedBy.tsx             # Trust indicators
│   └── Footer.tsx                # Footer
│
└── design-system/                # Design System
    ├── tokens.ts                 # Design tokens
    ├── components.tsx            # DS components
    ├── agentic-components.tsx    # Agentic UI
    └── AGENTIC_DESIGN_SYSTEM.md  # Documentation
```

---

## Component Hierarchy

### Visual Component Tree

```
App Layout
│
├── Navbar
│   ├── Logo
│   ├── Navigation Links
│   ├── PiConnectButton
│   └── WalletButton
│
├── SovereignStatusBar
│   ├── Network Status
│   ├── KYC Status
│   └── Wallet Balance
│
├── Page Content
│   │
│   ├── Home Page
│   │   ├── HeroSection
│   │   │   └── VoiceOrb (dynamic import)
│   │   ├── SetupWizard
│   │   ├── AgentsDashboard
│   │   │   └── AgentCard (unified) × N
│   │   └── AgenticKycSetup
│   │
│   ├── Marketplace Page
│   │   ├── SearchBar
│   │   ├── FilterSidebar
│   │   │   ├── Type Filter
│   │   │   ├── Price Filter
│   │   │   └── KYA Tier Filter
│   │   └── Agent Grid
│   │       └── AgentCard (marketplace) × N
│   │           ├── KYABadge
│   │           ├── TrustScore
│   │           ├── RatingStars
│   │           └── PriceBadge
│   │
│   ├── My Agents Page
│   │   ├── Create Agent Button
│   │   └── Agent Grid
│   │       └── AgentCard (studio) × N
│   │           ├── AgentPet
│   │           ├── DNABadge
│   │           └── Deployment Status
│   │
│   ├── Builder Page
│   │   ├── MetaForm
│   │   ├── PersonaEditor
│   │   ├── LiveValidator
│   │   └── VoiceWizard
│   │
│   ├── Agent Workspace
│   │   ├── Workspace Sidebar
│   │   │   ├── Overview Tab
│   │   │   ├── Skills Tab
│   │   │   ├── Memory Tab
│   │   │   ├── Pet Tab
│   │   │   ├── Pulse Tab
│   │   │   └── WikiBrain Tab
│   │   │
│   │   └── Workspace Content
│   │       ├── Agent Overview
│   │       ├── Skills Manager
│   │       ├── Memory Tree
│   │       ├── Pet Customizer
│   │       ├── Pulse Monitor
│   │       └── WikiBrain Interface
│   │
│   ├── Agent Details Page
│   │   ├── AgentDetailClient
│   │   ├── DiscoveryPreview
│   │   ├── DeployModal
│   │   └── BOMVisualizer
│   │
│   ├── Skills Page
│   │   ├── Skill Grid
│   │   └── SkillCard × N
│   │
│   ├── MCP Page
│   │   ├── Discovery UI
│   │   └── MCPCard × N
│   │
│   ├── Fleet Page
│   │   ├── Fleet Metrics
│   │   └── Agent Grid
│   │
│   ├── Analytics Page
│   │   ├── Metrics Display
│   │   ├── Charts
│   │   └── Export UI
│   │
│   ├── Settings Page
│   │   ├── Settings Tabs
│   │   ├── Profile Settings
│   │   ├── API Keys
│   │   ├── Integrations
│   │   └── Billing
│   │
│   └── Identity Page
│       ├── DIDCard
│       └── AgenticKycSetup
│
├── GlobalVoiceCommandPalette
│   └── Command List
│
├── GlobalVoiceFAB
│   └── Mic Button
│
└── SovereignAetherClient
    └── Background Effects
```

---

## Route Mapping

### Public Routes

| Route | Component | Purpose | Auth Required |
|-------|-----------|---------|---------------|
| `/` | `app/page.tsx` | Landing page | No |
| `/pricing` | `app/pricing/page.tsx` | Pricing plans | No |
| `/design-system` | `app/design-system/page.tsx` | Design showcase | No |
| `/spec` | `app/spec/page.tsx` | AIX spec viewer | No |

### Authenticated Routes

| Route | Component | Purpose | Features |
|-------|-----------|---------|----------|
| `/marketplace` | `app/marketplace/page.tsx` | Browse agents | Search, filter, purchase |
| `/my-agents` | `app/my-agents/page.tsx` | User's agents | CRUD, deploy |
| `/builder` | `app/builder/page.tsx` | Create agent | Visual editor, validation |
| `/workspace/[agentId]` | `app/workspace/[agentId]/page.tsx` | Agent workspace | Multi-tab interface |
| `/workspace/[agentId]/skills` | `app/workspace/[agentId]/skills/page.tsx` | Manage skills | CRUD operations |
| `/workspace/[agentId]/pet` | `app/workspace/[agentId]/pet/page.tsx` | Customize pet | Visual customizer |
| `/workspace/[agentId]/pulse` | `app/workspace/[agentId]/pulse/page.tsx` | Monitor pulse | Real-time metrics |
| `/workspace/[agentId]/wikibrain` | `app/workspace/[agentId]/wikibrain/page.tsx` | Knowledge base | Search, browse |
| `/workspace/[agentId]/deploy` | `app/workspace/[agentId]/deploy/page.tsx` | Deploy agent | Multi-target |
| `/agents/[id]` | `app/agents/[id]/page.tsx` | Agent details | Full info, deploy |
| `/agents/[id]/memory` | `app/agents/[id]/memory/page.tsx` | Memory tree | Visualization, CRUD |
| `/skills` | `app/skills/page.tsx` | Skills library | Browse, create |
| `/mcp` | `app/mcp/page.tsx` | MCP servers | Discovery, register |
| `/plugins` | `app/plugins/page.tsx` | Plugin marketplace | Browse, install |
| `/plugins/dev/[id]` | `app/plugins/dev/[id]/page.tsx` | Plugin dev tools | Testing, debugging |
| `/fleet` | `app/fleet/page.tsx` | Fleet management | Bulk operations |
| `/analytics` | `app/analytics/page.tsx` | Analytics dashboard | Metrics, export |
| `/settings` | `app/settings/page.tsx` | User settings | Profile, API keys |
| `/identity` | `app/identity/page.tsx` | Identity management | DID, KYC |
| `/playground` | `app/playground/page.tsx` | Testing playground | Interactive testing |
| `/pulse` | `app/pulse/page.tsx` | Pulse monitoring | Real-time data |
| `/space` | `app/space/page.tsx` | Memory space | 3D visualization |
| `/scan` | `app/scan/page.tsx` | Security scanning | ABOM analysis |
| `/deploy` | `app/deploy/page.tsx` | Deployment center | Multi-agent deploy |
| `/network-status` | `app/network-status/page.tsx` | Network health | Status monitoring |

---

## Data Flow Diagrams

### Agent Creation Flow

```
User Input (Builder)
        ↓
   MetaForm + PersonaEditor
        ↓
   LiveValidator (real-time)
        ↓
   POST /api/agents
        ↓
   useLocalAgents (cache)
        ↓
   Redirect to /my-agents
```

### Marketplace Purchase Flow

```
Browse Marketplace
        ↓
   AgentCard onClick
        ↓
   AgentDetailModal
        ↓
   Purchase Button
        ↓
   POST /api/stripe/checkout
        ↓
   Stripe Checkout
        ↓
   Webhook /api/stripe/webhook
        ↓
   Grant Access
        ↓
   POST /api/marketplace/clone/[id]
        ↓
   Add to My Agents
```

### KYC Verification Flow

```
Identity Page
        ↓
   AgenticKycSetup
        ↓
   Pi Network Auth
        ↓
   POST /api/kyc/verify
        ↓
   KycSignatureModal
        ↓
   Sign with Wallet
        ↓
   POST /api/kyc/sign
        ↓
   GET /api/kyc/status-stream (SSE)
        ↓
   Update UI with Status
```

### Voice Command Flow

```
GlobalVoiceFAB Click
        ↓
   VoiceOrb (listening)
        ↓
   Speech Recognition API
        ↓
   parseIntent (useVoiceCommands)
        ↓
   Route to Action
        ├── Navigate to Page
        ├── Create Agent
        ├── Deploy Agent
        └── Search Marketplace
```

---

## State Management

### Global State (Context)

```typescript
// Voice Command Context
VoiceCommandProvider
├── isListening: boolean
├── transcript: string
├── intent: ParsedIntent | null
└── executeCommand: (intent) => void

// Wallet Context
WalletProvider
├── address: string | null
├── isConnected: boolean
├── balance: bigint
└── connect: () => Promise<void>
```

### Local State (Hooks)

```typescript
// useLocalAgents - Agent Management
{
  agents: AgentRecord[]
  loading: boolean
  error: Error | null
  createAgent: (data) => Promise<AgentRecord>
  updateAgent: (id, data) => Promise<void>
  deleteAgent: (id) => Promise<void>
  deployAgent: (id, config) => Promise<void>
}

// useMarketplace - Marketplace Operations
{
  items: MarketplaceItem[]
  filters: FilterState
  loading: boolean
  search: (query) => void
  filter: (filters) => void
  purchase: (itemId) => Promise<void>
}

// useSettings - Settings Management
{
  settings: UserSettings
  loading: boolean
  updateSettings: (data) => Promise<void>
  apiKeys: ApiKey[]
  createApiKey: (name) => Promise<ApiKey>
  deleteApiKey: (id) => Promise<void>
}
```

---

## API Integration Matrix

### Frontend → Backend Mapping

| Frontend Hook/Component | API Endpoint | Method | Status |
|------------------------|--------------|--------|--------|
| useLocalAgents.createAgent | /api/agents | POST | ✅ |
| useLocalAgents.updateAgent | /api/agents/[id] | PUT | ✅ |
| useLocalAgents.deployAgent | /api/agents/bulk-deploy | POST | ✅ |
| useMarketplace.search | /api/marketplace | GET | ✅ |
| useMarketplace.purchase | /api/stripe/checkout | POST | ⚠️ |
| useKyc.verify | /api/kyc/verify | POST | ✅ |
| useKyc.sign | /api/kyc/sign | POST | ✅ |
| useVoiceWizard.transcribe | /api/voice-wizard/transcribe | POST | ✅ |
| useVoiceWizard.generateManifest | /api/voice-wizard/generate-manifest | POST | ✅ |
| useRegistry.discover | /api/mcp-discovery | GET | ✅ |
| useRegistry.register | /api/mcp-discovery/register | POST | ✅ |
| useDeployment.deploy | /api/deploy-agent | POST | ✅ |
| useAbom.scan | /api/abom-scan | POST | ✅ |
| Skills CRUD | /api/skills | GET/POST | ⚠️ |
| Skills Update | /api/skills/[id] | PUT | ❌ |
| Skills Delete | /api/skills/[id] | DELETE | ❌ |
| Plugins List | /api/plugins | GET | ❌ |

---

## Inter-Module Dependencies

### Dependency Graph

```
┌─────────────────────────────────────────────────────────┐
│                     App Pages                           │
│  (Consume components, hooks, and call APIs)             │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  Components  │ │  Hooks   │ │  API Routes  │
│              │ │          │ │              │
│ - agents/    │ │ - useXxx │ │ - /api/xxx   │
│ - studio/    │ │          │ │              │
│ - shared/    │ └────┬─────┘ └──────────────┘
│ - layout/    │      │
└──────┬───────┘      │
       │              │
       └──────┬───────┘
              ↓
       ┌─────────────┐
       │    lib/     │
       │             │
       │ - utils     │
       │ - types     │
       │ - api-      │
       │   helpers   │
       └─────────────┘
```

### Critical Dependencies

**High Coupling (Needs Refactoring):**
- `marketplace/AgentCard` → `marketplace-api.ts` → `lib/types.ts`
- `studio/AgentCard` → `lib/types.ts` → `useLocalAgents`
- `agents/AgentCard` → Both marketplace and studio types

**Good Separation:**
- `shared/` components → No external dependencies
- `hooks/` → Only depend on `lib/` utilities
- `sections/` → Only use `shared/` components

---

## Component Communication Patterns

### Props Drilling (Current)

```
Page
 └→ Container Component
     └→ List Component
         └→ Card Component (receives 10+ props)
```

**Issue:** Deep prop drilling in marketplace and fleet pages

### Context API (Implemented)

```
VoiceCommandProvider
 ├→ GlobalVoiceFAB
 ├→ GlobalVoiceCommandPalette
 └→ VoiceOrb
```

**Status:** Working well for voice commands

### Custom Hooks (Recommended Pattern)

```
useLocalAgents() → Encapsulates agent state
useMarketplace() → Encapsulates marketplace state
useSettings() → Encapsulates settings state
```

**Status:** Partially implemented, needs expansion

---

## Performance Considerations

### Code Splitting

**Currently Implemented:**
- Dynamic import of VoiceOrb in HeroSection
- Lazy loading of heavy components

**Needs Implementation:**
- Marketplace grid virtualization
- Analytics chart lazy loading
- Design system component splitting

### Memoization

**Missing:**
- AgentCard components (re-render on every filter)
- Marketplace grid (recalculates on every change)
- Analytics charts (expensive calculations)

---

## Security Architecture

### Authentication Flow

```
User → Pi Network Auth → JWT Token → API Requests
                                    ↓
                              Middleware Validation
                                    ↓
                              Protected Routes
```

### Authorization Layers

1. **Route Level:** Next.js middleware checks auth
2. **API Level:** Each endpoint validates JWT
3. **Component Level:** Conditional rendering based on auth state

---

## Future Architecture Improvements

### Recommended Changes

1. **Consolidate Duplicate Components**
   - Migrate to unified `agents/AgentCard`
   - Remove marketplace and studio versions

2. **Implement State Management Library**
   - Consider Zustand or Jotai for complex state
   - Reduce prop drilling

3. **Add Error Boundaries**
   - Wrap all major page components
   - Implement fallback UI

4. **Improve Type Safety**
   - Remove all `any` types
   - Add strict TypeScript config

5. **Optimize Bundle Size**
   - Implement route-based code splitting
   - Lazy load heavy dependencies

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-02  
**Next Review:** 2026-06-02