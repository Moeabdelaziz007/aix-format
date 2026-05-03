/**
 * Ultra-Lean Rule Loader
 * Dynamic rule loading from files and config
 * 
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { readFile } from 'fs/promises';
import { pathToFileURL } from 'url';
import { resolve } from 'path';
import { register } from './validation-engine.js';

/**
 * Load a rule from a file path
 * @param {string} path - File path or module name
 * @returns {Promise<Array>} Array of loaded rules
 */
export const loadRule = async (path) => {
  try {
    const url = path.startsWith('.') || path.startsWith('/') 
      ? pathToFileURL(resolve(process.cwd(), path)).href 
      : path;
    const mod = await import(url);
    const rules = mod.default || mod.rules || [mod];
    const ruleArray = Array.isArray(rules) ? rules : [rules];
    ruleArray.forEach(register);
    return ruleArray;
  } catch (err) {
    console.warn(`Failed to load rule from ${path}:`, err.message);
    return null;
  }
};

/**
 * Load rules from config file
 * @param {string} configPath - Path to config file (default: .aix-plugins.json)
 * @returns {Promise<Array>} Array of loaded rules
 */
export const loadFromConfig = async (configPath = '.aix-plugins.json') => {
  try {
    const config = JSON.parse(await readFile(configPath, 'utf-8'));
    const results = [];
    for (const path of Object.keys(config.plugins || {})) {
      if (config.plugins[path].enabled !== false) {
        const rules = await loadRule(path);
        if (rules) results.push(...rules);
      }
    }
    return results;
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    return [];
  }
};

// Made with Bob