/**
 * Meta Section Validation Rules
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { isValidID, isValidISO8601, isValidSemver } from '../validation-utils.js';

export const metaRules = [
  {
    name: 'meta-required',
    priority: 10,
    check: (data) => !!data.meta,
    message: 'Missing required section: meta'
  },
  {
    name: 'meta-fields',
    priority: 10,
    check: (data) => {
      const required = ['version', 'id', 'name', 'created', 'author'];
      return required.every(f => data.meta?.[f]);
    },
    message: 'Meta section missing required fields (version, id, name, created, author)'
  },
  {
    name: 'meta-id-format',
    priority: 10,
    check: (data) => !data.meta?.id || isValidID(data.meta.id),
    message: 'Invalid ID format. Must be a valid DID (did:web:axiomid.app:* or did:web:*)'
  },
  {
    name: 'meta-timestamp',
    priority: 10,
    check: (data) => !data.meta?.created || isValidISO8601(data.meta.created),
    message: 'Invalid ISO 8601 timestamp format'
  },
  {
    name: 'meta-version',
    priority: 10,
    check: (data) => !data.meta?.version || isValidSemver(data.meta.version),
    message: 'Invalid semantic version format (expected: X.Y.Z)'
  },
  {
    name: 'meta-lineage-array',
    priority: 10,
    check: (data) => !data.meta?.lineage || Array.isArray(data.meta.lineage),
    message: 'Lineage must be an array'
  },
  {
    name: 'meta-lineage-parent-id',
    priority: 10,
    check: (data) => {
      if (!data.meta?.lineage || !Array.isArray(data.meta.lineage)) return true;
      return data.meta.lineage.every(entry => entry.parent_id);
    },
    message: 'Lineage entries must have parent_id field'
  }
];

// Made with Bob