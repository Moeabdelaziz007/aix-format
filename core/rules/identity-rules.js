/**
 * Identity Layer Validation Rules
 * Validates identity layer structure, DIDs, and authority
 */

import { isValidID, isValidISO8601 } from '../validation-utils.js';

export const identityRules = [
  {
    name: 'identity_layer.id.required',
    check: (data) => !!data.identity_layer?.id,
    message: "Required field 'identity_layer.id' is missing",
    section: 'identity_layer',
    field: 'id'
  },
  
  {
    name: 'identity_layer.authority.required',
    check: (data) => !!data.identity_layer?.authority,
    message: "Required field 'identity_layer.authority' is missing",
    section: 'identity_layer',
    field: 'authority'
  },
  
  {
    name: 'identity_layer.issuedAt.required',
    check: (data) => !!data.identity_layer?.issuedAt,
    message: "Required field 'identity_layer.issuedAt' is missing",
    section: 'identity_layer',
    field: 'issuedAt'
  },
  
  {
    name: 'identity_layer.id.format',
    check: (data) => {
      const id = data.identity_layer?.id;
      return !id || isValidID(id);
    },
    message: 'Invalid ID format',
    section: 'identity_layer',
    field: 'id'
  },
  
  {
    name: 'identity_layer.authority.axiom',
    check: (data) => {
      const id = data.identity_layer?.id;
      const authority = data.identity_layer?.authority;
      if (!id || !authority) return true;
      if (id.startsWith('did:web:axiomid.app:')) {
        return authority === 'axiomid.app';
      }
      return true;
    },
    message: "Authority must be 'axiomid.app' for did:web:axiomid.app",
    section: 'identity_layer',
    field: 'authority'
  },
  
  {
    name: 'identity_layer.authority.web',
    check: (data) => {
      const id = data.identity_layer?.id;
      const authority = data.identity_layer?.authority;
      if (!id || !authority) return true;
      if (id.startsWith('did:web:')) {
        const domain = id.split(':')[2];
        return authority === domain;
      }
      return true;
    },
    message: (data) => {
      const id = data.identity_layer?.id;
      const authority = data.identity_layer?.authority;
      const domain = id?.split(':')[2];
      return `Authority '${authority}' does not match did:web domain '${domain}'`;
    },
    section: 'identity_layer',
    field: 'authority',
    severity: 'warning'
  },
  
  {
    name: 'identity_layer.issuedAt.format',
    check: (data) => {
      const issuedAt = data.identity_layer?.issuedAt;
      return !issuedAt || isValidISO8601(issuedAt);
    },
    message: 'Invalid ISO 8601 timestamp',
    section: 'identity_layer',
    field: 'issuedAt'
  }
];

// Made with Bob
