/**
 * AIX Parser - TypeScript Implementation (v1.3)
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

// ─── Types (inline until `npm run generate:types:unified` produces types/aix.d.ts) ─

export interface SemVer extends String {}
export interface ISODateTime extends String {}

export interface MetaArbiterConfig {
  activation_threshold?: number;
  concurrent_systems_limit?: number;
  response_time_target_sec?: number;
  resource_allocation_ratio?: number;
  growth_milestones_enabled?: boolean;
  coordination_strategy?: 'sequential' | 'parallel' | 'hierarchical' | 'collaborative' | 'competitive';
  decision_criteria?: {
    urgency?: number;
    complexity?: number;
    resource_availability?: number;
    user_preference?: number;
    system_capability?: number;
  };
  alert_thresholds?: {
    response_time_sec?: number;
    accuracy?: number;
    error_rate?: number;
    resource_usage?: number;
  };
  growth_milestone_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface PublicKey {
  algorithm: 'Ed25519' | 'secp256k1';
  value: string;
  encoding?: 'base64url' | 'hex';
}

export interface Signature {
  algorithm: 'Ed25519' | 'secp256k1';
  value: string;
  canonicalization?: 'JCS' | 'RFC8785';
}

export interface Meta {
  version: string;
  id: string;
  name: string;
  created: string;
  author: string;
  description?: string;
  updated?: string;
  tags?: string[];
  license?: string;
  homepage?: string;
  repository?: string;
  framework?: string;
  lineage?: Array<{
    parent_id: string;
    relationship?: 'fork' | 'clone' | 'ancestor' | 'template';
    timestamp?: string;
    signature?: string;
  }>;
  [key: string]: unknown;
}

export interface Persona {
  role: string;
  instructions: string;
  tone?: string;
  style?: string;
  constraints?: string[];
  temperature?: number;
  context_window?: number;
  [key: string]: unknown;
}

export interface Security {
  checksum: {
    algorithm: 'sha256' | 'sha512' | 'blake3';
    value: string;
    scope?: string;
  };
  signature?: {
    algorithm?: string;
    value?: string;
    public_key?: string;
    signer?: string;
    timestamp?: string;
  };
  capabilities?: {
    allowed_operations?: string[];
    restricted_operations?: string[];
    restricted_domains?: string[];
    max_api_calls_per_minute?: number;
    sandbox?: boolean;
  };
  [key: string]: unknown;
}

export interface IdentityLayer {
  id: string;
  authority: 'axiomid.app';
  issuedAt: string;
  expiresAt?: string;
  publicKey?: PublicKey;
  signature?: Signature;
  dna_hash?: string;
}

export interface Skill {
  name: string;
  description: string;
  enabled?: boolean;
  parameters?: Record<string, unknown>;
  triggers?: string[];
  examples?: string[];
  priority?: number;
}

export interface APIEndpoint {
  path?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description?: string;
  parameters?: unknown[];
}

export interface API {
  name: string;
  base_url: string;
  description?: string;
  version?: string;
  auth?: {
    type?: 'bearer' | 'api_key' | 'oauth2' | 'basic' | 'none';
    location?: 'header' | 'query' | 'body';
    key_name?: string;
  };
  endpoints?: APIEndpoint[];
}

export interface MCPServer {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  description?: string;
  capabilities?: string[];
  timeout?: number;
  auto_start?: boolean;
}

export interface MCP {
  servers?: MCPServer[];
}

export interface Memory {
  episodic?: { enabled?: boolean; max_messages?: number; retention_days?: number; storage?: string; };
  semantic?: { enabled?: boolean; embedding_model?: string; vector_db?: string; similarity_threshold?: number; max_results?: number; };
  procedural?: { enabled?: boolean; storage?: string; max_workflows?: number; };
  persistence?: { enabled?: boolean; backend?: string; config?: Record<string, unknown>; };
}

export interface Economics {
  pi_smart_contract?: {
    address: string;
    network: 'mainnet' | 'testnet' | 'sandbox';
    escrow_enabled?: boolean;
    abi_url?: string;
  };
  pricing?: {
    model?: 'pay_per_call' | 'subscription' | 'freemium' | 'tiered';
    cost_per_call?: { amount?: number; currency?: string; };
    subscription?: { monthly_fee?: { amount?: number; currency?: string; }; included_calls?: number; };
  };
  [key: string]: unknown;
}

export interface PiNetwork {
  app_id: string;
  environment: 'sandbox' | 'production';
  sdk_version?: string;
  payment_provider?: string;
  kyc_required?: boolean;
}

export interface SaasService {
  name: string;
  provider: string;
  version?: string;
  compliance_tier?: 'low' | 'medium' | 'high' | 'critical';
  endpoints?: string[];
  data_flow?: string[];
}

export interface UnifiedBOM {
  agents?: Array<{ did: string; name: string; version: string; }>;
  saas?: SaasService[];
  ai_models?: Array<{ model_id: string; provider: string; weights_hash?: string; }>;
  infrastructure?: Array<{ provider: string; region?: string; }>;
}

export interface ABOM {
  spec_version?: string;
  generated?: string;
  tools?: Array<{ name: string; version?: string; }>;
  constituents?: ABOMConstituent[];
  attestations?: Array<{ type?: string; value?: string; signer?: string; }>;
  saas_services?: SaasService[];
  unified_bom?: UnifiedBOM;
  risk_score?: number;
  compliance_notes?: string;
}

export interface BuildProvenance {
  builder_id: string;
  build_type: string;
  invocation?: { config_source: { uri: string; digest: Record<string, string> } };
  materials: Array<{ uri: string; digest: Record<string, string> }>;
}

export interface MonetizationConfig {
  tier: 'free' | 'builder' | 'pro' | 'enterprise';
  pricing: Record<string, unknown>;
}

export interface LiveVoice {
  enabled: boolean;
  provider: 'openai-realtime' | 'hume' | 'elevenlabs' | 'generic';
  voice_id?: string;
  latency_mode?: 'ultra_low' | 'standard' | 'high_quality';
}

export interface Requirements {
  hardware?: { cpu_cores?: number; memory_mb?: number; storage_mb?: number; gpu_required?: boolean; };
  software?: { runtime?: string; dependencies?: string[]; python_version?: string; node_version?: string; };
  network?: { internet_access?: boolean; bandwidth_mbps?: number; allowed_domains?: string[]; };
  vla?: { adapter: 'openpi' | 'π0.7' | 'generic'; vision?: Record<string, unknown>; };
}

/** Full AIX Document — canonical typed shape for aix.schema.json v1.3 */
export interface AIXDocument {
  meta: Meta;
  persona: Persona;
  security: Security;
  identity_layer: IdentityLayer;
  skills?: Skill[];
  apis?: API[];
  mcp?: MCP;
  memory?: Memory;
  economics?: Economics;
  pi_network?: PiNetwork;
  abom?: ABOM;
  live_voice?: LiveVoice;
  requirements?: Requirements;
  /** Meta Arbiter runtime config — 'العقل المدبر' orchestration layer */
  meta_arbiter?: MetaArbiterConfig;
  build_provenance?: BuildProvenance;
  monetization?: MonetizationConfig;
  [key: string]: unknown;
}

export interface AIXValidationError {
  code: string;
  section?: string;
  field?: string;
  message: string;
  index?: number;
}

export interface AIXValidationWarning {
  code: string;
  section?: string;
  field?: string;
  message: string;
}

// ─── AI-SBOM constituent field enumerations ──────────────────────────────────
const ABOM_VALID_TYPES        = ['model', 'dataset', 'library', 'tool', 'plugin', 'agent', 'runtime'] as const;
const ABOM_VALID_TRUST_TIERS  = ['verified', 'community', 'unverified', 'revoked'] as const;
const ABOM_VALID_SEC_STATUSES = ['clean', 'vulnerable', 'revoked', 'unknown'] as const;
const ABOM_VALID_COMPLIANCE   = ['low', 'medium', 'high', 'critical'] as const;
const ABOM_INTEGRITY_RE       = /^[a-zA-Z0-9-]+:[a-fA-F0-9]{32,}$/;
const ABOM_PURL_RE            = /^pkg:[a-zA-Z][a-zA-Z0-9+\-.]*\/.+/;

// ─── AIXParser ────────────────────────────────────────────────────────────────

export class AIXParser {
  private errors: AIXValidationError[] = [];
  private warnings: AIXValidationWarning[] = [];

  parseFile(filePath: string): AIXAgent {
    const content = fs.readFileSync(filePath, 'utf-8');
    return this.parse(content, filePath);
  }

  parse(content: string, filePath: string = '<string>'): AIXAgent {
    this.errors = [];
    this.warnings = [];

    const format = this.detectFormat(content, filePath);
    let data: unknown;

    try {
      switch (format) {
        case 'json':  data = this.parseJSON(content);  break;
        case 'yaml':  data = this.parseYAML(content);  break;
        case 'toml':  data = this.parseTOML(content);  break;
        default:      throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      const msg = `Failed to parse ${format.toUpperCase()}: ${(error as Error).message}`;
      this.errors.push({ code: 'PARSE_ERROR', message: msg, section: filePath });
      throw this.createParseError('PARSE_ERROR', msg, filePath, error as Error);
    }

    this.validateStructure(data as Record<string, unknown>);
    this.validateSecurity(data as Record<string, unknown>, content);
    if (data && (data as Record<string, unknown>).meta_arbiter) {
      this.validateMetaArbiter((data as Record<string, unknown>).meta_arbiter);
    }

    if (this.errors.length > 0) {
      const err = Object.assign(new Error(`Validation failed: ${this.errors.length} error(s) found`), {
        errors: this.errors
      });
      throw err;
    }

    return new AIXAgent(data as AIXDocument, this.warnings);
  }

  private detectFormat(content: string, filePath: string): string {
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) return 'yaml';
    if (filePath.endsWith('.toml')) return 'toml';
    if (filePath.endsWith('.aix')) {
      const t = content.trim();
      if (t.startsWith('{')) return 'json';
      if (t.startsWith('[') || /^\w+\s*=/.test(t)) return 'toml';
      return 'yaml';
    }
    const t = content.trim();
    if (t.startsWith('{')) return 'json';
    if (/^\[\w+\]/.test(t) || /^\w+\s*=/.test(t)) return 'toml';
    return 'yaml';
  }

  private parseJSON(content: string): unknown {
    return JSON.parse(content);
  }

  private parseYAML(content: string): unknown {
    return yaml.load(content, { schema: yaml.JSON_SCHEMA });
  }

  private parseTOML(content: string): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    let current: Record<string, unknown> = out;

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
          current = current[section] as Record<string, unknown>;
        }
        continue;
      }

      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const rawValue = line.slice(eq + 1).trim();

      let parsedValue: unknown;
      if ((rawValue.startsWith('"') && rawValue.endsWith('"')) ||
          (rawValue.startsWith("'") && rawValue.endsWith("'"))) {
        parsedValue = rawValue.slice(1, -1);
      } else if (rawValue === 'true' || rawValue === 'false') {
        parsedValue = rawValue === 'true';
      } else if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
        parsedValue = rawValue.slice(1, -1).split(',').map((item) => item.trim()).filter((v) => v.length > 0)
          .map((item) => {
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

  private createParseError(code: string, message: string, filePath: string, originalError: Error): Error {
    return Object.assign(new Error(message), { code, file: filePath, cause: originalError });
  }

  private validateStructure(data: Record<string, unknown>): void {
    for (const section of ['meta', 'persona', 'security', 'identity_layer']) {
      if (!data[section]) {
        this.errors.push({ code: 'MISSING_SECTION', section, message: `Required section '${section}' is missing` });
      }
    }
    if (data['meta'])           this.validateMeta(data['meta'] as Record<string, unknown>);
    if (data['persona'])        this.validatePersona(data['persona'] as Record<string, unknown>);
    if (data['security'])       this.validateSecurityStructure(data['security'] as Record<string, unknown>);
    if (data['skills'])         this.validateSkills(data['skills']);
    if (data['apis'])           this.validateAPIs(data['apis']);
    if (data['mcp'])            this.validateMCP(data['mcp'] as Record<string, unknown>);
    if (data['memory'])         this.validateMemory(data['memory'] as Record<string, unknown>);
    if (data['requirements'])   this.validateRequirements(data['requirements'] as Record<string, unknown>);
    if (data['pricing'])        this.validatePricing(data['pricing'] as Record<string, unknown>);
    if (data['identity_layer']) this.validateIdentityLayer(data['identity_layer'] as Record<string, unknown>);
    if (data['pi_network'])     this.validatePiNetwork(data['pi_network'] as Record<string, unknown>);
    if (data['economics'])      this.validateEconomics(data['economics'] as Record<string, unknown>);
    if (data['abom'])           this.validateABOM(data['abom'] as Record<string, unknown>);
    if (data['build_provenance']) this.validateBuildProvenance(data['build_provenance'] as Record<string, unknown>);
    if (data['monetization'])   this.validateMonetization(data['monetization'] as Record<string, unknown>);
  }

  private validateMeta(meta: Record<string, unknown>): void {
    for (const field of ['version', 'id', 'name', 'created', 'author']) {
      if (!meta[field]) this.errors.push({ code: 'MISSING_FIELD', section: 'meta', field, message: `Required field 'meta.${field}' is missing` });
    }
    if (meta['id'] && !this.isValidID(meta['id'] as string)) {
      this.errors.push({ code: 'INVALID_ID', section: 'meta', field: 'id', message: 'Invalid ID format' });
    }
    if (meta['created'] && !this.isValidISO8601(meta['created'] as string)) {
      this.errors.push({ code: 'INVALID_TIMESTAMP', section: 'meta', field: 'created', message: 'Invalid ISO 8601 timestamp' });
    }
    if (meta['version'] && !this.isValidSemver(meta['version'] as string)) {
      this.errors.push({ code: 'INVALID_VERSION', section: 'meta', field: 'version', message: 'Invalid semantic version format' });
    }
    if (meta['lineage']) {
      if (!Array.isArray(meta['lineage'])) {
        this.errors.push({ code: 'INVALID_TYPE', section: 'meta', field: 'lineage', message: 'Lineage must be an array' });
      } else {
        (meta['lineage'] as unknown[]).forEach((entry, index) => {
          if (!(entry as Record<string, unknown>)['parent_id']) {
            this.errors.push({ code: 'MISSING_FIELD', section: 'meta.lineage', index, field: 'parent_id', message: `Lineage entry at index ${index} is missing 'parent_id'` });
          }
        });
      }
    }
  }

  private validateIdentityLayer(il: Record<string, unknown>): void {
    for (const field of ['id', 'authority', 'issuedAt']) {
      if (!il[field]) this.errors.push({ code: 'MISSING_FIELD', section: 'identity_layer', field, message: `Required field 'identity_layer.${field}' is missing` });
    }
    if (il['id'] && !this.isValidID(il['id'] as string)) {
      this.errors.push({ code: 'INVALID_ID', section: 'identity_layer', field: 'id', message: 'Invalid ID format' });
    }
    if (il['id'] && il['authority']) {
      if ((il['id'] as string).startsWith('did:axiom:') && il['authority'] !== 'axiomid.app') {
        this.errors.push({ code: 'INVALID_AUTHORITY', section: 'identity_layer', field: 'authority', message: "Authority must be 'axiomid.app' for did:axiom" });
      }
    }
    if (il['issuedAt'] && !this.isValidISO8601(il['issuedAt'] as string)) {
      this.errors.push({ code: 'INVALID_TIMESTAMP', section: 'identity_layer', field: 'issuedAt', message: 'Invalid ISO 8601 timestamp' });
    }
  }

  private validatePersona(persona: Record<string, unknown>): void {
    for (const field of ['role', 'instructions']) {
      if (!persona[field]) this.errors.push({ code: 'MISSING_FIELD', section: 'persona', field, message: `Required field 'persona.${field}' is missing` });
    }
    if (persona['temperature'] !== undefined) {
      const t = persona['temperature'] as number;
      if (t < 0 || t > 2) this.errors.push({ code: 'INVALID_RANGE', section: 'persona', field: 'temperature', message: 'Temperature must be between 0.0 and 2.0' });
    }
  }




  private validateSecurityStructure(security: Record<string, unknown>): void {
    const cs = security['checksum'] as Record<string, unknown> | undefined;
    if (!cs) { this.errors.push({ code: 'MISSING_FIELD', section: 'security', field: 'checksum', message: 'Required field security.checksum is missing' }); return; }
    if (!cs['algorithm']) this.errors.push({ code: 'MISSING_FIELD', section: 'security.checksum', field: 'algorithm', message: 'Required field security.checksum.algorithm is missing' });
    if (!cs['value'])     this.errors.push({ code: 'MISSING_FIELD', section: 'security.checksum', field: 'value', message: 'Required field security.checksum.value is missing' });
    if (cs['algorithm'] && !['sha256', 'sha512', 'blake3'].includes(cs['algorithm'] as string)) {
      this.errors.push({ code: 'INVALID_ALGORITHM', section: 'security.checksum', field: 'algorithm', message: 'Algorithm must be one of: sha256, sha512, blake3' });
    }
  }

  private validateSkills(skills: unknown): void {
    if (!Array.isArray(skills)) { this.errors.push({ code: 'INVALID_TYPE', section: 'skills', message: 'Skills must be an array' }); return; }
    const names = new Set<string>();
    (skills as unknown[]).forEach((skill, i) => {
      const s = skill as Record<string, unknown>;
      if (!s['name']) this.errors.push({ code: 'MISSING_FIELD', section: 'skills', index: i, field: 'name', message: `Skill at index ${i} is missing 'name' field` });
      if (s['name']) {
        if (names.has(s['name'] as string)) this.errors.push({ code: 'DUPLICATE_NAME', section: 'skills', field: 'name', message: `Duplicate skill name: ${s['name']}` });
        names.add(s['name'] as string);
      }
      if (!s['description']) this.errors.push({ code: 'MISSING_FIELD', section: 'skills', index: i, field: 'description', message: `Skill '${s['name'] || 'at index ' + i}' is missing 'description' field` });
    });
  }

  private validateAPIs(apis: unknown): void {
    if (!Array.isArray(apis)) { this.errors.push({ code: 'INVALID_TYPE', section: 'apis', message: 'APIs must be an array' }); return; }
    (apis as unknown[]).forEach((api, i) => {
      const a = api as Record<string, unknown>;
      if (!a['name']) this.errors.push({ code: 'MISSING_FIELD', section: 'apis', index: i, field: 'name', message: `API at index ${i} is missing 'name' field` });
      if (!a['base_url']) this.errors.push({ code: 'MISSING_FIELD', section: 'apis', index: i, field: 'base_url', message: `API '${a['name'] || 'at index ' + i}' is missing 'base_url' field` });
      else if (!this.isValidURL(a['base_url'] as string)) this.errors.push({ code: 'INVALID_URL', section: 'apis', index: i, field: 'base_url', message: `API '${a['name']}' has invalid URL` });
    });
  }

  private validateMCP(mcp: Record<string, unknown>): void {
    const servers = mcp['servers'];
    if (!servers || !Array.isArray(servers)) { this.errors.push({ code: 'INVALID_TYPE', section: 'mcp', message: 'MCP servers must be an array' }); return; }
    (servers as unknown[]).forEach((server, i) => {
      const s = server as Record<string, unknown>;
      if (!s['name'])    this.errors.push({ code: 'MISSING_FIELD', section: 'mcp.servers', index: i, field: 'name',    message: `Server at index ${i} is missing 'name' field` });
      if (!s['command']) this.errors.push({ code: 'MISSING_FIELD', section: 'mcp.servers', index: i, field: 'command', message: `Server '${s['name'] || 'at index ' + i}' is missing 'command' field` });
    });
  }

  private validateMemory(memory: Record<string, unknown>): void {
    const validTypes = ['episodic', 'semantic', 'procedural', 'persistence'];
    for (const key of Object.keys(memory)) {
      if (!validTypes.includes(key)) this.errors.push({ code: 'INVALID_MEMORY_TYPE', section: 'memory', field: key, message: `Memory type must be one of: ${validTypes.join(', ')}` });
    }
    const sem = memory['semantic'] as Record<string, unknown> | undefined;
    if (sem && sem['similarity_threshold'] !== undefined) {
      const th = sem['similarity_threshold'] as number;
      if (th < 0 || th > 1) this.errors.push({ code: 'INVALID_RANGE', section: 'memory.semantic', field: 'similarity_threshold', message: 'Similarity threshold must be between 0.0 and 1.0' });
    }
  }

  private validateRequirements(req: Record<string, unknown>): void {
    const hw = req['hardware'] as Record<string, unknown> | undefined;
    if (hw) {
      if (hw['cpu_cores'] !== undefined && (!Number.isInteger(hw['cpu_cores']) || (hw['cpu_cores'] as number) < 1))
        this.errors.push({ code: 'INVALID_VALUE', section: 'requirements.hardware', field: 'cpu_cores', message: 'CPU cores must be a positive integer' });
      if (hw['memory_mb'] !== undefined && (!Number.isInteger(hw['memory_mb']) || (hw['memory_mb'] as number) < 1))
        this.errors.push({ code: 'INVALID_VALUE', section: 'requirements.hardware', field: 'memory_mb', message: 'Memory MB must be a positive integer' });
    }
    const vla = req['vla'] as Record<string, unknown> | undefined;
    if (vla) {
      if (!vla['adapter']) this.errors.push({ code: 'MISSING_FIELD', section: 'requirements.vla', field: 'adapter', message: 'Cyber-physical agent requires a VLA adapter' });
      else if (!['openpi', 'π0.7', 'generic'].includes(vla['adapter'] as string))
        this.errors.push({ code: 'INVALID_VALUE', section: 'requirements.vla', field: 'adapter', message: 'VLA adapter must be one of: openpi, π0.7, generic' });
    }
  }

  private validatePricing(pricing: Record<string, unknown>): void {
    const validModels = ['pay_per_call', 'subscription', 'freemium', 'tiered'];
    const validCurrencies = ['USD', 'EUR', 'BTC', 'ETH', 'PI', 'SOL'];
    if (pricing['currency'] && !validCurrencies.includes(pricing['currency'] as string))
      this.warnings.push({ code: 'UNKNOWN_CURRENCY', section: 'pricing', field: 'currency', message: `Currency '${pricing['currency']}' is not in the standard list` });
    if (pricing['model'] && !validModels.includes(pricing['model'] as string))
      this.errors.push({ code: 'INVALID_VALUE', section: 'pricing', field: 'model', message: `Pricing model must be one of: ${validModels.join(', ')}` });
  }

  private validatePiNetwork(pi: Record<string, unknown>): void {
    for (const field of ['app_id', 'environment']) {
      if (!pi[field]) this.errors.push({ code: 'MISSING_FIELD', section: 'pi_network', field, message: `Required field 'pi_network.${field}' is missing` });
    }
    if (pi['environment'] && !['sandbox', 'production'].includes(pi['environment'] as string))
      this.errors.push({ code: 'INVALID_VALUE', section: 'pi_network', field: 'environment', message: 'Pi environment must be sandbox or production' });
  }

  private validateEconomics(economics: Record<string, unknown>): void {
    if (economics['pricing']) this.validatePricing(economics['pricing'] as Record<string, unknown>);
    const psc = economics['pi_smart_contract'] as Record<string, unknown> | undefined;
    if (psc) {
      if (!psc['address']) this.errors.push({ code: 'MISSING_FIELD', section: 'economics.pi_smart_contract', field: 'address', message: "Pi smart contract requires an 'address'" });
      if (psc['network'] && !['pi-mainnet', 'pi-testnet', 'mainnet', 'testnet', 'sandbox'].includes(psc['network'] as string))
        this.errors.push({ code: 'INVALID_VALUE', section: 'economics.pi_smart_contract', field: 'network', message: "Network must be 'pi-mainnet', 'pi-testnet', 'mainnet', 'testnet', or 'sandbox'" });
    }
  }

  /** Validate Meta Arbiter configuration block — new in v1.3 */
  private validateMetaArbiter(arbiter: unknown): void {
    const a = arbiter as Record<string, unknown>;
    if (a['activation_threshold'] !== undefined) {
      const v = a['activation_threshold'] as number;
      if (typeof v !== 'number' || v < 0 || v > 1)
        this.errors.push({ code: 'INVALID_RANGE', section: 'meta_arbiter', field: 'activation_threshold', message: 'activation_threshold must be a number between 0 and 1' });
    }
    if (a['concurrent_systems_limit'] !== undefined) {
      const v = a['concurrent_systems_limit'] as number;
      if (!Number.isInteger(v) || v < 1)
        this.errors.push({ code: 'INVALID_VALUE', section: 'meta_arbiter', field: 'concurrent_systems_limit', message: 'concurrent_systems_limit must be a positive integer' });
    }
    if (a['coordination_strategy'] !== undefined) {
      const allowed = ['sequential', 'parallel', 'hierarchical', 'collaborative', 'competitive'];
      if (!allowed.includes(a['coordination_strategy'] as string))
        this.errors.push({ code: 'INVALID_VALUE', section: 'meta_arbiter', field: 'coordination_strategy', message: `coordination_strategy must be one of: ${allowed.join(', ')}` });
    }
    if (a['growth_milestone_level'] !== undefined) {
      const allowed = ['beginner', 'intermediate', 'advanced', 'expert'];
      if (!allowed.includes(a['growth_milestone_level'] as string))
        this.errors.push({ code: 'INVALID_VALUE', section: 'meta_arbiter', field: 'growth_milestone_level', message: `growth_milestone_level must be one of: ${allowed.join(', ')}` });
    }
  }

  private validateABOM(abom: Record<string, unknown>): void {
    if (abom['spec_version'] !== undefined && typeof abom['spec_version'] !== 'string')
      this.errors.push({ code: 'INVALID_TYPE', section: 'abom', field: 'spec_version', message: 'abom.spec_version must be a string' });
    if (abom['generated'] !== undefined && !this.isValidISO8601(abom['generated'] as string))
      this.errors.push({ code: 'INVALID_TIMESTAMP', section: 'abom', field: 'generated', message: 'abom.generated must be a valid ISO 8601 timestamp' });
    if (abom['tools'] !== undefined && !Array.isArray(abom['tools']))
      this.errors.push({ code: 'INVALID_TYPE', section: 'abom', field: 'tools', message: 'abom.tools must be an array' });
    if (!abom['constituents']) {
      this.warnings.push({ code: 'ABOM_EMPTY', section: 'abom', message: 'abom.constituents is missing — consider listing all agent dependencies' });
      return;
    }
    if (!Array.isArray(abom['constituents'])) {
      this.errors.push({ code: 'INVALID_TYPE', section: 'abom', field: 'constituents', message: 'abom.constituents must be an array' });
    } else {
      (abom['constituents'] as unknown[]).forEach((item, index) => this._validateABOMConstituent(item as Record<string, unknown>, index));
    }

    if (abom['saas_services']) {
      if (!Array.isArray(abom['saas_services'])) {
        this.errors.push({ code: 'INVALID_TYPE', section: 'abom', field: 'saas_services', message: 'abom.saas_services must be an array' });
      } else {
        (abom['saas_services'] as unknown[]).forEach((s, i) => this._validateSaasService(s as Record<string, unknown>, `abom.saas_services[${i}]`));
      }
    }

    if (abom['unified_bom']) {
      this._validateUnifiedBOM(abom['unified_bom'] as Record<string, unknown>);
    }

    if (abom['risk_score'] !== undefined) {
      const rs = abom['risk_score'] as number;
      if (typeof rs !== 'number' || rs < 0 || rs > 100)
        this.errors.push({ code: 'INVALID_RANGE', section: 'abom', field: 'risk_score', message: 'risk_score must be between 0 and 100' });
    }
  }

  private _validateSaasService(s: Record<string, unknown>, section: string): void {
    for (const field of ['name', 'provider']) {
      if (!s[field]) this.errors.push({ code: 'MISSING_FIELD', section, field, message: `SaaS service is missing required field '${field}'` });
    }
    if (s['compliance_tier'] && !ABOM_VALID_COMPLIANCE.includes(s['compliance_tier'] as typeof ABOM_VALID_COMPLIANCE[number])) {
      this.errors.push({ code: 'INVALID_VALUE', section, field: 'compliance_tier', message: `compliance_tier must be one of: ${ABOM_VALID_COMPLIANCE.join(', ')}` });
    }
  }

  private _validateUnifiedBOM(ubom: Record<string, unknown>): void {
    if (ubom['saas']) {
      if (!Array.isArray(ubom['saas'])) {
        this.errors.push({ code: 'INVALID_TYPE', section: 'abom.unified_bom', field: 'saas', message: 'unified_bom.saas must be an array' });
      } else {
        (ubom['saas'] as unknown[]).forEach((s, i) => this._validateSaasService(s as Record<string, unknown>, `abom.unified_bom.saas[${i}]`));
      }
    }
    // Add validation for other unified_bom fields if needed
  }

  private validateBuildProvenance(bp: Record<string, unknown>): void {
    for (const field of ['builder_id', 'build_type', 'materials']) {
      if (!bp[field]) this.errors.push({ code: 'MISSING_FIELD', section: 'build_provenance', field, message: `build_provenance.${field} is missing` });
    }
    if (bp['materials'] && !Array.isArray(bp['materials'])) {
      this.errors.push({ code: 'INVALID_TYPE', section: 'build_provenance', field: 'materials', message: 'build_provenance.materials must be an array' });
    }
  }

  private validateMonetization(m: Record<string, unknown>): void {
    if (!m['tier']) this.errors.push({ code: 'MISSING_FIELD', section: 'monetization', field: 'tier', message: 'monetization.tier is missing' });
    if (!m['pricing']) this.errors.push({ code: 'MISSING_FIELD', section: 'monetization', field: 'pricing', message: 'monetization.pricing is missing' });
    const tiers = ['free', 'builder', 'pro', 'enterprise'];
    if (m['tier'] && !tiers.includes(m['tier'] as string)) {
      this.errors.push({ code: 'INVALID_VALUE', section: 'monetization', field: 'tier', message: `monetization.tier must be one of: ${tiers.join(', ')}` });
    }
  }

  private _validateABOMConstituent(item: Record<string, unknown>, index: number): void {
    const sec = `abom.constituents[${index}]`;
    const label = item['name'] ? `'${item['name']}'` : `at index ${index}`;
    for (const field of ['name', 'version', 'type', 'purl']) {
      if (!item[field]) this.errors.push({ code: 'MISSING_FIELD', section: sec, field, message: `Constituent ${label} is missing required AI-SBOM field '${field}'` });
    }
    if (item['type'] && !ABOM_VALID_TYPES.includes(item['type'] as typeof ABOM_VALID_TYPES[number]))
      this.errors.push({ code: 'INVALID_VALUE', section: sec, field: 'type', message: `Constituent ${label} type '${item['type']}' is invalid` });
    if (item['purl'] && !ABOM_PURL_RE.test(item['purl'] as string))
      this.errors.push({ code: 'INVALID_PURL', section: sec, field: 'purl', message: `Constituent ${label} has invalid purl '${item['purl']}'` });
    if (item['integrity_hash'] !== undefined && !ABOM_INTEGRITY_RE.test(item['integrity_hash'] as string))
      this.errors.push({ code: 'INVALID_INTEGRITY_HASH', section: sec, field: 'integrity_hash', message: `Constituent ${label} integrity_hash must follow 'algorithm:hexdigest' format` });
    if (item['trust_tier']) {
      const tier = item['trust_tier'] as string;
      if (!ABOM_VALID_TRUST_TIERS.includes(tier as typeof ABOM_VALID_TRUST_TIERS[number]))
        this.errors.push({ code: 'INVALID_VALUE', section: sec, field: 'trust_tier', message: `trust_tier '${tier}' is invalid` });
      if (tier === 'revoked') this.errors.push({ code: 'ABOM_REVOKED_CONSTITUENT', section: sec, field: 'trust_tier', message: `SECURITY: Constituent ${label} has trust_tier='revoked'. Must be removed before deployment.` });
      if (tier === 'unverified') this.warnings.push({ code: 'ABOM_UNVERIFIED_CONSTITUENT', section: sec, field: 'trust_tier', message: `Constituent ${label} is unverified. Verify before production.` });
      if (tier === 'verified' && !item['integrity_hash']) this.warnings.push({ code: 'ABOM_VERIFIED_WITHOUT_HASH', section: sec, field: 'integrity_hash', message: `Constituent ${label} claims 'verified' but provides no integrity_hash.` });
    }
    if (item['security_status']) {
      const ss = item['security_status'] as string;
      if (!ABOM_VALID_SEC_STATUSES.includes(ss as typeof ABOM_VALID_SEC_STATUSES[number]))
        this.errors.push({ code: 'INVALID_VALUE', section: sec, field: 'security_status', message: `security_status '${ss}' is invalid` });
      if (ss === 'revoked') this.errors.push({ code: 'ABOM_REVOKED_CONSTITUENT', section: sec, field: 'security_status', message: `SECURITY: Constituent ${label} has security_status='revoked'. Must be replaced before deployment.` });
      if (ss === 'vulnerable') this.warnings.push({ code: 'ABOM_VULNERABLE_CONSTITUENT', section: sec, field: 'security_status', message: `Constituent ${label} has known vulnerabilities. Update before production.` });
    }
  }


  private validateBlackBox(black_box: Record<string, unknown>): void {
    if (black_box['enabled'] !== undefined && typeof black_box['enabled'] !== 'boolean') {
      this.errors.push({ code: 'INVALID_TYPE', section: 'black_box', field: 'enabled', message: 'black_box.enabled must be a boolean' });
    }

    if (black_box['traces'] !== undefined) {
      if (!Array.isArray(black_box['traces'])) {
        this.errors.push({ code: 'INVALID_TYPE', section: 'black_box', field: 'traces', message: 'black_box.traces must be an array' });
      } else {
        (black_box['traces'] as Record<string, unknown>[]).forEach((trace, i) => {
          if (!trace['timestamp'] || !this.isValidISO8601(trace['timestamp'] as string)) {
             this.errors.push({ code: 'INVALID_TIMESTAMP', section: 'black_box', field: 'timestamp', message: `black_box.traces[${i}].timestamp must be a valid ISO 8601 timestamp` });
          }
          if (!trace['action']) {
             this.errors.push({ code: 'MISSING_FIELD', section: 'black_box', field: 'action', message: `black_box.traces[${i}] is missing 'action'` });
          }
          if (!trace['signature'] || !(trace['signature'] as Record<string, unknown>)['value']) {
             this.errors.push({ code: 'MISSING_FIELD', section: 'black_box', field: 'signature', message: `black_box.traces[${i}] is missing a valid signature` });
          }
        });
      }
    }
  }

  private validateSecurity(data: Record<string, unknown>, content: string): void {
    const security = data['security'] as Record<string, unknown> | undefined;
    if (!security || !security['checksum']) return;
    const cs = security['checksum'] as { algorithm?: string; value?: string };
    const contentWithoutSecurity = this.removeSecuritySection(content);
    const calculated = this.calculateChecksum(contentWithoutSecurity, cs.algorithm || 'sha256');
    if (!this.timingSafeEqualHex(calculated, cs.value || '')) {
      this.warnings.push({ code: 'CHECKSUM_MISMATCH', section: 'security', message: `Checksum mismatch (expected: ${(cs.value || '').substring(0, 16)}..., got: ${calculated.substring(0, 16)}...)` });
    }
  }

  private removeSecuritySection(content: string): string {
    const lines = content.split('\n');
    const filtered: string[] = [];
    let inSecurity = false;
    let securityIndent = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('security:')) { inSecurity = true; securityIndent = line.search(/\S/); continue; }
      if (inSecurity) {
        const ci = line.search(/\S/);
        if (ci !== -1 && ci <= securityIndent && trimmed !== '') inSecurity = false;
      }
      if (!inSecurity) filtered.push(line);
    }
    return filtered.join('\n').trim();
  }

  private calculateChecksum(content: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(content.trim().replace(/\r\n/g, '\n'), 'utf8').digest('hex');
  }

  private timingSafeEqualHex(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    try { return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex')); } catch { return false; }
  }

  private isValidID(id: string): boolean {
    return /^did:axiom:axiomid\.app:[a-zA-Z0-9._\-]+$/i.test(id) || /^did:web:[a-zA-Z0-9.\-]+(:[a-zA-Z0-9.\-]+)*$/i.test(id);
  }

  private isValidISO8601(ts: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(ts)) return false;
    try { return !isNaN(new Date(ts).getTime()); } catch { return false; }
  }

  private isValidSemver(version: string): boolean {
    return /^\d+\.\d+(\.\d+)?(-[a-z0-9.]+)?(\+[a-z0-9.]+)?$/i.test(version);
  }

  private isValidURL(url: string): boolean {
    try { new URL(url); return true; } catch { return false; }
  }
}

// ─── AIXAgent ─────────────────────────────────────────────────────────────────

export class AIXAgent {
  readonly data: AIXDocument;
  readonly warnings: AIXValidationWarning[];
  public errors: AIXValidationError[] = [];

  constructor(data: AIXDocument, warnings: AIXValidationWarning[] = []) {
    this.data = data;
    this.warnings = warnings;
    this.errors = [];
  }

  get meta(): Meta                              { return this.data.meta; }
  get persona(): Persona                        { return this.data.persona; }
  get skills(): Skill[]                         { return this.data.skills || []; }
  get apis(): API[]                             { return this.data.apis || []; }
  get mcp(): MCP | undefined                    { return this.data.mcp; }
  get memory(): Memory | undefined              { return this.data.memory; }
  get requirements(): Requirements | undefined  { return this.data.requirements; }
  get security(): Security                      { return this.data.security; }
  get identity_layer(): IdentityLayer           { return this.data.identity_layer; }
  get pi_network(): PiNetwork | undefined       { return this.data.pi_network; }
  get economics(): Economics | undefined        { return this.data.economics; }
  get abom(): ABOM | undefined                 { return this.data.abom; }
  get live_voice(): LiveVoice | undefined       { return this.data.live_voice; }
  get lineage()                                 { return this.data.meta?.lineage || []; }
  /** Meta Arbiter config — 'العقل المدبر' orchestration layer */
  get meta_arbiter(): MetaArbiterConfig | undefined { return this.data.meta_arbiter; }

  getCapabilities(): string[] {
    const caps: string[] = [];
    caps.push(...this.skills.filter(s => s.enabled !== false).map(s => s.name));
    if (this.apis.length > 0)                caps.push('api_integration');
    if (this.mcp)                            caps.push('mcp_servers');
    if (this.requirements?.vla)              caps.push('vla');
    if (this.memory?.episodic?.enabled)      caps.push('episodic_memory');
    if (this.memory?.semantic?.enabled)      caps.push('semantic_memory');
    if (this.memory?.procedural?.enabled)    caps.push('procedural_memory');
    if (this.meta_arbiter)                   caps.push('meta_arbiter');
    return caps;
  }

  isAuthorized(operation: string): boolean {
    const allowed = this.security?.capabilities?.allowed_operations;
    if (!allowed) return true;
    return allowed.includes(operation);
  }

  abomSummary() {
    const constituents = this.abom?.constituents || [];
    const summary = { total: constituents.length, verified: 0, community: 0, unverified: 0, revoked: 0, vulnerable: 0, missing_hash: 0 };
    for (const c of constituents) {
      const tier = c.trust_tier || 'unverified';
      if (tier in summary) (summary as Record<string, number>)[tier]++;
      if (c.security_status === 'vulnerable') summary.vulnerable++;
      if (!c.integrity_hash) summary.missing_hash++;
    }
    return summary;
  }

  toString(): string {
    return `AIX Agent: ${this.meta.name} (${this.meta.id})`;
  }
}
