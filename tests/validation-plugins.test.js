/**
 * Validation Plugin System Tests
 * Tests for the plugin-based validation architecture
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationPlugin, PluginRegistry } from '../core/validation-plugins.js';
import {
  MetaValidator,
  PersonaValidator,
  SecurityValidator,
  SkillsValidator,
  APIsValidator,
  MCPValidator,
  MemoryValidator,
  ABOMValidator
} from '../core/plugins/index.js';

describe('ValidationPlugin Base Class', () => {
  it('should require a name', () => {
    expect(() => new ValidationPlugin()).toThrow();
    expect(() => new ValidationPlugin('')).toThrow();
  });

  it('should create plugin with name and default priority', () => {
    const plugin = new ValidationPlugin('test');
    expect(plugin.name).toBe('test');
    expect(plugin.priority).toBe(50);
  });

  it('should create plugin with custom priority', () => {
    const plugin = new ValidationPlugin('test', 100);
    expect(plugin.priority).toBe(100);
  });

  it('should require validate method to be implemented', async () => {
    const plugin = new ValidationPlugin('test');
    await expect(plugin.validate({}, {})).rejects.toThrow();
  });

  it('should return empty array for getTargetFields by default', () => {
    const plugin = new ValidationPlugin('test');
    expect(plugin.getTargetFields()).toEqual([]);
  });

  it('should return metadata', () => {
    const plugin = new ValidationPlugin('test', 25);
    const metadata = plugin.getMetadata();
    expect(metadata.name).toBe('test');
    expect(metadata.priority).toBe(25);
    expect(metadata.targetFields).toEqual([]);
  });
});

describe('PluginRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  it('should create empty registry', () => {
    expect(registry.listPlugins()).toEqual([]);
  });

  it('should register a plugin', () => {
    class TestPlugin extends ValidationPlugin {
      constructor() {
        super('test');
      }
      async validate() {}
    }

    const plugin = new TestPlugin();
    registry.register(plugin);
    expect(registry.hasPlugin('test')).toBe(true);
    expect(registry.getPlugin('test')).toBe(plugin);
  });

  it('should reject non-plugin instances', () => {
    expect(() => registry.register({})).toThrow();
    expect(() => registry.register('not a plugin')).toThrow();
  });

  it('should reject duplicate plugin names', () => {
    class TestPlugin extends ValidationPlugin {
      constructor() {
        super('test');
      }
      async validate() {}
    }

    registry.register(new TestPlugin());
    expect(() => registry.register(new TestPlugin())).toThrow();
  });

  it('should unregister plugins', () => {
    class TestPlugin extends ValidationPlugin {
      constructor() {
        super('test');
      }
      async validate() {}
    }

    registry.register(new TestPlugin());
    expect(registry.hasPlugin('test')).toBe(true);
    
    registry.unregister('test');
    expect(registry.hasPlugin('test')).toBe(false);
  });

  it('should list plugins sorted by priority', () => {
    class Plugin1 extends ValidationPlugin {
      constructor() {
        super('p1', 30);
      }
      async validate() {}
    }

    class Plugin2 extends ValidationPlugin {
      constructor() {
        super('p2', 10);
      }
      async validate() {}
    }

    class Plugin3 extends ValidationPlugin {
      constructor() {
        super('p3', 20);
      }
      async validate() {}
    }

    registry.register(new Plugin1());
    registry.register(new Plugin2());
    registry.register(new Plugin3());

    const plugins = registry.listPlugins();
    expect(plugins.map(p => p.name)).toEqual(['p2', 'p3', 'p1']);
  });

  it('should run all plugins in priority order', async () => {
    const order = [];

    class Plugin1 extends ValidationPlugin {
      constructor() {
        super('p1', 20);
      }
      async validate() {
        order.push('p1');
      }
    }

    class Plugin2 extends ValidationPlugin {
      constructor() {
        super('p2', 10);
      }
      async validate() {
        order.push('p2');
      }
    }

    registry.register(new Plugin1());
    registry.register(new Plugin2());

    await registry.runAll({});
    expect(order).toEqual(['p2', 'p1']);
  });

  it('should collect errors from plugins', async () => {
    class ErrorPlugin extends ValidationPlugin {
      constructor() {
        super('error-plugin');
      }
      async validate(manifest, context) {
        context.errors.push({
          code: 'TEST_ERROR',
          message: 'Test error'
        });
      }
    }

    registry.register(new ErrorPlugin());
    const errors = await registry.runAll({});
    
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('TEST_ERROR');
  });

  it('should handle plugin exceptions gracefully', async () => {
    class BrokenPlugin extends ValidationPlugin {
      constructor() {
        super('broken');
      }
      async validate() {
        throw new Error('Plugin crashed');
      }
    }

    registry.register(new BrokenPlugin());
    const errors = await registry.runAll({});
    
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('PLUGIN_ERROR');
    expect(errors[0].plugin).toBe('broken');
  });

  it('should track execution statistics', async () => {
    class TestPlugin extends ValidationPlugin {
      constructor() {
        super('test');
      }
      async validate() {}
    }

    registry.register(new TestPlugin());
    
    await registry.runAll({});
    await registry.runAll({});
    
    const stats = registry.getStats('test');
    expect(stats.executions).toBe(2);
    expect(stats.errors).toBe(0);
  });

  it('should run specific plugins', async () => {
    const executed = [];

    class Plugin1 extends ValidationPlugin {
      constructor() {
        super('p1');
      }
      async validate() {
        executed.push('p1');
      }
    }

    class Plugin2 extends ValidationPlugin {
      constructor() {
        super('p2');
      }
      async validate() {
        executed.push('p2');
      }
    }

    registry.register(new Plugin1());
    registry.register(new Plugin2());

    await registry.runPlugins(['p1'], {});
    expect(executed).toEqual(['p1']);
  });

  it('should get plugins for specific field', () => {
    class MetaPlugin extends ValidationPlugin {
      constructor() {
        super('meta');
      }
      getTargetFields() {
        return ['meta'];
      }
      async validate() {}
    }

    class PersonaPlugin extends ValidationPlugin {
      constructor() {
        super('persona');
      }
      getTargetFields() {
        return ['persona'];
      }
      async validate() {}
    }

    registry.register(new MetaPlugin());
    registry.register(new PersonaPlugin());

    const metaPlugins = registry.getPluginsForField('meta');
    expect(metaPlugins).toHaveLength(1);
    expect(metaPlugins[0].name).toBe('meta');
  });

  it('should clear all plugins', () => {
    class TestPlugin extends ValidationPlugin {
      constructor() {
        super('test');
      }
      async validate() {}
    }

    registry.register(new TestPlugin());
    expect(registry.listPlugins()).toHaveLength(1);
    
    registry.clear();
    expect(registry.listPlugins()).toHaveLength(0);
  });

  it('should export registry state', () => {
    class TestPlugin extends ValidationPlugin {
      constructor() {
        super('test', 25);
      }
      getTargetFields() {
        return ['meta'];
      }
      async validate() {}
    }

    registry.register(new TestPlugin());
    const exported = registry.export();
    
    expect(exported.plugins).toHaveLength(1);
    expect(exported.plugins[0].name).toBe('test');
    expect(exported.plugins[0].priority).toBe(25);
  });
});

describe('Core Validators', () => {
  describe('MetaValidator', () => {
    it('should validate required fields', async () => {
      const validator = new MetaValidator();
      const context = { errors: [], warnings: [] };
      
      await validator.validate({ meta: {} }, context);
      
      expect(context.errors.length).toBeGreaterThan(0);
      expect(context.errors.some(e => e.field === 'version')).toBe(true);
    });

    it('should validate ID format', async () => {
      const validator = new MetaValidator();
      const context = { errors: [], warnings: [] };
      
      await validator.validate({
        meta: {
          version: '1.0.0',
          id: 'invalid-id',
          name: 'Test',
          created: '2024-01-01T00:00:00Z',
          author: 'Test'
        }
      }, context);
      
      expect(context.errors.some(e => e.code === 'INVALID_ID')).toBe(true);
    });

    it('should accept valid manifest', async () => {
      const validator = new MetaValidator();
      const context = { errors: [], warnings: [] };
      
      await validator.validate({
        meta: {
          version: '1.0.0',
          id: 'did:axiom:axiomid.app:test',
          name: 'Test Agent',
          created: '2024-01-01T00:00:00Z',
          author: 'Test Author'
        }
      }, context);
      
      expect(context.errors).toHaveLength(0);
    });
  });

  describe('PersonaValidator', () => {
    it('should validate required fields', async () => {
      const validator = new PersonaValidator();
      const context = { errors: [], warnings: [] };
      
      await validator.validate({ persona: {} }, context);
      
      expect(context.errors.some(e => e.field === 'role')).toBe(true);
      expect(context.errors.some(e => e.field === 'instructions')).toBe(true);
    });

    it('should validate temperature range', async () => {
      const validator = new PersonaValidator();
      const context = { errors: [], warnings: [] };
      
      await validator.validate({
        persona: {
          role: 'assistant',
          instructions: 'Help users',
          temperature: 3.0
        }
      }, context);
      
      expect(context.errors.some(e => e.code === 'INVALID_RANGE')).toBe(true);
    });
  });

  describe('SkillsValidator', () => {
    it('should validate array type', async () => {
      const validator = new SkillsValidator();
      const context = { errors: [], warnings: [] };
      
      await validator.validate({ skills: 'not an array' }, context);
      
      expect(context.errors.some(e => e.code === 'INVALID_TYPE')).toBe(true);
    });

    it('should detect duplicate skill names', async () => {
      const validator = new SkillsValidator();
      const context = { errors: [], warnings: [] };
      
      await validator.validate({
        skills: [
          { name: 'skill1', description: 'First' },
          { name: 'skill1', description: 'Duplicate' }
        ]
      }, context);
      
      expect(context.errors.some(e => e.code === 'DUPLICATE_NAME')).toBe(true);
    });
  });

  describe('ABOMValidator', () => {
    it('should validate constituent required fields', async () => {
      const validator = new ABOMValidator();
      const context = { errors: [], warnings: [] };
      
      await validator.validate({
        abom: {
          constituents: [
            { name: 'test' } // Missing required fields
          ]
        }
      }, context);
      
      expect(context.errors.length).toBeGreaterThan(0);
    });

    it('should validate purl format', async () => {
      const validator = new ABOMValidator();
      const context = { errors: [], warnings: [] };
      
      await validator.validate({
        abom: {
          constituents: [
            {
              name: 'test',
              version: '1.0.0',
              type: 'model',
              purl: 'invalid-purl'
            }
          ]
        }
      }, context);
      
      expect(context.errors.some(e => e.code === 'INVALID_PURL')).toBe(true);
    });
  });
});

describe('Integration Tests', () => {
  it('should run multiple validators together', async () => {
    const registry = new PluginRegistry();
    registry.register(new MetaValidator());
    registry.register(new PersonaValidator());
    registry.register(new SkillsValidator());

    const manifest = {
      meta: {
        version: '1.0.0',
        id: 'did:axiom:axiomid.app:test',
        name: 'Test',
        created: '2024-01-01T00:00:00Z',
        author: 'Test'
      },
      persona: {
        role: 'assistant',
        instructions: 'Help users'
      },
      skills: [
        { name: 'skill1', description: 'First skill' }
      ]
    };

    const errors = await registry.runAll(manifest);
    expect(errors).toHaveLength(0);
  });

  it('should collect errors from multiple validators', async () => {
    const registry = new PluginRegistry();
    registry.register(new MetaValidator());
    registry.register(new PersonaValidator());

    const manifest = {
      meta: {},
      persona: {}
    };

    const errors = await registry.runAll(manifest);
    expect(errors.length).toBeGreaterThan(0);
  });
});

// Made with Bob
