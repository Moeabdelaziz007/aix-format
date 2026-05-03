/**
 * ABOM (AI Bill of Materials) Validator Plugin
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Validates the ABOM section of AIX manifests
 *
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { ValidationPlugin } from '../validation-plugins.js';
import { addError, addWarning, isValidISO8601 } from './validation-utils.js';

// ABOM field enumerations
const ABOM_VALID_TYPES = ['model', 'dataset', 'library', 'tool', 'plugin', 'agent', 'runtime'];
const ABOM_VALID_TRUST_TIERS = ['verified', 'community', 'unverified', 'revoked'];
const ABOM_VALID_SEC_STATUSES = ['clean', 'vulnerable', 'revoked', 'unknown'];
const ABOM_INTEGRITY_RE = /^[a-zA-Z0-9-]+:[a-fA-F0-9]{32,}$/;
const ABOM_PURL_RE = /^pkg:[a-zA-Z][a-zA-Z0-9+\-.]*\/.+/;

/**
 * Validates the ABOM section of AIX manifests
 * Checks constituents, tools, and security properties
 */
export class ABOMValidator extends ValidationPlugin {
  constructor() {
    super('abom', 60);
  }

  getTargetFields() {
    return ['abom'];
  }

  async validate(manifest, context) {
    const abom = manifest.abom;

    // ABOM is optional, skip if not present
    if (!abom) {
      return;
    }

    const sec = 'abom';

    // Validate spec_version
    if (abom.spec_version !== undefined && typeof abom.spec_version !== 'string') {
      addError(
        context,
        'INVALID_TYPE',
        sec,
        'abom.spec_version must be a string (e.g. "1.0")',
        { field: 'spec_version' }
      );
    }

    // Validate generated timestamp
    if (abom.generated !== undefined && !isValidISO8601(abom.generated)) {
      addError(
        context,
        'INVALID_TIMESTAMP',
        sec,
        'abom.generated must be a valid ISO 8601 timestamp',
        { field: 'generated' }
      );
    }

    // Validate tools array
    if (abom.tools !== undefined) {
      if (!Array.isArray(abom.tools)) {
        addError(context, 'INVALID_TYPE', sec, 'abom.tools must be an array', { field: 'tools' });
      } else {
        abom.tools.forEach((tool, i) => {
          if (!tool.name) {
            addError(
              context,
              'MISSING_FIELD',
              `${sec}.tools`,
              `abom.tools[${i}] is missing required field 'name'`,
              { index: i, field: 'name' }
            );
          }
        });
      }
    }

    // Validate constituents
    if (!abom.constituents) {
      addWarning(
        context,
        'ABOM_EMPTY',
        sec,
        'abom.constituents is missing or empty — consider listing all agent dependencies'
      );
      return;
    }

    if (!Array.isArray(abom.constituents)) {
      addError(
        context,
        'INVALID_TYPE',
        sec,
        'abom.constituents must be an array',
        { field: 'constituents' }
      );
      return;
    }

    // Validate each constituent
    abom.constituents.forEach((item, index) => {
      this.validateConstituent(item, index, context);
    });
  }

  /**
   * Validate a single ABOM constituent
   * @param {Object} item - The constituent to validate
   * @param {number} index - Index in constituents array
   * @param {Object} context - Validation context
   */
  validateConstituent(item, index, context) {
    const sec = `abom.constituents[${index}]`;
    const label = item.name ? `'${item.name}'` : `at index ${index}`;

    // Validate required fields
    const mandatory = ['name', 'version', 'type', 'purl'];
    for (const field of mandatory) {
      if (!item[field]) {
        addError(
          context,
          'MISSING_FIELD',
          sec,
          `Constituent ${label} is missing required AI-SBOM field '${field}'`,
          { field }
        );
      }
    }

    // Validate type
    if (item.type && !ABOM_VALID_TYPES.includes(item.type)) {
      addError(
        context,
        'INVALID_VALUE',
        sec,
        `Constituent ${label} type '${item.type}' is invalid. Must be one of: ${ABOM_VALID_TYPES.join(', ')}`,
        { field: 'type' }
      );
    }

    // Validate purl format
    if (item.purl && !ABOM_PURL_RE.test(item.purl)) {
      addError(
        context,
        'INVALID_PURL',
        sec,
        `Constituent ${label} has invalid purl '${item.purl}'`,
        { field: 'purl' }
      );
    }

    // Validate integrity hash
    if (item.integrity_hash !== undefined) {
      if (typeof item.integrity_hash !== 'string' || !ABOM_INTEGRITY_RE.test(item.integrity_hash)) {
        addError(
          context,
          'INVALID_INTEGRITY_HASH',
          sec,
          `Constituent ${label} integrity_hash must follow 'algorithm:hexdigest' format`,
          { field: 'integrity_hash' }
        );
      }
    }

    // Validate trust tier
    if (item.trust_tier !== undefined) {
      if (!ABOM_VALID_TRUST_TIERS.includes(item.trust_tier)) {
        addError(
          context,
          'INVALID_VALUE',
          sec,
          `Constituent ${label} trust_tier '${item.trust_tier}' is invalid`,
          { field: 'trust_tier' }
        );
      } else {
        if (item.trust_tier === 'revoked') {
          addError(
            context,
            'ABOM_REVOKED_CONSTITUENT',
            sec,
            `SECURITY: Constituent ${label} has trust_tier='revoked'`,
            { field: 'trust_tier' }
          );
        }
        if (item.trust_tier === 'unverified') {
          addWarning(
            context,
            'ABOM_UNVERIFIED_CONSTITUENT',
            sec,
            `Constituent ${label} has trust_tier='unverified'`,
            { field: 'trust_tier' }
          );
        }
        if (item.trust_tier === 'verified' && !item.integrity_hash) {
          addWarning(
            context,
            'ABOM_VERIFIED_WITHOUT_HASH',
            sec,
            `Constituent ${label} claims trust_tier='verified' but provides no integrity_hash`,
            { field: 'integrity_hash' }
          );
        }
      }
    }

    // Validate security status
    if (item.security_status !== undefined) {
      if (!ABOM_VALID_SEC_STATUSES.includes(item.security_status)) {
        addError(
          context,
          'INVALID_VALUE',
          sec,
          `Constituent ${label} security_status '${item.security_status}' is invalid`,
          { field: 'security_status' }
        );
      } else {
        if (item.security_status === 'revoked') {
          addError(
            context,
            'ABOM_REVOKED_CONSTITUENT',
            sec,
            `SECURITY: Constituent ${label} has security_status='revoked'`,
            { field: 'security_status' }
          );
        }
        if (item.security_status === 'vulnerable') {
          addWarning(
            context,
            'ABOM_VULNERABLE_CONSTITUENT',
            sec,
            `Constituent ${label} has known vulnerabilities`,
            { field: 'security_status' }
          );
        }
      }
    }

    // Validate supplier
    if (item.supplier !== undefined) {
      if (typeof item.supplier !== 'string' || item.supplier.trim() === '') {
        addError(
          context,
          'INVALID_VALUE',
          sec,
          `Constituent ${label} supplier must be a non-empty string`,
          { field: 'supplier' }
        );
      }
    }

    // Validate license
    if (item.license !== undefined && typeof item.license !== 'string') {
      addError(
        context,
        'INVALID_TYPE',
        sec,
        `Constituent ${label} license must be a string`,
        { field: 'license' }
      );
    }
  }
}

export default ABOMValidator;

// Made with Bob
