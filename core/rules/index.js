/**
 * Core Validation Rules - Central Export
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { metaRules } from './meta-rules.js';
import { personaRules } from './persona-rules.js';
import { securityRules } from './security-rules.js';
import { skillsRules } from './skills-rules.js';
import { apisRules } from './apis-rules.js';
import { mcpRules } from './mcp-rules.js';
import { memoryRules } from './memory-rules.js';
import { abomRules } from './abom-rules.js';

/**
 * All core validation rules combined
 */
export const allRules = [
  ...metaRules,
  ...personaRules,
  ...securityRules,
  ...skillsRules,
  ...apisRules,
  ...mcpRules,
  ...memoryRules,
  ...abomRules
];

// Made with Bob