/**
 * E2E coverage for bin/aix-convert.js.
 *
 * Exercises format conversion roundtrips (yaml <-> json) on the
 * committed example manifests. Asserts the output file is created
 * and the manifest semantics survive a round trip.
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
const CONVERT = path.join(REPO_ROOT, 'bin', 'aix-convert.js');

function runConvert(args) {
  return execFileSync('node', [CONVERT, ...args], {
    encoding: 'utf8',
    cwd: REPO_ROOT,
  });
}

test('aix-convert: --help prints usage', () => {
  const out = execFileSync('node', [CONVERT, '--help'], { encoding: 'utf8', cwd: REPO_ROOT });
  assert.match(out, /Usage:|aix-convert/i);
});

test('aix-convert: yaml -> json produces a non-empty file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-yaml-json-'));
  const out = path.join(dir, 'persona-agent.json');
  runConvert(['examples/persona-agent.aix', out, '--format', 'json']);
  assert.ok(fs.existsSync(out), 'output file should exist');
  const content = fs.readFileSync(out, 'utf8');
  assert.ok(content.length > 0);
  const parsed = JSON.parse(content);
  assert.ok(parsed.meta, 'output JSON should have a meta block');
  assert.ok(parsed.persona, 'output JSON should have a persona block');
});

test('aix-convert: missing args exits non-zero', () => {
  assert.throws(() => execFileSync('node', [CONVERT, 'examples/persona-agent.aix'], { encoding: 'utf8', cwd: REPO_ROOT }));
});

test('aix-convert: unknown format flag is rejected', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-bad-format-'));
  const out = path.join(dir, 'persona.xml');
  assert.throws(() => execFileSync('node', [CONVERT, 'examples/persona-agent.aix', out, '--format', 'xml'], { encoding: 'utf8', cwd: REPO_ROOT }));
});

// --- PR coverage: sync parseFile (removed await), modified and new example files ---

test('aix-convert: pi-agent.aix (abom without type/purl) converts to JSON', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-pi-'));
  const out = path.join(dir, 'pi-agent.json');
  runConvert(['examples/pi-agent.aix', out, '--format', 'json']);
  assert.ok(fs.existsSync(out), 'output JSON file should exist');
  const parsed = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.ok(parsed.meta, 'should have meta block');
  assert.ok(parsed.abom, 'should have abom block');
  const constituents = parsed.abom.constituents ?? [];
  assert.ok(constituents.length > 0, 'abom should have constituents');
  // Verify that the PR change (removing type and purl fields) is preserved through conversion
  for (const c of constituents) {
    assert.strictEqual(c.type, undefined, 'constituent should not have type field after PR change');
    assert.strictEqual(c.purl, undefined, 'constituent should not have purl field after PR change');
  }
});

test('aix-convert: enhanced-agent.aix (version "1.0", with memory.persistence) converts to JSON', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-enhanced-'));
  const out = path.join(dir, 'enhanced-agent.json');
  runConvert(['examples/enhanced-agent.aix', out, '--format', 'json']);
  assert.ok(fs.existsSync(out), 'output JSON file should exist');
  const parsed = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.strictEqual(parsed.meta.version, '1.0', 'version should be "1.0" as changed in PR');
  assert.strictEqual(parsed.identity_layer, undefined, 'identity_layer should be absent (removed in PR)');
  assert.ok(parsed.memory?.persistence, 'memory.persistence section should be present (added in PR)');
  assert.strictEqual(parsed.memory.persistence.enabled, true);
  assert.strictEqual(parsed.memory.persistence.backend, 'file');
});

test('aix-convert: enhanced-agent.aix yaml -> yaml roundtrip preserves meta name', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-enhanced-yaml-'));
  const out = path.join(dir, 'enhanced-agent.aix');
  runConvert(['examples/enhanced-agent.aix', out, '--format', 'yaml']);
  assert.ok(fs.existsSync(out), 'output YAML file should exist');
  const content = fs.readFileSync(out, 'utf8');
  assert.match(content, /Web Scraper Pro/, 'agent name should survive YAML roundtrip');
});

test('aix-convert: -f shorthand accepted as alias for --format', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-shorthand-'));
  const out = path.join(dir, 'pi-agent.json');
  // -f is the documented shorthand for --format
  runConvert(['examples/pi-agent.aix', out, '-f', 'json']);
  assert.ok(fs.existsSync(out), 'output file should exist when using -f shorthand');
});

test('aix-convert: non-existent input file exits non-zero', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-missing-'));
  const out = path.join(dir, 'out.json');
  assert.throws(
    () => execFileSync('node', [CONVERT, 'examples/does-not-exist.aix', out, '--format', 'json'], { encoding: 'utf8', cwd: REPO_ROOT }),
    'should throw when input file does not exist'
  );
});

test('aix-convert: yaml -> toml conversion produces a non-empty file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-toml-'));
  const out = path.join(dir, 'pi-agent.toml');
  runConvert(['examples/pi-agent.aix', out, '--format', 'toml']);
  assert.ok(fs.existsSync(out), 'output TOML file should exist');
  const content = fs.readFileSync(out, 'utf8');
  assert.ok(content.length > 0, 'TOML output should not be empty');
  // TOML sections start with [sectionName]
  assert.match(content, /\[meta\]/);
});
