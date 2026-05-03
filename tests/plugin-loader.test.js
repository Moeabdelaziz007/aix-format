import { describe, it, expect, beforeEach } from 'vitest';
import { PluginLoader } from '../core/plugin-loader.js';
import { PluginRegistry } from '../core/validation-plugins.js';
import { writeFile, unlink } from 'fs/promises';

describe('PluginLoader', () => {
  let registry, loader;

  beforeEach(() => {
    registry = new PluginRegistry();
    loader = new PluginLoader(registry);
  });

  it('should load plugin from path', async () => {
    const plugin = await loader.loadFromPath('./core/plugins/meta-validator.js');
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('meta');
  });

  it('should handle load failures gracefully', async () => {
    const plugin = await loader.loadFromPath('./nonexistent.js', { required: false });
    expect(plugin).toBeNull();
  });

  it('should respect enabled flag', async () => {
    await loader.loadFromPath('./core/plugins/meta-validator.js', { enabled: false });
    expect(registry.listPlugins()).toHaveLength(0);
  });

  it('should override priority', async () => {
    const plugin = await loader.loadFromPath('./core/plugins/meta-validator.js', { priority: 99 });
    expect(plugin.priority).toBe(99);
  });

  it('should load from config', async () => {
    const testConfig = { plugins: { './core/plugins/meta-validator.js': { enabled: true } } };
    await writeFile('.aix-plugins.test.json', JSON.stringify(testConfig));
    const plugins = await loader.loadFromConfig('.aix-plugins.test.json');
    expect(plugins.length).toBeGreaterThan(0);
    await unlink('.aix-plugins.test.json');
  });

  it('should handle missing config gracefully', async () => {
    const plugins = await loader.loadFromConfig('.nonexistent.json');
    expect(plugins).toHaveLength(0);
  });

  it('should unload plugins', async () => {
    await loader.loadFromPath('./core/plugins/meta-validator.js');
    expect(loader.unload('meta')).toBe(true);
    expect(registry.getPlugin('meta')).toBeUndefined();
  });

  it('should list loaded plugins', async () => {
    await loader.loadFromPath('./core/plugins/meta-validator.js');
    const list = loader.list();
    expect(list[0].name).toBe('meta');
    expect(list[0]).toHaveProperty('meta');
  });
});

// Made with Moe Abdelaziz
