import { AgentManifest } from "@aix-core";

export interface ScanReport {
  safetyScore: number;
  vulnerabilities: string[];
  compliant: boolean;
}

/**
 * scanAgent
 * Real ABOM risk scoring engine stub in studio.
 * Delegated to core logic when available.
 */
export function scanAgent(manifest: Partial<AgentManifest>): ScanReport {
  let score = 7.0; // Base score
  const vulnerabilities: string[] = [];

  if (!manifest.abom) {
    score -= 2.0;
    vulnerabilities.push("Missing Agent Bill of Materials (ABOM)");
  }

  if (manifest.persona?.system_prompt && manifest.persona.system_prompt.length < 50) {
    score -= 1.0;
    vulnerabilities.push("System prompt too short - potential lack of grounding");
  }

  return {
    safetyScore: Math.max(0, score),
    vulnerabilities,
    compliant: score >= 5.0
  };
}
