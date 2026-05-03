/**
 * APIs Validator Plugin
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Validates the APIs section of AIX manifests
 *
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { ValidationPlugin } from '../validation-plugins.js';
import { addError, isValidURL } from './validation-utils.js';

/**
 * Validates the APIs section of AIX manifests
 * Checks array structure, required fields, and URL validity
 */
export class APIsValidator extends ValidationPlugin {
  constructor() {
    super('apis', 35);
  }

  getTargetFields() {
    return ['apis'];
  }

  async validate(manifest, context) {
    const apis = manifest.apis;

    // APIs is optional, skip if not present
    if (!apis) {
      return;
    }

    // Validate array type
    if (!Array.isArray(apis)) {
      addError(context, 'INVALID_TYPE', 'apis', 'APIs must be an array');
      return;
    }

    // Validate each API
    for (let i = 0; i < apis.length; i++) {
      const api = apis[i];

      // Check required name field
      if (!api.name) {
        addError(
          context,
          'MISSING_FIELD',
          'apis',
          `API at index ${i} is missing 'name' field`,
          { index: i, field: 'name' }
        );
      }

      // Check required base_url field
      if (!api.base_url) {
        addError(
          context,
          'MISSING_FIELD',
          'apis',
          `API '${api.name || 'at index ' + i}' is missing 'base_url' field`,
          { index: i, field: 'base_url' }
        );
      } else if (!isValidURL(api.base_url)) {
        addError(
          context,
          'INVALID_URL',
          'apis',
          `API '${api.name}' has invalid URL`,
          { index: i, field: 'base_url' }
        );
      }
    }
  }
}

export default APIsValidator;

// Made with Bob
