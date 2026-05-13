# AIX Schema Overview (v1.3)

## Introduction
AIX (Artificial Intelligence eXchange) Format v1.3 is the Sovereign Protocol standard for autonomous AI agents. It provides a "Digital DNA" for agents, ensuring interoperability, supply chain transparency (via ABOM), and cryptographic identity (via AxiomID).

## Core Structure
The v1.3 schema is organized into four mandatory top-level blocks:

### 1. Meta (`meta`)
Contains administrative and identification data for the agent.
- **`id`**: Unique identifier (UUID v4 or AxiomDID).
- **`version`**: Semantic version of the agent.
- **`author`**: Creator of the agent.
- **`lineage`**: Tracks the agent's heritage (forks, clones, etc.).

### 2. Persona (`persona`)
Defines the agent's behavior, tone, and specific instructions.
- **`role`**: The primary role of the agent.
- **`instructions`**: Core system prompts and behavior rules.
- **`tone` / `style`**: Emotional and linguistic traits.
- **`constraints`**: Operational boundaries.

### 3. Security (`security`)
Ensures integrity and specifies operational permissions.
- **`checksum`**: Cryptographic hash (SHA-256/512/BLAKE3) of the payload.
- **`signature`**: Proof of authorship.
- **`capabilities`**: Explicit permissions (allowed/restricted operations).
- **`compliance`**: Standards and certifications.

### 4. Identity Layer (`identity_layer`)
The AxiomID block, rooted in `axiomid.app`.
- **`id`**: Canonical DID for the agent.
- **`kyc_tier`**: Verification level (0-3).
- **`authority`**: Must be `axiomid.app`.
- **`publicKey` / `signature`**: Cryptographic identity proofs.

## Extensions

### ABOM (Agent Bill of Materials)
Supply chain transparency for models, datasets, and tools.
- **`constituents`**: List of dependencies with integrity hashes and licenses.
- **`risk_level`**: Assessed security risk.

### Economics
Monetization and settlement configurations.
- **`pricing`**: Models (pay-per-call, subscription).
- **`pi_smart_contract`**: Integration with Pi Network for settlements.

### MCP (Model Context Protocol)
Integration with MCP servers for tool usage and knowledge retrieval.

## Validation
All AIX manifests must validate against the canonical schema at `schemas/aix.schema.json`.
Use the `aix-validate` CLI tool to verify compliance.
