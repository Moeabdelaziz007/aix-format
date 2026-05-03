/**
 * ABOM Section Validation Rules
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { isValidISO8601 } from '../validation-utils.js';

const ABOM_VALID_TYPES = ['model', 'dataset', 'library', 'tool', 'plugin', 'agent', 'runtime'];
const ABOM_VALID_TRUST_TIERS = ['verified', 'community', 'unverified', 'revoked'];
const ABOM_VALID_SEC_STATUSES = ['clean', 'vulnerable', 'revoked', 'unknown'];
const ABOM_INTEGRITY_RE = /^[a-zA-Z0-9-]+:[a-fA-F0-9]{32,}$/;
const ABOM_PURL_RE = /^pkg:[a-zA-Z][a-zA-Z0-9+\-.]*\/.+/;

export const abomRules = [
  {
    name: 'abom-spec-version',
    priority: 60,
    check: (data) => !data.abom?.spec_version || typeof data.abom.spec_version === 'string',
    message: 'ABOM spec_version must be a string'
  },
  {
    name: 'abom-generated',
    priority: 60,
    check: (data) => !data.abom?.generated || isValidISO8601(data.abom.generated),
    message: 'ABOM generated must be a valid ISO 8601 timestamp'
  },
  {
    name: 'abom-tools-array',
    priority: 60,
    check: (data) => !data.abom?.tools || Array.isArray(data.abom.tools),
    message: 'ABOM tools must be an array'
  },
  {
    name: 'abom-tools-name',
    priority: 60,
    check: (data) => {
      if (!data.abom?.tools) return true;
      return data.abom.tools.every(tool => tool.name);
    },
    message: 'ABOM tool entries missing required name field'
  },
  {
    name: 'abom-constituents-array',
    priority: 60,
    check: (data) => !data.abom?.constituents || Array.isArray(data.abom.constituents),
    message: 'ABOM constituents must be an array'
  },
  {
    name: 'abom-constituent-required-fields',
    priority: 60,
    check: (data) => {
      if (!data.abom?.constituents) return true;
      const required = ['name', 'version', 'type', 'purl'];
      return data.abom.constituents.every(item => 
        required.every(field => item[field])
      );
    },
    message: 'ABOM constituents missing required fields (name, version, type, purl)'
  },
  {
    name: 'abom-constituent-type',
    priority: 60,
    check: (data) => {
      if (!data.abom?.constituents) return true;
      return data.abom.constituents.every(item => 
        !item.type || ABOM_VALID_TYPES.includes(item.type)
      );
    },
    message: `ABOM constituent type must be one of: ${ABOM_VALID_TYPES.join(', ')}`
  },
  {
    name: 'abom-constituent-purl',
    priority: 60,
    check: (data) => {
      if (!data.abom?.constituents) return true;
      return data.abom.constituents.every(item => 
        !item.purl || ABOM_PURL_RE.test(item.purl)
      );
    },
    message: 'ABOM constituent has invalid purl format'
  },
  {
    name: 'abom-constituent-integrity',
    priority: 60,
    check: (data) => {
      if (!data.abom?.constituents) return true;
      return data.abom.constituents.every(item => 
        !item.integrity_hash || ABOM_INTEGRITY_RE.test(item.integrity_hash)
      );
    },
    message: 'ABOM constituent integrity_hash must follow algorithm:hexdigest format'
  },
  {
    name: 'abom-constituent-trust-tier',
    priority: 60,
    check: (data) => {
      if (!data.abom?.constituents) return true;
      return data.abom.constituents.every(item => 
        !item.trust_tier || ABOM_VALID_TRUST_TIERS.includes(item.trust_tier)
      );
    },
    message: `ABOM constituent trust_tier must be one of: ${ABOM_VALID_TRUST_TIERS.join(', ')}`
  },
  {
    name: 'abom-constituent-security-status',
    priority: 60,
    check: (data) => {
      if (!data.abom?.constituents) return true;
      return data.abom.constituents.every(item => 
        !item.security_status || ABOM_VALID_SEC_STATUSES.includes(item.security_status)
      );
    },
    message: `ABOM constituent security_status must be one of: ${ABOM_VALID_SEC_STATUSES.join(', ')}`
  },
  {
    name: 'abom-constituent-revoked',
    priority: 60,
    check: (data) => {
      if (!data.abom?.constituents) return true;
      return !data.abom.constituents.some(item => 
        item.trust_tier === 'revoked' || item.security_status === 'revoked'
      );
    },
    message: 'SECURITY: ABOM contains revoked constituents'
  },
  {
    name: 'abom-constituent-supplier',
    priority: 60,
    check: (data) => {
      if (!data.abom?.constituents) return true;
      return data.abom.constituents.every(item => 
        !item.supplier || (typeof item.supplier === 'string' && item.supplier.trim() !== '')
      );
    },
    message: 'ABOM constituent supplier must be a non-empty string'
  },
  {
    name: 'abom-constituent-license',
    priority: 60,
    check: (data) => {
      if (!data.abom?.constituents) return true;
      return data.abom.constituents.every(item => 
        !item.license || typeof item.license === 'string'
      );
    },
    message: 'ABOM constituent license must be a string'
  }
];

// Made with Moe Abdelaziz