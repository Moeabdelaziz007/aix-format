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
export interface SemVer extends String {
}
export interface ISODateTime extends String {
}
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
    episodic?: {
        enabled?: boolean;
        max_messages?: number;
        retention_days?: number;
        storage?: string;
    };
    semantic?: {
        enabled?: boolean;
        embedding_model?: string;
        vector_db?: string;
        similarity_threshold?: number;
        max_results?: number;
    };
    procedural?: {
        enabled?: boolean;
        storage?: string;
        max_workflows?: number;
    };
    persistence?: {
        enabled?: boolean;
        backend?: string;
        config?: Record<string, unknown>;
    };
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
        cost_per_call?: {
            amount?: number;
            currency?: string;
        };
        subscription?: {
            monthly_fee?: {
                amount?: number;
                currency?: string;
            };
            included_calls?: number;
        };
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
export interface ABOMConstituent {
    name: string;
    version: string;
    type?: 'model' | 'dataset' | 'library' | 'tool' | 'plugin' | 'agent' | 'runtime';
    purl?: string;
    hash?: string;
    integrity_hash?: string;
    license?: string;
    supplier?: string;
    trust_tier?: 'verified' | 'community' | 'unverified' | 'revoked';
    security_status?: 'clean' | 'vulnerable' | 'revoked' | 'unknown';
    source_registry?: string;
}
export interface ABOM {
    spec_version?: string;
    generated?: string;
    tools?: Array<{
        name: string;
        version?: string;
    }>;
    constituents?: ABOMConstituent[];
    attestations?: Array<{
        type?: string;
        value?: string;
        signer?: string;
    }>;
}
export interface LiveVoice {
    enabled: boolean;
    provider: 'openai-realtime' | 'hume' | 'elevenlabs' | 'generic';
    voice_id?: string;
    latency_mode?: 'ultra_low' | 'standard' | 'high_quality';
}
export interface Requirements {
    hardware?: {
        cpu_cores?: number;
        memory_mb?: number;
        storage_mb?: number;
        gpu_required?: boolean;
    };
    software?: {
        runtime?: string;
        dependencies?: string[];
        python_version?: string;
        node_version?: string;
    };
    network?: {
        internet_access?: boolean;
        bandwidth_mbps?: number;
        allowed_domains?: string[];
    };
    vla?: {
        adapter: 'openpi' | 'π0.7' | 'generic';
        vision?: Record<string, unknown>;
    };
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
export declare class AIXParser {
    private errors;
    private warnings;
    parseFile(filePath: string): AIXAgent;
    parse(content: string, filePath?: string): AIXAgent;
    private detectFormat;
    private parseJSON;
    private parseYAML;
    private parseTOML;
    private createParseError;
    private validateStructure;
    private validateMeta;
    private validateIdentityLayer;
    private validatePersona;
    private validateSecurityStructure;
    private validateSkills;
    private validateAPIs;
    private validateMCP;
    private validateMemory;
    private validateRequirements;
    private validatePricing;
    private validatePiNetwork;
    private validateEconomics;
    /** Validate Meta Arbiter configuration block — new in v1.3 */
    private validateMetaArbiter;
    private validateABOM;
    private _validateABOMConstituent;
    private validateSecurity;
    private removeSecuritySection;
    private calculateChecksum;
    private timingSafeEqualHex;
    private isValidID;
    private isValidISO8601;
    private isValidSemver;
    private isValidURL;
}
export declare class AIXAgent {
    readonly data: AIXDocument;
    readonly warnings: AIXValidationWarning[];
    constructor(data: AIXDocument, warnings?: AIXValidationWarning[]);
    get meta(): Meta;
    get persona(): Persona;
    get skills(): Skill[];
    get apis(): API[];
    get mcp(): MCP | undefined;
    get memory(): Memory | undefined;
    get requirements(): Requirements | undefined;
    get security(): Security;
    get identity_layer(): IdentityLayer;
    get pi_network(): PiNetwork | undefined;
    get economics(): Economics | undefined;
    get abom(): ABOM | undefined;
    get live_voice(): LiveVoice | undefined;
    get lineage(): {
        parent_id: string;
        relationship?: "fork" | "clone" | "ancestor" | "template";
        timestamp?: string;
        signature?: string;
    }[];
    /** Meta Arbiter config — 'العقل المدبر' orchestration layer */
    get meta_arbiter(): MetaArbiterConfig | undefined;
    getCapabilities(): string[];
    isAuthorized(operation: string): boolean;
    abomSummary(): {
        total: number;
        verified: number;
        community: number;
        unverified: number;
        revoked: number;
        vulnerable: number;
        missing_hash: number;
    };
    toString(): string;
}
