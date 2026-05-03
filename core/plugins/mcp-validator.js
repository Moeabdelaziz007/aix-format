/**
 * MCP Validator Plugin
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Validates the MCP (Model Context Protocol) section of AIX manifests
 *
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { ValidationPlugin } from '../validation-plugins.js';
import { addError } from './validation-utils.js';

/**
 * Validates the MCP section of AIX manifests
 * Checks servers array structure and required fields
 */
export class MCPValidator extends ValidationPlugin {
  constructor() {
    super('mcp', 40);
  }

  getTargetFields() {
    return ['mcp'];
  }

  async validate(manifest, context) {
    const mcp = manifest.mcp;

    // MCP is optional, skip if not present
    if (!mcp) {
      return;
    }

    // Validate servers array
    if (!mcp.servers || !Array.isArray(mcp.servers)) {
      addError(context, 'INVALID_TYPE', 'mcp', 'MCP servers must be an array');
      return;
    }

    // Validate each server
    for (let i = 0; i < mcp.servers.length; i++) {
      const server = mcp.servers[i];

      // Check required name field
      if (!server.name) {
        addError(
          context,
          'MISSING_FIELD',
          'mcp.servers',
          `Server at index ${i} is missing 'name' field`,
          { index: i, field: 'name' }
        );
      }

      // Check required command field
      if (!server.command) {
        addError(
          context,
          'MISSING_FIELD',
          'mcp.servers',
          `Server '${server.name || 'at index ' + i}' is missing 'command' field`,
          { index: i, field: 'command' }
        );
      }
    }
  }
}

export default MCPValidator;

// Made with Bob
