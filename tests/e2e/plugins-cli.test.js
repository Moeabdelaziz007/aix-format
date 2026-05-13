/**
 * E2E coverage for bin/aix-plugins.js.
 *
 * Verifies the plugin registry CLI: list / add / enable / disable / remove.
 * Each test runs in an isolated tempdir so the real .aix-plugins.json is
 * never touched.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

// import.meta.dirname is Node 20.11+, but package.json declares engines.node
// >=18.0.0. Derive the dirname via fileURLToPath for Node 18 compatibility.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PLUGINS = path.join(REPO_ROOT, 'bin', 'aix-plugins.js');

function makeWorkspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-plugins-'));
  fs.writeFileSync(path.join(dir, '.aix-plugins.json'), JSON.stringify({ plugins: {} }, null, 2));
  return dir;
}

function runPlugins(args, cwd) {
  return execFileSync('node', [PLUGINS, ...args], { encoding: 'utf8', cwd });
}

test('aix-plugins: list on empty config returns gracefully', () => {
  const cwd = makeWorkspace();
  const out = runPlugins(['list'], cwd);
  assert.match(out, /Installed plugins|No plugins|plugins/i);
});

test('aix-plugins: add then list shows the plugin', () => {
  const cwd = makeWorkspace();
  // Create a fake plugin file so the CLI has a real path to point at.
  const pluginPath = path.join(cwd, 'fake-plugin.js');
  fs.writeFileSync(pluginPath, 'module.exports = { name: "fake" };');

  runPlugins(['add', pluginPath], cwd);
  const out = runPlugins(['list'], cwd);
  assert.match(out, new RegExp('fake-plugin'));
});

test('aix-plugins: disable then re-enable a plugin', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'p.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  runPlugins(['add', pluginPath], cwd);
  const disabled = runPlugins(['disable', pluginPath], cwd);
  assert.match(disabled, /[Dd]isabled|✓|✅/);
  const enabled = runPlugins(['enable', pluginPath], cwd);
  assert.match(enabled, /[Ee]nabled|✓|✅/);
});

// --- PR coverage: commander-based CLI rewrite ---

test('aix-plugins: add with --priority option persists priority in config', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'priority-plugin.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  const out = runPlugins(['add', pluginPath, '--priority', '5'], cwd);
  assert.match(out, /Added plugin/i);

  const config = JSON.parse(fs.readFileSync(path.join(cwd, '.aix-plugins.json'), 'utf-8'));
  assert.strictEqual(config.plugins[pluginPath].priority, 5);
  assert.strictEqual(config.plugins[pluginPath].enabled, true);
});

test('aix-plugins: add with -p shorthand sets priority', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'p-plugin.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  runPlugins(['add', pluginPath, '-p', '10'], cwd);

  const config = JSON.parse(fs.readFileSync(path.join(cwd, '.aix-plugins.json'), 'utf-8'));
  assert.strictEqual(config.plugins[pluginPath].priority, 10);
});

test('aix-plugins: add with --disabled flag stores plugin as disabled', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'disabled-plugin.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  runPlugins(['add', pluginPath, '--disabled'], cwd);

  const config = JSON.parse(fs.readFileSync(path.join(cwd, '.aix-plugins.json'), 'utf-8'));
  assert.strictEqual(config.plugins[pluginPath].enabled, false);
});

test('aix-plugins: add without --disabled stores plugin as enabled', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'enabled-plugin.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  runPlugins(['add', pluginPath], cwd);

  const config = JSON.parse(fs.readFileSync(path.join(cwd, '.aix-plugins.json'), 'utf-8'));
  assert.strictEqual(config.plugins[pluginPath].enabled, true);
});

test('aix-plugins: remove command deletes the plugin entry from config', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'to-remove.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  runPlugins(['add', pluginPath], cwd);
  const out = runPlugins(['remove', pluginPath], cwd);
  assert.match(out, /[Rr]emoved/);

  const config = JSON.parse(fs.readFileSync(path.join(cwd, '.aix-plugins.json'), 'utf-8'));
  assert.strictEqual(config.plugins[pluginPath], undefined);
});

test('aix-plugins: remove a plugin not in config does not throw', () => {
  const cwd = makeWorkspace();
  // Removing a path that was never added should not crash
  assert.doesNotThrow(() => runPlugins(['remove', '/nonexistent/plugin.js'], cwd));
});

test('aix-plugins: enable a non-existent plugin prints error to stderr', () => {
  const cwd = makeWorkspace();
  let stderr = '';
  try {
    execFileSync('node', [PLUGINS, 'enable', '/no/such/plugin.js'], {
      encoding: 'utf8',
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err) {
    stderr = err.stderr ?? '';
  }
  // Capture stderr even when command exits 0 (commander rewrite does not exit 1 on missing plugin)
  const combined = stderr;
  // The CLI prints "Plugin not found" to stderr
  assert.match(combined, /[Pp]lugin not found|not found/i);
});

test('aix-plugins: disable a non-existent plugin prints error to stderr', () => {
  const cwd = makeWorkspace();
  let stderr = '';
  try {
    execFileSync('node', [PLUGINS, 'disable', '/no/such/plugin.js'], {
      encoding: 'utf8',
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err) {
    stderr = err.stderr ?? '';
  }
  assert.match(stderr, /[Pp]lugin not found|not found/i);
});

test('aix-plugins: list shows disabled status marker for disabled plugin', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'marked-disabled.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  runPlugins(['add', pluginPath, '--disabled'], cwd);
  const out = runPlugins(['list'], cwd);
  // The commander rewrite uses ❌ for disabled and ✅ for enabled
  assert.match(out, /❌/);
});

test('aix-plugins: list shows enabled status marker for enabled plugin', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'marked-enabled.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  runPlugins(['add', pluginPath], cwd);
  const out = runPlugins(['list'], cwd);
  assert.match(out, /✅/);
});

test('aix-plugins: list shows priority annotation when plugin has priority set', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'with-priority.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  runPlugins(['add', pluginPath, '--priority', '7'], cwd);
  const out = runPlugins(['list'], cwd);
  assert.match(out, /priority:\s*7/i);
});
