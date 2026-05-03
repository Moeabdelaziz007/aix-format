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

// Import new validation engine
import { validate, register, clear } from './validation-engine.js';
import { allRules } from './rules/index.js';
import { loadFromConfig } from './rule-loader.js';

// ─── AI-SBOM constituent field enumerations ───────────────────────────────────
const ABOM_VALID_TYPES        = ['model', 'dataset', 'library', 'tool', 'plugin', 'agent', 'runtime'];
const ABOM_VALID_TRUST_TIERS  = ['verified', 'community', 'unverified', 'revoked'];
const ABOM_VALID_SEC_STATUSES = ['clean', 'vulnerable', 'revoked', 'unknown'];
const ABOM_INTEGRITY_RE       = /^[a-zA-Z0-9-]+:[a-fA-F0-9]{32,}$/;   // alg:hexdigest
const ABOM_PURL_RE            = /^pkg:[a-zA-Z][a-zA-Z0-9+\-.]*\/.+/;   // pkg:type/...

// ─── Register Core Rules ───────────────────────────────────────────────────────
// Register all core validation rules
allRules.forEach(register);

/**
 * AIXParser - Main parser class for AIX files
 */
export class AIXParser {
  constructor(options = {}) {
    this.errors = [];
    this.warnings = [];
    
    // Auto-load custom rules from config if exists
    if (options.autoLoadRules !== false) {
      loadFromConfig().catch(() => {}); // Silent fail if no config
    }
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

    // Run rule-based validation
    const ruleErrors = await validate(data);
    
    // Convert rule errors to parser error format
    for (const err of ruleErrors) {
      this.errors.push({
        code: err.error ? 'RULE_ERROR' : 'VALIDATION_FAILED',
        rule: err.rule,
        message: err.message || err.error,
        ...(err.stack && { stack: err.stack })
      });
    }
  }


  /**
   * Validate identity layer section
   */
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
