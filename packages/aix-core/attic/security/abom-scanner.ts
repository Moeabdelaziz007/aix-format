/**
 * 🛡️ ABOM Scanner (Sovereign Version)
 * [AI_COGNITIVE_FOOTPRINT]: {
 *   "role": "Static and dynamic analysis of Agent Bill of Materials",
 *   "logic": "Scans for sensitive API keys, dangerous capability combinations, and schema violations"
 * }
 * Made with Moe Abdelaziz
 */

import { z } from 'zod';

export const SafetyRuleSchema = z.object({
  id: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  check: z.function().args(z.any()).returns(z.boolean())
});

export type SafetyRule = z.infer<typeof SafetyRuleSchema>;

export class AbomScanner {
  private static rules: SafetyRule[] = [
    {
      id: 'hardcoded-secrets',
      severity: 'critical',
      description: 'Detects potential hardcoded secrets in agent config',
      check: (config: any) => {
        const str = JSON.stringify(config);
        return !/sk-[a-zA-Z0-9]{32,}/.test(str); // Simple OpenAI-like key detection
      }
    },
    {
      id: 'excessive-capabilities',
      severity: 'high',
      description: 'Checks for dangerous tool combinations (e.g., terminal + network)',
      check: (config: any) => {
        const tools = config.tools || [];
        const hasTerminal = tools.some((t: any) => t.name === 'terminal' || t.name === 'shell');
        const hasNetwork = tools.some((t: any) => t.name === 'http' || t.name === 'fetch');
        return !(hasTerminal && hasNetwork);
      }
    }
  ];

  /**
   * Scans an agent configuration and returns safety results
   */
  static scan(config: any): { score: number; violations: string[] } {
    const violations: string[] = [];
    let penalty = 0;

    for (const rule of this.rules) {
      if (!rule.check(config)) {
        violations.push(`${rule.id}: ${rule.description}`);
        if (rule.severity === 'critical') penalty += 5;
        else if (rule.severity === 'high') penalty += 3;
        else if (rule.severity === 'medium') penalty += 2;
        else penalty += 1;
      }
    }

    return {
      score: Math.max(0, 10 - penalty),
      violations
    };
  }
}
