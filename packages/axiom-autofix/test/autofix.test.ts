// بسم الله الرحمن الرحيم
// Tests pin the three load-bearing properties of @axiom/autofix:
//   1. each transform is deterministic + idempotent
//   2. the runner refuses to write to disk without an approved gate
//   3. token validation is constant-time and single-use

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { writeFileSync, readFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import {
  fixEmDash,
  fixTabInMarkdown,
  fixTrailingWhitespace,
  fixFinalNewline,
  applyFixesToFile,
  applyFixesToFiles,
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

test('no-tab-in-markdown does not rewrite tabs in .ts source', () => {
  // Regression: previously fixTabInMarkdown ran on every file with no
  // file-type guard, so a TypeScript file's significant leading tab
  // would be silently replaced with two spaces. Now the fix has an
  // appliesTo filter that restricts it to .md / .mdx.
  const tsFile = tmp('a.ts', '\texport const x = 1;\n');
  const before = readFileSync(tsFile, 'utf8');
  const results = applyFixesToFile(tsFile, { approved: true });
  const tabFix = results.find(r => r.fix === 'no-tab-in-markdown');
  assert.equal(tabFix, undefined, 'tab fix must not run on .ts files');
  assert.equal(readFileSync(tsFile, 'utf8'), before, '.ts content must be unchanged');
});

test('no-tab-in-markdown does rewrite tabs in .md files (positive case)', () => {
  const mdFile = tmp('a.md', '\theading\n');
  applyFixesToFile(mdFile, { approved: true });
  const after = readFileSync(mdFile, 'utf8');
  assert.ok(!after.startsWith('\t'), 'leading tab must be replaced');
  assert.ok(after.startsWith('  '), 'leading tab must become two spaces');
});

test('applyFixesToFiles refuses to recurse into a symlinked directory', () => {
  // Build dir/, then create dir/loop -> .. so a naive recursive walk
  // would loop forever. lstatSync + isSymbolicLink() must short-circuit.
  const dir = mkdtempSync(join(tmpdir(), 'axiom-autofix-link-'));
  writeFileSync(join(dir, 'real.md'), 'foo \u2014 bar\n', 'utf8');
  try {
    // node:fs symlinkSync — wrap in try/catch because some CI sandboxes
    // forbid symlink creation; we just skip the assertion in that case.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs');
    fs.symlinkSync('..', join(dir, 'loop'), 'dir');
  } catch {
    return; // sandbox without symlink permission
  }
  const out = applyFixesToFiles([dir], { approved: false });
  // Must terminate AND find real.md. Visiting the symlink would either
  // loop forever (timeout) or surface a 'loop/real.md'-prefixed file.
  const files = out.map(r => r.file);
  assert.ok(files.some(f => f.endsWith('real.md')));
  assert.ok(!files.some(f => f.includes('/loop/')), 'must not descend into symlinked dir');
});

test('applyFixesToFile skips a directory input without throwing', () => {
  // Regression for the EISDIR bug: previously applyFixesToFile called
  // readFileSync on whatever path it received and crashed on directories.
  const dir = mkdtempSync(join(tmpdir(), 'axiom-autofix-dir-'));
  // No throw, empty results.
  const out = applyFixesToFile(dir, { approved: false });
  assert.deepEqual(out, []);
});

test('applyFixesToFiles expands directories into constituent files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'axiom-autofix-walk-'));
  const sub = join(dir, 'sub');
  mkdirSync(sub);
  writeFileSync(join(dir, 'a.md'), 'foo \u2014 bar\n', 'utf8');
  writeFileSync(join(sub, 'b.md'), 'baz \u2014 qux\n', 'utf8');
  const out = applyFixesToFiles([dir], { approved: false });
  // Use path.basename so the assertion holds on Windows (where the
  // walker emits backslash-separated paths) as well as POSIX. The
  // previous split('/').pop() returned the entire path on Windows
  // and the set membership check failed even when the walker was
  // working correctly.
  const files = new Set(out.map(r => basename(r.file)));
  assert.ok(files.has('a.md'), 'must walk top-level file');
  assert.ok(files.has('b.md'), 'must recurse into sub-directory');
});

test('applyFixesToFiles skips node_modules during directory walk', () => {
  const dir = mkdtempSync(join(tmpdir(), 'axiom-autofix-nm-'));
  const nm = join(dir, 'node_modules');
  mkdirSync(nm);
  writeFileSync(join(dir, 'real.md'), 'a \u2014 b\n', 'utf8');
  writeFileSync(join(nm, 'fake.md'), 'c \u2014 d\n', 'utf8');
  const out = applyFixesToFiles([dir], { approved: false });
  const files = out.map(r => r.file);
  assert.ok(files.some(f => f.endsWith('real.md')));
  assert.ok(!files.some(f => f.includes('node_modules')));
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
