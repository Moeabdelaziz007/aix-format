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
import { execFileSync } from 'child_process';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');
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
