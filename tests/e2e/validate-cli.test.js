/**
 * E2E coverage for bin/aix-validate.js.
 *
 * Exercises the binary end-to-end with the example manifests committed
 * under examples/, plus a few negative inputs to verify error paths.
 * Uses node:test (matches the existing tests/e2e/ convention).
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
const VALIDATE = path.join(REPO_ROOT, 'bin', 'aix-validate.js');

function runValidate(args, opts = {}) {
  return execFileSync('node', [VALIDATE, ...args], {
    encoding: 'utf8',
    cwd: REPO_ROOT,
    ...opts,
  });
}

test('aix-validate: --help prints usage and exits 0', () => {
  const out = runValidate(['--help']);
  assert.match(out, /AIX Validation Tool/);
  assert.match(out, /Usage:/);
});

test('aix-validate: persona example manifest passes', () => {
  const out = runValidate(['examples/persona-agent.aix']);
  // The CLI either prints a success banner or exits cleanly.
  // We only assert it did not throw; success markers vary by version.
  assert.equal(typeof out, 'string');
});

test('aix-validate: tool-agent example manifest passes', () => {
  const out = runValidate(['examples/tool-agent.aix']);
  assert.equal(typeof out, 'string');
});

test('aix-validate: hybrid-agent example manifest passes', () => {
  const out = runValidate(['examples/hybrid-agent.aix']);
  assert.equal(typeof out, 'string');
});

test('aix-validate: missing file path exits non-zero', () => {
  assert.throws(() => execFileSync('node', [VALIDATE], { encoding: 'utf8', cwd: REPO_ROOT }));
});

test('aix-validate: non-existent file exits non-zero', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-validate-missing-'));
  const missing = path.join(dir, 'no-such-file.aix');
  assert.throws(() => execFileSync('node', [VALIDATE, missing], { encoding: 'utf8', cwd: REPO_ROOT }));
});
