/**
 * AIX Parser - Reference Implementation
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Zero-dependency parser for AIX (Artificial Intelligence eXchange) files.
 * Supports YAML, JSON, and TOML formats with built-in validation.
 *
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import fs from 'fs';
import crypto from 'crypto';
import yaml from 'js-yaml';

// Import plugin system
import { PluginRegistry } from './validation-plugins.js';
import {
  MetaValidator,
  PersonaValidator,
  SecurityValidator,
  SkillsValidator,
  APIsValidator,
  MCPValidator,
  MemoryValidator,
  ABOMValidator
} from './plugins/index.js';

// ─── AI-SBOM constituent field enumerations ───────────────────────────────────
const ABOM_VALID_TYPES        = ['model', 'dataset', 'library', 'tool', 'plugin', 'agent', 'runtime'];
const ABOM_VALID_TRUST_TIERS  = ['verified', 'community', 'unverified', 'revoked'];
const ABOM_VALID_SEC_STATUSES = ['clean', 'vulnerable', 'revoked', 'unknown'];
const ABOM_INTEGRITY_RE       = /^[a-zA-Z0-9-]+:[a-fA-F0-9]{32,}$/;   // alg:hexdigest
const ABOM_PURL_RE            = /^pkg:[a-zA-Z][a-zA-Z0-9+\-.]*\/.+/;   // pkg:type/...

// ─── Global Plugin Registry ───────────────────────────────────────────────────
// Create and configure the default plugin registry
const defaultRegistry = new PluginRegistry();

// Register core validation plugins
defaultRegistry.register(new MetaValidator());
defaultRegistry.register(new PersonaValidator());
defaultRegistry.register(new SecurityValidator());
defaultRegistry.register(new SkillsValidator());
defaultRegistry.register(new APIsValidator());
defaultRegistry.register(new MCPValidator());
defaultRegistry.register(new MemoryValidator());
defaultRegistry.register(new ABOMValidator());

/**
 * AIXParser - Main parser class for AIX files
 */
export class AIXParser {
  constructor(options = {}) {
    this.errors = [];
    this.warnings = [];
    // Allow custom plugin registry or use default
    this.registry = options.registry || defaultRegistry;
  }

  /**
   * Parse an AIX file from disk
   * @param {string} filePath - Path to AIX file
   * @returns {AIXAgent} Parsed agent object
   */
  async parseFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return await this.parse(content, filePath);
  }

  /**
   * Parse AIX content from string
   * @param {string} content - AIX file content
   * @param {string} filePath - Optional file path for error reporting
   * @returns {AIXAgent} Parsed agent object
   */
  async parse(content, filePath = '<string>') {
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
      throw this.createParseError('PARSE_ERROR', `Failed to parse ${format.toUpperCase()}: ${error.message}`, filePath, error);
    }

    // Validate structure (now async with plugin system)
    await this.validateStructure(data);

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
    return yaml.load(content, { schema: yaml.JSON_SCHEMA });
  }

  /**
   * Parse TOML content (simplified implementation)
   */
  parseTOML(content) {
    const out = {};
    let current = out;

    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      if (line.startsWith('[') && line.endsWith(']')) {
        const sectionPath = line.slice(1, -1).split('.').map((s) => s.trim()).filter(Boolean);
        current = out;
        for (const section of sectionPath) {
          if (!current[section] || typeof current[section] !== 'object' || Array.isArray(current[section])) {
            current[section] = {};
          }
          current = current[section];
        }
        continue;
      }

      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const rawValue = line.slice(eq + 1).trim();

      let parsedValue;
      if ((rawValue.startsWith('"') && rawValue.endsWith('"')) || (rawValue.startsWith("'") && rawValue.endsWith("'"))) {
        parsedValue = rawValue.slice(1, -1);
      } else if (rawValue === 'true' || rawValue === 'false') {
        parsedValue = rawValue === 'true';
      } else if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
        parsedValue = rawValue.slice(1, -1).split(',').map((item) => item.trim()).filter((v) => v.length > 0).map((item) => {
          if ((item.startsWith('"') && item.endsWith('"')) || (item.startsWith("'") && item.endsWith("'"))) return item.slice(1, -1);
          if (item === 'true' || item === 'false') return item === 'true';
          if (!Number.isNaN(Number(item))) return Number(item);
          return item;
        });
      } else if (!Number.isNaN(Number(rawValue))) {
        parsedValue = Number(rawValue);
      } else {
        parsedValue = rawValue;
      }

      current[key] = parsedValue;
    }

    return out;
  }


  createParseError(code, message, filePath, originalError) {
    const error = new Error(message);
    error.code = code;
    error.file = filePath;
    error.cause = originalError;
    return error;
  }

  /**
   * Validate AIX structure
   */
  async validateStructure(data) {
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

    // Run plugin-based validation
    const context = {
      errors: this.errors,
      warnings: this.warnings
    };
    
    await this.registry.runAll(data, context);

    // Validate sections not yet covered by plugins (for backward compatibility)
    // These will be migrated to plugins in future updates
    if (data.requirements) this.validateRequirements(data.requirements);
    if (data.pricing) this.validatePricing(data.pricing);
    if (data.identity_layer) this.validateIdentityLayer(data.identity_layer);
    if (data.pi_network) this.validatePiNetwork(data.pi_network);
    if (data.economics) this.validateEconomics(data.economics);
    if (data.black_box) this.validateBlackBox(data.black_box);
    if (data.build_provenance) this.validateBuildProvenance(data.build_provenance);
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

      if (hw.storage_mb !== undefined && (!Number.isInteger(hw.storage_mb) || hw.storage_mb < 1)) {
        this.errors.push({
          code: 'INVALID_VALUE',
          section: 'requirements.hardware',
          field: 'storage_mb',
          message: 'Storage MB must be a positive integer'
        });
      }

      if (hw.gpu_memory_mb !== undefined && (!Number.isInteger(hw.gpu_memory_mb) || hw.gpu_memory_mb < 1)) {
        this.errors.push({
          code: 'INVALID_VALUE',
          section: 'requirements.hardware',
          field: 'gpu_memory_mb',
          message: 'GPU memory MB must be a positive integer'
        });
      }
    }

    if (requirements.network) {
      const net = requirements.network;
      if (net.bandwidth_mbps !== undefined && (typeof net.bandwidth_mbps !== 'number' || net.bandwidth_mbps < 0)) {
        this.errors.push({
          code: 'INVALID_VALUE',
          section: 'requirements.network',
          field: 'bandwidth_mbps',
          message: 'Bandwidth must be a non-negative number'
        });
      }
    }

    if (requirements.vla) {
      const vla = requirements.vla;
      if (!vla.adapter) {
        this.errors.push({
          code: 'MISSING_FIELD',
          section: 'requirements.vla',
          field: 'adapter',
          message: `Required field 'requirements.vla.adapter' is missing`
        });
      } else {
        const allowedAdapters = ['openpi', 'π0.7', 'generic'];
        const validAdapters = allowedAdapters;
        if (!allowedAdapters.includes(requirements.vla.adapter)) {
          this.errors.push({
            code: 'INVALID_VALUE',
            section: 'requirements.vla',
            field: 'adapter',
            message: `Adapter must be one of: ${validAdapters.join(', ')}`
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
  validateEconomics(econ) {
    if (econ.pricing) this.validatePricing(econ.pricing);
    if (econ.pi_smart_contract) this.validatePiSmartContract(econ.pi_smart_contract);
    
    if (econ.wallets) this.validateWallets(econ.wallets);
    if (econ.payment_gateways) this.validatePaymentGateways(econ.payment_gateways);
    if (econ.delegation) this.validateDelegation(econ.delegation);
    if (econ.treasury) this.validateTreasury(econ.treasury);
  }

  validatePiSmartContract(psc) {
    if (!psc.address) {
      this.errors.push({
        code: 'MISSING_FIELD',
        section: 'economics.pi_smart_contract',
        field: 'address',
        message: "Pi smart contract requires an 'address'"
      });
    }
    if (psc.network && !['pi-mainnet', 'pi-testnet', 'sandbox'].includes(psc.network)) {
      this.errors.push({
        code: 'INVALID_VALUE',
        section: 'economics.pi_smart_contract',
        field: 'network',
        message: "Network must be 'pi-mainnet', 'pi-testnet', or 'sandbox'"
      });
    }
  }

  validateWallets(wallets) {
    if (!Array.isArray(wallets)) {
      this.errors.push({ code: 'INVALID_TYPE', section: 'economics', field: 'wallets', message: 'wallets must be an array' });
      return;
    }
    wallets.forEach((w, i) => {
      if (!w.chain || !w.address) {
        this.errors.push({ code: 'MISSING_FIELD', section: `economics.wallets[${i}]`, message: 'Wallet requires chain and address' });
      }
    });
  }

  validatePaymentGateways(gateways) {
    const sec = 'economics.payment_gateways';
    if (gateways.stripe_acp && gateways.stripe_acp.enabled && !gateways.stripe_acp.merchant_id) {
      this.warnings.push({ code: 'MISSING_MERCHANT_ID', section: sec, field: 'stripe_acp.merchant_id', message: 'Stripe ACP enabled without merchant_id' });
    }
    if (gateways.paypal_ap2 && gateways.paypal_ap2.enabled && !gateways.paypal_ap2.mandate_id) {
      this.warnings.push({ code: 'MISSING_MANDATE_ID', section: sec, field: 'paypal_ap2.mandate_id', message: 'PayPal AP2 enabled without mandate_id' });
    }
  }

  validateDelegation(del) {
    if (del.allow_recursive && del.max_depth > 5) {
      this.warnings.push({ code: 'HIGH_DELEGATION_DEPTH', section: 'economics.delegation', message: 'Max delegation depth > 5 may increase security risk' });
    }
  }

  validateTreasury(tre) {
    if (tre.flash_loan_arbitrage_enabled && !this.data.security?.guardian_logic?.mempool_monitor) {
      this.warnings.push({ code: 'RISKY_TREASURY_CONFIG', section: 'economics.treasury', message: 'Flash loan arbitrage enabled without guardian mempool monitor' });
    }
  }

  // ─── AI-SBOM / ABOM Validation ──────────────────────────────────────────────

  validateABOM(abom) {
    const sec = 'abom';

    if (abom.spec_version !== undefined && typeof abom.spec_version !== 'string') {
      this.errors.push({ code: 'INVALID_TYPE', section: sec, field: 'spec_version', message: 'abom.spec_version must be a string (e.g. "1.0")' });
    }

    if (abom.generated !== undefined && !this.isValidISO8601(abom.generated)) {
      this.errors.push({ code: 'INVALID_TIMESTAMP', section: sec, field: 'generated', message: 'abom.generated must be a valid ISO 8601 timestamp' });
    }

    if (abom.tools !== undefined) {
      if (!Array.isArray(abom.tools)) {
        this.errors.push({ code: 'INVALID_TYPE', section: sec, field: 'tools', message: 'abom.tools must be an array' });
      } else {
        abom.tools.forEach((tool, i) => {
          if (!tool.name) {
            this.errors.push({ code: 'MISSING_FIELD', section: `${sec}.tools`, index: i, field: 'name', message: `abom.tools[${i}] is missing required field 'name'` });
          }
        });
      }
    }

    if (!abom.constituents) {
      this.warnings.push({ code: 'ABOM_EMPTY', section: sec, message: 'abom.constituents is missing or empty — consider listing all agent dependencies' });
      return;
    }

    if (!Array.isArray(abom.constituents)) {
      this.errors.push({ code: 'INVALID_TYPE', section: sec, field: 'constituents', message: 'abom.constituents must be an array' });
      return;
    }

    abom.constituents.forEach((item, index) => { this._validateABOMConstituent(item, index); });
  }

  _validateABOMConstituent(item, index) {
    const sec = `abom.constituents[${index}]`;
    const label = item.name ? `'${item.name}'` : `at index ${index}`;

    const mandatory = ['name', 'version', 'type', 'purl'];
    for (const field of mandatory) {
      if (!item[field]) {
        this.errors.push({ code: 'MISSING_FIELD', section: sec, field, message: `Constituent ${label} is missing required AI-SBOM field '${field}'` });
      }
    }

    if (item.type && !ABOM_VALID_TYPES.includes(item.type)) {
      this.errors.push({ code: 'INVALID_VALUE', section: sec, field: 'type', message: `Constituent ${label} type '${item.type}' is invalid. Must be one of: ${ABOM_VALID_TYPES.join(', ')}` });
    }

    if (item.purl && !ABOM_PURL_RE.test(item.purl)) {
      this.errors.push({ code: 'INVALID_PURL', section: sec, field: 'purl', message: `Constituent ${label} has invalid purl '${item.purl}'.` });
    }

    if (item.integrity_hash !== undefined && (typeof item.integrity_hash !== 'string' || !ABOM_INTEGRITY_RE.test(item.integrity_hash))) {
      this.errors.push({ code: 'INVALID_INTEGRITY_HASH', section: sec, field: 'integrity_hash', message: `Constituent ${label} integrity_hash must follow 'algorithm:hexdigest' format` });
    }

    if (item.trust_tier !== undefined) {
      if (!ABOM_VALID_TRUST_TIERS.includes(item.trust_tier)) {
        this.errors.push({ code: 'INVALID_VALUE', section: sec, field: 'trust_tier', message: `Constituent ${label} trust_tier '${item.trust_tier}' is invalid.` });
      } else {
        if (item.trust_tier === 'revoked') this.errors.push({ code: 'ABOM_REVOKED_CONSTITUENT', section: sec, field: 'trust_tier', message: `SECURITY: Constituent ${label} has trust_tier='revoked'.` });
        if (item.trust_tier === 'unverified') this.warnings.push({ code: 'ABOM_UNVERIFIED_CONSTITUENT', section: sec, field: 'trust_tier', message: `Constituent ${label} has trust_tier='unverified'.` });
        if (item.trust_tier === 'verified' && !item.integrity_hash) this.warnings.push({ code: 'ABOM_VERIFIED_WITHOUT_HASH', section: sec, field: 'integrity_hash', message: `Constituent ${label} claims trust_tier='verified' but provides no integrity_hash.` });
      }
    }

    if (item.security_status !== undefined) {
      if (!ABOM_VALID_SEC_STATUSES.includes(item.security_status)) {
        this.errors.push({ code: 'INVALID_VALUE', section: sec, field: 'security_status', message: `Constituent ${label} security_status '${item.security_status}' is invalid.` });
      } else {
        if (item.security_status === 'revoked') this.errors.push({ code: 'ABOM_REVOKED_CONSTITUENT', section: sec, field: 'security_status', message: `SECURITY: Constituent ${label} has security_status='revoked'.` });
        if (item.security_status === 'vulnerable') this.warnings.push({ code: 'ABOM_VULNERABLE_CONSTITUENT', section: sec, field: 'security_status', message: `Constituent ${label} has known vulnerabilities.` });
      }
    }

    if (item.supplier !== undefined && (typeof item.supplier !== 'string' || item.supplier.trim() === '')) {
      this.errors.push({ code: 'INVALID_VALUE', section: sec, field: 'supplier', message: `Constituent ${label} supplier must be a non-empty string` });
    }

    if (item.license !== undefined && typeof item.license !== 'string') {
      this.errors.push({ code: 'INVALID_TYPE', section: sec, field: 'license', message: `Constituent ${label} license must be a string` });
    }
  }

  /**
   * Validate security (checksums and signatures)
   */

  /**
   * Validate build_provenance section
   */
  validateBuildProvenance(prov) {
    if (prov.slsa_level >= 2 && !prov.builder_signature) {
      this.errors.push({
        code: 'MISSING_FIELD',
        section: 'build_provenance',
        field: 'builder_signature',
        message: 'builder_signature is required when slsa_level >= 2'
      });
    }
  }

  /**
   * Verify build_provenance signature if public key is provided
   */
  verifySignature(publicKeyPem) {
    if (this.data && this.data.build_provenance && this.data.build_provenance.builder_signature && publicKeyPem) {
      try {
        const keyObj = crypto.createPublicKey(publicKeyPem);
        const { builder_signature, ...provData } = this.data.build_provenance;
        const str = JSON.stringify({
          builder: provData.builder,
          source_commit: provData.source_commit,
          source_repo: provData.source_repo,
          build_timestamp: provData.build_timestamp
        });
        const bytes = Buffer.from(str, 'utf8');
        const isValid = crypto.verify(null, bytes, keyObj, Buffer.from(builder_signature, 'base64'));
        if (!isValid) {
          this.warnings.push({
            code: 'INVALID_SIGNATURE',
            section: 'build_provenance',
            message: 'builder_signature verification failed'
          });
        }
        return isValid;
      } catch (err) {
        this.warnings.push({
          code: 'VERIFICATION_ERROR',
          section: 'build_provenance',
          message: 'Error verifying builder_signature: ' + err.message
        });
        return false;
      }
    }
    return true;
  }

  validateSecurity(data, content) {
    if (data.security && data.security.guardian_logic) {
      this.validateGuardianLogic(data.security.guardian_logic);
    }
    if (!data.security || !data.security.checksum) return;

    const { algorithm, value } = data.security.checksum;
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

  removeSecuritySection(content) {
    const lines = content.split('\n');
    const filtered = [];
    let inSecurity = false;
    let securityIndent = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('security:')) {
        inSecurity = true;
        securityIndent = line.search(/\S/);
        continue;
      }
      
      if (inSecurity) {
        const currentIndent = line.search(/\S/);
        if (currentIndent !== -1 && currentIndent <= securityIndent && trimmed !== '') {
          inSecurity = false;
        }
      }

      if (!inSecurity) filtered.push(line);
    }

    return filtered.join('\n').trim();
  }

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

  isValidID(id) {
    const axiomRegex = /^did:axiom:axiomid\.app:[a-zA-Z0-9._\-]+$/i;
    const webRegex = /^did:web:[a-zA-Z0-9.\-]+(:[a-zA-Z0-9.\-]+)*$/i;
    return axiomRegex.test(id) || webRegex.test(id);
  }

  isValidISO8601(timestamp) {
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!regex.test(timestamp)) return false;
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
    try { new URL(url); return true; } catch { return false; }
  }
}

/**
 * AIXAgent - Represents a parsed AIX agent
 */
export class AIXAgent {
  constructor(data, warnings = []) {
    this.data = data;
    this.warnings = warnings;
    // FIX: AIXAgent needs its own errors array for standalone validation calls
    // (e.g. validateLiveVoice called outside of AIXParser context)
    this.errors = [];
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
  get guardian_logic() { return this.data.security?.guardian_logic; }
  get wallets() { return this.data.economics?.wallets || []; }
  get payment_gateways() { return this.data.economics?.payment_gateways; }
  get delegation() { return this.data.economics?.delegation; }
  get treasury() { return this.data.economics?.treasury; }
  get lineage() { return this.data.meta?.lineage || []; }

  getCapabilities() {
    const capabilities = [];
    if (this.skills.length > 0) capabilities.push(...this.skills.filter(s => s.enabled !== false).map(s => s.name));
    if (this.apis.length > 0) capabilities.push('api_integration');
    if (this.mcp) capabilities.push('mcp_servers');
    if (this.requirements?.vla) capabilities.push('vla');
    if (this.memory) {
      if (this.memory.episodic?.enabled) capabilities.push('episodic_memory');
      if (this.memory.semantic?.enabled) capabilities.push('semantic_memory');
      if (this.memory.procedural?.enabled) capabilities.push('procedural_memory');
    }
    return capabilities;
  }

  isAuthorized(operation) {
    if (!this.security?.capabilities) return true;
    const { allowed_operations } = this.security.capabilities;
    if (allowed_operations && !allowed_operations.includes(operation)) return false;
    return true;
  }

  abomSummary() {
    const constituents = this.abom?.constituents || [];
    const summary = { total: constituents.length, verified: 0, community: 0, unverified: 0, revoked: 0, vulnerable: 0, missing_hash: 0 };
    for (const c of constituents) {
      const tier = c.trust_tier || 'unverified';
      if (summary[tier] !== undefined) summary[tier]++;
      if (c.security_status === 'vulnerable') summary.vulnerable++;
      if (!c.integrity_hash) summary.missing_hash++;
    }
    return summary;
  }

  toString() {
    return `AIX Agent: ${this.meta.name} (${this.meta.id})`;
  }
  /**
   * Validate Live Voice settings.
   * Results are stored in this.errors and this.warnings.
   * @param {object} voice - live_voice section from AIX manifest
   * @returns {{ errors: Array, warnings: Array }} validation result
   */
  validateLiveVoice(voice) {
    // Reset per-call so repeated calls don't accumulate stale results
    this.errors = [];

    if (!voice || typeof voice !== 'object') {
      this.errors.push({
        code: 'INVALID_INPUT',
        section: 'live_voice',
        message: 'validateLiveVoice: voice argument must be a non-null object'
      });
      return { errors: this.errors, warnings: this.warnings };
    }

    if (!voice.provider) {
      this.errors.push({
        code: 'MISSING_FIELD',
        section: 'live_voice',
        field: 'provider',
        message: 'live_voice requires a provider.'
      });
    } else {
      const allowedProviders = ['openai-realtime', 'hume', 'elevenlabs', 'generic'];
      if (!allowedProviders.includes(voice.provider)) {
        this.errors.push({
          code: 'INVALID_VALUE',
          section: 'live_voice',
          field: 'provider',
          message: 'live_voice provider must be one of: ' + allowedProviders.join(', ')
        });
      }
    }

    return { errors: this.errors, warnings: this.warnings };
  }

  validateGuardianLogic(logic) {
    if (logic.front_run_defense && !logic.mempool_monitor) {
      this.errors.push({
        code: 'INCONSISTENT_CONFIG',
        section: 'security.guardian_logic',
        message: 'front_run_defense requires mempool_monitor to be enabled'
      });
    }
  }
}

// ─── Plugin System Exports ────────────────────────────────────────────────────
// Export plugin system for external use
export { defaultRegistry, PluginRegistry };
export { ValidationPlugin } from './validation-plugins.js';
export * from './plugins/index.js';
