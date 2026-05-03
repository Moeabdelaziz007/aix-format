/**
 * AIX Validation Plugin System
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Extensible plugin architecture for AIX manifest validation.
 * Allows custom validators to be added without modifying core code.
 *
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

/**
 * Base class for validation plugins
 * All custom validators must extend this class
 */
export class ValidationPlugin {
  /**
   * Create a validation plugin
   * @param {string} name - Unique plugin identifier
   * @param {number} priority - Execution priority (lower runs first, default: 50)
   */
  constructor(name, priority = 50) {
    if (!name || typeof name !== 'string') {
      throw new Error('Plugin name must be a non-empty string');
    }
    this.name = name;
    this.priority = priority;
  }

  /**
   * Validate manifest data
   * Must be implemented by subclasses
   * @param {Object} manifest - The parsed AIX manifest
   * @param {Object} context - Validation context containing errors array and options
   * @returns {Promise<void>}
   */
  async validate(manifest, context) {
    throw new Error(`Plugin '${this.name}' must implement validate() method`);
  }

  /**
   * Declare which top-level fields this plugin validates
   * Optional: Used for documentation and introspection
   * @returns {string[]} Array of field names
   */
  getTargetFields() {
    return [];
  }

  /**
   * Get plugin metadata
   * @returns {Object} Plugin information
   */
  getMetadata() {
    return {
      name: this.name,
      priority: this.priority,
      targetFields: this.getTargetFields()
    };
  }
}

/**
 * Registry for managing validation plugins
 * Handles plugin registration, execution order, and lifecycle
 */
export class PluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.executionStats = new Map();
  }

  /**
   * Register a validation plugin
   * @param {ValidationPlugin} plugin - Plugin instance to register
   * @throws {Error} If plugin is invalid or name conflicts
   */
  register(plugin) {
    if (!(plugin instanceof ValidationPlugin)) {
      throw new Error('Plugin must be an instance of ValidationPlugin');
    }

    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already registered`);
    }

    this.plugins.set(plugin.name, plugin);
    this.executionStats.set(plugin.name, {
      executions: 0,
      totalTime: 0,
      errors: 0
    });
  }

  /**
   * Unregister a plugin by name
   * @param {string} name - Plugin name to remove
   * @returns {boolean} True if plugin was removed
   */
  unregister(name) {
    this.executionStats.delete(name);
    return this.plugins.delete(name);
  }

  /**
   * Get a registered plugin by name
   * @param {string} name - Plugin name
   * @returns {ValidationPlugin|undefined} The plugin or undefined
   */
  getPlugin(name) {
    return this.plugins.get(name);
  }

  /**
   * Check if a plugin is registered
   * @param {string} name - Plugin name
   * @returns {boolean} True if plugin exists
   */
  hasPlugin(name) {
    return this.plugins.has(name);
  }

  /**
   * List all registered plugins
   * @returns {ValidationPlugin[]} Array of plugins sorted by priority
   */
  listPlugins() {
    return Array.from(this.plugins.values())
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get plugin execution statistics
   * @param {string} name - Plugin name
   * @returns {Object|undefined} Execution stats or undefined
   */
  getStats(name) {
    return this.executionStats.get(name);
  }

  /**
   * Get all plugin statistics
   * @returns {Map<string, Object>} Map of plugin names to stats
   */
  getAllStats() {
    return new Map(this.executionStats);
  }

  /**
   * Clear all plugins from registry
   */
  clear() {
    this.plugins.clear();
    this.executionStats.clear();
  }

  /**
   * Run all registered plugins on a manifest
   * Executes plugins in priority order (lower priority first)
   * @param {Object} manifest - The parsed AIX manifest
   * @param {Object} context - Validation context (errors, warnings, options)
   * @returns {Promise<Object[]>} Array of validation errors
   */
  async runAll(manifest, context = {}) {
    // Initialize context
    const ctx = {
      errors: [],
      warnings: [],
      ...context
    };

    // Sort plugins by priority
    const sortedPlugins = Array.from(this.plugins.values())
      .sort((a, b) => a.priority - b.priority);

    // Execute each plugin
    for (const plugin of sortedPlugins) {
      const stats = this.executionStats.get(plugin.name);
      const startTime = Date.now();

      try {
        await plugin.validate(manifest, ctx);
        stats.executions++;
        stats.totalTime += Date.now() - startTime;
      } catch (err) {
        stats.errors++;
        // Add plugin error to errors array
        ctx.errors.push({
          code: 'PLUGIN_ERROR',
          plugin: plugin.name,
          message: `Plugin '${plugin.name}' threw an error: ${err.message}`,
          error: err.message,
          stack: err.stack
        });
      }
    }

    return ctx.errors;
  }

  /**
   * Run specific plugins by name
   * @param {string[]} pluginNames - Array of plugin names to run
   * @param {Object} manifest - The parsed AIX manifest
   * @param {Object} context - Validation context
   * @returns {Promise<Object[]>} Array of validation errors
   */
  async runPlugins(pluginNames, manifest, context = {}) {
    const ctx = {
      errors: [],
      warnings: [],
      ...context
    };

    // Get and sort requested plugins
    const plugins = pluginNames
      .map(name => this.plugins.get(name))
      .filter(p => p !== undefined)
      .sort((a, b) => a.priority - b.priority);

    // Execute each plugin
    for (const plugin of plugins) {
      const stats = this.executionStats.get(plugin.name);
      const startTime = Date.now();

      try {
        await plugin.validate(manifest, ctx);
        stats.executions++;
        stats.totalTime += Date.now() - startTime;
      } catch (err) {
        stats.errors++;
        ctx.errors.push({
          code: 'PLUGIN_ERROR',
          plugin: plugin.name,
          message: `Plugin '${plugin.name}' threw an error: ${err.message}`,
          error: err.message,
          stack: err.stack
        });
      }
    }

    return ctx.errors;
  }

  /**
   * Get plugins that validate a specific field
   * @param {string} fieldName - Field name to search for
   * @returns {ValidationPlugin[]} Array of plugins that target this field
   */
  getPluginsForField(fieldName) {
    return Array.from(this.plugins.values())
      .filter(plugin => plugin.getTargetFields().includes(fieldName))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Export registry configuration
   * @returns {Object} Serializable registry state
   */
  export() {
    return {
      plugins: Array.from(this.plugins.values()).map(p => p.getMetadata()),
      stats: Object.fromEntries(this.executionStats)
    };
  }
}

/**
 * Create a default plugin registry with no plugins
 * @returns {PluginRegistry} Empty registry instance
 */
export function createRegistry() {
  return new PluginRegistry();
}

// Made with Bob
