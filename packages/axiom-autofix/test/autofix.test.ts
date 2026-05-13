// بسم الله الرحمن الرحيم
// Tests pin the three load-bearing properties of @axiom/autofix:
//   1. each transform is deterministic + idempotent
//   2. the runner refuses to write to disk without an approved gate
//   3. token validation is constant-time and single-use

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  fixEmDash,
  fixTabInMarkdown,
  fixTrailingWhitespace,
  fixFinalNewline,
  applyFixesToFile,
  mintApprovalToken,
  validateApprovalToken,
} from '../src/index.ts';

function tmp(name: string, body: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'axiom-autofix-'));
  const p = join(dir, name);
  writeFileSync(p, body, 'utf8');
  return p;
}

test('emDash transform converts " — " to " - "', () => {
  const out = fixEmDash.transform('foo \u2014 bar');
  assert.equal(out, 'foo - bar');
});

test('emDash transform is idempotent', () => {
  const once = fixEmDash.transform('foo \u2014 bar');
  const twice = fixEmDash.transform(once!);
  assert.equal(twice, null, 'second application is a no-op');
});

test('emDash returns null when there is nothing to fix', () => {
  assert.equal(fixEmDash.transform('plain text'), null);
});

test('tab transform replaces leading tabs with two spaces', () => {
  const out = fixTabInMarkdown.transform('\t\tindented\n');
  assert.equal(out, '    indented\n');
});

test('trailing whitespace transform strips end-of-line spaces', () => {
  const out = fixTrailingWhitespace.transform('a   \nb\t\nc\n');
  assert.equal(out, 'a\nb\nc\n');
});

test('final newline transform collapses multiple trailing newlines to one', () => {
  const out = fixFinalNewline.transform('content\n\n\n');
  assert.equal(out, 'content\n');
});

test('runner does NOT write to disk without approval', () => {
  const file = tmp('a.md', 'foo \u2014 bar\n');
  const original = readFileSync(file, 'utf8');
  const results = applyFixesToFile(file, { approved: false });
  // Computed a change …
  assert.ok(results.some(r => r.fix === 'no-em-dash'));
  // … but didn't write.
  assert.equal(readFileSync(file, 'utf8'), original);
  for (const r of results) assert.equal(r.blockedByGate, true);
});

test('runner writes to disk WITH approval', () => {
  const file = tmp('a.md', 'foo \u2014 bar\n');
  applyFixesToFile(file, { approved: true });
  const after = readFileSync(file, 'utf8');
  assert.ok(!after.includes('\u2014'));
  assert.ok(after.includes('foo - bar'));
});

test('token validation: matching SHA succeeds', () => {
  const { token, sha } = mintApprovalToken();
  assert.equal(validateApprovalToken(token, sha), true);
});

test('token validation: tampered token fails', () => {
  const { token, sha } = mintApprovalToken();
  const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
  assert.equal(validateApprovalToken(tampered, sha), false);
});

test('token validation: missing prefix rejected', () => {
  const { sha } = mintApprovalToken();
  assert.equal(validateApprovalToken('not-a-token', sha), false);
});

test('all fixes are idempotent under double application', () => {
  const transforms = [fixEmDash, fixTabInMarkdown, fixTrailingWhitespace, fixFinalNewline];
  const samples = ['hello \u2014 world\n', '\tindented\n', 'trailing   \n', 'no newline', 'foo\n\n\n'];
  for (const t of transforms) {
    for (const s of samples) {
      const once = t.transform(s);
      if (once === null) continue;
      const twice = t.transform(once);
      assert.equal(twice, null, `${t.id} not idempotent on ${JSON.stringify(s)}`);
    }
  }
});
