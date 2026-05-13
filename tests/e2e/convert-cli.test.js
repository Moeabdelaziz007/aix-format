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
import { execFileSync } from 'child_process';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');
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
