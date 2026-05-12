import { ValidationEngine, Validators } from './validation';
import { ValidationResult } from './domain';

const ABOM_VALID_TYPES = ['model', 'dataset', 'library', 'tool', 'plugin', 'agent', 'runtime'];
const ABOM_VALID_TRUST_TIERS = ['verified', 'community', 'unverified', 'revoked'];

const engine = new ValidationEngine();

// 1. Spec Version Rule
engine.register({
  name: 'abom-spec-version',
  section: 'abom',
  priority: 60,
  check: (data) => !data.abom?.spec_version || typeof data.abom.spec_version === 'string',
  message: 'ABOM spec_version must be a string'
});

// 2. Missing ABOM Rule (Critical)
engine.register({
  name: 'abom-missing',
  section: 'security',
  priority: 95,
  check: (data) => !!data.abom,
  message: 'Missing ABOM security block'
});

// 3. Permissions Audit
engine.register({
  name: 'high-risk-permissions',
  section: 'security',
  priority: 85,
  check: (data) => {
    const permissions = data.abom?.permissions || data.permissions || [];
    const highRisk = ["exec:shell", "access:secrets", "network:unrestricted"];
    const found = permissions.filter((p: string) => highRisk.includes(p));
    return found.length === 0 ? true : `High-risk permissions detected: ${found.join(', ')}`;
  }
});

// 4. Constituent Types
engine.register({
  name: 'abom-constituent-type',
  section: 'abom',
  priority: 70,
  check: (data) => {
    if (!data.abom?.constituents) return true;
    const invalid = data.abom.constituents.filter((item: any) => item.type && !ABOM_VALID_TYPES.includes(item.type));
    return invalid.length === 0 ? true : `Invalid constituent types: ${invalid.map((i: any) => i.type).join(', ')}`;
  }
});

export class AbomScanner {
  /**
   * Scan an agent manifest for security risks.
   * Uses high-fidelity functional rules.
   */
  static async scan(manifest: any): Promise<ValidationResult> {
    return engine.validate(manifest);
  }
}

