export interface SaasService {
    name: string;
    provider: string;
    version?: string;
    compliance_tier?: 'low' | 'medium' | 'high' | 'critical';
    endpoints?: string[];
    data_flow?: string[];
}

export interface AgentRef {
    did: string;
    name: string;
    version: string;
}

export interface AIModelRef {
    model_id: string;
    provider: string;
    weights_hash?: string;
}

export interface InfraRef {
    provider: string;
    region?: string;
}

export interface UnifiedBOM {
    agents?: AgentRef[];
    saas?: SaasService[];
    ai_models?: AIModelRef[];
    infrastructure?: InfraRef[];
}

export interface BuildProvenance {
    builder_id: string;
    build_type: 'https://slsa.dev/provenance/v1';
    invocation: { config_source: { uri: string; digest: Record<string, string> } };
    materials: Array<{ uri: string; digest: Record<string, string> }>;
}

export interface ABOM {
    risk_score?: number; // 0-100
    saas_services?: SaasService[];
    unified_bom?: UnifiedBOM;
    compliance_notes?: string;
}

export interface MonetizationConfig {
    tier: 'free' | 'builder' | 'pro' | 'enterprise';
    pricing: Record<string, any>;
}

export interface AIXManifest {
    aix_version: string;
    name: string;
    version: string;
    description: string;
    capabilities: string[];
    abom?: ABOM;
    build_provenance?: BuildProvenance;
    monetization?: MonetizationConfig;
}