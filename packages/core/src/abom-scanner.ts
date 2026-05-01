import type { AIXManifest, ABOM } from './types.ts';

export interface ScanReport {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  risks: Risk[];
  recommendations: string[];
  compliance: {
    eu_cra: boolean;
    nist_ai_rmf: boolean;
    kyc_complete: boolean;
  };
}

export interface Risk {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

/**
 * AIX v1.3 Security Invariants
 * Single source of truth for protocol-level security constraints.
 */
export const SecurityInvariants = {
  REQUIRED_PROVENANCE_TYPES: ['saas', 'utility', 'hybrid', 'infra'],
  MIN_COMPLIANCE_FOR_HIGH_RISK: 'high',
  MANDATORY_SANDBOX_FOR_MCP: true,
};

export function scanAgent(agent: any): ScanReport {
  let score = 0;
  const risks: Risk[] = [];
  const recommendations: string[] = [];

  // ... (lines 26-114 remain similar but I'll update the logic below)
  
  // Basic Checks (Score points)
  if (agent.abom?.integrity_hash) score += 10;
  else risks.push({ category: 'Security', severity: 'high', message: 'Missing ABOM integrity hash' });

  if (agent.abom?.governance?.human_oversight) score += 15;
  else risks.push({ category: 'Governance', severity: 'high', message: 'No human oversight declared' });

  if (agent.security?.sandboxed) score += 10;
  else risks.push({ category: 'Security', severity: 'high', message: 'Agent not sandboxed' });

  // 11. Rule 11: build_provenance enforcement based on type
  const requiresProvenance = SecurityInvariants.REQUIRED_PROVENANCE_TYPES.includes(agent.meta?.type);
  if (requiresProvenance) {
    if (agent.build_provenance?.verified) {
      score += 15;
    } else {
      risks.push({ category: 'Security', severity: 'critical', message: `Agent type '${agent.meta?.type}' requires verified build_provenance` });
      recommendations.push('Generate a verified build_provenance to meet AIX v1.3 standards for this agent type');
    }
  }

  // 12. Rule 12: High-risk SaaS Compliance
  if (agent.abom?.risk_level === 'high' || agent.abom?.risk_level === 'critical') {
    const services = agent.abom?.saas_services || [];
    const nonCompliant = services.filter((s: any) => s.compliance_tier !== SecurityInvariants.MIN_COMPLIANCE_FOR_HIGH_RISK);
    
    if (nonCompliant.length > 0) {
      risks.push({ category: 'Supply Chain', severity: 'critical', message: `High-risk agents require '${SecurityInvariants.MIN_COMPLIANCE_FOR_HIGH_RISK}' compliance for all SaaS services` });
      recommendations.push(`Upgrade SaaS dependencies: ${nonCompliant.map((s: any) => s.name).join(', ')}`);
    } else if (services.length > 0) {
      score += 10;
    }
  }

  // 13. Rule 13: MCP Sandbox Invariant
  if (agent.mcp?.endpoints?.length > 0 && !agent.security?.sandboxed) {
    risks.push({ category: 'Security', severity: 'critical', message: 'Invariant Violation: MCP usage requires mandatory sandboxing' });
    recommendations.push('Enable security.sandboxed: true to authorize MCP operations');
  }

  // 14. Identity Layer Points
  const kycMap: Record<string, number> = { 'unverified': 0, 'basic': 1, 'verified': 2, 'institutional': 3 };
  const kycLevel = typeof agent.identity_layer?.kyc_tier === 'number' ? agent.identity_layer.kyc_tier : (kycMap[agent.identity_layer?.kyc_tier] || 0);
  if (kycLevel >= 2) score += 20;
  else if (kycLevel === 1) score += 10;

  // 15. Signature Points
  if (agent.security?.signature || agent.identity_layer?.signature) score += 20;

  // 16. Protocol Version
  if (agent.meta?.format_version === "1.3.0") score += 5;

  // Cap score at 100
  score = Math.min(100, score);

  // Determine Grade
  let grade: ScanReport['grade'] = 'F';
  if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 30) grade = 'D';

  return {
    score,
    grade,
    risks,
    recommendations,
    compliance: {
      eu_cra: score >= 75,
      nist_ai_rmf: score >= 65,
      kyc_complete: kycLevel >= 2
    }
  };
}
