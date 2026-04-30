import crypto from 'node:crypto';

/**
 * AIX Detective - Core Scanning Logic
 * Pure functions for maximum testability.
 */

/**
 * Scans text for common prompt injection patterns.
 * @param {string} text
 * @returns {Array<{pattern: string, severity: 'high' | 'medium'}>}
 */
export function scanPromptInjection(text) {
  if (!text) return [];

  const rules = [
    {
      name: 'Ignore Commands',
      pattern: /\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior)\s+instructions\b/i,
      severity: 'high'
    },
    {
      name: 'System Override',
      pattern: /\b(system|original|initial)\s+(prompt|instruction|rule|configuration)\b/i,
      severity: 'high'
    },
    {
      name: 'Persona Hijack',
      pattern: /\b(you\s+are|assume\s+the\s+role\s+of|act\s+as|DAN)\b/i,
      severity: 'medium'
    },
    {
      name: 'Output Hijack',
      pattern: /\b(output|print|reveal|display|show)\s+(your|the)\s+(system|initial)\s+(prompt|instructions|rules)\b/i,
      severity: 'high'
    }
  ];

  return rules
    .filter(rule => rule.pattern.test(text))
    .map(rule => ({ name: rule.name, severity: rule.severity }));
}

/**
 * Verifies the integrity of the ABOM section.
 * @param {Object} abom
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function verifyABOMIntegrity(abom) {
  const errors = [];
  if (!abom) return { valid: false, errors: ['ABOM missing'] };

  if (!abom.integrity_hash) {
    errors.push('Missing top-level integrity_hash in ABOM');
  }

  if (abom.constituents) {
    abom.constituents.forEach((item, index) => {
      if (!item.integrity_hash && !item.hash) {
        errors.push(`Constituent [${index}: ${item.name || 'unknown'}] is missing integrity hash`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Audits the identity layer for KYC and verification.
 * @param {Object} identity
 * @returns {{ tier: number, verified: boolean, status: string }}
 */
export function auditIdentity(identity) {
  if (!identity) {
    return { tier: 0, verified: false, status: 'unverified' };
  }

  const tier = identity.kyc_tier || 0;
  const verified = !!identity.verified;

  let status = 'unverified';
  if (verified) {
    status = tier >= 2 ? 'sovereign' : 'verified';
  }

  return { tier, verified, status };
}

/**
 * Determines the trust tier based on audit results.
 * @param {Object} auditResults
 * @returns {'trusted' | 'caution' | 'malicious'}
 */
export function calculateTrustTier(auditResults) {
  const { injectionCount, abomValid, identityStatus } = auditResults;

  if (injectionCount > 0) return 'malicious';
  if (!abomValid || identityStatus === 'unverified') return 'caution';
  if (identityStatus === 'sovereign') return 'trusted';

  return 'caution';
}
