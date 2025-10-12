/**
 * AIX Parser - Reference Implementation
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2025
 * 
 * Zero-dependency parser for AIX (Artificial Intelligence eXchange) files.
 * Supports YAML, JSON, and TOML formats with built-in validation.
 * 
 * Copyright © 2025 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under MIT License - See LICENSE.md
 */

import fs from 'fs';
import crypto from 'crypto';

/**
 * AIXParser - Main parser class for AIX files
 */
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
      const errorMsg = `Validation failed: ${this.errors.length} error(s) found`;
      const error = new Error(errorMsg);
      error.errors = this.errors;
      throw error;
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
   * Parse YAML content (simplified implementation)
   * Note: This is a basic YAML parser for demonstration.
   * For production, consider using a full YAML library.
   */
  parseYAML(content) {
    const result = {};
    const lines = content.split('\n');
    let currentPath = [];
    let currentObj = result;
    let multilineKey = null;
    let multilineContent = [];
    let inMultiline = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || line.trim() === '') continue;

      const indent = line.search(/\S/);
      if (indent === -1) continue;

      const trimmed = line.trim();

      // Handle multi-line string end
      if (inMultiline && indent <= currentPath[currentPath.length - 1]?.indent) {
        // Save multi-line content
        const parent = currentPath[currentPath.length - 1]?.obj || result;
        parent[multilineKey] = multilineContent.join('\n');
        inMultiline = false;
        multilineKey = null;
        multilineContent = [];
      }

      // Multi-line string content
      if (inMultiline) {
        multilineContent.push(trimmed);
        continue;
      }

      // Array item
      if (trimmed.startsWith('- ')) {
        const value = trimmed.substring(2).trim();
        
        // Find parent array
        while (currentPath.length > 0 && currentPath[currentPath.length - 1].indent >= indent) {
          currentPath.pop();
        }
        
        const parent = currentPath.length > 0 ? currentPath[currentPath.length - 1].obj : result;
        const lastKey = currentPath.length > 0 ? currentPath[currentPath.length - 1].key : null;
        
        if (lastKey && !Array.isArray(parent[lastKey])) {
          parent[lastKey] = [];
        }
        
        if (lastKey) {
          if (value.includes(':')) {
            // Object in array
            const obj = this.parseYAMLObject(value);
            parent[lastKey].push(obj);
          } else {
            parent[lastKey].push(this.parseYAMLValue(value));
          }
        }
        continue;
      }

      // Key-value pair
      if (trimmed.includes(':')) {
        const colonIndex = trimmed.indexOf(':');
        const key = trimmed.substring(0, colonIndex).trim();
        let value = trimmed.substring(colonIndex + 1).trim();

        // Adjust current object based on indentation
        while (currentPath.length > 0 && currentPath[currentPath.length - 1].indent >= indent) {
          currentPath.pop();
        }
        
        currentObj = currentPath.length > 0 ? currentPath[currentPath.length - 1].obj : result;

        if (value === '' || value === '|' || value === '>') {
          // New object or multi-line string
          if (value === '|' || value === '>') {
            multilineKey = key;
            multilineContent = [];
            inMultiline = true;
            currentObj[key] = '';
          } else {
            const newObj = {};
            currentObj[key] = newObj;
            currentPath.push({ indent, obj: newObj, key });
          }
        } else {
          currentObj[key] = this.parseYAMLValue(value);
        }
      }
    }

    // Handle remaining multi-line content
    if (inMultiline && multilineKey) {
      const parent = currentPath[currentPath.length - 1]?.obj || result;
      parent[multilineKey] = multilineContent.join('\n');
    }

    return result;
  }

  /**
   * Parse YAML value to appropriate JavaScript type
   */
  parseYAMLValue(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    if (value.startsWith('{') && value.endsWith('}')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }
    if (!isNaN(value) && value !== '') {
      return Number(value);
    }
    return value;
  }

  /**
   * Parse YAML object from string
   */
  parseYAMLObject(str) {
    const obj = {};
    const parts = str.split(',');
    for (const part of parts) {
      if (part.includes(':')) {
        const [key, value] = part.split(':').map(s => s.trim());
        obj[key] = this.parseYAMLValue(value);
      }
    }
    return obj;
  }

  /**
   * Parse TOML content (simplified implementation)
   */
  parseTOML(content) {
    const result = {};
    const lines = content.split('\n');
    let currentSection = result;
    let currentSectionName = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') continue;

      // Section header [section]
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSectionName = trimmed.slice(1, -1);
        currentSection = result[currentSectionName] = {};
        continue;
      }

      // Key-value pair
      if (trimmed.includes('=')) {
        const equalIndex = trimmed.indexOf('=');
        const key = trimmed.substring(0, equalIndex).trim();
        let value = trimmed.substring(equalIndex + 1).trim();

        // Parse value
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        } else if (value === 'true' || value === 'false') {
          value = value === 'true';
        } else if (!isNaN(value) && value !== '') {
          value = Number(value);
        } else if (value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value);
          } catch {
            // Keep as string
          }
        }

        currentSection[key] = value;
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

    // Validate each section
    if (data.meta) this.validateMeta(data.meta);
    if (data.persona) this.validatePersona(data.persona);
    if (data.security) this.validateSecurityStructure(data.security);
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
          message: `Skill '${skill.name || 'at index ' + i}' is missing 'description' field`
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
          message: `API '${api.name || 'at index ' + i}' is missing 'base_url' field`
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
          message: `Server '${server.name || 'at index ' + i}' is missing 'command' field`
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
      this.warnings.push({
        code: 'CHECKSUM_MISMATCH',
        section: 'security',
        message: `Checksum mismatch (expected: ${value.substring(0, 16)}..., got: ${calculated.substring(0, 16)}...)`
      });
    }
  }

  /**
   * Remove security section from content for checksum calculation
   */
  removeSecuritySection(content) {
    const lines = content.split('\n');
    const filtered = [];
    let inSecurity = false;
    let securityIndent = 0;

    for (const line of lines) {
      // Detect security section start
      if (line.trim().startsWith('security:')) {
        inSecurity = true;
        securityIndent = line.search(/\S/);
        continue;
      }
      
      // Check if we've reached another top-level section
      if (inSecurity) {
        const currentIndent = line.search(/\S/);
        if (currentIndent !== -1 && currentIndent <= securityIndent && line.trim() !== '') {
          inSecurity = false;
        }
      }

      if (!inSecurity) {
        filtered.push(line);
      }
    }

    return filtered.join('\n').trim();
  }

  /**
   * Calculate checksum
   */
  calculateChecksum(content, algorithm = 'sha256') {
    const normalized = content.trim().replace(/\r\n/g, '\n');
    return crypto.createHash(algorithm).update(normalized, 'utf8').digest('hex');
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
    if (!regex.test(timestamp)) return false;
    
    // Validate actual date
    try {
      const date = new Date(timestamp);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
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

    const { allowed_operations } = this.security.capabilities;

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

