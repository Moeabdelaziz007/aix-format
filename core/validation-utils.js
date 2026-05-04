/**
 * Validation Utilities - Compressed essential helpers for rule validation
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

// Format validators
export const isValidID = (id) => /^did:(axiom|web):.+/.test(id);
export const isValidISO8601 = (ts) => !isNaN(Date.parse(ts));
export const isValidSemver = (v) => /^\d+\.\d+(\.\d+)?(-[a-z0-9.]+)?(\+[a-z0-9.]+)?$/i.test(v);
export const isValidURL = (url) => {
  try { new URL(url); return true; } catch { return false; }
};

// Field validators
export const hasFields = (obj, fields) => fields.every(f => obj?.[f]);
export const isInRange = (val, min, max) => val >= min && val <= max;
export const isEnum = (val, allowed) => allowed.includes(val);
export const isArray = (val) => Array.isArray(val);
export const isObject = (val) => val && typeof val === 'object' && !Array.isArray(val);

// Validation helpers
export const validateRequired = (obj, fields) => {
  const missing = fields.filter(f => !obj?.[f]);
  return missing.length === 0 ? null : `Missing required fields: ${missing.join(', ')}`;
};

export const validateRange = (val, min, max, name) => {
  if (typeof val !== 'number') return `${name} must be a number`;
  if (val < min || val > max) return `${name} must be between ${min} and ${max}`;
  return null;
};

export const validateEnum = (val, allowed, name) => {
  if (!allowed.includes(val)) {
    return `${name} must be one of: ${allowed.join(', ')}`;
  }
  return null;
};

export const validateArray = (arr, validator, name) => {
  if (!Array.isArray(arr)) return `${name} must be an array`;
  const errors = [];
  arr.forEach((item, i) => {
    const err = validator(item, i);
    if (err) errors.push(`${name}[${i}]: ${err}`);
  });
  return errors.length > 0 ? errors.join('; ') : null;
};

// Error helpers
export const addError = (context, code, section, message, details = {}) => {
  context.errors.push({ code, section, message, ...details });
};

export const addWarning = (context, code, section, message, details = {}) => {
  if (!context.warnings) context.warnings = [];
  context.warnings.push({ code, section, message, ...details });
};

// Batch validators
export const validateRequiredFields = (obj, fields, context, section) => {
  const missing = fields.filter(f => !obj?.[f]);
  if (missing.length > 0) {
    addError(context, 'MISSING_FIELDS', section, 
      `Missing required fields: ${missing.join(', ')}`);
  }
};

export const validateType = (val, type, context, section, field) => {
  const actualType = Array.isArray(val) ? 'array' : typeof val;
  if (actualType !== type) {
    addError(context, 'INVALID_TYPE', section,
      `Field '${field}' must be ${type}, got ${actualType}`);
  }
};

// Made with Bob