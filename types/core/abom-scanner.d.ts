interface Manifest {
    meta?: {
        id?: string;
        name?: string;
        version?: string;
    };
    abom?: AbomData;
    skills?: Array<{
        name: string;
        [key: string]: any;
    }>;
    identity_layer?: {
        kyc_tier?: number;
        [key: string]: any;
    };
    [key: string]: any;
}
interface AbomData {
    constituents?: Array<{
        name: string;
        version?: string;
        type?: string;
        trust_tier?: string;
        security_status?: string;
        integrity_hash?: string;
    }>;
    saas_services?: Array<{
        name: string;
        provider: string;
        compliance_tier?: string;
        endpoint?: string;
        usage_policy?: string;
    }>;
    dependencies?: string[];
    risk_score?: number;
    risk_level?: string;
}
interface RiskItem {
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    message: string;
    component?: string;
}
interface ComplianceReport {
    eu_cra: boolean;
    nist_ai_rmf: boolean;
    kyc_complete: boolean;
}
interface ScanResult {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    risks: RiskItem[];
    recommendations: string[];
    compliance: ComplianceReport;
    timestamp: string;
}
/**
 * ABOM Scanner - Sovereign Risk Scoring Engine
 * Analyzes AIX manifests for security, compliance, and supply chain risks.
 */
export declare function scanAgent(agent: Partial<Manifest>): ScanResult;
export {};
