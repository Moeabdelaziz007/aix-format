/**
 * Ultra-Lean Validation Engine
 * Functional rule-based validation system
 * 
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

const registry = [];

/**
 * Register a validation rule
 * @param {Object} rule - { name, check, priority?, message? }
 */
export const register = (rule) => {
  if (!rule.name || !rule.check) {
    throw new Error('Rule must have name and check function');
  }
  registry.push({ priority: 50, ...rule });
  registry.sort((a, b) => a.priority - b.priority);
};

/**
 * Unregister a rule by name
 */
export const unregister = (name) => {
  const index = registry.findIndex(r => r.name === name);
  if (index !== -1) registry.splice(index, 1);
};

/**
 * Validate data against all registered rules
 */
export const validate = async (data) => {
  const errors = [];
  
  for (const rule of registry) {
    try {
      const result = await rule.check(data);
      if (!result) {
        errors.push({
          rule: rule.name,
          message: rule.message || `Validation failed: ${rule.name}`
        });
      }
    } catch (err) {
      errors.push({
        rule: rule.name,
        error: err.message,
        stack: err.stack
      });
    }
  }
  
  return errors;
};

/**
 * Get all registered rules
 */
export const getRules = () => [...registry];

/**
 * Clear all rules
 */
export const clear = () => registry.length = 0;

// Made with Bob