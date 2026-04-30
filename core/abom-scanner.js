/**
 * ABOM Scanner - Sovereign Risk Scoring Engine
 * Analyzes AIX manifests for security, compliance, and supply chain risks.
 */

export function scanAgent(agent) {
  const risks = [];
  const recommendations = [];
  let score = 100; // Start with perfect score

  const meta = agent.meta || {};
  const skills = agent.skills || [];
  const abom = agent.abom || {};
  const identity = agent.identity_layer || {};

  // 1. Analyze Capabilities (Skills)
  const highRiskSkills = ['filesystem_access', 'network_request', 'shell_exec', 'code_execution'];
  skills.forEach(skill => {
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
  const deps = abom.constituents || abom.dependencies || [];
  if (deps.length === 0) {
    risks.push({
      category: 'Supply Chain',
      severity: 'medium',
      message: 'No dependencies listed in ABOM. Integrity cannot be verified.'
    });
    recommendations.push('List all third-party models and libraries in the ABOM section.');
    score -= 10;
  } else {
    deps.forEach(dep => {
      const name = typeof dep === 'string' ? dep : dep.name;
      if (!name) return;
      
      // Simulated "known vulnerable" or "untrusted" list
      const untrusted = ['legacy-unverified-model', 'unsafe-adapter'];
      if (untrusted.some(u => name.toLowerCase().includes(u))) {
        risks.push({
          category: 'Supply Chain',
          severity: 'critical',
          message: `Untrusted dependency detected: ${name}`
        });
        score -= 25;
      }
    });
  }

  // 3. Identity & Trust
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

  // 4. Compliance Checks
  const compliance = {
    eu_cra: score > 70 && deps.length > 0,
    nist_ai_rmf: score > 60 && !!abom.risk_level,
    kyc_complete: kycTier >= 2
  };

  // Grade calculation
  let grade = 'F';
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
