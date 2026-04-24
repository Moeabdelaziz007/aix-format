# Sovereign Protocol — Strategic Roadmap

**Root Authority:** [axiomid.app](https://axiomid.app)
**Current version:** 2.0.0

---

## 🎯 Phase 1: Core Foundation (Q2 2026) — *Current*

The current phase establishes the **Sovereign AIX Format** as the canonical standard for decentralized agent identities and cyber-physical alignments.

- [x] **AxiomID Integration**: Full support for `did:axiom` DIDs governed by `axiomid.app`.
- [x] **Cryptographic Signatures**: Integrated `Ed25519` and `secp256k1` support within the Identity Layer.
- [x] **Vision-Language-Action (VLA)**: Embedded generic `vla` capabilities to prepare the agent standard for robotics and physical runtimes (e.g., `openpi`, `π0.7`).
- [x] **Automated Weekly Health Checks**: Ensuring protocol validity and structural integrity via GitHub Actions.

---

## 🏗️ Phase 2: Tooling & SDKs (Q3 2026)

This phase focuses on empowering developers to build, validate, and parse Sovereign AIX files natively across multiple languages.

- [ ] **TypeScript SDK (`@sovereign/aix`)**
  - Native Builder API for constructing AIX messages programmatically.
  - Built-in verifier integrated with the `axiomid.app` resolver.
- [ ] **Python SDK (`sovereign-aix`)**
  - PyPI package designed for data scientists and ML engineers.
  - Seamless integration with HuggingFace, OpenAI, and LangChain environments.
- [ ] **Decentralized Storage Connectors**
  - Plugins to automatically serialize and persist AIX manifests to IPFS and Arweave.

---

## 🌍 Phase 3: Cyber-Physical & VLA Expansion (Q4 2026)

Bringing AIX into the physical world by providing native and strict schema support for robotic adapters.

- [ ] **Official VLA Adapter Profiles**
  - Published sub-schemas strictly mapping the data structures for `openpi` and `π0.7`.
- [ ] **Streaming AIX Format**
  - Designing a binary encoding profile (like CBOR or MessagePack) to allow continuous, low-latency streaming of VLA sensor and action data.
- [ ] **Edge Execution Environments**
  - WebAssembly (Wasm) runtime validators for executing AIX rules directly on edge devices and robotics controllers.

---

## 🪐 Phase 4: Sovereign Economy & Multi-Agent Swarms (2027)

Transitioning the format from single-agent definitions to complex, economically-independent swarms.

- [ ] **Multi-Signature AxiomID (M-of-N)**
  - Allowing AIX payloads and actions to require consensus from multiple agents or human overseers.
- [ ] **On-Chain Agent Wallets & DeFi Modules**
  - Upgrading the pricing sections to support smart-contract native execution (e.g., automated Solana escrow creation based on the AIX schema).
- [ ] **Swarm Definition Schemas**
  - Introducing `aix-swarm.schema.json` to define relationships, hierarchies, and communication protocols between multiple Sovereign AIX agents.

---

*This roadmap is a living document, actively maintained by the Sovereign Protocol Guardian.*
