/**
 * Meta Validator Plugin
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Validates the meta section of AIX manifests
 *
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { ValidationPlugin } from '../validation-plugins.js';
import {
  isValidID,
  isValidISO8601,
  isValidSemver,
  addError,
  validateRequiredFields
} from './validation-utils.js';

/**
 * Validates the meta section of AIX manifests
 * Checks required fields, ID format, timestamps, and version format
 */
export class MetaValidator extends ValidationPlugin {
  constructor() {
    super('meta', 10); // High priority - meta is fundamental
  }

  getTargetFields() {
    return ['meta'];
  }

  async validate(manifest, context) {
    const meta = manifest.meta;

    // Check if meta section exists
    if (!meta) {
      addError(context, 'MISSING_SECTION', 'meta', 'Missing required section: meta');
      return;
    }

    // Validate required fields
    const required = ['version', 'id', 'name', 'created', 'author'];
    validateRequiredFields(meta, required, context, 'meta');

    // Validate ID format
    if (meta.id && !isValidID(meta.id)) {
      addError(
        context,
        'INVALID_ID',
        'meta',
        'Invalid ID format. Must be a valid DID (did:axiom:* or did:web:*)',
        { field: 'id' }
      );
    }

    // Validate ISO 8601 timestamp
    if (meta.created && !isValidISO8601(meta.created)) {
      addError(
        context,
        'INVALID_TIMESTAMP',
        'meta',
        'Invalid ISO 8601 timestamp format',
        { field: 'created' }
      );
    }

    // Validate semantic version
    if (meta.version && !isValidSemver(meta.version)) {
      addError(
        context,
        'INVALID_VERSION',
        'meta',
        'Invalid semantic version format (expected: X.Y.Z)',
        { field: 'version' }
      );
    }

    // Validate lineage if present
    if (meta.lineage) {
      if (!Array.isArray(meta.lineage)) {
        addError(
          context,
          'INVALID_TYPE',
          'meta',
          'Lineage must be an array',
          { field: 'lineage' }
        );
      } else {
        meta.lineage.forEach((entry, index) => {
          if (!entry.parent_id) {
            addError(
              context,
              'MISSING_FIELD',
              'meta.lineage',
              `Lineage entry at index ${index} is missing 'parent_id'`,
              { index, field: 'parent_id' }
            );
          }
        });
      }
    }
  }
}

export default MetaValidator;

// Made with Bob
