/**
 * Memory Validator Plugin
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Validates the memory section of AIX manifests
 *
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { ValidationPlugin } from '../validation-plugins.js';
import { addError, validateRange } from './validation-utils.js';

/**
 * Validates the memory section of AIX manifests
 * Checks memory types and similarity threshold ranges
 */
export class MemoryValidator extends ValidationPlugin {
  constructor() {
    super('memory', 50);
  }

  getTargetFields() {
    return ['memory'];
  }

  async validate(manifest, context) {
    const memory = manifest.memory;

    // Memory is optional, skip if not present
    if (!memory) {
      return;
    }

    // Validate memory types
    const validMemoryTypes = ['episodic', 'semantic', 'procedural'];
    for (const key of Object.keys(memory)) {
      if (!validMemoryTypes.includes(key)) {
        addError(
          context,
          'INVALID_MEMORY_TYPE',
          'memory',
          `Memory type must be one of: ${validMemoryTypes.join(', ')}`,
          { field: key }
        );
      }
    }

    // Validate semantic memory similarity threshold
    if (memory.semantic && memory.semantic.similarity_threshold !== undefined) {
      const threshold = memory.semantic.similarity_threshold;
      if (typeof threshold !== 'number') {
        addError(
          context,
          'INVALID_TYPE',
          'memory.semantic',
          'Similarity threshold must be a number',
          { field: 'similarity_threshold' }
        );
      } else {
        validateRange(threshold, 0, 1, context, 'memory.semantic', 'similarity_threshold');
      }
    }
  }
}

export default MemoryValidator;

// Made with Bob
