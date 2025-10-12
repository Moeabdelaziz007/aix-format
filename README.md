# AIX Format Specification

> **A**rtificial **I**ntelligence e**X**change - The Standard File Format for AI Agents

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/amrikyy/aix-format)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

---

**Author:** Mohamed H Abdelaziz  
**Organization:** AMRIKYY AI Solutions  
**Contact:** amrikyy@gmail.com  
**Academic Email:** abdela1@students.kennesaw.edu  
**Copyright © 2025** Mohamed H Abdelaziz / AMRIKYY AI Solutions

---

## 📖 Overview

**AIX (Artificial Intelligence eXchange)** is a comprehensive, standardized file format designed for packaging, distributing, and executing AI agents. It provides a unified structure that encompasses agent personality, capabilities, tool integrations, memory configurations, and security features—all in a single, portable file.

### Why AIX?

- **🔒 Security First**: Built-in checksums, digital signatures, and encryption support
- **🔄 Interoperable**: Works across different AI frameworks and platforms
- **📦 Self-Contained**: Everything needed to deploy an agent in one file
- **🎯 Human & Machine Readable**: Supports YAML, JSON, and TOML formats
- **🚀 Extensible**: Custom fields and future-proof design
- **✅ Validated**: Schema-based validation ensures correctness

---

## ✨ Key Features

### 1. **Comprehensive Agent Definition**
Define your AI agent's personality, skills, and behavior in a structured format:
- Persona configuration (tone, style, constraints)
- Skills and capabilities
- API integrations
- MCP (Model Context Protocol) server configurations
- Memory management (episodic, semantic, procedural)

### 2. **Multi-Format Support**
Write AIX files in your preferred format:
- **YAML**: Human-friendly, easy to read and write
- **JSON**: Universal compatibility
- **TOML**: Configuration-focused syntax

### 3. **Security by Design**
- **SHA-256 Checksums**: Verify file integrity
- **Digital Signatures**: RSA/Ed25519 signature support
- **Encryption Metadata**: Track encryption status
- **Capability Restrictions**: Define allowed operations

### 4. **Tool Integration**
- Native API integration definitions
- MCP server configurations
- Authentication and rate limiting
- Custom tool parameters

### 5. **Memory Systems**
- Episodic memory (conversation history)
- Semantic memory (knowledge graphs)
- Procedural memory (workflows)
- Vector database support

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/amrikyy/aix-format.git
cd aix-format

# Install dependencies
npm install

# Run tests
npm test
```

### Basic Usage

#### 1. Create an AIX File

Create a file named `my-agent.aix` (YAML format):

```yaml
# My First AIX Agent
meta:
  version: "1.0"
  id: "550e8400-e29b-41d4-a716-446655440000"
  name: "My Assistant"
  created: "2025-01-12T10:30:00Z"
  author: "Your Name"

persona:
  role: "helpful assistant"
  tone: "friendly and professional"
  instructions: "Help users with their questions clearly and concisely."

skills:
  - name: "general_knowledge"
    description: "Answer general knowledge questions"
    enabled: true

security:
  checksum:
    algorithm: "sha256"
    value: "abc123..."
```

#### 2. Validate the AIX File

```bash
# Using the CLI tool
node bin/aix-validate.js my-agent.aix

# Or programmatically
node -e "
const { AIXParser } = require('./core/parser.js');
const parser = new AIXParser();
const agent = parser.parseFile('my-agent.aix');
console.log('Valid!', agent.meta.name);
"
```

#### 3. Convert Between Formats

```bash
# Convert YAML to JSON
node bin/aix-convert.js my-agent.aix my-agent.json --format json

# Convert JSON to TOML
node bin/aix-convert.js my-agent.json my-agent.toml --format toml
```

---

## 📂 Project Structure

```
aix-format/
├── docs/                      # Documentation
│   ├── AIX_SPEC.md           # Complete technical specification
│   └── AIX_PARSER_DOC.md     # Parser implementation guide
├── core/                      # Core implementation
│   └── parser.js             # Reference parser (zero dependencies)
├── examples/                  # Example AIX files
│   ├── persona-agent.aix     # Conversational agent example
│   ├── tool-agent.aix        # API integration example
│   └── hybrid-agent.aix      # Full-featured research assistant
├── schemas/                   # Validation schemas
│   └── aix-v1.schema.json    # JSON Schema for AIX v1.0
├── bin/                       # CLI tools
│   ├── aix-validate.js       # Validation utility
│   └── aix-convert.js        # Format conversion utility
├── tests/                     # Test suite
│   └── parser.test.js        # Parser tests
├── COPYRIGHT.md               # Copyright notice
├── LICENSE.md                 # MIT License with attribution
├── README.md                  # This file
└── package.json              # NPM package configuration
```

---

## 🛠️ CLI Tools

### aix-validate

Validate AIX files for correctness:

```bash
node bin/aix-validate.js <file.aix>

# Options:
#   --schema    Use JSON schema validation
#   --security  Verify checksums and signatures
#   --verbose   Show detailed validation results
```

**Example:**
```bash
node bin/aix-validate.js examples/persona-agent.aix --security --verbose
```

### aix-convert

Convert AIX files between formats:

```bash
node bin/aix-convert.js <input> <output> --format <yaml|json|toml>

# The tool automatically:
#   - Detects input format
#   - Validates structure
#   - Recalculates checksums
#   - Preserves all data
```

**Example:**
```bash
node bin/aix-convert.js my-agent.yaml my-agent.json --format json
```

---

## 🔐 Security Features

### Checksum Verification

Every AIX file can include a SHA-256 checksum to verify integrity:

```yaml
security:
  checksum:
    algorithm: "sha256"
    value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    scope: "content"  # What's included in checksum
```

### Digital Signatures

Support for cryptographic signatures:

```yaml
security:
  signature:
    algorithm: "RSA-SHA256"
    value: "base64-encoded-signature"
    public_key: "-----BEGIN PUBLIC KEY-----\n..."
    signer: "author@example.com"
    timestamp: "2025-01-12T10:30:00Z"
```

### Capability Restrictions

Define what the agent is allowed to do:

```yaml
security:
  capabilities:
    allowed_operations:
      - "read_files"
      - "call_apis"
    restricted_domains:
      - "localhost"
      - "*.internal"
    max_api_calls_per_minute: 60
```

---

## 📚 Documentation

- **[AIX Specification](docs/AIX_SPEC.md)**: Complete technical specification
- **[Parser Documentation](docs/AIX_PARSER_DOC.md)**: Implementation guide
- **[Examples](examples/)**: Sample AIX files for different use cases

---

## 🧪 Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Generate documentation
npm run docs
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
node tests/parser.test.js
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Issues**: Found a bug? [Open an issue](https://github.com/amrikyy/aix-format/issues)
2. **Suggest Features**: Have an idea? Start a discussion
3. **Submit PRs**: Fork, create a branch, and submit a pull request
4. **Improve Docs**: Documentation improvements are always welcome

### Contribution Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Maintain attribution in file headers
- Sign commits with GPG (recommended)

---

## 📄 License

This project is licensed under the **MIT License with Attribution Requirements**.

Copyright (c) 2025 Mohamed H Abdelaziz / AMRIKYY AI Solutions

See [LICENSE.md](LICENSE.md) for full license text.  
See [COPYRIGHT.md](COPYRIGHT.md) for complete copyright notice.

### Attribution

When using this specification, please include:

```
Based on the AIX Format Specification by Mohamed H Abdelaziz / AMRIKYY AI Solutions
https://github.com/amrikyy/aix-format
```

---

## 📞 Support

### Contact

- **Email**: amrikyy@gmail.com
- **Academic Email**: abdela1@students.kennesaw.edu
- **Website**: https://amrikyy.ai
- **Issues**: https://github.com/amrikyy/aix-format/issues

### Community

- **Discussions**: https://github.com/amrikyy/aix-format/discussions
- **Wiki**: https://github.com/amrikyy/aix-format/wiki

---

## 🗺️ Roadmap

- [x] v1.0: Core specification and reference parser
- [ ] v1.1: Python reference implementation
- [ ] v1.2: Go reference implementation
- [ ] v1.3: Enhanced security features
- [ ] v2.0: Multi-agent coordination support

---

## 🙏 Acknowledgments

Special thanks to:
- The AI development community
- Contributors and early adopters
- Standards organizations (IETF, W3C, OpenAPI Initiative)

---

## 📜 Version History

- **v1.0.0** (January 2025): Initial release
  - Complete specification
  - Reference Node.js parser
  - CLI tools
  - Example agents
  - JSON Schema validation

---

**Built with ❤️ by Mohamed H Abdelaziz / AMRIKYY AI Solutions**

*Making AI agents portable, secure, and interoperable.*

