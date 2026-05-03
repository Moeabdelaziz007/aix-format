/**
 * Skills Section Validation Rules
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

export const skillsRules = [
  {
    name: 'skills-array',
    priority: 30,
    check: (data) => !data.skills || Array.isArray(data.skills),
    message: 'Skills must be an array'
  },
  {
    name: 'skills-fields',
    priority: 30,
    check: (data) => {
      if (!data.skills) return true;
      return data.skills.every(s => s.name && s.description);
    },
    message: 'Skills missing required fields (name, description)'
  },
  {
    name: 'skills-unique',
    priority: 30,
    check: (data) => {
      if (!data.skills) return true;
      const names = data.skills.map(s => s.name);
      return names.length === new Set(names).size;
    },
    message: 'Duplicate skill names detected'
  }
];

// Made with Moe Abdelaziz