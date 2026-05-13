/**
 * Example Custom Validation Plugin
 * 
 * This demonstrates how to create custom validators for AIX manifests
 * without modifying core code.
 */

import { ValidationPlugin } from '../core/validation-plugins.js';
import { addError, addWarning } from '../core/validation-utils.js';

/**
 * Example 1: Company-specific naming convention validator
 * Enforces that all agent names follow company standards
 */
export class CompanyNamingValidator extends ValidationPlugin {
  constructor(prefix = 'ACME-') {
    super('company-naming', 100); // Lower priority runs after core validators
    this.requiredPrefix = prefix;
  }

  getTargetFields() {
    return ['meta'];
  }

  async validate(manifest, context) {
    const name = manifest.meta?.name;
    
    if (name && !name.startsWith(this.requiredPrefix)) {
      addError(
        context,
        'NAMING_CONVENTION',
        'meta',
        `Agent name must start with '${this.requiredPrefix}' prefix`,
        { field: 'name', expected: this.requiredPrefix }
      );
    }
  }
}

/**
 * Example 2: Compliance validator
 * Ensures agents meet regulatory requirements
 */
export class ComplianceValidator extends ValidationPlugin {
  constructor() {
    super('compliance', 90);
  }

  getTargetFields() {
    return ['meta', 'security', 'abom'];
  }

  async validate(manifest, context) {
    // Require author contact information
    if (manifest.meta && !manifest.meta.author_email) {
      addWarning(
        context,
        'COMPLIANCE_WARNING',
        'meta',
        'Author email is recommended for compliance tracking',
        { field: 'author_email' }
      );
    }

    // Require security checksum for production agents
    if (manifest.meta?.environment === 'production') {
      if (!manifest.security?.checksum) {
        addError(
          context,
          'COMPLIANCE_ERROR',
          'security',
          'Production agents must have security checksums',
          { field: 'checksum' }
        );
      }
    }

    // Require ABOM for agents using external dependencies
    if (manifest.apis || manifest.mcp) {
      if (!manifest.abom || !manifest.abom.constituents?.length) {
        addWarning(
          context,
          'COMPLIANCE_WARNING',
          'abom',
          'Agents with external dependencies should document them in ABOM'
        );
      }
    }
  }
}

/**
 * Example 3: Performance validator
 * Checks for potential performance issues
 */
export class PerformanceValidator extends ValidationPlugin {
  constructor() {
    super('performance', 110);
  }

  getTargetFields() {
    return ['skills', 'apis', 'mcp'];
  }

  async validate(manifest, context) {
    // Warn about too many skills
    if (manifest.skills && manifest.skills.length > 20) {
      addWarning(
        context,
        'PERFORMANCE_WARNING',
        'skills',
        `Agent has ${manifest.skills.length} skills. Consider splitting into multiple agents for better performance`,
        { count: manifest.skills.length }
      );
    }

    // Warn about too many API integrations
    if (manifest.apis && manifest.apis.length > 10) {
      addWarning(
        context,
        'PERFORMANCE_WARNING',
        'apis',
        `Agent integrates with ${manifest.apis.length} APIs. This may impact response time`,
        { count: manifest.apis.length }
      );
    }

    // Check for high temperature settings
    if (manifest.persona?.temperature > 1.5) {
      addWarning(
        context,
        'PERFORMANCE_WARNING',
        'persona',
        'High temperature (>1.5) may produce inconsistent results',
        { field: 'temperature', value: manifest.persona.temperature }
      );
    }
  }
}

/**
 * Example 4: Security hardening validator
 * Enforces additional security best practices
 */
export class SecurityHardeningValidator extends ValidationPlugin {
  constructor() {
    super('security-hardening', 95);
  }

  getTargetFields() {
    return ['security', 'apis', 'mcp'];
  }

  async validate(manifest, context) {
    // Require strong checksum algorithms
    if (manifest.security?.checksum?.algorithm === 'sha256') {
      addWarning(
        context,
        'SECURITY_WARNING',
        'security.checksum',
        'Consider using sha512 or blake3 for stronger security',
        { field: 'algorithm' }
      );
    }

    // Check for unencrypted API endpoints
    if (manifest.apis) {
      manifest.apis.forEach((api, index) => {
        if (api.base_url && !api.base_url.startsWith('https://')) {
          addError(
            context,
            'SECURITY_ERROR',
            'apis',
            `API '${api.name}' uses unencrypted HTTP. Use HTTPS instead`,
            { index, field: 'base_url' }
          );
        }
      });
    }

    // Warn about missing rate limiting
    if (manifest.apis && manifest.apis.length > 0) {
      const hasRateLimiting = manifest.apis.some(api => api.rate_limit);
      if (!hasRateLimiting) {
        addWarning(
          context,
          'SECURITY_WARNING',
          'apis',
          'Consider adding rate limiting to API configurations'
        );
      }
    }
  }
}

// ─── Usage Example ────────────────────────────────────────────────────────────

/**
 * How to use custom plugins:
 * 
 * import { AIXParser, defaultRegistry } from '../core/parser.js';
 * import { CompanyNamingValidator, ComplianceValidator } from './custom-validator-plugin.js';
 * 
 * // Register custom plugins
 * defaultRegistry.register(new CompanyNamingValidator('MYCOMPANY-'));
 * defaultRegistry.register(new ComplianceValidator());
 * 
 * // Parse with custom validation
 * const parser = new AIXParser();
 * const agent = await parser.parseFile('my-agent.aix');
 * 
 * // Or create a custom registry
 * import { PluginRegistry } from '../core/validation-plugins.js';
 * const customRegistry = new PluginRegistry();
 * customRegistry.register(new CompanyNamingValidator());
 * 
 * const parser = new AIXParser({ registry: customRegistry });
 * const agent = await parser.parseFile('my-agent.aix');
 */

// Made with Moe Abdelaziz
