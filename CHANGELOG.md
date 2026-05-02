
# Changelog

All notable changes to the AIX Format project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-05-02

### 🚀 Major Release: Universal Agent Passport

This release introduces the **Universal Agent Passport** - transforming AIX Format into the standard for the agentic payment economy.

### Added

#### Payment Layer (v1.0.0)
- **HTTP 402 Integration**: Native "Payment Required" protocol support
  - Payment challenge/response flow
  - Cryptographic proof verification
  - Replay attack prevention
  - 300-second challenge TTL

- **Multi-Chain Wallet Support**:
  - Base L2 ($0.0001/tx, 2s finality)
  - Solana ($0.00025/tx, 400ms finality)
  - Ethereum (ERC-4337 account abstraction)
  - Pi Network (native KYC integration)

- **Fiat On/Off Ramps**:
  - Stripe integration (2.9% + $0.30)
  - PayPal integration (3.49% + $0.49)
  - PYUSD stablecoin support (4% APY)

- **Payment Routing Engine**:
  - Automatic cost-optimized chain selection
  - Rules-based routing (amount, urgency, compliance)
  - Fallback chain support
  - Real-time fee estimation

- **ERC-4337 Smart Wallets**:
  - Gasless transactions via Paymaster
  - Session keys for automation
  - Social recovery via did:axiom
  - Programmable spending limits

#### DeFi Integration (Beta)
- **Flash Loan Framework**:
  - Aave V4 integration
  - Arbitrage strategy engine
  - Risk management system
  - Backtesting infrastructure

- **Treasury Management**:
  - Multi-sig treasury contract (5-of-7)
  - Yield optimization (8% APY target)
  - Automatic rebalancing
  - Protocol integration (Aave, Compound)

#### Platform Adapters (Beta)
- **OpenClaw Adapter**: Import 44K+ skills with identity verification
- **Hermes Adapter**: MCP-first agent migration
- **Kelos Adapter**: Kubernetes AgentConfig conversion
- **Manus Adapter**: Enterprise agent export
- **IBM watsonx Adapter**: Enterprise compliance integration

#### Documentation
- [`AIX_PAYMENT_ECONOMY_STRATEGIC_PLAN.md`](docs/AIX_PAYMENT_ECONOMY_STRATEGIC_PLAN.md): Comprehensive strategic plan
- [`PR_72_REVIEW.md`](docs/PR_72_REVIEW.md): Code review best practices
- Updated README with Universal Passport section
- Version tracking system ([`version.ts`](packages/aix-core/src/version.ts))

### Changed
- **Package Version**: 1.3.0 → 1.4.0
- **Package Description**: Updated to reflect Universal Agent Passport positioning
- **README Title**: "Sovereign Agent Standard" → "Universal Agent Passport"
- **Core Identity**: Maintained at v1.3.0 (stable)
- **Payment Layer**: New at v1.0.0

### Version Matrix
```
AIX Core Format:    v1.3.0 (Identity + MCP + ABOM)
AIX Payment Layer:  v1.0.0 (HTTP 402 + Multi-Chain + DeFi)
AIX Passport:       v1.4.0 (Complete Integration)
```

### Feature Flags
```typescript
FEATURES = {
  // Core (Stable)
  IDENTITY: true,
  MCP: true,
  ABOM: true,
  ZK_KYC: true,
  
  // Payment (Stable)
  HTTP_402: true,
  MULTI_CHAIN: true,
  PAYMENT_ROUTING: true,
  FIAT_RAMPS: true,
  TREASURY_YIELD: true,
  
  // DeFi (Beta)
  FLASH_LOANS: false,
  ARBITRAGE: false,
  
  // Adapters (Beta)
  OPENCLAW_ADAPTER: false,
  HERMES_ADAPTER: false,
  KELOS_ADAPTER: false,
  MANUS_ADAPTER: false,
  IBM_WATSONX_ADAPTER: false
}
```

### Economic Model
- **Year 1 Revenue Target**: $25.24M
  - Platform fees: $18M (15% avg take rate)
  - SaaS subscriptions: $6.6M
  - DeFi treasury yield: $400K
  - Staking rewards: $240K
- **Profit Margin**: 60%
- **Target Agents**: 10,000
- **Target Daily Transactions**: 100,000

### Security
- TEE wallet infrastructure (AWS Nitro Enclaves)
- ZK-proof integration for privacy-preserving KYC
- Multi-sig treasury with 48-hour timelock
- Immutable audit logs on-chain

### Breaking Changes
None. All changes are backward compatible with v1.3.0 agents.

---

## [1.3.0] - 2026-04-29

### Added
- **did:axiom Identity Layer**: Decentralized identifiers with Ed25519 signatures
- **Pi Network KYC Integration**: Tier 0-3 verification levels
- **ZK-Proof Verification**: Privacy-preserving identity proofs
- **Economics Module**: Basic pricing and settlement configuration
- **Nullifier Registry**: Replay attack prevention for ZK-proofs

### Changed
- Schema version: 1.2.0 → 1.3.0
- Identity layer now required in all agents
- Enhanced security validation

---

## [1.2.0] - 2026-04-20

### Added
- **ABOM (Agent Bill of Materials)**: Supply chain transparency
- **Live Voice Models**: Real-time conversational AI support
- **Meta Arbiter**: Orchestration layer for multi-system coordination
- **SaaS-BOM Auditing**: Third-party dependency tracking

### Changed
- Schema version: 1.1.0 → 1.2.0
- Enhanced security scanning

---

## [1.1.0] - 2026-04-15

### Added
- **MCP Integration**: Model Context Protocol server configuration
- **Memory System**: Episodic, semantic, and procedural memory
- **Requirements Section**: Hardware, software, and network specifications
- **VLA Support**: Vision-Language-Action model adapters

### Changed
- Schema version: 1.0.0 → 1.1.0
- Improved validation rules

---

## [1.0.0] - 2026-04-01

### Added
- Initial release of AIX Format
- Basic agent manifest structure
- Persona configuration
- Skills and APIs
- Security checksums
- Digital signatures

---

## Upcoming

### [1.5.0] - Planned Q3 2026
- Full DeFi strategy suite (flash loans, arbitrage)
- All platform adapters (production-ready)
- Advanced payment routing (ML-optimized)
- Cross-chain atomic swaps
- Agent marketplace launch

### [2.0.0] - Planned Q4 2026
