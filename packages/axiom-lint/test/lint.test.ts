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

test('secrets rule filePattern matches id_* keys on both / and \\ separators', () => {
  // Regression: the id_* alternative was anchored on '/', so on a
  // Windows path like C:\Users\me\.ssh\id_rsa the extensionless
  // filename slipped through despite being explicitly in scope. We
  // can't actually create a file at a Windows-style path on POSIX,
  // so we exercise the filePattern directly here. (The POSIX-path
  // runtime test on real files lives in the next case.)
  const rules = buildRules({ naming: 'mixed' });
  const rule = rules.find(r => r.id === 'no-secrets');
  assert.ok(rule, 'no-secrets rule must be registered');
  assert.ok(rule!.filePattern!.test('C:\\Users\\me\\.ssh\\id_rsa'), 'Windows path must match');
  assert.ok(rule!.filePattern!.test('/home/me/.ssh/id_rsa'), 'POSIX path must still match');
});

test('max-file-size rule fires on files above the 5MB hard cap', () => {
  // Regression: lintFile used to early-return [] for files larger than
  // 5MB, which skipped every rule INCLUDING the size rule itself. That
  // meant the largest files (the ones the size policy exists for) were
  // reported as clean. Now lintFile evaluates max-file-size against
  // the stat alone before the read short-circuit.
  const dir = mkdtempSync(join(tmpdir(), 'axiom-lint-big-'));
  const big = join(dir, 'big.ts');
  // Write ~6 MB of ASCII so we exceed the 5 MB hard cap without OOM.
  writeFileSync(big, 'x'.repeat(6_000_000), 'utf8');
  const report = lintFiles([big], { naming: 'mixed' });
  assert.ok(
    report.findings.some(f => f.rule === 'max-file-size'),
    `expected max-file-size finding on a 6MB file, got ${JSON.stringify(report.findings)}`,
  );
});

test('oversized fast path respects configured max-file-size threshold', () => {
  // Regression: the over-5MB short-circuit previously always emitted a
  // max-file-size finding even when --max-bytes was set higher than
  // the file size, producing a false positive. Now we re-read the
  // configured threshold and only fire when s.size > configuredMax.
  const dir = mkdtempSync(join(tmpdir(), 'axiom-lint-big2-'));
  const big = join(dir, 'big.ts');
  writeFileSync(big, 'x'.repeat(6_000_000), 'utf8');
  const report = lintFiles([big], { naming: 'mixed', maxFileBytes: 10_000_000 });
  assert.equal(
    report.findings.filter(f => f.rule === 'max-file-size').length,
    0,
    `6MB file under a 10MB cap must NOT fire; got ${JSON.stringify(report.findings)}`,
  );
});

test('secrets rule scans PEM key file conventions (.pem, .key, id_rsa, id_ed25519)', () => {
  // Regression: the private-key-pem pattern was in the detector but
  // the file filter excluded the very files that hold those keys.
  const pem = '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n';
  const rules = buildRules({ naming: 'mixed' });
  for (const name of ['server.pem', 'client.key', 'id_rsa', 'id_ed25519', 'id_rsa.pem']) {
    const file = fixture(name, pem);
    const findings = lintFile(file, rules);
    assert.ok(
      findings.some(f => f.rule === 'no-secrets/private-key-pem'),
      `${name} must be scanned for PEM keys`,
    );
  }
});

test('secrets rule scans .env variant filenames (.env.local, .env.production, .env.test)', () => {
  // Regression for the blind spot where /env$/ only matched a bare .env
  // file. Real leaks live in .env.local far more often than in .env.
  const bait = 'AKIA' + 'IOSFODNN7' + 'EXAMPLE';
  const rules = buildRules({ naming: 'mixed' });
  for (const name of ['.env.local', '.env.production', '.env.test', '.env']) {
    const file = fixture(name, `AWS_KEY=${bait}\n`);
    const findings = lintFile(file, rules);
    assert.ok(
      findings.some(f => f.rule.startsWith('no-secrets')),
      `${name} must be scanned for secrets`,
    );
  }
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
  // Locate by rule id rather than position. Any other rule emitting on
  // this fixture (a future markdown-quality check, say) would have
  // silently broken the previous findings[0] assertion.
  const emDash = findings.find(f => f.rule === 'no-em-dash');
  assert.ok(emDash, 'no-em-dash finding must exist');
  assert.equal(emDash!.severity, 'error');
});

test('lintFiles aggregates report', () => {
  const f1 = fixture('a.md', 'em \u2014 dash\n');
  const f2 = fixture('b.md', 'tab\there\n');
  const report = lintFiles([f1, f2], { naming: 'mixed' });
  assert.equal(report.totalFiles, 2);
  assert.equal(report.filesWithFindings, 2);
  assert.ok(report.findings.length >= 2);
});

test('clean run yields zero findings (used by --fail-on info exit-code policy)', () => {
  // Ground-truth for the CLI fix: a directory whose content tripped no
  // rule must report zero findings, so the exit-code policy can return
  // 0 even when --fail-on is set to the lowest tier (info).
  const file = fixture('clean.ts', `export function add(a: number, b: number) { return a + b; }\n`);
  const report = lintFiles([file], { naming: 'mixed' });
  assert.equal(report.findings.length, 0);
  assert.equal(report.errorCount, 0);
  assert.equal(report.warningCount, 0);
  assert.equal(report.infoCount, 0);
});

test('exclude regex skips file entirely', () => {
  const f = fixture('a.md', 'em \u2014 dash\n');
  const report = lintFiles([f], { naming: 'mixed', exclude: [/\.md$/] });
  assert.equal(report.findings.length, 0);
});
