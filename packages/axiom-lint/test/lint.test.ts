// بسم الله الرحمن الرحيم
// Unit tests for @axiom/lint rules. Each test uses a real string sample, not a
// mock — the rule is given content it would actually receive from readFileSync.

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lintFiles, buildRules, lintFile } from '../src/index.ts';

function fixture(name: string, body: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'axiom-lint-'));
  const p = join(dir, name);
  writeFileSync(p, body, 'utf8');
  return p;
}

test('detects em dash in markdown', () => {
  const file = fixture('a.md', 'Hello \u2014 world\n');
  const rules = buildRules({ naming: 'mixed' });
  const findings = lintFile(file, rules);
  const emDash = findings.find(f => f.rule === 'no-em-dash');
  assert.ok(emDash, 'em dash must be flagged');
  assert.equal(emDash!.line, 1);
});

test('accepts an em dash inside a JSON string when it is data, not prose', () => {
  // The rule fires on text content regardless; the test pins the documented
  // behaviour so consumers know to disable the rule on data files if needed.
  const file = fixture('a.json', '{"label":"foo \u2014 bar"}\n');
  const rules = buildRules({ naming: 'mixed' });
  const findings = lintFile(file, rules);
  assert.equal(findings.filter(f => f.rule === 'no-em-dash').length, 1);
});

test('detects AWS access key', () => {
  // Compose the bait from fragments so this very test file does not trip
  // the rule when axiom-lint is dogfooded on itself.
  const bait = 'AKIA' + 'IOSFODNN7' + 'EXAMPLE';
  const file = fixture('a.env', `AWS_KEY=${bait}\n`);
  const rules = buildRules({ naming: 'mixed' });
  const findings = lintFile(file, rules);
  const secret = findings.find(f => f.rule.startsWith('no-secrets'));
  assert.ok(secret, 'AWS key must be flagged');
  assert.equal(secret!.severity, 'error');
});

test('detects GitHub PAT', () => {
  const bait = 'ghp' + '_' + 'abcdefghijklmnopqrstuvwxyz0123456789';
  const file = fixture('a.sh', `token=${bait}\n`);
  const rules = buildRules({ naming: 'mixed' });
  const findings = lintFile(file, rules);
  assert.ok(findings.some(f => f.rule === 'no-secrets/github-pat'));
});

test('detects tabs in markdown', () => {
  const file = fixture('a.md', 'line1\n\tindented\n');
  const rules = buildRules({ naming: 'mixed' });
  const findings = lintFile(file, rules);
  assert.ok(findings.some(f => f.rule === 'no-tab-in-markdown'));
});

test('flags TODO markers as info', () => {
  const file = fixture('a.ts', 'export function x() { /* TODO refactor */ return 1; }\n');
  const rules = buildRules({ naming: 'mixed' });
  const findings = lintFile(file, rules);
  const todo = findings.find(f => f.rule === 'no-todo-marker');
  assert.ok(todo);
  assert.equal(todo!.severity, 'info');
});

test('flags oversized files', () => {
  const file = fixture('a.ts', 'x'.repeat(1500));
  const rules = buildRules({ naming: 'mixed', maxFileBytes: 1000 });
  const findings = lintFile(file, rules);
  assert.ok(findings.some(f => f.rule === 'max-file-size'));
});

test('disabled rules emit nothing', () => {
  const file = fixture('a.md', 'see \u2014 here\n');
  const rules = buildRules({ disable: ['no-em-dash'], naming: 'mixed' });
  const findings = lintFile(file, rules);
  assert.equal(findings.length, 0);
});

test('severity override is respected', () => {
  const file = fixture('a.md', 'note \u2014 here\n');
  const rules = buildRules({ severities: { 'no-em-dash': 'error' }, naming: 'mixed' });
  const findings = lintFile(file, rules);
  assert.equal(findings[0].severity, 'error');
});

test('lintFiles aggregates report', () => {
  const f1 = fixture('a.md', 'em \u2014 dash\n');
  const f2 = fixture('b.md', 'tab\there\n');
  const report = lintFiles([f1, f2], { naming: 'mixed' });
  assert.equal(report.totalFiles, 2);
  assert.equal(report.filesWithFindings, 2);
  assert.ok(report.findings.length >= 2);
});

test('exclude regex skips file entirely', () => {
  const f = fixture('a.md', 'em \u2014 dash\n');
  const report = lintFiles([f], { naming: 'mixed', exclude: [/\.md$/] });
  assert.equal(report.findings.length, 0);
});
