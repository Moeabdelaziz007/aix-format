# AIX Parser Implementation Guide

**Document Version:** 1.0  
**Created by:** Mohamed H Abdelaziz  
**Organization:** AMRIKYY AI Solutions - 2025  
**Contact:** amrikyy@gmail.com  
**Academic Email:** abdela1@students.kennesaw.edu

---

**Copyright © 2025 Mohamed H Abdelaziz / AMRIKYY AI Solutions**  
Licensed under MIT with Attribution Requirements. See [LICENSE.md](../LICENSE.md)

---

## Table of Contents

1. [Parser Architecture](#1-parser-architecture)
2. [Node.js Implementation](#2-nodejs-implementation)
3. [Python Implementation](#3-python-implementation)
4. [Format Detection Logic](#4-format-detection-logic)
5. [Validation Rules Implementation](#5-validation-rules-implementation)
6. [Security Verification](#6-security-verification)
7. [Error Handling Patterns](#7-error-handling-patterns)
8. [Performance Considerations](#8-performance-considerations)
9. [Testing Guidelines](#9-testing-guidelines)
10. [CLI Tool Implementation](#10-cli-tool-implementation)

---

## 1. Parser Architecture

### 1.1 High-Level Architecture

The AIX parser follows a layered architecture:

```
┌─────────────────────────────────────┐
│   CLI Tools (aix-validate, etc.)   │
├─────────────────────────────────────┤
│         AIXAgent Class              │  ← High-level API
├─────────────────────────────────────┤
│         AIXParser Class             │  ← Core parser
├─────────────────────────────────────┤
│  Format Detectors (YAML/JSON/TOML) │  ← Format handlers
├─────────────────────────────────────┤
│      Validation Engine              │  ← Structural validation
├─────────────────────────────────────┤
│      Security Verifier              │  ← Checksum/signature
└─────────────────────────────────────┘
```

### 1.2 Core Components

**AIXParser Class:**
- Responsible for parsing AIX files
- Detects format automatically
- Delegates to format-specific parsers
- Coordinates validation

**AIXAgent Class:**
- Represents a parsed agent
- Provides high-level access to agent properties
- Implements capability checking
- Handles authorization logic

**Validator:**
- Structural validation (required fields, types)
- Semantic validation (references, consistency)
- Security validation (checksums, signatures)

**Format Handlers:**
- YAML parser (zero dependencies)
- JSON parser (native JSON.parse)
- TOML parser (zero dependencies)

### 1.3 Design Principles

1. **Zero Dependencies**: Core parser must work without external packages
2. **Format Agnostic**: All formats treated equally
3. **Fail Fast**: Validation errors reported immediately
4. **Secure by Default**: Security checks always performed
5. **Extensible**: Easy to add custom validation rules

---

## 2. Node.js Implementation

### 2.1 Project Setup

```bash
# Create project structure
mkdir -p aix-format/{core,bin,examples,schemas,tests,docs}

# Initialize package.json
npm init -y

# Configure ES6 modules
# Add to package.json: "type": "module"
```

### 2.2 AIXParser Class Implementation

```javascript
/**
 * AIX Parser - Reference Implementation
 * Created by Mohamed H Abdelaziz - AMRIKYY AI Solutions 2025
 * 
 * Zero-dependency parser for AIX (Artificial Intelligence eXchange) files.
 * Supports YAML, JSON, and TOML formats with built-in validation.
 */

import fs from 'fs';
import crypto from 'crypto';

export class AIXParser {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Parse an AIX file from disk
   * @param {string} filePath - Path to AIX file
   * @returns {AIXAgent} Parsed agent object
   */
  parseFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return this.parse(content, filePath);
  }

  /**
   * Parse AIX content from string
   * @param {string} content - AIX file content
   * @param {string} filePath - Optional file path for error reporting
   * @returns {AIXAgent} Parsed agent object
   */
  parse(content, filePath = '<string>') {
    this.errors = [];
    this.warnings = [];

    // Detect format
    const format = this.detectFormat(content, filePath);
    
    // Parse based on format
    let data;
    try {
      switch (format) {
        case 'json':
          data = this.parseJSON(content);
          break;
        case 'yaml':
          data = this.parseYAML(content);
          break;
        case 'toml':
          data = this.parseTOML(content);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      this.errors.push({
        code: 'PARSE_ERROR',
        message: `Failed to parse ${format.toUpperCase()}: ${error.message}`,
        file: filePath
      });
      throw new Error(`Parse failed: ${error.message}`);
    }

    // Validate structure
    this.validateStructure(data);

    // Validate security
    this.validateSecurity(data, content);

    // Throw if errors found
    if (this.errors.length > 0) {
      throw new Error(`Validation failed: ${this.errors.length} error(s) found`);
    }

    // Create agent object
    return new AIXAgent(data, this.warnings);
  }

  /**
   * Detect file format from content
   * @param {string} content - File content
   * @param {string} filePath - File path
   * @returns {string} Format: 'yaml', 'json', or 'toml'
   */
  detectFormat(content, filePath) {
    // Check file extension first
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) return 'yaml';
    if (filePath.endsWith('.toml')) return 'toml';
    if (filePath.endsWith('.aix')) {
      // Inspect content for .aix files
      const trimmed = content.trim();
      if (trimmed.startsWith('{')) return 'json';
      if (trimmed.startsWith('[')) return 'toml';
      if (/^\w+\s*=/.test(trimmed)) return 'toml';
      return 'yaml'; // Default for .aix
    }

    // Content-based detection
    const trimmed = content.trim();
    if (trimmed.startsWith('{')) return 'json';
    if (/^\[\w+\]/.test(trimmed)) return 'toml';
    if (/^\w+\s*=/.test(trimmed)) return 'toml';
    
    return 'yaml'; // Default fallback
  }

  /**
   * Parse JSON content
   */
  parseJSON(content) {
    return JSON.parse(content);
  }

  /**
   * Parse YAML content (simple implementation)
   * Note: This is a basic YAML parser. For production, consider using a library.
   */
  parseYAML(content) {
    const result = {};
    const lines = content.split('\n');
    let currentSection = result;
    let currentKey = null;
    let indentStack = [{ level: -1, obj: result }];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || line.trim() === '') continue;

      const indent = line.search(/\S/);
      const trimmed = line.trim();

      // Handle key-value pairs
      if (trimmed.includes(':')) {
        const colonIndex = trimmed.indexOf(':');
        const key = trimmed.substring(0, colonIndex).trim();
        let value = trimmed.substring(colonIndex + 1).trim();

        // Find correct parent based on indentation
        while (indentStack.length > 0 && indentStack[indentStack.length - 1].level >= indent) {
          indentStack.pop();
        }
        currentSection = indentStack[indentStack.length - 1].obj;

        if (value === '') {
          // New object
          const newObj = {};
          currentSection[key] = newObj;
          indentStack.push({ level: indent, obj: newObj });
        } else if (value.startsWith('[') && value.endsWith(']')) {
          // Inline array
          currentSection[key] = JSON.parse(value);
        } else if (value === 'true' || value === 'false') {
          currentSection[key] = value === 'true';
        } else if (!isNaN(value) && value !== '') {
          currentSection[key] = Number(value);
        } else if (value.startsWith('"') && value.endsWith('"')) {
          currentSection[key] = value.slice(1, -1);
        } else if (value === '|' || value === '>') {
          // Multi-line string follows
          currentKey = key;
          currentSection[key] = '';
        } else {
          currentSection[key] = value;
        }
      } else if (trimmed.startsWith('- ')) {
        // Array item
        const value = trimmed.substring(2);
        const parentKey = Object.keys(currentSection).pop();
        
        if (!Array.isArray(currentSection[parentKey])) {
          currentSection[parentKey] = [];
        }
        
        if (value.includes(':')) {
          // Object in array
          const obj = {};
          const parts = value.split(':');
          obj[parts[0].trim()] = parts[1].trim();
          currentSection[parentKey].push(obj);
        } else {
          currentSection[parentKey].push(value);
        }
      } else if (currentKey && indent > 0) {
        // Continuation of multi-line string
        currentSection[currentKey] += '\n' + trimmed;
      }
    }

    return result;
  }

  /**
   * Parse TOML content (simple implementation)
   */
  parseTOML(content) {
    const result = {};
    const lines = content.split('\n');
    let currentSection = result;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') continue;

      // Section header
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const section = trimmed.slice(1, -1);
        currentSection = result[section] = {};
        continue;
      }

      // Key-value pair
      if (trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        let value = valueParts.join('=').trim();

        // Parse value
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value === 'true' || value === 'false') {
          value = value === 'true';
        } else if (!isNaN(value)) {
          value = Number(value);
        } else if (value.startsWith('[') && value.endsWith(']')) {
          value = JSON.parse(value);
        }

        currentSection[key.trim()] = value;
      }
    }

    return result;
  }

  /**
   * Validate AIX structure
   */
  validateStructure(data) {
    // Required sections
    const requiredSections = ['meta', 'persona', 'security'];
    for (const section of requiredSections) {
      if (!data[section]) {
        this.errors.push({
          code: 'MISSING_SECTION',
          section,
          message: `Required section '${section}' is missing`
        });
      }
    }

    // Validate meta section
    if (data.meta) {
      this.validateMeta(data.meta);
    }

    // Validate persona section
    if (data.persona) {
      this.validatePersona(data.persona);
    }

    // Validate security section
    if (data.security) {
      this.validateSecurityStructure(data.security);
    }

    // Validate optional sections
    if (data.skills) this.validateSkills(data.skills);
    if (data.apis) this.validateAPIs(data.apis);
    if (data.mcp) this.validateMCP(data.mcp);
    if (data.memory) this.validateMemory(data.memory);
  }

  /**
   * Validate meta section
   */
  validateMeta(meta) {
    const required = ['version', 'id', 'name', 'created', 'author'];
    for (const field of required) {
      if (!meta[field]) {
        this.errors.push({
          code: 'MISSING_FIELD',
          section: 'meta',
          field,
          message: `Required field 'meta.${field}' is missing`
        });
      }
    }

    // Validate UUID format
    if (meta.id && !this.isValidUUID(meta.id)) {
      this.errors.push({
        code: 'INVALID_UUID',
        section: 'meta',
        field: 'id',
        message: 'Invalid UUID format'
      });
    }

    // Validate ISO 8601 timestamp
    if (meta.created && !this.isValidISO8601(meta.created)) {
      this.errors.push({
        code: 'INVALID_TIMESTAMP',
        section: 'meta',
        field: 'created',
        message: 'Invalid ISO 8601 timestamp'
      });
    }

    // Validate semver
    if (meta.version && !this.isValidSemver(meta.version)) {
      this.errors.push({
        code: 'INVALID_VERSION',
        section: 'meta',
        field: 'version',
        message: 'Invalid semantic version format'
      });
    }
  }

  /**
   * Validate persona section
   */
  validatePersona(persona) {
    const required = ['role', 'instructions'];
    for (const field of required) {
      if (!persona[field]) {
        this.errors.push({
          code: 'MISSING_FIELD',
          section: 'persona',
          field,
          message: `Required field 'persona.${field}' is missing`
        });
      }
    }

    // Validate temperature range
    if (persona.temperature !== undefined) {
      if (persona.temperature < 0 || persona.temperature > 2) {
        this.errors.push({
          code: 'INVALID_RANGE',
          section: 'persona',
          field: 'temperature',
          message: 'Temperature must be between 0.0 and 2.0'
        });
      }
    }
  }

  /**
   * Validate security section structure
   */
  validateSecurityStructure(security) {
    if (!security.checksum) {
      this.errors.push({
        code: 'MISSING_FIELD',
        section: 'security',
        field: 'checksum',
        message: 'Required field security.checksum is missing'
      });
      return;
    }

    if (!security.checksum.algorithm) {
      this.errors.push({
        code: 'MISSING_FIELD',
        section: 'security.checksum',
        field: 'algorithm',
        message: 'Required field security.checksum.algorithm is missing'
      });
    }

    if (!security.checksum.value) {
      this.errors.push({
        code: 'MISSING_FIELD',
        section: 'security.checksum',
        field: 'value',
        message: 'Required field security.checksum.value is missing'
      });
    }

    // Validate algorithm
    const validAlgorithms = ['sha256', 'sha512', 'blake3'];
    if (security.checksum.algorithm && !validAlgorithms.includes(security.checksum.algorithm)) {
      this.errors.push({
        code: 'INVALID_ALGORITHM',
        section: 'security.checksum',
        field: 'algorithm',
        message: `Algorithm must be one of: ${validAlgorithms.join(', ')}`
      });
    }
  }

  /**
   * Validate skills section
   */
  validateSkills(skills) {
    if (!Array.isArray(skills)) {
      this.errors.push({
        code: 'INVALID_TYPE',
        section: 'skills',
        message: 'Skills must be an array'
      });
      return;
    }

    const names = new Set();
    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      
      if (!skill.name) {
        this.errors.push({
          code: 'MISSING_FIELD',
          section: 'skills',
          index: i,
          field: 'name',
          message: `Skill at index ${i} is missing 'name' field`
        });
      }

      // Check for duplicate names
      if (skill.name) {
        if (names.has(skill.name)) {
          this.errors.push({
            code: 'DUPLICATE_NAME',
            section: 'skills',
            field: 'name',
            message: `Duplicate skill name: ${skill.name}`
          });
        }
        names.add(skill.name);
      }

      if (!skill.description) {
        this.errors.push({
          code: 'MISSING_FIELD',
          section: 'skills',
          index: i,
          field: 'description',
          message: `Skill '${skill.name}' is missing 'description' field`
        });
      }
    }
  }

  /**
   * Validate APIs section
   */
  validateAPIs(apis) {
    if (!Array.isArray(apis)) {
      this.errors.push({
        code: 'INVALID_TYPE',
        section: 'apis',
        message: 'APIs must be an array'
      });
      return;
    }

    for (let i = 0; i < apis.length; i++) {
      const api = apis[i];
      
      if (!api.name) {
        this.errors.push({
          code: 'MISSING_FIELD',
          section: 'apis',
          index: i,
          field: 'name',
          message: `API at index ${i} is missing 'name' field`
        });
      }

      if (!api.base_url) {
        this.errors.push({
          code: 'MISSING_FIELD',
          section: 'apis',
          index: i,
          field: 'base_url',
          message: `API '${api.name}' is missing 'base_url' field`
        });
      } else if (!this.isValidURL(api.base_url)) {
        this.errors.push({
          code: 'INVALID_URL',
          section: 'apis',
          index: i,
          field: 'base_url',
          message: `API '${api.name}' has invalid URL`
        });
      }
    }
  }

  /**
   * Validate MCP section
   */
  validateMCP(mcp) {
    if (!mcp.servers || !Array.isArray(mcp.servers)) {
      this.errors.push({
        code: 'INVALID_TYPE',
        section: 'mcp',
        message: 'MCP servers must be an array'
      });
      return;
    }

    for (let i = 0; i < mcp.servers.length; i++) {
      const server = mcp.servers[i];
      
      if (!server.name) {
        this.errors.push({
          code: 'MISSING_FIELD',
          section: 'mcp.servers',
          index: i,
          field: 'name',
          message: `Server at index ${i} is missing 'name' field`
        });
      }

      if (!server.command) {
        this.errors.push({
          code: 'MISSING_FIELD',
          section: 'mcp.servers',
          index: i,
          field: 'command',
          message: `Server '${server.name}' is missing 'command' field`
        });
      }
    }
  }

  /**
   * Validate memory section
   */
  validateMemory(memory) {
    if (memory.semantic && memory.semantic.similarity_threshold !== undefined) {
      const threshold = memory.semantic.similarity_threshold;
      if (threshold < 0 || threshold > 1) {
        this.errors.push({
          code: 'INVALID_RANGE',
          section: 'memory.semantic',
          field: 'similarity_threshold',
          message: 'Similarity threshold must be between 0.0 and 1.0'
        });
      }
    }
  }

  /**
   * Validate security (checksums and signatures)
   */
  validateSecurity(data, content) {
    if (!data.security || !data.security.checksum) {
      return; // Already reported in structure validation
    }

    const { algorithm, value } = data.security.checksum;

    // Calculate checksum on content without security section
    const contentWithoutSecurity = this.removeSecuritySection(content);
    const calculated = this.calculateChecksum(contentWithoutSecurity, algorithm);

    if (calculated !== value) {
      this.errors.push({
        code: 'CHECKSUM_MISMATCH',
        section: 'security',
        message: `Checksum mismatch: expected ${value}, got ${calculated}`
      });
    }
  }

  /**
   * Remove security section from content for checksum calculation
   */
  removeSecuritySection(content) {
    // Simple approach: remove lines between "security:" and next top-level section
    const lines = content.split('\n');
    const filtered = [];
    let inSecurity = false;

    for (const line of lines) {
      if (line.trim().startsWith('security:')) {
        inSecurity = true;
        continue;
      }
      
      // Check if we've reached another top-level section
      if (inSecurity && line.match(/^[a-z_]+:/)) {
        inSecurity = false;
      }

      if (!inSecurity) {
        filtered.push(line);
      }
    }

    return filtered.join('\n');
  }

  /**
   * Calculate checksum
   */
  calculateChecksum(content, algorithm = 'sha256') {
    const normalized = content.trim().replace(/\r\n/g, '\n');
    return crypto.createHash(algorithm).update(normalized).digest('hex');
  }

  /**
   * Validation helpers
   */
  isValidUUID(uuid) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  }

  isValidISO8601(timestamp) {
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return regex.test(timestamp);
  }

  isValidSemver(version) {
    const regex = /^\d+\.\d+(\.\d+)?(-[a-z0-9.]+)?(\+[a-z0-9.]+)?$/i;
    return regex.test(version);
  }

  isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * AIXAgent - Represents a parsed AIX agent
 */
export class AIXAgent {
  constructor(data, warnings = []) {
    this.data = data;
    this.warnings = warnings;
  }

  get meta() { return this.data.meta; }
  get persona() { return this.data.persona; }
  get skills() { return this.data.skills || []; }
  get apis() { return this.data.apis || []; }
  get mcp() { return this.data.mcp; }
  get memory() { return this.data.memory; }
  get security() { return this.data.security; }

  /**
   * Get agent capabilities
   */
  getCapabilities() {
    const capabilities = [];

    if (this.skills.length > 0) {
      capabilities.push(...this.skills.filter(s => s.enabled !== false).map(s => s.name));
    }

    if (this.apis.length > 0) {
      capabilities.push('api_integration');
    }

    if (this.mcp) {
      capabilities.push('mcp_servers');
    }

    if (this.memory) {
      if (this.memory.episodic?.enabled) capabilities.push('episodic_memory');
      if (this.memory.semantic?.enabled) capabilities.push('semantic_memory');
      if (this.memory.procedural?.enabled) capabilities.push('procedural_memory');
    }

    return capabilities;
  }

  /**
   * Check if operation is authorized
   */
  isAuthorized(operation) {
    if (!this.security.capabilities) {
      return true; // No restrictions
    }

    const { allowed_operations, restricted_domains } = this.security.capabilities;

    if (allowed_operations && !allowed_operations.includes(operation)) {
      return false;
    }

    return true;
  }

  /**
   * Get agent summary
   */
  toString() {
    return `AIX Agent: ${this.meta.name} (${this.meta.id})`;
  }
}
```

### 2.3 Dependencies

The reference implementation uses only Node.js built-in modules:
- `fs` - File system operations
- `crypto` - Checksum calculation
- No external dependencies required

### 2.4 Usage Example

```javascript
import { AIXParser } from './core/parser.js';

const parser = new AIXParser();

try {
  const agent = parser.parseFile('examples/persona-agent.aix');
  
  console.log(`Loaded agent: ${agent.meta.name}`);
  console.log(`Capabilities: ${agent.getCapabilities().join(', ')}`);
  
  if (agent.warnings.length > 0) {
    console.warn(`Warnings: ${agent.warnings.length}`);
  }
} catch (error) {
  console.error('Parse failed:', error.message);
  console.error('Errors:', parser.errors);
}
```

---

## 3. Python Implementation

### 3.1 Project Structure

```python
aix_format/
├── __init__.py
├── parser.py
├── validator.py
├── security.py
└── cli.py
```

### 3.2 Basic Python Parser

```python
"""
AIX Parser - Python Reference Implementation
Created by Mohamed H Abdelaziz - AMRIKYY AI Solutions 2025

Zero-dependency parser for AIX files.
"""

import json
import hashlib
import re
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path


class AIXParser:
    """Parser for AIX (Artificial Intelligence eXchange) files."""
    
    def __init__(self):
        self.errors: List[Dict] = []
        self.warnings: List[Dict] = []
    
    def parse_file(self, file_path: str) -> 'AIXAgent':
        """Parse an AIX file from disk."""
        content = Path(file_path).read_text(encoding='utf-8')
        return self.parse(content, file_path)
    
    def parse(self, content: str, file_path: str = '<string>') -> 'AIXAgent':
        """Parse AIX content from string."""
        self.errors = []
        self.warnings = []
        
        # Detect format
        format_type = self.detect_format(content, file_path)
        
        # Parse based on format
        try:
            if format_type == 'json':
                data = json.loads(content)
            elif format_type == 'yaml':
                data = self.parse_yaml(content)
            elif format_type == 'toml':
                data = self.parse_toml(content)
            else:
                raise ValueError(f"Unsupported format: {format_type}")
        except Exception as e:
            self.errors.append({
                'code': 'PARSE_ERROR',
                'message': f'Failed to parse {format_type.upper()}: {str(e)}',
                'file': file_path
            })
            raise
        
        # Validate
        self.validate_structure(data)
        self.validate_security(data, content)
        
        if self.errors:
            raise ValueError(f"Validation failed: {len(self.errors)} error(s)")
        
        return AIXAgent(data, self.warnings)
    
    def detect_format(self, content: str, file_path: str) -> str:
        """Detect file format."""
        if file_path.endswith('.json'):
            return 'json'
        if file_path.endswith(('.yaml', '.yml')):
            return 'yaml'
        if file_path.endswith('.toml'):
            return 'toml'
        
        # Content-based detection
        trimmed = content.strip()
        if trimmed.startswith('{'):
            return 'json'
        if re.match(r'^\[\w+\]', trimmed):
            return 'toml'
        if re.match(r'^\w+\s*=', trimmed):
            return 'toml'
        
        return 'yaml'
    
    def parse_yaml(self, content: str) -> Dict:
        """Simple YAML parser."""
        try:
            import yaml
            return yaml.safe_load(content)
        except ImportError:
            # Fallback to basic parsing
            return self._basic_yaml_parse(content)
    
    def _basic_yaml_parse(self, content: str) -> Dict:
        """Basic YAML parsing without dependencies."""
        # Simplified implementation
        result = {}
        # ... (similar to Node.js implementation)
        return result
    
    def validate_structure(self, data: Dict) -> None:
        """Validate AIX structure."""
        required_sections = ['meta', 'persona', 'security']
        for section in required_sections:
            if section not in data:
                self.errors.append({
                    'code': 'MISSING_SECTION',
                    'section': section,
                    'message': f"Required section '{section}' is missing"
                })
    
    def validate_security(self, data: Dict, content: str) -> None:
        """Validate checksums and signatures."""
        if 'security' not in data or 'checksum' not in data['security']:
            return
        
        checksum_data = data['security']['checksum']
        algorithm = checksum_data.get('algorithm', 'sha256')
        expected = checksum_data.get('value', '')
        
        # Calculate checksum
        content_without_security = self.remove_security_section(content)
        calculated = self.calculate_checksum(content_without_security, algorithm)
        
        if calculated != expected:
            self.errors.append({
                'code': 'CHECKSUM_MISMATCH',
                'section': 'security',
                'message': f'Checksum mismatch: expected {expected}, got {calculated}'
            })
    
    def remove_security_section(self, content: str) -> str:
        """Remove security section for checksum calculation."""
        lines = content.split('\n')
        filtered = []
        in_security = False
        
        for line in lines:
            if line.strip().startswith('security:'):
                in_security = True
                continue
            
            if in_security and re.match(r'^[a-z_]+:', line):
                in_security = False
            
            if not in_security:
                filtered.append(line)
        
        return '\n'.join(filtered)
    
    def calculate_checksum(self, content: str, algorithm: str = 'sha256') -> str:
        """Calculate checksum."""
        normalized = content.strip().replace('\r\n', '\n')
        hasher = hashlib.new(algorithm)
        hasher.update(normalized.encode('utf-8'))
        return hasher.hexdigest()


class AIXAgent:
    """Represents a parsed AIX agent."""
    
    def __init__(self, data: Dict, warnings: List = None):
        self.data = data
        self.warnings = warnings or []
    
    @property
    def meta(self) -> Dict:
        return self.data.get('meta', {})
    
    @property
    def persona(self) -> Dict:
        return self.data.get('persona', {})
    
    @property
    def skills(self) -> List:
        return self.data.get('skills', [])
    
    def get_capabilities(self) -> List[str]:
        """Get agent capabilities."""
        capabilities = []
        
        if self.skills:
            capabilities.extend(s['name'] for s in self.skills if s.get('enabled', True))
        
        if self.data.get('apis'):
            capabilities.append('api_integration')
        
        if self.data.get('mcp'):
            capabilities.append('mcp_servers')
        
        return capabilities
    
    def __str__(self) -> str:
        return f"AIX Agent: {self.meta.get('name')} ({self.meta.get('id')})"
```

---

## 4. Format Detection Logic

### 4.1 Detection Strategy

Format detection follows a two-phase approach:

**Phase 1: File Extension**
```
.json  → JSON
.yaml  → YAML
.yml   → YAML
.toml  → TOML
.aix   → Content inspection required
```

**Phase 2: Content Inspection**

```javascript
function detectFormat(content) {
  const trimmed = content.trim();
  
  // JSON: starts with { or [
  if (trimmed[0] === '{' || trimmed[0] === '[') {
    return 'json';
  }
  
  // TOML: has section headers [section] or key = value
  if (/^\[\w+\]/.test(trimmed) || /^\w+\s*=/.test(trimmed)) {
    return 'toml';
  }
  
  // Default to YAML
  return 'yaml';
}
```

### 4.2 Format-Specific Quirks

**YAML:**
- Indentation-sensitive
- Supports comments with `#`
- Multi-line strings with `|` or `>`
- Arrays with `-` prefix

**JSON:**
- Strict syntax
- No comments allowed
- Quoted strings only
- Trailing commas forbidden

**TOML:**
- Section-based with `[section]`
- Comments with `#`
- Arrays with `[]`
- Supports nested tables

---

## 5. Validation Rules Implementation

### 5.1 Validation Layers

```
Layer 1: Syntax Validation
  ↓ (Format-specific parser)
Layer 2: Structural Validation
  ↓ (Required sections and fields)
Layer 3: Type Validation
  ↓ (Data types, formats, ranges)
Layer 4: Semantic Validation
  ↓ (References, consistency)
Layer 5: Security Validation
  ↓ (Checksums, signatures)
```

### 5.2 Validation Error Codes

| Code | Description | Severity |
|------|-------------|----------|
| PARSE_ERROR | Syntax error in format | Error |
| MISSING_SECTION | Required section absent | Error |
| MISSING_FIELD | Required field absent | Error |
| INVALID_TYPE | Wrong data type | Error |
| INVALID_FORMAT | Invalid format (UUID, URL, etc.) | Error |
| INVALID_RANGE | Value out of range | Error |
| CHECKSUM_MISMATCH | Integrity check failed | Error |
| SIGNATURE_INVALID | Signature verification failed | Error |
| DEPRECATED_FIELD | Field is deprecated | Warning |
| UNKNOWN_FIELD | Unrecognized field | Warning |

### 5.3 Custom Validation Rules

Implement custom validators:

```javascript
class CustomValidator {
  validate(agent) {
    const errors = [];
    
    // Custom rule: Check for profanity in persona
    if (this.containsProfanity(agent.persona.instructions)) {
      errors.push({
        code: 'PROFANITY_DETECTED',
        section: 'persona',
        message: 'Persona instructions contain inappropriate language'
      });
    }
    
    // Custom rule: Ensure at least one skill
    if (agent.skills.length === 0) {
      errors.push({
        code: 'NO_SKILLS',
        section: 'skills',
        message: 'Agent should have at least one skill'
      });
    }
    
    return errors;
  }
}
```

---

## 6. Security Verification

### 6.1 Checksum Calculation

**Algorithm:**

1. Remove `security` section from content
2. Normalize line endings (CRLF → LF)
3. Trim leading/trailing whitespace
4. Calculate hash using specified algorithm

**Implementation:**

```javascript
function calculateChecksum(content, algorithm = 'sha256') {
  // Remove security section
  const withoutSecurity = removeSecuritySection(content);
  
  // Normalize
  const normalized = withoutSecurity.trim().replace(/\r\n/g, '\n');
  
  // Calculate hash
  return crypto.createHash(algorithm).update(normalized).digest('hex');
}
```

### 6.2 Digital Signature Verification

**RSA-SHA256 Example:**

```javascript
import crypto from 'crypto';

function verifySignature(data, signature, publicKey) {
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(data);
  
  return verify.verify(publicKey, signature, 'base64');
}

// Usage
const checksum = calculateChecksum(content);
const signature = agent.security.signature.value;
const publicKey = agent.security.signature.public_key;

if (!verifySignature(checksum, signature, publicKey)) {
  throw new Error('Signature verification failed');
}
```

### 6.3 Capability Enforcement

```javascript
class SecurityEnforcer {
  constructor(agent) {
    this.capabilities = agent.security.capabilities || {};
  }
  
  canPerformOperation(operation) {
    const { allowed_operations } = this.capabilities;
    
    if (!allowed_operations) {
      return true; // No restrictions
    }
    
    return allowed_operations.includes(operation);
  }
  
  canAccessDomain(domain) {
    const { restricted_domains } = this.capabilities;
    
    if (!restricted_domains) {
      return true;
    }
    
    return !restricted_domains.some(pattern => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(domain);
    });
  }
  
  enforceRateLimit() {
    const { max_api_calls_per_minute } = this.capabilities;
    
    if (!max_api_calls_per_minute) {
      return true;
    }
    
    // Implement rate limiting logic
    // ...
  }
}
```

---

## 7. Error Handling Patterns

### 7.1 Error Types

**Parse Errors:**
```javascript
try {
  const data = JSON.parse(content);
} catch (error) {
  throw new ParseError(`Invalid JSON: ${error.message}`, {
    line: error.lineNumber,
    column: error.columnNumber
  });
}
```

**Validation Errors:**
```javascript
class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
  
  toJSON() {
    return {
      message: this.message,
      errors: this.errors
    };
  }
}
```

**Security Errors:**
```javascript
class SecurityError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'SecurityError';
    this.details = details;
  }
}
```

### 7.2 Error Recovery

```javascript
class ResilientParser extends AIXParser {
  parse(content, filePath) {
    try {
      return super.parse(content, filePath);
    } catch (error) {
      // Log error but continue with partial data
      console.error('Parse failed, attempting recovery:', error.message);
      
      // Return partial agent with warnings
      return this.createPartialAgent(content, error);
    }
  }
  
  createPartialAgent(content, error) {
    // Extract whatever we can
    const partialData = this.extractPartialData(content);
    
    return new AIXAgent(partialData, [{
      code: 'PARSE_FAILED',
      message: 'Partial agent created due to parse failure',
      original_error: error.message
    }]);
  }
}
```

---

## 8. Performance Considerations

### 8.1 Optimization Strategies

**Lazy Loading:**
```javascript
class OptimizedAIXAgent extends AIXAgent {
  constructor(data, warnings) {
    super(data, warnings);
    this._capabilities = null; // Cache
  }
  
  getCapabilities() {
    if (this._capabilities === null) {
      this._capabilities = super.getCapabilities();
    }
    return this._capabilities;
  }
}
```

**Streaming for Large Files:**
```javascript
import { createReadStream } from 'fs';

async function parseStreamingJSON(filePath) {
  const stream = createReadStream(filePath, { encoding: 'utf-8' });
  let buffer = '';
  
  for await (const chunk of stream) {
    buffer += chunk;
    // Process incrementally
  }
  
  return JSON.parse(buffer);
}
```

**Parallel Validation:**
```javascript
async function parallelValidate(agent) {
  const [structuralErrors, securityErrors, semanticErrors] = await Promise.all([
    validateStructure(agent),
    validateSecurity(agent),
    validateSemantics(agent)
  ]);
  
  return [...structuralErrors, ...securityErrors, ...semanticErrors];
}
```

### 8.2 Benchmarks

Target performance metrics:

| File Size | Parse Time | Validate Time |
|-----------|------------|---------------|
| < 10 KB   | < 5ms      | < 10ms        |
| 10-100 KB | < 50ms     | < 100ms       |
| 100KB-1MB | < 500ms    | < 1s          |

---

## 9. Testing Guidelines

### 9.1 Test Structure

```javascript
// tests/parser.test.js
import { describe, it, expect } from 'node:test';
import { AIXParser } from '../core/parser.js';

describe('AIXParser', () => {
  describe('format detection', () => {
    it('should detect JSON format', () => {
      const parser = new AIXParser();
      const content = '{ "meta": { "version": "1.0" } }';
      expect(parser.detectFormat(content, 'test.json')).toBe('json');
    });
    
    it('should detect YAML format', () => {
      const parser = new AIXParser();
      const content = 'meta:\n  version: "1.0"';
      expect(parser.detectFormat(content, 'test.yaml')).toBe('yaml');
    });
  });
  
  describe('validation', () => {
    it('should reject missing required sections', () => {
      const parser = new AIXParser();
      const content = '{ "meta": { "version": "1.0" } }';
      
      expect(() => parser.parse(content)).toThrow();
      expect(parser.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_SECTION',
          section: 'persona'
        })
      );
    });
  });
  
  describe('security', () => {
    it('should verify valid checksums', () => {
      // Test implementation
    });
    
    it('should reject invalid checksums', () => {
      // Test implementation
    });
  });
});
```

### 9.2 Test Coverage

Aim for:
- **Line Coverage**: > 90%
- **Branch Coverage**: > 85%
- **Function Coverage**: > 95%

### 9.3 Test Cases

**Positive Tests:**
- Valid YAML, JSON, TOML files
- All required sections present
- Valid checksums
- Optional sections

**Negative Tests:**
- Missing required sections
- Invalid UUIDs
- Malformed timestamps
- Checksum mismatches
- Invalid formats

**Edge Cases:**
- Empty files
- Very large files
- Unicode content
- Special characters
- Malformed syntax

---

## 10. CLI Tool Implementation

### 10.1 aix-validate Tool

```javascript
#!/usr/bin/env node
/**
 * AIX Validation Tool
 * Created by Mohamed H Abdelaziz - AMRIKYY AI Solutions 2025
 */

import { AIXParser } from '../core/parser.js';
import { readFileSync } from 'fs';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: aix-validate <file.aix> [--verbose] [--security]');
  process.exit(1);
}

const filePath = args[0];
const verbose = args.includes('--verbose');
const checkSecurity = args.includes('--security');

// Parse and validate
const parser = new AIXParser();

try {
  const agent = parser.parseFile(filePath);
  
  console.log('✅ Valid AIX file');
  console.log(`   Agent: ${agent.meta.name}`);
  console.log(`   Version: ${agent.meta.version}`);
  console.log(`   ID: ${agent.meta.id}`);
  
  if (verbose) {
    console.log(`   Capabilities: ${agent.getCapabilities().join(', ')}`);
  }
  
  if (agent.warnings.length > 0) {
    console.log(`\n⚠️  ${agent.warnings.length} warning(s):`);
    agent.warnings.forEach(w => {
      console.log(`   - ${w.message}`);
    });
  }
  
  process.exit(0);
} catch (error) {
  console.log('❌ Invalid AIX file');
  console.log(`   Error: ${error.message}`);
  
  if (parser.errors.length > 0) {
    console.log(`\n   ${parser.errors.length} error(s) found:`);
    parser.errors.forEach(e => {
      console.log(`   - [${e.code}] ${e.message}`);
      if (e.section) console.log(`     Section: ${e.section}`);
      if (e.field) console.log(`     Field: ${e.field}`);
    });
  }
  
  process.exit(1);
}
```

### 10.2 aix-convert Tool

```javascript
#!/usr/bin/env node
/**
 * AIX Format Conversion Tool
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2025
 */

import { AIXParser } from '../core/parser.js';
import { writeFileSync } from 'fs';

const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: aix-convert <input> <output> --format <yaml|json|toml>');
  process.exit(1);
}

const [inputPath, outputPath] = args;
const formatIndex = args.indexOf('--format');
const targetFormat = formatIndex !== -1 ? args[formatIndex + 1] : 'yaml';

// Parse input
const parser = new AIXParser();

try {
  const agent = parser.parseFile(inputPath);
  
  // Convert to target format
  let output;
  switch (targetFormat) {
    case 'json':
      output = JSON.stringify(agent.data, null, 2);
      break;
    case 'yaml':
      output = convertToYAML(agent.data);
      break;
    case 'toml':
      output = convertToTOML(agent.data);
      break;
    default:
      throw new Error(`Unsupported format: ${targetFormat}`);
  }
  
  // Recalculate checksum
  const contentWithoutSecurity = output.replace(/security:[\s\S]*$/, '');
  const newChecksum = parser.calculateChecksum(contentWithoutSecurity);
  
  // Update security section
  agent.data.security.checksum.value = newChecksum;
  
  // Regenerate output with new checksum
  switch (targetFormat) {
    case 'json':
      output = JSON.stringify(agent.data, null, 2);
      break;
    case 'yaml':
      output = convertToYAML(agent.data);
      break;
    case 'toml':
      output = convertToTOML(agent.data);
      break;
  }
  
  // Write output
  writeFileSync(outputPath, output, 'utf-8');
  
  console.log(`✅ Converted ${inputPath} to ${targetFormat}`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Checksum updated: ${newChecksum}`);
  
  process.exit(0);
} catch (error) {
  console.error(`❌ Conversion failed: ${error.message}`);
  process.exit(1);
}

function convertToYAML(data) {
  // Simple YAML serialization
  // For production, use a library like js-yaml
  return Object.entries(data).map(([key, value]) => {
    return `${key}:\n${serializeYAMLValue(value, 2)}`;
  }).join('\n');
}

function serializeYAMLValue(value, indent) {
  const spaces = ' '.repeat(indent);
  
  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).map(([k, v]) => {
      return `${spaces}${k}: ${JSON.stringify(v)}`;
    }).join('\n');
  }
  
  return spaces + JSON.stringify(value);
}

function convertToTOML(data) {
  // Simple TOML serialization
  return Object.entries(data).map(([section, value]) => {
    let result = `[${section}]\n`;
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      result += Object.entries(value).map(([k, v]) => {
        return `${k} = ${JSON.stringify(v)}`;
      }).join('\n');
    }
    
    return result;
  }).join('\n\n');
}
```

---

## Appendix A: Complete Parser API Reference

### AIXParser Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `parseFile(filePath)` | string | AIXAgent | Parse file from disk |
| `parse(content, filePath)` | string, string | AIXAgent | Parse from string |
| `detectFormat(content, filePath)` | string, string | string | Detect format type |
| `validateStructure(data)` | object | void | Validate structure |
| `validateSecurity(data, content)` | object, string | void | Verify checksums |
| `calculateChecksum(content, algorithm)` | string, string | string | Calculate hash |

### AIXAgent Properties

| Property | Type | Description |
|----------|------|-------------|
| `meta` | object | Agent metadata |
| `persona` | object | Personality config |
| `skills` | array | Capabilities |
| `apis` | array | API integrations |
| `mcp` | object | MCP servers |
| `memory` | object | Memory config |
| `security` | object | Security data |

### AIXAgent Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getCapabilities()` | string[] | List capabilities |
| `isAuthorized(operation)` | boolean | Check authorization |
| `toString()` | string | Human-readable name |

---

## Appendix B: Error Code Reference

See [Section 5.2](#52-validation-error-codes) for complete error code listing.

---

**End of Parser Documentation**

For technical support: amrikyy@gmail.com

**Copyright © 2025 Mohamed H Abdelaziz / AMRIKYY AI Solutions**

