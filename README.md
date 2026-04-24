<div align="center">

# 🤖 Sovereign Protocol — AIX Format

**The Artificial Intelligence eXchange (AIX) Standard File Format for Autonomous Agents**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-v2.0.0-brightgreen.svg?style=for-the-badge)](#)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-43853d.svg?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Status](https://img.shields.io/badge/status-active-success.svg?style=for-the-badge)](#)
[![Root Authority](https://img.shields.io/badge/Root_Authority-axiomid.app-blueviolet.svg?style=for-the-badge)](https://axiomid.app)

*Building the future of Cyber-Physical and Sovereign AI Agent portability.*

</div>

---

## 🌟 Overview

**AIX (Artificial Intelligence eXchange)** is a robust, structured, and cryptographically-verifiable file format for defining, packaging, and distributing AI Agents. Originally developed by **Mohamed H Abdelaziz / AMRIKYY AI Solutions** and now vastly upgraded for the **Sovereign Protocol**, AIX ensures your agents are secure, autonomous, and portable across platforms.

Whether you're building a conversational assistant, a Web3 autonomous entity, or a Vision-Language-Action (VLA) robotics model, AIX provides the essential DNA structure for your agent.

This repository is **actively maintained** and serves as the living standard for Sovereign Agent architectures.

---

## ✨ Key Features

### 🛡️ **Sovereign Identity Layer (AxiomID)**
Every AIX Enhanced message is governed by **axiomid.app** as the sole Root Authority for Agent DIDs (`did:axiom:axiomid.app:<id>`). Includes an `identity_layer` block with support for **Ed25519** and **secp256k1** cryptographic signatures, guaranteeing mathematical ownership of the agent identity.

### 🦾 **Vision-Language-Action (VLA) Alignment**
Built-in requirements for Cyber-Physical operations. Supports robotic and VLA runtimes seamlessly with dedicated generic configurations, including adapters for **openpi** and **π0.7**. The format is ready to bridge the gap between digital reasoning and physical action.

### 🔒 **Security & Sovereignty First**
- **SHA-256 Checksums**: Verify agent file integrity and manifestations.
- **Capability Restrictions**: Explicitly define what the agent is allowed to execute (sandboxing).
- **Manifest Integrity**: Validated digital signatures to trace origin authenticity.

### 🌐 **Multi-Format Support**
Represent your agent DNA using:
- **YAML**: Human-readable, easy for configuration.
- **JSON**: Universal, web and API standard.
- **TOML**: Flat, configuration-focused syntax.

### 🧠 **Advanced Memory & Skills**
Strict categorization of agent memory into:
- **Episodic** (experiences and chat history)
- **Semantic** (facts and vector embeddings)
- **Procedural** (actions and workflows)

---

## 🚀 Quick Start

### 1. Installation

Clone the repository and install the zero-dependency parser and CLI tools:

```bash
git clone https://github.com/Moeabdelaziz007/aix-format.git
cd aix-format

npm install
```

### 2. Validation & Tooling

Validate your `aix` definitions against the standard AIX schema or the Enhanced schema.

```bash
# Validate an agent definition (verifies checksums and structure)
node bin/aix-validate.js examples/enhanced-agent.aix --security --verbose

# Convert between formats (e.g., YAML to JSON)
node bin/aix-convert.js my-agent.yaml my-agent.json --format json
```

---

## 🏗️ Structure of an AIX Agent

An `aix` file defines everything an agent needs to exist and operate autonomously:

```yaml
# 1. Metadata
meta:
  version: "2.0.0"
  id: "550e8400-e29b-41d4-a716-446655440000"
  name: "SovereignAgent-X"

# 2. Identity (AxiomID)
identity_layer:
  id: "did:axiom:axiomid.app:12345"
  authority: "axiomid.app"
  issuedAt: "2026-04-24T00:00:00Z"
  publicKey:
    algorithm: "Ed25519"
    value: "<base64url-encoded>"

# 3. Persona & Skills
persona:
  role: "Data Analyst"
  instructions: "Provide highly accurate analysis without hallucination."

# 4. Cyber-Physical Requirements (VLA)
requirements:
  vla:
    adapter: "openpi"
    vision: {}
    action: {}

# 5. Security & Verification
security:
  checksum:
    algorithm: "sha256"
    value: "..."
```

---

## 📂 Project Architecture

```
aix-format/
├── schemas/
│   ├── aix-v1.schema.json         # Standard AIX v1.0 schema
│   ├── aix-enhanced.schema.json   # Enhanced schema (AxiomID, VLA, Pricing)
│   └── manifest.schema.json       # Manifest integrity schema
├── docs/
│   ├── AIX_SPEC.md                # Complete technical specification
│   ├── AIX_PARSER_DOC.md          # Guide for building custom parsers
│   ├── STATUS.md                  # Implementation health status
│   └── ROADMAP.md                 # Future milestones (Updated for 2026+)
├── core/
│   └── parser.js                  # Reference JS implementation
├── bin/
│   ├── aix-validate.js            # CLI: Validator tool
│   └── aix-convert.js             # CLI: Format conversion tool
├── tests/                         # Full test suite
└── examples/                      # Agent templates
```

---

## 🗺️ The Sovereign Roadmap

Our vision expands rapidly through 2026 and beyond. For a detailed breakdown, see [ROADMAP.md](docs/ROADMAP.md).

- **Q2 2026**: AxiomID Integration, VLA payloads, automated weekly audits (Current).
- **Q3 2026**: Multi-language SDKs (TypeScript, Python), decentralized storage plugins.
- **Q4 2026**: Streaming binary AIX encoding, Edge Wasm executors.
- **2027**: M-of-N Multi-sig Agents, fully autonomous DeFi logic, AIX Swarm schemas.

---

## 🤖 Sovereign Protocol Automation

This repository runs an automated **Weekly Health Check** using GitHub Actions to audit the `aix-enhanced` schema structure and ensure it meets modern Cyber-Physical and VLA architectural standards.

Status and roadmap changes are documented in `STATUS.md` and `ROADMAP.md`.

---

## 🤝 Contributing

We welcome early adopters to shape the future of Sovereign Agent formats!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/cyber-module`)
3. Commit your changes (`git commit -m 'feat: Add cyber module'`)
4. Push to the branch (`git push origin feature/cyber-module`)
5. Open a Pull Request

---

## 📄 License & Attribution

This project is licensed under the **MIT License with Attribution Requirements**.

**Copyright © 2026 Mohamed H Abdelaziz / AMRIKYY AI Solutions**

When using this specification, please include:
> *Based on the AIX Format Specification by Mohamed H Abdelaziz / AMRIKYY AI Solutions*
> [https://github.com/Moeabdelaziz007/aix-format](https://github.com/Moeabdelaziz007/aix-format)

---
<div align="center">
  <i>Maintained by the Autonomous Sovereign Protocol Guardian</i>
</div>
