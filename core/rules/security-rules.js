/**
 * Security Section Validation Rules
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

export const securityRules = [
  {
    name: 'security-checksum',
    priority: 15,
    check: (data) => !data.security || (data.security.checksum?.algorithm && data.security.checksum?.value),
    message: 'Security checksum missing required fields (algorithm, value)'
  },
  {
    name: 'security-algorithm',
    priority: 15,
    check: (data) => {
      const algo = data.security?.checksum?.algorithm;
      return !algo || ['sha256', 'sha512', 'blake3'].includes(algo);
    },
    message: 'Invalid checksum algorithm. Must be one of: sha256, sha512, blake3'
  }
];

// Made with Moe Abdelaziz