// Define types locally to avoid circular dependencies
interface Manifest {
  meta?: { id?: string; name?: string; version?: string };
  abom?: AbomData;
  skills?: Array<{ name: string; [key: string]: any }>;
  identity_layer?: { kyc_tier?: number; [key: string]: any };
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
export function scanAgent(agent: Partial<Manifest>): ScanResult {
  const risks: RiskItem[] = [];
  const recommendations: string[] = [];
  let score = 100; // Start with perfect score

  // Basic structure check
  const skills = agent.skills || [];
  const abom = agent.abom || {} as AbomData;
  const identity = agent.identity_layer || { kyc_tier: 0 };

  // 1. Analyze Capabilities (Skills)
  const highRiskSkills = ['filesystem_access', 'network_request', 'shell_exec', 'code_execution'];
  skills.forEach((skill: { name: string; [key: string]: any }) => {
    if (highRiskSkills.includes(skill.name)) {
      risks.push({
        category: 'Capability',
        severity: 'high',
        message: `High-risk capability detected: ${skill.name}`
      });
      score -= 15;
    }
  });

  // 2. Analyze Supply Chain (Dependencies)
  const deps = abom.dependencies || [];
  if (deps.length === 0) {
    risks.push({
      category: 'Supply Chain',
      severity: 'medium',
      message: 'No dependencies listed in ABOM. Integrity cannot be verified.'
    });
    recommendations.push('List all third-party models and libraries in the ABOM section.');
    score -= 10;
  } else {
    deps.forEach((depName: string) => {
      const untrusted = ['legacy-unverified-model', 'unsafe-adapter'];
      if (untrusted.some(u => depName.toLowerCase().includes(u))) {
        risks.push({
          category: 'Supply Chain',
          severity: 'critical',
          message: `Untrusted dependency detected: ${depName}`
        });
        score -= 25;
      }
    });
  }

  // 3. Analyze SaaS-BOM (SaaS Services)
  const saasServices = abom.saas_services || [];
  if (saasServices.length > 0) {
    saasServices.forEach((service: { name: string; endpoint?: string; usage_policy?: string; [key: string]: any }) => {
      if (!service.endpoint) {
        risks.push({
          category: 'Supply Chain',
          severity: 'medium',
          message: `SaaS service ${service.name} is missing an endpoint.`
        });
        score -= 5;
      }
      if (!service.usage_policy) {
        risks.push({
          category: 'Compliance',
          severity: 'low',
          message: `SaaS service ${service.name} has no usage policy defined.`
        });
        score -= 2;
      }
      const untrustedEndpoints = ['unverified-api', 'dev-endpoint'];
      if (service.endpoint && untrustedEndpoints.some(u => service.endpoint?.includes(u))) {
        risks.push({
          category: 'Supply Chain',
          severity: 'high',
          message: `SaaS service ${service.name} uses an untrusted endpoint: ${service.endpoint}`
        });
        score -= 15;
      }
    });
  }

  // 4. Identity & Trust
  const kycTier = identity.kyc_tier || 0;
  if (kycTier < 2) {
    risks.push({
      category: 'Identity',
      severity: 'medium',
      message: 'Agent author has low KYC trust tier.'
    });
    recommendations.push('Complete Level 2 KYC to improve agent trust score.');
    score -= 10;
  }

  // 5. Compliance Checks
  const compliance: ComplianceReport = {
    eu_cra: score > 70 && deps.length > 0,
    nist_ai_rmf: score > 60 && !!abom.risk_level,
    kyc_complete: kycTier >= 2
  };

  // Grade calculation
  let grade: ScanResult['grade'] = 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';

  return {
    score: Math.max(0, score),
    grade,
    risks,
    recommendations,
    compliance,
    timestamp: new Date().toISOString()
  };
}

// Made with Bob
