/**
 * APIs Section Validation Rules
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { isValidURL } from '../validation-utils.js';

export const apisRules = [
  {
    name: 'apis-array',
    priority: 35,
    check: (data) => !data.apis || Array.isArray(data.apis),
    message: 'APIs must be an array'
  },
  {
    name: 'apis-name',
    priority: 35,
    check: (data) => {
      if (!data.apis) return true;
      return data.apis.every(api => api.name);
    },
    message: 'API entries missing required name field'
  },
  {
    name: 'apis-base-url',
    priority: 35,
    check: (data) => {
      if (!data.apis) return true;
      return data.apis.every(api => api.base_url);
    },
    message: 'API entries missing required base_url field'
  },
  {
    name: 'apis-url-valid',
    priority: 35,
    check: (data) => {
      if (!data.apis) return true;
      return data.apis.every(api => !api.base_url || isValidURL(api.base_url));
    },
    message: 'API entries contain invalid URLs'
  }
];

// Made with Moe Abdelaziz