/**
 * Persona Section Validation Rules
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

export const personaRules = [
  {
    name: 'persona-fields',
    priority: 20,
    check: (data) => !data.persona || (data.persona.role && data.persona.instructions),
    message: 'Persona missing required fields (role, instructions)'
  },
  {
    name: 'persona-temperature-type',
    priority: 20,
    check: (data) => {
      const temp = data.persona?.temperature;
      return temp === undefined || typeof temp === 'number';
    },
    message: 'Temperature must be a number'
  },
  {
    name: 'persona-temperature-range',
    priority: 20,
    check: (data) => {
      const temp = data.persona?.temperature;
      return temp === undefined || (temp >= 0 && temp <= 2);
    },
    message: 'Temperature must be between 0 and 2'
  }
];

// Made with Moe Abdelaziz