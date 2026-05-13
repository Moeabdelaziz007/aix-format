/**
 * ABOM Risk Scoring Engine (2026 Compliance Standard)
 */

function checkIntegrityHash(agent, result) {
  if (agent.abom?.integrity_hash) {
    result.score += 10;
  } else {
    result.risks.push({ category: 'Security', severity: 'high', message: 'Missing ABOM integrity hash' });
    result.recommendations.push('Generate a SHA-256 integrity hash for your agent manifest');
  }
}

function checkModelProvider(agent, result) {
  const knownProviders = ['openai', 'anthropic', 'google', 'meta', 'mistral', 'cohere'];
  if (agent.abom?.model?.provider && knownProviders.includes(agent.abom.model.provider.toLowerCase())) {
    result.score += 10;
  } else {
    result.risks.push({ category: 'Supply Chain', severity: 'medium', message: 'Unknown or missing model provider' });
    result.recommendations.push('Specify a recognized AI model provider in ABOM metadata');
  }
}

function checkDatasetProvenance(agent, result) {
  if (agent.abom?.dataset?.sources && agent.abom.dataset.sources.length > 0) {
    result.score += 10;
  } else {
    result.risks.push({ category: 'Transparency', severity: 'medium', message: 'Missing dataset provenance' });
    result.recommendations.push('Document the data sources used for agent training or fine-tuning');
  }
}

function checkHumanOversight(agent, result) {
  if (agent.abom?.governance?.human_oversight === true) {
    result.score += 15;
  } else {
    result.risks.push({ category: 'Governance', severity: 'high', message: 'No human oversight declared' });
    result.recommendations.push('Implement a human-in-the-loop mechanism for critical actions');
  }
}

function checkIdentity(agent, result) {
  if (agent.identity_layer?.id || agent.did) {
    result.score += 10;
  } else {
    result.risks.push({ category: 'Identity', severity: 'critical', message: 'Missing Sovereign DID' });
    result.recommendations.push('Register a Decentralized Identifier (DID) via AxiomID');
  }
}

function checkKyc(agent, result) {
  if (agent.kyc_tier === 'verified' || agent.identity_layer?.kyc_tier === 'verified') {
    result.score += 10;
  } else {
    result.risks.push({ category: 'Trust', severity: 'medium', message: 'Identity not verified' });
    result.recommendations.push('Complete Pi KYC to reach the "verified" trust tier');
  }
}

function checkSecuritySandbox(agent, result) {
  if (agent.security?.sandboxed === true) {
    result.score += 10;
  } else {
    result.risks.push({ category: 'Security', severity: 'high', message: 'Agent not sandboxed' });
    result.recommendations.push('Ensure the agent executes in a restricted, sandboxed environment');
  }
}

function checkDangerousCapabilities(agent, result) {
  const dangerousCapabilities = ['filesystem_write', 'network_raw', 'shell_exec'];
  const hasUncheckedDangerous = agent.abom?.capabilities?.some(c =>
    dangerousCapabilities.includes(c)
  ) && !agent.abom?.governance?.policy_url;

  if (!hasUncheckedDangerous) {
    result.score += 10;
  } else {
    result.risks.push({ category: 'Policy', severity: 'high', message: 'Dangerous capabilities without governance policy' });
    result.recommendations.push('Link a clear governance policy if your agent uses privileged system access');
  }
}

function checkVersion(agent, result) {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
  if (agent.meta?.version && semverRegex.test(agent.meta.version)) {
    result.score += 5;
  } else {
    result.recommendations.push('Use semantic versioning (e.g., 1.0.0) for agent manifests');
  }
}

function checkMcpEndpoints(agent, result) {
  const endpoints = agent.mcp?.endpoints || [];
  const allSecure = endpoints.length > 0 && endpoints.every(e => e.uri.startsWith('https://'));
  if (allSecure) {
    result.score += 10;
  } else if (endpoints.length > 0) {
    result.risks.push({ category: 'Network', severity: 'critical', message: 'Insecure MCP endpoints detected' });
    result.recommendations.push('Upgrade all MCP endpoints to use HTTPS');
  } else {
    result.score += 5; // Neutral if no endpoints
  }
}

function calculateGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function determineCompliance(score, agent) {
  return {
    eu_cra: score >= 80,
    nist_ai_rmf: score >= 70,
    kyc_complete: agent.kyc_tier === 'verified' || agent.identity_layer?.kyc_tier === 'verified'
  };
}

export function scanAgent(agent) {
  const result = {
    score: 0,
    risks: [],
    recommendations: []
  };

  const rules = [
    checkIntegrityHash,
    checkModelProvider,
    checkDatasetProvenance,
    checkHumanOversight,
    checkIdentity,
    checkKyc,
    checkSecuritySandbox,
    checkDangerousCapabilities,
    checkVersion,
    checkMcpEndpoints
  ];

  rules.forEach(rule => rule(agent, result));

  // Cap score at 100
  result.score = Math.min(100, result.score);

  return {
    score: result.score,
    grade: calculateGrade(result.score),
    risks: result.risks,
    recommendations: result.recommendations,
    compliance: determineCompliance(result.score, agent)
  };
}
