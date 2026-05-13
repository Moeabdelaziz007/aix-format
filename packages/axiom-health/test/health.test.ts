// بسم الله الرحمن الرحيم
// Health module tests over real strings and real file fixtures.

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  deadCodeScore,
  coverageScore,
  trustChainScore,
  typeDriftScore,
  aggregateHealth,
} from '../src/index.ts';

function tmp(name: string, body: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'axiom-health-'));
  const p = join(dir, name);
  writeFileSync(p, body, 'utf8');
  return p;
}

test('deadCodeScore: 100 when every export is referenced', () => {
  const f1 = tmp('a.ts', `export const used = 1;\nexport const helper = 2;\n`);
  const f2 = tmp('b.ts', `import { used, helper } from './a';\nconsole.log(used + helper);\n`);
  const sub = deadCodeScore('/', [f1, f2]);
  assert.equal(sub.score, 100);
});

test('deadCodeScore: penalises unreferenced export', () => {
  const f1 = tmp('a.ts', `export const usedOnce = 1;\nexport const dead = 2;\n`);
  const f2 = tmp('b.ts', `import { usedOnce } from './a';\nconsole.log(usedOnce);\n`);
  const sub = deadCodeScore('/', [f1, f2]);
  assert.ok(sub.score !== null && sub.score < 100);
});

test('deadCodeScore: null with no sources', () => {
  const sub = deadCodeScore('/', []);
  assert.equal(sub.score, null);
});

test('coverageScore: parses istanbul shape', () => {
  const f = tmp('cov.json', JSON.stringify({ total: { lines: { pct: 87.5 } } }));
  const sub = coverageScore(f);
  assert.equal(sub.score, 87.5);
});

test('coverageScore: parses custom {coverage} shape', () => {
  const f = tmp('cov.json', JSON.stringify({ coverage: 92.4 }));
  const sub = coverageScore(f);
  assert.equal(sub.score, 92.4);
});

test('coverageScore: missing file -> null with explanation', () => {
  const sub = coverageScore('/no/such/path.json');
  assert.equal(sub.score, null);
  assert.ok(sub.detail.includes('not found'));
});

test('trustChainScore: 100 on linked chain', () => {
  const entries = [
    { index: 0, action_hash: 'a', prev_hash: '' },
    { index: 1, action_hash: 'b', prev_hash: 'a' },
    { index: 2, action_hash: 'c', prev_hash: 'b' },
  ];
  const f = tmp('chain.json', JSON.stringify({ entries }));
  const sub = trustChainScore(f);
  assert.equal(sub.score, 100);
});

test('trustChainScore: broken linkage scored < 100', () => {
  const entries = [
    { index: 0, action_hash: 'a', prev_hash: '' },
    { index: 1, action_hash: 'b', prev_hash: 'WRONG' },
  ];
  const f = tmp('chain.json', JSON.stringify({ entries }));
  const sub = trustChainScore(f);
  assert.ok(sub.score !== null && sub.score < 100);
});

test('trustChainScore: rejects payload missing the entries key entirely', () => {
  // Regression: `{}` used to coerce to entries=[] and return score 100
  // ("empty chain, vacuously intact"). For external trust-chain input,
  // a missing entries key is a structural failure, not a valid empty
  // export. Now scored 0 with a clear detail.
  const f = tmp('chain.json', JSON.stringify({}));
  const sub = trustChainScore(f);
  assert.equal(sub.score, 0);
  assert.ok(sub.detail.includes('missing entries array'));
});

test('trustChainScore: rejects null top-level payload', () => {
  // Same defensive guard for `null` — would previously have thrown on
  // .entries access; now returns 0 + structural-failure detail.
  const f = tmp('chain.json', 'null');
  const sub = trustChainScore(f);
  assert.equal(sub.score, 0);
  assert.ok(sub.detail.includes('missing entries array'));
});

test('trustChainScore: rejects non-array entries with a structural failure', () => {
  // Regression: when `entries` is present but is a string / number / object,
  // dereferencing .length used to yield NaN and the aggregate scoring
  // propagated the NaN. Now this case returns score 0 with a clear
  // structural-failure detail.
  const f = tmp('chain.json', JSON.stringify({ entries: 'not-an-array' }));
  const sub = trustChainScore(f);
  assert.equal(sub.score, 0);
  assert.ok(sub.detail.includes('entries must be an array'));
});

test('trustChainScore: malformed entry shape produces a break, not a crash', () => {
  // Regression: a null entry or a non-object inside .entries would have
  // thrown on .index / .prev_hash access. Now it counts as a break and
  // the score reflects that, but the process keeps running.
  const entries = [
    { index: 0, action_hash: 'a', prev_hash: '' },
    null,
    { index: 2, action_hash: 'c', prev_hash: 'a' },
  ];
  const f = tmp('chain.json', JSON.stringify({ entries }));
  const sub = trustChainScore(f);
  assert.ok(sub.score !== null);
  assert.ok(sub.score < 100, `expected break recorded for null entry, got ${sub.score}`);
});

test('trustChainScore: entry with non-string action_hash counts as a break', () => {
  const entries = [
    { index: 0, action_hash: 'a', prev_hash: '' },
    { index: 1, action_hash: 12345, prev_hash: 'a' },
  ];
  const f = tmp('chain.json', JSON.stringify({ entries }));
  const sub = trustChainScore(f);
  assert.ok(sub.score !== null && sub.score < 100);
});

test('trustChainScore: duplicate action_hash penalised', () => {
  const entries = [
    { index: 0, action_hash: 'a', prev_hash: '' },
    { index: 1, action_hash: 'a', prev_hash: 'a' },
  ];
  const f = tmp('chain.json', JSON.stringify({ entries }));
  const sub = trustChainScore(f);
  assert.ok(sub.score !== null && sub.score < 100);
});

test('typeDriftScore: matching SHA -> 100', () => {
  const gen = tmp('gen.d.ts', 'export type X = number;\n');
  const sha = createHash('sha256').update('export type X = number;\n').digest('hex');
  const manifest = tmp('manifest.json', JSON.stringify({ expectedSha256: sha }));
  const sub = typeDriftScore(gen, manifest);
  assert.equal(sub.score, 100);
});

test('typeDriftScore: mismatch -> 0', () => {
  const gen = tmp('gen.d.ts', 'export type X = number;\n');
  const manifest = tmp('manifest.json', JSON.stringify({ expectedSha256: 'deadbeef' }));
  const sub = typeDriftScore(gen, manifest);
  assert.equal(sub.score, 0);
});

test('aggregateHealth: skipped sub-scores excluded from average', () => {
  const subs = [
    { name: 'a', score: 80, weight: 25, detail: '' },
    { name: 'b', score: null, weight: 25, detail: 'skip' },
    { name: 'c', score: 100, weight: 25, detail: '' },
    { name: 'd', score: null, weight: 25, detail: 'skip' },
  ];
  const r = aggregateHealth(subs);
  assert.equal(r.aggregate, 90); // (80 + 100)/2 weighted equally
  assert.equal(r.notes.length, 2);
});
