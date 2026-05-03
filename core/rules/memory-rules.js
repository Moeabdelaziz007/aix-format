/**
 * Memory Section Validation Rules
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

export const memoryRules = [
  {
    name: 'memory-types',
    priority: 50,
    check: (data) => {
      if (!data.memory) return true;
      const validTypes = ['episodic', 'semantic', 'procedural'];
      return Object.keys(data.memory).every(key => validTypes.includes(key));
    },
    message: 'Memory type must be one of: episodic, semantic, procedural'
  },
  {
    name: 'memory-similarity-threshold-type',
    priority: 50,
    check: (data) => {
      const threshold = data.memory?.semantic?.similarity_threshold;
      return threshold === undefined || typeof threshold === 'number';
    },
    message: 'Similarity threshold must be a number'
  },
  {
    name: 'memory-similarity-threshold-range',
    priority: 50,
    check: (data) => {
      const threshold = data.memory?.semantic?.similarity_threshold;
      return threshold === undefined || (threshold >= 0 && threshold <= 1);
    },
    message: 'Similarity threshold must be between 0 and 1'
  }
];

// Made with Bob