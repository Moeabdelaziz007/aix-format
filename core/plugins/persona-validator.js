/**
 * Persona Validator Plugin
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Validates the persona section of AIX manifests
 *
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { ValidationPlugin } from '../validation-plugins.js';
import { addError, validateRequiredFields, validateRange } from './validation-utils.js';

/**
 * Validates the persona section of AIX manifests
 * Checks required fields and temperature range
 */
export class PersonaValidator extends ValidationPlugin {
  constructor() {
    super('persona', 20);
  }

  getTargetFields() {
    return ['persona'];
  }

  async validate(manifest, context) {
    const persona = manifest.persona;

    // Persona is optional, skip if not present
    if (!persona) {
      return;
    }

    // Validate required fields
    const required = ['role', 'instructions'];
    validateRequiredFields(persona, required, context, 'persona');

    // Validate temperature range if present
    if (persona.temperature !== undefined) {
      if (typeof persona.temperature !== 'number') {
        addError(
          context,
          'INVALID_TYPE',
          'persona',
          'Temperature must be a number',
          { field: 'temperature' }
        );
      } else {
        validateRange(persona.temperature, 0, 2, context, 'persona', 'temperature');
      }
    }
  }
}

export default PersonaValidator;

// Made with Bob
