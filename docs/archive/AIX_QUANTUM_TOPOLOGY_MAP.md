# AIX Quantum Topology Map
## The 4-Ring Sovereign Ecosystem

This document provides a visual representation of the AIX Sovereign Architecture, mapping the interactions between the 4 primary Rings: Genesis, Soul, Mind, and Body.

```mermaid
graph TD
    %% Core Nodes (The Essences)
    subgraph Ring0 [Ring 0: GENESIS - The DNA Vault]
        R0_Rust[Rust Event Store]
        R0_TrustChain[TrustChain Binary]
    end

    subgraph Ring1 [Ring 1: SOUL - Identity & KYC]
        R1_ZKKyc[Zero-Knowledge KYC]
        R1_PiAuth[Pi Network Auth]
        R1_DID[did:axiom Engine]
    end

    subgraph Ring2 [Ring 2: MIND - Swarm Intelligence]
        R2_GoRouter[Go SwarmRouter]
        R2_Bus[Quantum Resonance Bus]
        R2_CircuitBreaker[Circuit Breaker]
    end

    subgraph Ring3 [Ring 3: BODY - The Studio]
        R3_Studio[Studio UI]
        R3_MCP[MCP Integrations]
        R3_Web3[Web3 Wallets]
    end

    %% Internal Brain Core
    subgraph BrainCore [Brain Core - Meta-Logic]
        BC_Gateway[SovereignGateway]
        BC_Harness[HarnessGate]
        BC_Memory[Sovereign Memory]
    end

    %% Edge Connections (Neural Paths)
    %% Data Flow
    R3_Studio -->|User Intent| BC_Harness
    BC_Harness -->|Clearance Check| BC_Gateway
    
    %% Identity Anchor
    BC_Gateway -->|Verify Trust| R1_DID
    R1_PiAuth -->|KYC Proof| R1_ZKKyc
    R1_ZKKyc -->|Mint DID| R1_DID

    %% Orchestration
    BC_Gateway -->|Publish Task| R2_Bus
    R2_Bus <-->|Resonance| R2_GoRouter
    R2_GoRouter -->|Route to Agent| R3_MCP
    
    %% Memory & Audit (The Trust Edges)
    BC_Gateway -->|Audit Event| R0_Rust
    R2_GoRouter -->|Dead Letter / Failure| R0_Rust
    R1_DID -->|Identity Mutation| R0_Rust
    BC_Gateway -->|Distill Wisdom| BC_Memory

    %% Styling
    classDef ring0 fill:#2d1b1b,stroke:#ff4444,stroke-width:2px,color:#fff;
    classDef ring1 fill:#1b2d3d,stroke:#44aaff,stroke-width:2px,color:#fff;
    classDef ring2 fill:#1b3d1b,stroke:#44ff44,stroke-width:2px,color:#fff;
    classDef ring3 fill:#3d1b3d,stroke:#ff44ff,stroke-width:2px,color:#fff;
    classDef core fill:#222,stroke:#00dbe9,stroke-width:2px,color:#fff;

    class Ring0,R0_Rust,R0_TrustChain ring0;
    class Ring1,R1_ZKKyc,R1_PiAuth,R1_DID ring1;
    class Ring2,R2_GoRouter,R2_Bus,R2_CircuitBreaker ring2;
    class Ring3,R3_Studio,R3_MCP,R3_Web3 ring3;
    class BrainCore,BC_Gateway,BC_Harness,BC_Memory core;
```

### Topological Folding
When the `SovereignGateway` receives a task, it collapses this topology, ensuring that clearance (Harness), identity (DID), execution (Swarm), and audit (Rust) are invoked in a singular quantum context window.

// Made with Moe Abdelaziz
