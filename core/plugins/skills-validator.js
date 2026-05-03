/**
 * Skills Validator Plugin
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Validates the skills section of AIX manifests
 *
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { ValidationPlugin } from '../validation-plugins.js';
import { addError } from './validation-utils.js';

/**
 * Validates the skills section of AIX manifests
 * Checks array structure, required fields, and duplicate names
 */
export class SkillsValidator extends ValidationPlugin {
  constructor() {
    super('skills', 30);
  }

  getTargetFields() {
    return ['skills'];
  }

  async validate(manifest, context) {
    const skills = manifest.skills;

    // Skills is optional, skip if not present
    if (!skills) {
      return;
    }

    // Validate array type
    if (!Array.isArray(skills)) {
      addError(context, 'INVALID_TYPE', 'skills', 'Skills must be an array');
      return;
    }

    // Track duplicate names
    const names = new Set();

    // Validate each skill
    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];

      // Check required name field
      if (!skill.name) {
        addError(
          context,
          'MISSING_FIELD',
          'skills',
          `Skill at index ${i} is missing 'name' field`,
          { index: i, field: 'name' }
        );
      }

      // Check for duplicate names
      if (skill.name) {
        if (names.has(skill.name)) {
          addError(
            context,
            'DUPLICATE_NAME',
            'skills',
            `Duplicate skill name: ${skill.name}`,
            { field: 'name' }
          );
        }
        names.add(skill.name);
      }

      // Check required description field
      if (!skill.description) {
        addError(
          context,
          'MISSING_FIELD',
          'skills',
          `Skill '${skill.name || 'at index ' + i}' is missing 'description' field`,
          { index: i, field: 'description' }
        );
      }
    }
  }
}

export default SkillsValidator;

// Made with Bob
