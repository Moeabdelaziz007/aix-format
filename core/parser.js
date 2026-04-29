/**
 * AIX Parser - Reference Implementation
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 * 
 * Zero-dependency parser for AIX (Artificial Intelligence eXchange) files.
 * Supports YAML, JSON, and TOML formats with built-in validation.
 * 
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under MIT License - See LICENSE.md
 */

import fs from 'fs';
import crypto from 'crypto';
import yaml from 'js-yaml';

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
   * Parse YAML content using js-yaml
   */
  parseYAML(content) {
    return yaml.load(content);
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
    const requiredSections = ['meta', 'persona', 'security', 'identity_layer'];
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
    if (data.requirements) this.validateRequirements(data.requirements);
    if (data.pricing) this.validatePricing(data.pricing);
    if (data.identity_layer) this.validateIdentityLayer(data.identity_layer);
    if (data.pi_network) this.validatePiNetwork(data.pi_network);
    if (data.economics) this.validateEconomics(data.economics);
    if (data.abom) this.validateABOM(data.abom);
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

    // Validate ID format
    if (meta.id && !this.isValidID(meta.id)) {
      this.errors.push({
        code: 'INVALID_ID',
        section: 'meta',
        field: 'id',
        message: 'Invalid ID format'
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

    // Validate lineage if present
    if (meta.lineage) {
      if (!Array.isArray(meta.lineage)) {
        this.errors.push({
          code: 'INVALID_TYPE',
          section: 'meta',
          field: 'lineage',
          message: 'Lineage must be an array'
        });
      } else {
        meta.lineage.forEach((entry, index) => {
          if (!entry.parent_id) {
            this.errors.push({
              code: 'MISSING_FIELD',
              section: 'meta.lineage',
              index,
              field: 'parent_id',
              message: `Lineage entry at index ${index} is missing 'parent_id'`
            });
          }
        });
      }
    }
  }

  /**
   * Validate identity layer section
   */
  validateIdentityLayer(identity_layer) {
    const required = ['id', 'authority', 'issuedAt'];
    for (const field of required) {
      if (!identity_layer[field]) {
        this.errors.push({
          code: 'MISSING_FIELD',
          section: 'identity_layer',
          field,
          message: `Required field 'identity_layer.${field}' is missing`
        });
      }
    }

    if (identity_layer.id) {
      if (!this.isValidID(identity_layer.id)) {
        this.errors.push({
          code: 'INVALID_ID',
          section: 'identity_layer',
          field: 'id',
          message: 'Invalid ID format'
        });
      }

      // Cross-validate authority
      if (identity_layer.authority) {
        if (identity_layer.id.startsWith('did:axiom:')) {
          if (identity_layer.authority !== 'axiomid.app') {
            this.errors.push({
              code: 'INVALID_AUTHORITY',
              section: 'identity_layer',
              field: 'authority',
              message: "Authority must be 'axiomid.app' for did:axiom"
            });
          }
        } else if (identity_layer.id.startsWith('did:web:')) {
          const domain = identity_layer.id.split(':')[2];
          if (identity_layer.authority !== domain) {
            this.warnings.push({
              code: 'AUTHORITY_MISMATCH',
              section: 'identity_layer',
              field: 'authority',
              message: `Authority '${identity_layer.authority}' does not match did:web domain '${domain}'`
            });
          }
        }
      }
    }

    if (identity_layer.issuedAt && !this.isValidISO8601(identity_layer.issuedAt)) {
      this.errors.push({
        code: 'INVALID_TIMESTAMP',
        section: 'identity_layer',
        field: 'issuedAt',
        message: 'Invalid ISO 8601 timestamp'
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
    const validMemoryTypes = ['episodic', 'semantic', 'procedural'];
    for (const key of Object.keys(memory)) {
      if (!validMemoryTypes.includes(key)) {
        this.errors.push({
          code: 'INVALID_MEMORY_TYPE',
          section: 'memory',
          field: key,
          message: `Memory type must be one of: ${validMemoryTypes.join(', ')}`
        });
      }
    }

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
   * Validate requirements section
   */
    validateRequirements(requirements) {
    if (requirements.hardware) {
      const hw = requirements.hardware;
      if (hw.cpu_cores !== undefined && (!Number.isInteger(hw.cpu_cores) || hw.cpu_cores < 1)) {
        this.errors.push({
          code: 'INVALID_VALUE',
          section: 'requirements.hardware',
          field: 'cpu_cores',
          message: 'CPU cores must be a positive integer'
        });
      }
      
      if (hw.memory_mb !== undefined && (!Number.isInteger(hw.memory_mb) || hw.memory_mb < 1)) {
        this.errors.push({
          code: 'INVALID_VALUE',
          section: 'requirements.hardware',
          field: 'memory_mb',
          message: 'Memory MB must be a positive integer'
        });
      }
    }

    if (requirements.vla) {
      if (!requirements.vla.adapter) {
        this.errors.push({
          code: 'MISSING_FIELD',
          section: 'requirements.vla',
          field: 'adapter',
          message: "Cyber-physical agent requires a VLA adapter in requirements.vla"
        });
      } else {
        const allowedAdapters = ['openpi', 'π0.7', 'generic'];
        if (!allowedAdapters.includes(requirements.vla.adapter)) {
          this.errors.push({
            code: 'INVALID_VALUE',
            section: 'requirements.vla',
            field: 'adapter',
            message: "VLA adapter must be one of: " + allowedAdapters.join(', ')
          });
        }
      }
    }
  }



  /**
   * Validate pricing section
   */
  validatePricing(pricing) {
    const validModels = ['pay_per_call', 'subscription', 'freemium', 'tiered'];
    const validCurrencies = ['USD', 'EUR', 'BTC', 'ETH', 'PI'];
    
    if (pricing.currency && !validCurrencies.includes(pricing.currency)) {
      this.warnings.push({
        code: 'UNKNOWN_CURRENCY',
        section: 'pricing',
        field: 'currency',
        message: `Currency '${pricing.currency}' is not in the standard list: ${validCurrencies.join(', ')}`
      });
    }

    if (pricing.model && !validModels.includes(pricing.model)) {
      this.errors.push({
        code: 'INVALID_VALUE',
        section: 'pricing',
        field: 'model',
        message: `Pricing model must be one of: ${validModels.join(', ')}`
      });
    }
    
    if (pricing.cost_per_call) {
      const cost = pricing.cost_per_call;
      if (cost.amount !== undefined && (typeof cost.amount !== 'number' || cost.amount < 0)) {
        this.errors.push({
          code: 'INVALID_VALUE',
          section: 'pricing.cost_per_call',
          field: 'amount',
          message: 'Cost amount must be a non-negative number'
        });
      }
    }
    
    if (pricing.subscription) {
      const sub = pricing.subscription;
      if (sub.monthly_fee && sub.monthly_fee.amount !== undefined && 
          (typeof sub.monthly_fee.amount !== 'number' || sub.monthly_fee.amount < 0)) {
        this.errors.push({
          code: 'INVALID_VALUE',
          section: 'pricing.subscription.monthly_fee',
          field: 'amount',
          message: 'Monthly fee amount must be a non-negative number'
        });
      }
      
      if (sub.included_calls !== undefined && (!Number.isInteger(sub.included_calls) || sub.included_calls < 0)) {
        this.errors.push({
          code: 'INVALID_VALUE',
          section: 'pricing.subscription',
          field: 'included_calls',
          message: 'Included calls must be a non-negative integer'
        });
      }
    }
  }


  /**
   * Validate Pi Network section
   */
  validatePiNetwork(pi) {
    const required = ['app_id', 'environment'];
    for (const field of required) {
      if (!pi[field]) {
        this.errors.push({
          code: 'MISSING_FIELD',
          section: 'pi_network',
          field,
          message: `Required field 'pi_network.${field}' is missing`
        });
      }
    }

    if (pi.environment && !['sandbox', 'production'].includes(pi.environment)) {
      this.errors.push({
        code: 'INVALID_VALUE',
        section: 'pi_network',
        field: 'environment',
        message: 'Pi environment must be sandbox or production'
      });
    }

    if (pi.sdk_version && !this.isValidSemver(pi.sdk_version)) {
      this.errors.push({
        code: 'INVALID_VERSION',
        section: 'pi_network',
        field: 'sdk_version',
        message: 'Invalid Pi SDK version format'
      });
    }
  }

  /**
   * Validate economics section (v1.2)
   */
  validateEconomics(economics) {
    if (economics.pricing) {
      this.validatePricing(economics.pricing);
    }

    if (economics.pi_smart_contract) {
      const psc = economics.pi_smart_contract;
      if (!psc.address) {
        this.errors.push({
          code: 'MISSING_FIELD',
          section: 'economics.pi_smart_contract',
          field: 'address',
          message: "Pi smart contract requires an 'address'"
        });
      }
      if (psc.network && !['pi-mainnet', 'pi-testnet'].includes(psc.network)) {
        this.errors.push({
          code: 'INVALID_VALUE',
          section: 'economics.pi_smart_contract',
          field: 'network',
          message: "Network must be 'pi-mainnet' or 'pi-testnet'"
        });
      }
    }
  }

  /**
   * Validate ABOM section (v1.2)
   */
  validateABOM(abom) {
    if (abom.constituents) {
      if (!Array.isArray(abom.constituents)) {
        this.errors.push({
          code: 'INVALID_TYPE',
          section: 'abom',
          field: 'constituents',
          message: 'Constituents must be an array'
        });
      } else {
        abom.constituents.forEach((item, index) => {
          if (!item.name || !item.version) {
            this.errors.push({
              code: 'MISSING_FIELD',
              section: 'abom.constituents',
              index,
              message: "Constituent must have 'name' and 'version'"
            });
          }
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

    const safeEqual = this.timingSafeEqualHex(calculated, value);
    if (!safeEqual) {
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
      const trimmed = line.trim();
      // Detect security section start
      if (trimmed.startsWith('security:')) {
        inSecurity = true;
        securityIndent = line.search(/\S/);
        continue;
      }
      
      // Check if we've reached another top-level section
      if (inSecurity) {
        const currentIndent = line.search(/\S/);
        if (currentIndent !== -1 && currentIndent <= securityIndent && trimmed !== '') {
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



  timingSafeEqualHex(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
    } catch {
      return false;
    }
  }

  /**
   * Validation helpers
   */
  isValidID(id) {
    const axiomRegex = /^did:axiom:axiomid\.app:[a-zA-Z0-9._\-]+$/i;
    const webRegex = /^did:web:[a-zA-Z0-9.\-]+(:[a-zA-Z0-9.\-]+)*$/i;
    return axiomRegex.test(id) || webRegex.test(id);
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
  get requirements() { return this.data.requirements; }
  get pricing() { return this.data.pricing; }
  get security() { return this.data.security; }
  get identity_layer() { return this.data.identity_layer; }
  get kyc_proof() { return this.data.kyc_proof; }
  get pi_network() { return this.data.pi_network; }
  get economics() { return this.data.economics; }
  get abom() { return this.data.abom; }
  get lineage() { return this.data.meta?.lineage || []; }

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

    if (this.requirements && this.requirements.vla) {
      capabilities.push('vla');
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

  /**
   * Validate Live Voice settings
   */
  validateLiveVoice(voice) {
    if (!voice.provider) {
      this.errors.push({
        code: 'MISSING_FIELD',
        section: 'live_voice',
        field: 'provider',
        message: "live_voice requires a provider."
      });
    } else {
      const allowedProviders = ['openai-realtime', 'hume', 'elevenlabs', 'generic'];
      if (!allowedProviders.includes(voice.provider)) {
        this.errors.push({
          code: 'INVALID_VALUE',
          section: 'live_voice',
          field: 'provider',
          message: "live_voice provider must be one of: " + allowedProviders.join(', ')
        });
      }
    }
  }

}