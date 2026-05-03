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
import { requirementsRules } from './requirements-rules.js';
import { pricingRules } from './pricing-rules.js';
import { economicsRules } from './economics-rules.js';
import { identityRules } from './identity-rules.js';
import { piNetworkRules } from './pi-network-rules.js';

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
  ...abomRules,
  ...requirementsRules,
  ...pricingRules,
  ...economicsRules,
  ...identityRules,
  ...piNetworkRules
];

// Made with Moe Abdelaziz