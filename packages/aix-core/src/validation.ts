/**
 * ✅ AIX VALIDATION ENGINE
 * Functional, rule-based validation for the Sovereign Protocol.
 * 
 * Made with Moe Abdelaziz
 */

import { ValidationRule, ValidationError, ValidationResult, ValidationResultSchema } from './domain';

export class ValidationEngine {
  private rules: ValidationRule[] = [];

  register(rule: ValidationRule) {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  async validate(data: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let riskScore = 0;

    for (const rule of this.rules) {
      try {
        const result = await rule.check(data);
        if (result !== true) {
          const msg = typeof result === 'string' ? result : (rule.message || `Validation failed: ${rule.name}`);
          const entry = { rule: rule.name, message: msg, section: rule.section };
          
          if (rule.priority >= 80) {
            errors.push(entry);
            riskScore += (rule.priority - 50);
          } else {
            warnings.push(entry);
            riskScore += (rule.priority / 10);
          }
        }
      } catch (err: any) {
        errors.push({ 
          rule: rule.name, 
          message: `Execution Error: ${err.message}`, 
          section: rule.section 
        });
      }
    }

    return ValidationResultSchema.parse({
      valid: errors.length === 0,
      errors,
      warnings,
      riskScore: Math.min(100, riskScore)
    });
  }
}

// --- UTILITIES ---
export const Validators = {
  isValidID: (id: string) => /^did:(axiom|web):.+/.test(id),
  isValidISO8601: (ts: string) => !isNaN(Date.parse(ts)),
  isValidSemver: (v: string) => /^\d+\.\d+\.\d+/.test(v),
  isValidURL: (url: string) => {
    try { new URL(url); return true; } catch { return false; }
  },
  hasFields: (obj: any, fields: string[]) => fields.every(f => obj?.[f]),
  isInRange: (val: number, min: number, max: number) => val >= min && val <= max,
  isEnum: (val: any, allowed: any[]) => allowed.includes(val),
};
