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

// Additional tests for plugins-cli functionality

test('aix-plugins: --help prints program name and commands', () => {
  const cwd = makeWorkspace();
  const out = execFileSync('node', [PLUGINS, '--help'], { encoding: 'utf8', cwd });
  assert.match(out, /aix-plugins/i, '--help should print the program name');
  assert.match(out, /list|add|remove|enable|disable/i, '--help should list available commands');
});

test('aix-plugins: add with --priority stores priority as number in config', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'plugin-prio.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  runPlugins(['add', pluginPath, '--priority', '5'], cwd);

  const config = JSON.parse(fs.readFileSync(path.join(cwd, '.aix-plugins.json'), 'utf8'));
  assert.strictEqual(config.plugins[pluginPath].priority, 5, 'priority should be stored as the number 5');
});

test('aix-plugins: add with --disabled marks plugin as disabled in config', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'plugin-disabled.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  runPlugins(['add', pluginPath, '--disabled'], cwd);

  const config = JSON.parse(fs.readFileSync(path.join(cwd, '.aix-plugins.json'), 'utf8'));
  assert.strictEqual(config.plugins[pluginPath].enabled, false, 'plugin added with --disabled should have enabled=false');
});

test('aix-plugins: add without --disabled marks plugin as enabled in config', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'plugin-noflags.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  runPlugins(['add', pluginPath], cwd);

  const config = JSON.parse(fs.readFileSync(path.join(cwd, '.aix-plugins.json'), 'utf8'));
  assert.strictEqual(config.plugins[pluginPath].enabled, true, 'plugin added without --disabled should have enabled=true');
});

test('aix-plugins: add with --priority and --disabled together sets both fields', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'plugin-combo.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  runPlugins(['add', pluginPath, '--priority', '7', '--disabled'], cwd);

  const config = JSON.parse(fs.readFileSync(path.join(cwd, '.aix-plugins.json'), 'utf8'));
  assert.strictEqual(config.plugins[pluginPath].enabled, false, 'plugin should be disabled');
  assert.strictEqual(config.plugins[pluginPath].priority, 7, 'plugin priority should be 7');
});

test('aix-plugins: remove command deletes plugin from config', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'to-remove.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  runPlugins(['add', pluginPath], cwd);
  const out = runPlugins(['remove', pluginPath], cwd);
  assert.match(out, /[Rr]emoved|🗑/, 'remove command should confirm removal');

  const config = JSON.parse(fs.readFileSync(path.join(cwd, '.aix-plugins.json'), 'utf8'));
  assert.strictEqual(config.plugins[pluginPath], undefined, 'removed plugin should not be present in config');
});

test('aix-plugins: list shows priority for plugins that have it', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'plugin-with-prio.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  runPlugins(['add', pluginPath, '--priority', '3'], cwd);
  const out = runPlugins(['list'], cwd);
  assert.match(out, /priority.*3|3.*priority/, 'list output should display the priority value');
});

test('aix-plugins: add prints success confirmation message', () => {
  const cwd = makeWorkspace();
  const pluginPath = path.join(cwd, 'plugin-msg.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');

  const out = runPlugins(['add', pluginPath], cwd);
  assert.match(out, /Added plugin|✅/, 'add should print a success message');
});

test('aix-plugins: list on missing config file returns gracefully without throwing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-plugins-noconfig-'));
  // Intentionally do NOT create .aix-plugins.json — tests graceful fallback
  const out = runPlugins(['list'], dir);
  assert.match(out, /Installed plugins/i, 'list should work even when config file is absent');
});

test('aix-plugins: enable on non-existent plugin exits non-zero with error on stderr', () => {
  const cwd = makeWorkspace();
  let exitCode = 0;
  let stderr = '';
  try {
    execFileSync('node', [PLUGINS, 'enable', '/no/such/plugin.js'], {
      encoding: 'utf8',
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err) {
    exitCode = err.status;
    stderr = err.stderr || '';
  }
  assert.ok(exitCode !== 0, 'enabling non-existent plugin should exit with non-zero status');
  assert.match(stderr, /not found|Plugin not found/i, 'stderr should report the plugin was not found');
});

test('aix-plugins: disable on non-existent plugin exits non-zero with error on stderr', () => {
  const cwd = makeWorkspace();
  let exitCode = 0;
  let stderr = '';
  try {
    execFileSync('node', [PLUGINS, 'disable', '/no/such/plugin.js'], {
      encoding: 'utf8',
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err) {
    exitCode = err.status;
    stderr = err.stderr || '';
  }
  assert.ok(exitCode !== 0, 'disabling non-existent plugin should exit with non-zero status');
  assert.match(stderr, /not found|Plugin not found/i, 'stderr should report the plugin was not found');
});

test('aix-plugins: unknown command exits non-zero', () => {
  const cwd = makeWorkspace();
  assert.throws(
    () => execFileSync('node', [PLUGINS, 'notacommand'], { encoding: 'utf8', cwd }),
    'unknown command should cause non-zero exit'
  );
});
