# 🧊 RING 2: SWARM ORCHESTRATION (Mind)
## "The Logic of the Swarm"

### 🛡️ ALLOWED
- Dynamic routing based on agent capacity.
- Pulse emission for inter-agent signaling.
- Redis-based memory sharing with `TurboQuant`.

### ⛔ FORBIDDEN
- Hardcoding agent IDs.
- Circular dependencies between Go and TS.
- Modifying the TrustChain without a valid `sig:aix_dna`.

### 📡 TOPOLOGY
The Swarm is the central nervous system. It connects the Engine (Go) to the Brain (TS).
Refer to [AIX_TOPOLOGY_SCHEMA.md](../docs/AIX_TOPOLOGY_SCHEMA.md) for data formats.

### 🥧 PI NETWORK INTEGRATION
- All external bridges must reside in `packages/aix-core/src/network/`.
- Prioritize **AxiomID** as the primary identity, with Pi UID as a secondary mapping.
- Every Pi transaction must be logged in the **TrustChain**.

### 🧹 CODE QUALITY & HOUSEKEEPING
- **No Legacy**: `.bak` and `.tmp` files are strictly forbidden.
- **Branching**: Use `agent/name-task` or `fix/issue-id`.
- **Merge Criteria**: All PRs must have 100% test coverage for new logic.
