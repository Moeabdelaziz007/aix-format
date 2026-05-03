/**
 * Shared validation utilities for AIX plugins
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Common validation functions used across multiple plugins
 *
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

/**
 * Validate DID format (Axiom or Web)
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid DID format
 */
export function isValidID(id) {
  const axiomRegex = /^did:axiom:axiomid\.app:[a-zA-Z0-9._\-]+$/i;
  const webRegex = /^did:web:[a-zA-Z0-9.\-]+(:[a-zA-Z0-9.\-]+)*$/i;
  return axiomRegex.test(id) || webRegex.test(id);
}

/**
 * Validate ISO 8601 timestamp
 * @param {string} timestamp - The timestamp to validate
 * @returns {boolean} True if valid ISO 8601 format
 */
export function isValidISO8601(timestamp) {
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (!regex.test(timestamp)) return false;
  try {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Validate semantic version format
 * @param {string} version - The version to validate
 * @returns {boolean} True if valid semver format
 */
export function isValidSemver(version) {
  const regex = /^\d+\.\d+(\.\d+)?(-[a-z0-9.]+)?(\+[a-z0-9.]+)?$/i;
  return regex.test(version);
}

/**
 * Validate URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Add a validation error to the context
 * @param {Object} context - Validation context with errors array
 * @param {string} code - Error code
 * @param {string} section - Section where error occurred
 * @param {string} message - Error message
 * @param {Object} extra - Additional error properties
 */
export function addError(context, code, section, message, extra = {}) {
  context.errors.push({
    code,
    section,
    message,
    ...extra
  });
}

/**
 * Add a validation warning to the context
 * @param {Object} context - Validation context with warnings array
 * @param {string} code - Warning code
 * @param {string} section - Section where warning occurred
 * @param {string} message - Warning message
 * @param {Object} extra - Additional warning properties
 */
export function addWarning(context, code, section, message, extra = {}) {
  if (!context.warnings) {
    context.warnings = [];
  }
  context.warnings.push({
    code,
    section,
    message,
    ...extra
  });
}

/**
 * Check if required fields are present
 * @param {Object} obj - Object to check
 * @param {string[]} required - Array of required field names
 * @param {Object} context - Validation context
 * @param {string} section - Section name for error reporting
 */
export function validateRequiredFields(obj, required, context, section) {
  for (const field of required) {
    if (!obj[field]) {
      addError(
        context,
        'MISSING_FIELD',
        section,
        `Required field '${section}.${field}' is missing`,
        { field }
      );
    }
  }
}

/**
 * Validate that a value is within a numeric range
 * @param {number} value - Value to check
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @param {Object} context - Validation context
 * @param {string} section - Section name
 * @param {string} field - Field name
 */
export function validateRange(value, min, max, context, section, field) {
  if (value < min || value > max) {
    addError(
      context,
      'INVALID_RANGE',
      section,
      `${field} must be between ${min} and ${max}`,
      { field, value, min, max }
    );
  }
}

/**
 * Validate that a value is one of allowed options
 * @param {*} value - Value to check
 * @param {Array} allowed - Array of allowed values
 * @param {Object} context - Validation context
 * @param {string} section - Section name
 * @param {string} field - Field name
 */
export function validateEnum(value, allowed, context, section, field) {
  if (!allowed.includes(value)) {
    addError(
      context,
      'INVALID_VALUE',
      section,
      `${field} must be one of: ${allowed.join(', ')}`,
      { field, value, allowed }
    );
  }
}

/**
 * Validate array type and optionally its elements
 * @param {*} value - Value to check
 * @param {Object} context - Validation context
 * @param {string} section - Section name
 * @param {string} field - Field name
 * @param {Function} elementValidator - Optional validator for each element
 */
export function validateArray(value, context, section, field, elementValidator = null) {
  if (!Array.isArray(value)) {
    addError(
      context,
      'INVALID_TYPE',
      section,
      `${field} must be an array`,
      { field }
    );
    return false;
  }

  if (elementValidator) {
    value.forEach((element, index) => {
      elementValidator(element, index, context, section);
    });
  }

  return true;
}

// Made with Bob
