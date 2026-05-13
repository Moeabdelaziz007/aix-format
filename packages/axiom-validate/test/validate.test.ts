// بسم الله الرحمن الرحيم
// Tests use real JSON Schemas + real markdown samples, no mocks.

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  validateAgainstSchema,
  validateSkillMarkdown,
  checkTypeDrift,
  validateManifestFiles,
} from '../src/index.ts';

function tmp(name: string, body: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'axiom-val-'));
  const p = join(dir, name);
  writeFileSync(p, body, 'utf8');
  return p;
}

test('schema validation accepts a manifest matching the shape', () => {
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['version'],
    properties: { version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' } },
    additionalProperties: false,
  };
  const findings = validateAgainstSchema(schema, { version: '1.2.3' });
  assert.equal(findings.length, 0);
});

test('schema validation reports the precise path on mismatch', () => {
  const schema = {
    type: 'object',
    required: ['version'],
    properties: { version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' } },
  };
  const findings = validateAgainstSchema(schema, { version: '1.2' }, 'a.json');
  assert.ok(findings.length > 0);
  assert.equal(findings[0].file, 'a.json');
  assert.ok(findings[0].message.includes('pattern') || findings[0].message.includes('match'));
});

test('validateManifestFiles handles missing files cleanly', () => {
  const schemaPath = tmp('schema.json', JSON.stringify({ type: 'object' }));
  const report = validateManifestFiles(schemaPath, ['/definitely/not/here.json']);
  assert.equal(report.failed, 1);
  assert.ok(report.findings[0].message.includes('not found'));
});

test('skill markdown: accepts CRLF line endings (Windows authoring)', () => {
  // Regression: the frontmatter regex was hard-coded to LF, so a file
  // authored on Windows tripped a false "missing frontmatter" error.
  const body =
    `---\r\n` +
    `name: ok-name\r\n` +
    `tier: 1\r\n` +
    `description: one sentence\r\n` +
    `---\r\n` +
    `\r\n` +
    `## Purpose\r\n` +
    `\r\n` +
    `Real content.\r\n`;
  const file = tmp('windows.md', body);
  const findings = validateSkillMarkdown(file);
  assert.equal(
    findings.filter(f => f.message.includes('frontmatter')).length,
    0,
    `unexpected frontmatter errors: ${JSON.stringify(findings)}`,
  );
});

test('skill markdown: required-key check is anchored, not substring', () => {
  // Regression: fm.includes('name:') used to accept `rename:` and
  // similar lookalikes. Each lookalike must now be flagged as a
  // missing-required-key error.
  const file = tmp('substr.md', `---
rename: bad
frontier: 2
short_description: nope
---

## Purpose

x
`);
  const findings = validateSkillMarkdown(file);
  const missing = new Set(
    findings
      .filter(f => f.message.startsWith('frontmatter missing required key'))
      .map(f => f.message),
  );
  for (const key of ['name', 'tier', 'description']) {
    assert.ok(
      [...missing].some(m => m.includes(`"${key}"`)),
      `expected missing-key error for "${key}", got ${[...missing].join(' / ')}`,
    );
  }
});

test('skill markdown: rejects missing frontmatter', () => {
  const file = tmp('s.md', '# A skill\n\nSome body.\n');
  const findings = validateSkillMarkdown(file);
  assert.ok(findings.some(f => f.message.includes('frontmatter')));
});

test('skill markdown: accepts a well-formed file', () => {
  const file = tmp('good.md', `---
name: my-skill
tier: 2
description: One sentence.
---

## Purpose

Real content.
`);
  const findings = validateSkillMarkdown(file);
  assert.equal(findings.length, 0);
});

test('skill markdown: flags non-kebab name', () => {
  const file = tmp('bad.md', `---
name: My_Skill
tier: 2
description: x
---

## Purpose

x
`);
  const findings = validateSkillMarkdown(file);
  assert.ok(findings.some(f => f.message.includes('kebab-case')));
});

test('skill markdown: rejects non-numeric tier', () => {
  // Regression for the silent-acceptance bug: tier: two used to pass
  // because the digit-only regex simply did not match the value.
  const file = tmp('alpha.md', `---
name: ok-name
tier: two
description: x
---

## Purpose

x
`);
  const findings = validateSkillMarkdown(file);
  assert.ok(findings.some(f => f.message.includes('not a non-negative integer')));
});

test('skill markdown: flags out-of-range tier', () => {
  const file = tmp('bad2.md', `---
name: ok-name
tier: 9
description: x
---

## Purpose

x
`);
  const findings = validateSkillMarkdown(file);
  assert.ok(findings.some(f => f.message.includes('out of range')));
});

test('skill markdown: flags TODO purpose', () => {
  const file = tmp('todo.md', `---
name: ok-name
tier: 1
description: x
---

## Purpose: TODO write this
`);
  const findings = validateSkillMarkdown(file);
  assert.ok(findings.some(f => f.message.includes('TODO stub')));
});

test('drift: identical input -> no findings', () => {
  const findings = checkTypeDrift('x.d.ts', 'export const a = 1\n', 'export const a = 1\n');
  assert.equal(findings.length, 0);
});

test('drift: divergent input pinpoints first differing line', () => {
  const cur = 'line1\nline2\nline3\n';
  const exp = 'line1\nLINE2\nline3\n';
  const findings = checkTypeDrift('x.d.ts', cur, exp);
  assert.equal(findings.length, 1);
  assert.ok(findings[0].message.includes('line 2'));
});
