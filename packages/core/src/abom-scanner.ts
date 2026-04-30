import { AgentRecord, AbomManifest } from '../../apps/studio/src/lib/types';

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

export function scanAgent(agent: any): ScanReport {
  let score = 0;
  const risks: Risk[] = [];
  const recommendations: string[] = [];

  // 1. abom.integrity_hash موجود → +10
  if (agent.abom?.integrity_hash) {
    score += 10;
  } else {
    risks.push({ category: 'Security', severity: 'high', message: 'Missing ABOM integrity hash' });
    recommendations.push('Generate a SHA-256 integrity hash for your agent manifest');
  }

  // 2. abom.model.provider معروف (openai, anthropic, etc.) → +10
  const knownProviders = ['openai', 'anthropic', 'google', 'meta', 'mistral', 'cohere'];
  if (agent.abom?.model?.provider && knownProviders.includes(agent.abom.model.provider.toLowerCase())) {
    score += 10;
  } else {
    risks.push({ category: 'Supply Chain', severity: 'medium', message: 'Unknown or missing model provider' });
    recommendations.push('Specify a recognized AI model provider in ABOM metadata');
  }

  // 3. abom.dataset.provenance موجود → +10
  if (agent.abom?.dataset?.sources && agent.abom.dataset.sources.length > 0) {
    score += 10;
  } else {
    risks.push({ category: 'Transparency', severity: 'medium', message: 'Missing dataset provenance' });
    recommendations.push('Document the data sources used for agent training or fine-tuning');
  }

  // 4. abom.governance.human_oversight = true → +15
  if (agent.abom?.governance?.human_oversight === true) {
    score += 15;
  } else {
    risks.push({ category: 'Governance', severity: 'high', message: 'No human oversight declared' });
    recommendations.push('Implement a human-in-the-loop mechanism for critical actions');
  }

  // 5. identity.did موجود → +10
  if (agent.identity_layer?.id || agent.did) {
    score += 10;
  } else {
    risks.push({ category: 'Identity', severity: 'critical', message: 'Missing Sovereign DID' });
    recommendations.push('Register a Decentralized Identifier (DID) via AxiomID');
  }

  // 6. kyc_tier = 'verified' → +10
  if (agent.kyc_tier === 'verified' || agent.identity_layer?.kyc_tier === 'verified') {
    score += 10;
  } else {
    risks.push({ category: 'Trust', severity: 'medium', message: 'Identity not verified' });
    recommendations.push('Complete Pi KYC to reach the "verified" trust tier');
  }

  // 7. security.sandboxed = true → +10
  if (agent.security?.sandboxed === true) {
    score += 10;
  } else {
    risks.push({ category: 'Security', severity: 'high', message: 'Agent not sandboxed' });
    recommendations.push('Ensure the agent executes in a restricted, sandboxed environment');
  }

  // 8. مش عنده capabilities خطيرة بلا governance → +10
  const dangerousCapabilities = ['filesystem_write', 'network_raw', 'shell_exec'];
  const hasUncheckedDangerous = agent.abom?.capabilities?.some((c: string) =>
    dangerousCapabilities.includes(c)
  ) && !agent.abom?.governance?.policy_url;

  if (!hasUncheckedDangerous) {
    score += 10;
  } else {
    risks.push({ category: 'Policy', severity: 'high', message: 'Dangerous capabilities without governance policy' });
    recommendations.push('Link a clear governance policy if your agent uses privileged system access');
  }

  // 9. version موجود وصحيح (semver) → +5
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
  if (agent.meta?.version && semverRegex.test(agent.meta.version)) {
    score += 5;
  } else {
    recommendations.push('Use semantic versioning (e.g., 1.0.0) for agent manifests');
  }

  // 10. mcp.endpoints مأمونة (https فقط) → +10
  const endpoints = agent.mcp?.endpoints || [];
  const allSecure = endpoints.length > 0 && endpoints.every((e: any) => e.uri.startsWith('https://'));
  if (allSecure) {
    score += 10;
  } else if (endpoints.length > 0) {
    risks.push({ category: 'Network', severity: 'critical', message: 'Insecure MCP endpoints detected' });
    recommendations.push('Upgrade all MCP endpoints to use HTTPS');
  } else {
    score += 5; // Neutral if no endpoints
  }

  // Cap score at 100
  score = Math.min(100, score);

  // Determine Grade
  let grade: ScanReport['grade'] = 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';

  return {
    score,
    grade,
    risks,
    recommendations,
    compliance: {
      eu_cra: score >= 80,
      nist_ai_rmf: score >= 70,
      kyc_complete: agent.kyc_tier === 'verified' || agent.identity_layer?.kyc_tier === 'verified'
    }
  };
}
