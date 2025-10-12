# AIX File Format Specification v1.0

**Title:** AIX (Artificial Intelligence eXchange) File Format Specification  
**Version:** 1.0  
**Status:** Stable  
**Date:** January 2025  
**Author:** Mohamed H Abdelaziz  
**Organization:** AMRIKYY AI Solutions  
**Contact:** amrikyy@gmail.com  
**Academic Email:** abdela1@students.kennesaw.edu

---

**Copyright © 2025 Mohamed H Abdelaziz / AMRIKYY AI Solutions**  
Licensed under MIT with Attribution Requirements. See [LICENSE.md](../LICENSE.md)

---

## Abstract

This document specifies the AIX (Artificial Intelligence eXchange) file format, a standardized structure for packaging, distributing, and deploying AI agents. The format encompasses agent metadata, personality configuration, capabilities, tool integrations, memory systems, and security features in a single, portable file that can be represented in YAML, JSON, or TOML formats.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Conformance](#2-conformance)
3. [File Structure](#3-file-structure)
4. [Syntax Formats](#4-syntax-formats)
5. [Section Specifications](#5-section-specifications)
6. [Security Model](#6-security-model)
7. [Validation Rules](#7-validation-rules)
8. [Extension Mechanisms](#8-extension-mechanisms)
9. [Conformance Levels](#9-conformance-levels)
10. [References](#10-references)

---

## 1. Introduction

### 1.1 Purpose

The AIX format provides a standardized way to define, package, and distribute AI agents. It solves the problem of agent portability by creating a single file format that encapsulates all necessary information for agent deployment and execution.

### 1.2 Goals

- **Portability**: Agents can move between platforms and frameworks
- **Security**: Built-in integrity verification and capability restrictions
- **Interoperability**: Standard format enables ecosystem development
- **Extensibility**: Future-proof design allows for evolution
- **Human Readability**: Multiple format support for developer convenience

### 1.3 Terminology

**MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

**Key Terms:**
- **AIX File**: A file conforming to this specification
- **Agent**: An AI entity defined by an AIX file
- **Parser**: Software that reads and validates AIX files
- **Runtime**: Platform that executes agents defined in AIX files

---

## 2. Conformance

### 2.1 Conformance Classes

This specification defines three conformance classes:

1. **Minimal Conformance**: Supports required sections only (meta, persona, security)
2. **Standard Conformance**: Supports all sections except custom extensions
3. **Full Conformance**: Supports all sections including extensions

### 2.2 File Extension

AIX files **MUST** use the `.aix` file extension. The MIME type **SHOULD** be `application/x-aix` or `application/aix+yaml` for YAML format, `application/aix+json` for JSON format, and `application/aix+toml` for TOML format.

---

## 3. File Structure

### 3.1 Overview

An AIX file consists of seven top-level sections:

```
┌─────────────────────────────────┐
│ meta        (Required)          │  Agent metadata and identification
├─────────────────────────────────┤
│ persona     (Required)          │  Personality and behavior definition
├─────────────────────────────────┤
│ skills      (Optional)          │  Capabilities and actions
├─────────────────────────────────┤
│ apis        (Optional)          │  API integrations
├─────────────────────────────────┤
│ mcp         (Optional)          │  Model Context Protocol servers
├─────────────────────────────────┤
│ memory      (Optional)          │  Memory configuration
├─────────────────────────────────┤
│ security    (Required)          │  Security and integrity data
└─────────────────────────────────┘
```

### 3.2 Section Requirements

| Section  | Required | Minimal | Standard | Full |
|----------|----------|---------|----------|------|
| meta     | Yes      | ✓       | ✓        | ✓    |
| persona  | Yes      | ✓       | ✓        | ✓    |
| skills   | No       | -       | ✓        | ✓    |
| apis     | No       | -       | ✓        | ✓    |
| mcp      | No       | -       | ✓        | ✓    |
| memory   | No       | -       | ✓        | ✓    |
| security | Yes      | ✓       | ✓        | ✓    |

---

## 4. Syntax Formats

### 4.1 Supported Formats

AIX files **MAY** be written in any of the following formats:

1. **YAML** (YAML Ain't Markup Language) - Version 1.2
2. **JSON** (JavaScript Object Notation) - RFC 8259
3. **TOML** (Tom's Obvious Minimal Language) - Version 1.0.0

### 4.2 Format Detection

Parsers **MUST** detect the format using the following logic:

1. **File Extension**: `.yaml`, `.yml` → YAML; `.json` → JSON; `.toml` → TOML
2. **Content Inspection**: 
   - Starts with `{` → JSON
   - Contains `=` in key-value pattern → TOML
   - Otherwise → YAML

### 4.3 Format Examples

**YAML:**
```yaml
meta:
  version: "1.0"
  name: "Example Agent"
```

**JSON:**
```json
{
  "meta": {
    "version": "1.0",
    "name": "Example Agent"
  }
}
```

**TOML:**
```toml
[meta]
version = "1.0"
name = "Example Agent"
```

---

## 5. Section Specifications

### 5.1 Meta Section

**Purpose**: Contains agent metadata and identification information.

**Required Fields:**

```yaml
meta:
  version: string          # AIX format version (semver), REQUIRED
  id: string              # UUID v4, REQUIRED
  name: string            # Agent name, REQUIRED
  created: string         # ISO 8601 timestamp, REQUIRED
  author: string          # Author name or identifier, REQUIRED
```

**Optional Fields:**

```yaml
  description: string     # Human-readable description
  updated: string        # ISO 8601 timestamp of last modification
  tags: array           # Classification tags
  license: string       # License identifier (SPDX format)
  homepage: string      # URL to agent homepage
  repository: string    # URL to source repository
  documentation: string # URL to documentation
  icon: string         # Base64-encoded icon or URL
  language: string     # Primary language (ISO 639-1)
  framework: string    # Target AI framework
  runtime_version: string  # Required runtime version (semver)
```

**Validation Rules:**

- `version` **MUST** follow Semantic Versioning (semver) format
- `id` **MUST** be a valid UUID v4 (RFC 4122)
- `created` and `updated` **MUST** be valid ISO 8601 timestamps
- `name` **MUST** be 1-100 characters
- `tags` **SHOULD** contain 1-10 tags, each 1-50 characters

**Example:**

```yaml
meta:
  version: "1.0"
  id: "550e8400-e29b-41d4-a716-446655440000"
  name: "Customer Service Bot"
  description: "AI agent for handling customer inquiries"
  created: "2025-01-12T10:30:00Z"
  updated: "2025-01-12T15:45:00Z"
  author: "Mohamed H Abdelaziz"
  tags: ["customer-service", "support", "chatbot"]
  license: "MIT"
  language: "en"
```

---

### 5.2 Persona Section

**Purpose**: Defines the agent's personality, behavior, and interaction style.

**Required Fields:**

```yaml
persona:
  role: string           # Agent's primary role, REQUIRED
  instructions: string   # Core behavioral instructions, REQUIRED
```

**Optional Fields:**

```yaml
  tone: string              # Communication style (e.g., "friendly", "formal")
  style: string             # Response style (e.g., "concise", "detailed")
  constraints: array        # Behavioral constraints or rules
  personality_traits: object # Key-value personality attributes
  example_responses: array  # Sample conversations
  context_window: integer   # Preferred context size
  temperature: float        # Sampling temperature (0.0-2.0)
  response_format: string   # Preferred output format
```

**Validation Rules:**

- `role` **MUST** be 1-200 characters
- `instructions` **MUST** be 1-10000 characters
- `temperature` **MUST** be between 0.0 and 2.0 if specified
- `context_window` **MUST** be a positive integer if specified

**Example:**

```yaml
persona:
  role: "empathetic customer service representative"
  tone: "friendly, professional, and patient"
  style: "clear and solution-oriented"
  instructions: |
    You are a customer service agent helping users resolve issues.
    Always remain calm, empathetic, and solution-focused.
    Gather necessary information before proposing solutions.
  constraints:
    - "Never make promises about refunds without verification"
    - "Always verify user identity for account changes"
    - "Escalate to human agent if user is frustrated"
  personality_traits:
    empathy: "high"
    patience: "high"
    assertiveness: "medium"
  temperature: 0.7
  context_window: 4096
```

---

### 5.3 Skills Section

**Purpose**: Defines the agent's capabilities and actions it can perform.

**Structure:**

```yaml
skills:
  - name: string           # Skill identifier, REQUIRED
    description: string    # What the skill does, REQUIRED
    enabled: boolean      # Whether skill is active, default: true
    parameters: object    # Skill-specific parameters
    triggers: array       # Conditions that activate the skill
    examples: array       # Usage examples
    priority: integer     # Execution priority (1-10)
    timeout: integer      # Max execution time (seconds)
```

**Validation Rules:**

- Each skill **MUST** have a unique `name`
- `name` **MUST** match pattern: `^[a-z0-9_]+$`
- `priority` **MUST** be between 1 and 10 if specified
- `timeout` **MUST** be a positive integer if specified

**Example:**

```yaml
skills:
  - name: "answer_questions"
    description: "Answer general knowledge questions"
    enabled: true
    parameters:
      max_sources: 3
      confidence_threshold: 0.8
    triggers:
      - "user asks a question"
      - "question mark in user input"
    priority: 5
    timeout: 30
    
  - name: "book_appointment"
    description: "Schedule appointments for users"
    enabled: true
    parameters:
      calendars: ["support", "sales"]
      business_hours: "9:00-17:00"
    triggers:
      - "keywords: schedule, book, appointment"
    priority: 8
    timeout: 60
    examples:
      - "User: I'd like to schedule a call"
      - "Agent: I can help you book an appointment..."
```

---

### 5.4 APIs Section

**Purpose**: Defines external API integrations the agent can use.

**Structure:**

```yaml
apis:
  - name: string           # API identifier, REQUIRED
    base_url: string      # API base URL, REQUIRED
    description: string   # API purpose
    version: string       # API version
    auth:
      type: string        # "bearer", "api_key", "oauth2", "basic"
      location: string    # "header", "query", "body"
      key_name: string    # Header/query parameter name
    endpoints: array      # Available endpoints
    rate_limit:
      requests: integer   # Max requests
      period: integer     # Time period (seconds)
    timeout: integer      # Request timeout (seconds)
    retry:
      max_attempts: integer
      backoff: string     # "exponential", "linear"
```

**Validation Rules:**

- Each API **MUST** have a unique `name`
- `base_url` **MUST** be a valid HTTP/HTTPS URL
- `auth.type` **MUST** be one of: bearer, api_key, oauth2, basic, none
- `auth.location` **MUST** be one of: header, query, body

**Example:**

```yaml
apis:
  - name: "weather_api"
    base_url: "https://api.weather.com/v1"
    description: "Fetch weather information"
    version: "1.0"
    auth:
      type: "api_key"
      location: "header"
      key_name: "X-API-Key"
    endpoints:
      - path: "/current"
        method: "GET"
        description: "Get current weather"
        parameters:
          - name: "location"
            type: "string"
            required: true
          - name: "units"
            type: "string"
            required: false
            default: "metric"
    rate_limit:
      requests: 100
      period: 60
    timeout: 10
    retry:
      max_attempts: 3
      backoff: "exponential"
```

---

### 5.5 MCP Section

**Purpose**: Defines Model Context Protocol server configurations.

**Structure:**

```yaml
mcp:
  servers:
    - name: string         # Server identifier, REQUIRED
      command: string     # Executable command, REQUIRED
      args: array        # Command arguments
      env: object        # Environment variables
      description: string
      capabilities: array  # Server capabilities
      timeout: integer    # Connection timeout (seconds)
      auto_start: boolean # Start automatically
```

**Validation Rules:**

- Each server **MUST** have a unique `name`
- `command` **MUST** be a valid executable path or command
- `capabilities` **SHOULD** list supported MCP operations

**Example:**

```yaml
mcp:
  servers:
    - name: "filesystem_server"
      command: "npx"
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
      description: "Provides file system access"
      capabilities:
        - "read_file"
        - "write_file"
        - "list_directory"
      timeout: 30
      auto_start: true
      env:
        MCP_DEBUG: "false"
        
    - name: "search_server"
      command: "mcp-server-search"
      args: ["--engine", "google"]
      description: "Web search capabilities"
      capabilities:
        - "search"
        - "get_page_content"
      timeout: 15
      auto_start: true
```

---

### 5.6 Memory Section

**Purpose**: Configures the agent's memory systems.

**Structure:**

```yaml
memory:
  episodic:              # Conversation history
    enabled: boolean
    max_messages: integer
    retention_days: integer
    storage: string      # "local", "cloud", "vector_db"
    
  semantic:              # Knowledge graphs
    enabled: boolean
    embedding_model: string
    vector_db: string
    similarity_threshold: float
    max_results: integer
    
  procedural:            # Workflows and processes
    enabled: boolean
    storage: string
    max_workflows: integer
    
  persistence:
    enabled: boolean
    backend: string      # "file", "database", "redis"
    config: object       # Backend-specific configuration
```

**Validation Rules:**

- `similarity_threshold` **MUST** be between 0.0 and 1.0 if specified
- `max_messages`, `max_results`, `max_workflows` **MUST** be positive integers if specified
- `retention_days` **MUST** be a positive integer if specified

**Example:**

```yaml
memory:
  episodic:
    enabled: true
    max_messages: 100
    retention_days: 30
    storage: "local"
    
  semantic:
    enabled: true
    embedding_model: "text-embedding-3-small"
    vector_db: "chromadb"
    similarity_threshold: 0.75
    max_results: 10
    
  procedural:
    enabled: true
    storage: "file"
    max_workflows: 50
    
  persistence:
    enabled: true
    backend: "file"
    config:
      directory: "./agent_memory"
      format: "json"
      compress: true
```

---

### 5.7 Security Section

**Purpose**: Contains security-related metadata including checksums, signatures, and capability restrictions.

**Required Fields:**

```yaml
security:
  checksum:
    algorithm: string    # Hash algorithm, REQUIRED
    value: string        # Hash value, REQUIRED
```

**Optional Fields:**

```yaml
  signature:
    algorithm: string         # Signature algorithm
    value: string            # Signature value
    public_key: string       # Public key (PEM format)
    signer: string           # Signer identifier
    timestamp: string        # ISO 8601 signing timestamp
    
  encryption:
    encrypted: boolean       # Whether content is encrypted
    algorithm: string        # Encryption algorithm
    key_fingerprint: string  # Public key fingerprint
    
  capabilities:
    allowed_operations: array    # Permitted operations
    restricted_domains: array    # Blocked domains
    max_api_calls_per_minute: integer
    max_memory_mb: integer
    sandbox: boolean            # Run in sandbox
    
  compliance:
    standards: array            # Compliance standards
    certifications: array       # Security certifications
    audit_log: boolean         # Enable audit logging
```

**Validation Rules:**

- `checksum.algorithm` **MUST** be one of: sha256, sha512, blake3
- `checksum.value` **MUST** be a valid hex-encoded hash
- `signature.algorithm` **MUST** be one of: RSA-SHA256, Ed25519, ECDSA-SHA256
- `signature.public_key` **MUST** be valid PEM-encoded public key if provided
- `encryption.algorithm` **SHOULD** be one of: AES-256-GCM, ChaCha20-Poly1305

**Example:**

```yaml
security:
  checksum:
    algorithm: "sha256"
    value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    scope: "content"
    
  signature:
    algorithm: "RSA-SHA256"
    value: "MEUCIQDx..."
    public_key: |
      -----BEGIN PUBLIC KEY-----
      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
      -----END PUBLIC KEY-----
    signer: "mohamed@amrikyy.ai"
    timestamp: "2025-01-12T10:30:00Z"
    
  capabilities:
    allowed_operations:
      - "read_files"
      - "call_apis"
      - "use_tools"
    restricted_domains:
      - "localhost"
      - "*.internal"
      - "192.168.*"
    max_api_calls_per_minute: 60
    max_memory_mb: 512
    sandbox: true
    
  compliance:
    standards: ["SOC2", "GDPR"]
    audit_log: true
```

---

## 6. Security Model

### 6.1 Integrity Verification

**Checksum Calculation:**

1. Remove the `security` section from the file
2. Normalize whitespace and line endings
3. Calculate hash using specified algorithm
4. Store hash in `security.checksum.value`

**Verification Process:**

1. Extract stored checksum from file
2. Remove `security` section
3. Recalculate hash
4. Compare with stored value

### 6.2 Digital Signatures

**Signing Process:**

1. Calculate checksum as above
2. Sign the checksum using private key
3. Store signature and public key in `security.signature`

**Verification Process:**

1. Extract signature and public key
2. Calculate checksum
3. Verify signature using public key
4. Confirm signer identity

### 6.3 Capability Restrictions

Runtimes **SHOULD** enforce capability restrictions defined in `security.capabilities`:

- `allowed_operations`: Whitelist of permitted actions
- `restricted_domains`: Blacklist of blocked domains/IPs
- `max_api_calls_per_minute`: Rate limiting
- `max_memory_mb`: Memory usage limit
- `sandbox`: Execute in isolated environment

### 6.4 Encryption Support

AIX files **MAY** encrypt sensitive sections:

- Use asymmetric encryption for key exchange
- Use symmetric encryption (AES-256-GCM) for content
- Store key fingerprint in `security.encryption`
- Encrypted fields end with `_encrypted` suffix

---

## 7. Validation Rules

### 7.1 Structural Validation

Parsers **MUST** validate:

1. **Format Syntax**: Valid YAML/JSON/TOML
2. **Required Sections**: `meta`, `persona`, `security` present
3. **Required Fields**: All required fields in each section
4. **Data Types**: Correct types for all fields
5. **Field Formats**: UUIDs, timestamps, URLs, etc.

### 7.2 Semantic Validation

Parsers **SHOULD** validate:

1. **Version Compatibility**: AIX version supported
2. **Reference Integrity**: API/skill references valid
3. **Logical Consistency**: No conflicting settings
4. **Security Requirements**: Checksum valid
5. **Resource Limits**: Values within reasonable bounds

### 7.3 Security Validation

Parsers **MUST** validate:

1. **Checksum Integrity**: Hash matches content
2. **Signature Verification**: Valid cryptographic signature (if present)
3. **Timestamp Validity**: Timestamps not in future
4. **Capability Consistency**: No contradictory permissions

### 7.4 Validation Reporting

Parsers **MUST** report:

- **Errors**: Violations preventing agent execution
- **Warnings**: Issues that should be addressed
- **Info**: Non-critical observations

Example error structure:

```json
{
  "valid": false,
  "errors": [
    {
      "code": "MISSING_REQUIRED_FIELD",
      "section": "meta",
      "field": "version",
      "message": "Required field 'version' is missing"
    }
  ],
  "warnings": [
    {
      "code": "DEPRECATED_FIELD",
      "section": "persona",
      "field": "legacy_mode",
      "message": "Field 'legacy_mode' is deprecated"
    }
  ]
}
```

---

## 8. Extension Mechanisms

### 8.1 Custom Fields

AIX files **MAY** include custom fields using the `x-` prefix:

```yaml
meta:
  version: "1.0"
  name: "My Agent"
  x-custom-field: "custom value"
  x-internal-id: 12345
```

Parsers **MUST** ignore unknown fields with `x-` prefix.  
Parsers **SHOULD** warn about unknown fields without `x-` prefix.

### 8.2 Custom Sections

Custom top-level sections **MUST** use the `x-` prefix:

```yaml
meta:
  version: "1.0"
  # ...

x-analytics:
  tracking_id: "UA-12345"
  events: ["conversation_start", "tool_use"]
```

### 8.3 Section Extensions

Sections **MAY** be extended with custom fields:

```yaml
persona:
  role: "assistant"
  instructions: "Help users"
  x-voice:
    provider: "elevenlabs"
    voice_id: "voice_123"
    speed: 1.0
```

---

## 9. Conformance Levels

### 9.1 Level 1: Minimal Conformance

**Requirements:**
- Parse YAML, JSON, or TOML
- Validate `meta`, `persona`, `security` sections
- Calculate and verify checksums
- Report validation errors

### 9.2 Level 2: Standard Conformance

**Requirements:**
- All Level 1 requirements
- Parse all standard sections
- Validate all standard fields
- Support format conversion
- Verify digital signatures

### 9.3 Level 3: Full Conformance

**Requirements:**
- All Level 2 requirements
- Handle custom extensions
- Support encryption/decryption
- Enforce capability restrictions
- Generate compliant AIX files

---

## 10. References

### 10.1 Normative References

- **[RFC 2119]** Key words for use in RFCs to Indicate Requirement Levels
- **[RFC 4122]** A Universally Unique IDentifier (UUID) URN Namespace
- **[RFC 8259]** The JavaScript Object Notation (JSON) Data Interchange Format
- **[ISO 8601]** Data elements and interchange formats – Information interchange
- **[SemVer]** Semantic Versioning 2.0.0
- **[YAML 1.2]** YAML Ain't Markup Language Version 1.2
- **[TOML 1.0]** Tom's Obvious Minimal Language Version 1.0.0

### 10.2 Informative References

- **[MCP]** Model Context Protocol Specification
- **[SPDX]** Software Package Data Exchange
- **[PEM]** Privacy Enhanced Mail (RFC 7468)
- **[JWT]** JSON Web Tokens (RFC 7519)
- **[OpenAPI]** OpenAPI Specification 3.1

---

## Appendix A: Complete Example

```yaml
# Complete AIX Agent Example
# Created by Mohamed H Abdelaziz - AMRIKYY AI Solutions 2025

meta:
  version: "1.0"
  id: "550e8400-e29b-41d4-a716-446655440000"
  name: "Complete Example Agent"
  description: "Demonstrates all AIX features"
  created: "2025-01-12T10:30:00Z"
  updated: "2025-01-12T15:45:00Z"
  author: "Mohamed H Abdelaziz"
  tags: ["example", "full-featured"]
  license: "MIT"
  language: "en"

persona:
  role: "versatile AI assistant"
  tone: "professional and helpful"
  instructions: |
    You are a capable AI assistant with access to multiple tools and APIs.
    Always prioritize user safety and privacy.
  temperature: 0.7

skills:
  - name: "web_search"
    description: "Search the web for information"
    enabled: true
    priority: 5

apis:
  - name: "example_api"
    base_url: "https://api.example.com"
    auth:
      type: "bearer"
      location: "header"
    rate_limit:
      requests: 100
      period: 60

mcp:
  servers:
    - name: "fs_server"
      command: "npx"
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
      auto_start: true

memory:
  episodic:
    enabled: true
    max_messages: 50
  semantic:
    enabled: true
    vector_db: "chromadb"

security:
  checksum:
    algorithm: "sha256"
    value: "abc123..."
  capabilities:
    allowed_operations: ["read_files", "call_apis"]
    sandbox: true
```

---

## Appendix B: JSON Schema

See [schemas/aix-v1.schema.json](../schemas/aix-v1.schema.json) for the complete JSON Schema definition.

---

## Appendix C: Change Log

### Version 1.0 (January 2025)

- Initial specification release
- Defined seven core sections
- Specified three format support (YAML/JSON/TOML)
- Defined security model
- Established conformance levels

---

**End of Specification**

For questions or clarifications, contact: amrikyy@gmail.com

**Copyright © 2025 Mohamed H Abdelaziz / AMRIKYY AI Solutions**

