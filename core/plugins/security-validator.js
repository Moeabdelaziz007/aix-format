/**
 * Security Validator Plugin
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Validates the security section of AIX manifests
 *
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { ValidationPlugin } from '../validation-plugins.js';
import { addError, validateEnum } from './validation-utils.js';

/**
 * Validates the security section of AIX manifests
 * Checks checksum structure and algorithm validity
 */
export class SecurityValidator extends ValidationPlugin {
  constructor() {
    super('security', 15); // High priority - security is critical
  }

  getTargetFields() {
    return ['security'];
  }

  async validate(manifest, context) {
    const security = manifest.security;

    // Security is optional, skip if not present
    if (!security) {
      return;
    }

    // Validate checksum structure
    if (!security.checksum) {
      addError(
        context,
        'MISSING_FIELD',
        'security',
        'Required field security.checksum is missing',
        { field: 'checksum' }
      );
      return;
    }

    if (!security.checksum.algorithm) {
      addError(
        context,
        'MISSING_FIELD',
        'security.checksum',
        'Required field security.checksum.algorithm is missing',
        { field: 'algorithm' }
      );
    }

    if (!security.checksum.value) {
      addError(
        context,
        'MISSING_FIELD',
        'security.checksum',
        'Required field security.checksum.value is missing',
        { field: 'value' }
      );
    }

    // Validate algorithm
    const validAlgorithms = ['sha256', 'sha512', 'blake3'];
    if (security.checksum.algorithm) {
      validateEnum(
        security.checksum.algorithm,
        validAlgorithms,
        context,
        'security.checksum',
        'algorithm'
      );
    }
  }
}

export default SecurityValidator;

// Made with Bob
