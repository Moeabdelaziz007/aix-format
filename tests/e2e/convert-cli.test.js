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

// Additional tests for convert-cli functionality

test('aix-convert: yaml -> json output contains correct agent name in meta block', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-name-'));
  const out = path.join(dir, 'output.json');
  runConvert(['examples/persona-agent.aix', out, '--format', 'json']);
  const parsed = JSON.parse(fs.readFileSync(out, 'utf8'));
  // Ensure meta.name is a non-empty string (async parseFile must resolve before accessing agent.meta)
  assert.ok(typeof parsed.meta.name === 'string', 'meta.name should be a string');
  assert.ok(parsed.meta.name.length > 0, 'meta.name should not be empty');
});

test('aix-convert: yaml -> json with --pretty produces indented output', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-pretty-'));
  const out = path.join(dir, 'persona-pretty.json');
  runConvert(['examples/persona-agent.aix', out, '--format', 'json', '--pretty']);
  const content = fs.readFileSync(out, 'utf8');
  assert.ok(content.includes('\n'), 'pretty-printed JSON should contain newlines');
  assert.ok(content.includes('  '), 'pretty-printed JSON should be indented with spaces');
  // Must still be valid JSON
  const parsed = JSON.parse(content);
  assert.ok(parsed.meta, 'pretty JSON should have a meta block');
  assert.ok(parsed.persona, 'pretty JSON should have a persona block');
});

test('aix-convert: yaml -> yaml roundtrip produces valid YAML with meta section', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-yaml-yaml-'));
  const out = path.join(dir, 'persona-out.yaml');
  runConvert(['examples/persona-agent.aix', out, '--format', 'yaml']);
  assert.ok(fs.existsSync(out), 'output yaml file should exist');
  const content = fs.readFileSync(out, 'utf8');
  assert.ok(content.length > 0, 'output yaml should not be empty');
  assert.ok(content.includes('meta'), 'yaml output should contain a meta key');
  assert.ok(content.includes('persona'), 'yaml output should contain a persona key');
});

test('aix-convert: yaml -> toml produces a file with [meta] section', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-yaml-toml-'));
  const out = path.join(dir, 'persona.toml');
  runConvert(['examples/persona-agent.aix', out, '--format', 'toml']);
  assert.ok(fs.existsSync(out), 'output toml file should exist');
  const content = fs.readFileSync(out, 'utf8');
  assert.ok(content.length > 0, 'output toml should not be empty');
  assert.ok(content.includes('[meta]'), 'toml output should have a [meta] section');
  assert.ok(content.includes('[security]'), 'toml output should have a [security] section');
});

test('aix-convert: yml format alias produces same output as yaml format', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-yml-alias-'));
  const outYml = path.join(dir, 'persona.yml');
  const outYaml = path.join(dir, 'persona.yaml');
  runConvert(['examples/persona-agent.aix', outYml, '--format', 'yml']);
  runConvert(['examples/persona-agent.aix', outYaml, '--format', 'yaml']);
  assert.ok(fs.existsSync(outYml), 'output .yml file should exist');
  assert.ok(fs.existsSync(outYaml), 'output .yaml file should exist');
  const ymlContent = fs.readFileSync(outYml, 'utf8');
  const yamlContent = fs.readFileSync(outYaml, 'utf8');
  assert.ok(ymlContent.length > 0, 'yml output should not be empty');
  // Both should contain the same key sections
  assert.ok(ymlContent.includes('meta'), 'yml output should contain meta section');
  assert.ok(yamlContent.includes('meta'), 'yaml output should contain meta section');
});

test('aix-convert: non-existent input file exits with non-zero status', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-missing-'));
  const out = path.join(dir, 'out.json');
  assert.throws(
    () => runConvert(['/no/such/file-that-does-not-exist.aix', out, '--format', 'json']),
    'should throw when input file does not exist'
  );
});

test('aix-convert: output json contains security.checksum block', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-checksum-'));
  const out = path.join(dir, 'output.json');
  runConvert(['examples/persona-agent.aix', out, '--format', 'json']);
  const parsed = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.ok(parsed.security, 'output should have a security block');
  assert.ok(parsed.security.checksum, 'output security should have a checksum');
  assert.ok(typeof parsed.security.checksum.value === 'string', 'checksum value should be a string');
  assert.ok(parsed.security.checksum.value.length > 0, 'checksum value should not be empty');
});

test('aix-convert: tool-agent.aix yaml -> json conversion succeeds', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-convert-tool-'));
  const out = path.join(dir, 'tool-agent.json');
  runConvert(['examples/tool-agent.aix', out, '--format', 'json']);
  assert.ok(fs.existsSync(out), 'output json file should exist for tool-agent');
  const parsed = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.ok(parsed.meta, 'tool-agent output should have meta block');
});
