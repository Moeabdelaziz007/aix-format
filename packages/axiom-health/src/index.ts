// بسم الله الرحمن الرحيم
// @axiom/health — repo health score.
//
// Four independent metrics, each producing a 0..100 sub-score with a weight.
// The aggregate is the weighted sum. A missing input (e.g. coverage.json not
// found) yields a null sub-score and is excluded from the average, not coerced
// to zero, so a repo with no coverage instrumentation still reports honestly.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export interface SubScore {
  name: string;
  score: number | null;
  weight: number;
  detail: string;
}

export interface HealthReport {
  aggregate: number;
  subScores: SubScore[];
  /** Free-form findings the consumer can render verbatim. */
  notes: string[];
}

// --- 1. Dead-code score ---------------------------------------------------

/**
 * Heuristic: count exported symbols whose names appear ONLY in the file that
 * exports them. We deliberately use a fast text grep over `export X` / `export
 * function X` / `export const X` / `export class X` / `export interface X` /
 * `export type X` because a full AST scan across the workspace doubles the
 * tool's complexity for marginal extra accuracy. False positives are listed
 * as `notes` for human triage.
 */
export function deadCodeScore(repoRoot: string, sourceFiles: string[]): SubScore {
  if (sourceFiles.length === 0) {
    return { name: 'dead-code', score: null, weight: 25, detail: 'no source files supplied' };
  }
  const exportRe = /^\s*export\s+(?:async\s+)?(?:function|class|interface|type|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
  const exports: Array<{ symbol: string; file: string }> = [];
  const allText: string[] = [];
  for (const f of sourceFiles) {
    let body = '';
    try { body = readFileSync(f, 'utf8'); } catch { continue; }
    allText.push(body);
    let m: RegExpExecArray | null;
    while ((m = exportRe.exec(body)) !== null) {
      exports.push({ symbol: m[1], file: f });
    }
  }

  // Tokenise the corpus exactly once into an identifier frequency map.
  // Previously we ran one regex per exported symbol over the full corpus,
  // which is O(N exports × M bytes). The new approach is a single linear
  // scan that splits on /\b/ and counts every JS-identifier-shaped token,
  // turning the inner loop into an O(1) map lookup.
  const corpus = allText.join('\n');
  const idRe = /[A-Za-z_$][\w$]*/g;
  const frequency = new Map<string, number>();
  let tok: RegExpExecArray | null;
  while ((tok = idRe.exec(corpus)) !== null) {
    const id = tok[0];
    frequency.set(id, (frequency.get(id) ?? 0) + 1);
  }

  // An export is "likely dead" if its symbol appears less than twice across
  // the entire corpus (declaration + at least one importer).
  const unused = exports.filter(e => (frequency.get(e.symbol) ?? 0) < 2);

  const total = exports.length;
  const score = total === 0 ? 100 : Math.round((1 - unused.length / total) * 100);
  return {
    name: 'dead-code',
    score,
    weight: 25,
    detail: `${unused.length} likely-dead exports of ${total} total in ${sourceFiles.length} files`,
  };
}

// --- 2. Coverage score ----------------------------------------------------

/**
 * Reads a Go-style or Istanbul-style coverage JSON. Supports two shapes:
 *   {"total": {"lines": {"pct": 87.3}}}                      // istanbul
 *   {"coverage": 87.3}                                       // custom
 * Returns the pct directly capped to 100.
 */
export function coverageScore(coverageJsonPath: string, minimum = 70): SubScore {
  if (!existsSync(coverageJsonPath)) {
    return { name: 'coverage', score: null, weight: 25, detail: `coverage report not found: ${coverageJsonPath}` };
  }
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(coverageJsonPath, 'utf8'));
  } catch (e) {
    return { name: 'coverage', score: null, weight: 25, detail: `coverage JSON parse error: ${(e as Error).message}` };
  }
  let pct: number | null = null;
  const d = data as Record<string, unknown>;
  if (typeof d.coverage === 'number') pct = d.coverage;
  else if (d.total && typeof d.total === 'object') {
    const total = d.total as Record<string, unknown>;
    const lines = total.lines as Record<string, unknown> | undefined;
    if (lines && typeof lines.pct === 'number') pct = lines.pct;
  }
  if (pct === null) {
    return { name: 'coverage', score: null, weight: 25, detail: 'unrecognised coverage JSON shape' };
  }
  const capped = Math.max(0, Math.min(100, pct));
  return {
    name: 'coverage',
    score: capped,
    weight: 25,
    detail: `${capped.toFixed(1)}% line coverage (minimum ${minimum}%${capped < minimum ? ' — below floor' : ''})`,
  };
}

// --- 3. Trust-chain integrity --------------------------------------------

/**
 * Walks a JSON file representing a TrustChain export: { entries: [{
 *   index, action_hash, prev_hash, ... }] }. Verifies prev_hash linkage,
 * monotonic index, and that no two entries share an action_hash.
 */
export interface ChainEntry {
  index: number;
  action_hash: string;
  prev_hash: string;
  [k: string]: unknown;
}

export function trustChainScore(chainPath: string): SubScore {
  if (!existsSync(chainPath)) {
    return { name: 'trust-chain', score: null, weight: 25, detail: `chain file not found: ${chainPath}` };
  }
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(chainPath, 'utf8'));
  } catch (e) {
    return { name: 'trust-chain', score: 0, weight: 25, detail: `parse error: ${(e as Error).message}` };
  }
  // The chain file is external input. Three failure shapes that must
  // all return a structural-failure finding instead of a vacuous 100:
  //
  //   1. Top-level value is null / undefined / a primitive: it can't
  //      hold an `entries` key at all.
  //   2. The `entries` key is missing entirely. Previous code coerced
  //      this to [] and then reported "empty chain (vacuously intact)"
  //      with score 100 — a silent perfect score on garbage input.
  //   3. `entries` is present but not an array (string, number, object,
  //      etc.). Previous code would have dereferenced .length on a
  //      non-array and propagated NaN into the aggregate.
  if (!data || typeof data !== 'object' || !('entries' in data)) {
    return {
      name: 'trust-chain',
      score: 0,
      weight: 25,
      detail: 'invalid chain shape: missing entries array',
    };
  }
  const rawEntries = (data as { entries: unknown }).entries;
  if (!Array.isArray(rawEntries)) {
    return {
      name: 'trust-chain',
      score: 0,
      weight: 25,
      detail: 'invalid chain shape: entries must be an array',
    };
  }
  const entries = rawEntries as ChainEntry[];
  if (entries.length === 0) {
    return { name: 'trust-chain', score: 100, weight: 25, detail: 'empty chain (vacuously intact)' };
  }
  const seen = new Set<string>();
  let breaks = 0;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    // Defensive shape check. The chain file is JSON from an external
    // source (possibly tampered with — the whole reason we score chain
    // integrity here). A malformed entry must produce a break, not a
    // process-level crash.
    if (
      !e ||
      typeof e !== 'object' ||
      typeof e.index !== 'number' ||
      typeof e.action_hash !== 'string' ||
      typeof e.prev_hash !== 'string'
    ) {
      breaks += 1;
      continue;
    }
    if (e.index !== i) breaks += 1;
    const prev = entries[i - 1];
    if (i > 0 && (typeof prev?.action_hash !== 'string' || e.prev_hash !== prev.action_hash)) {
      breaks += 1;
    }
    if (seen.has(e.action_hash)) breaks += 1;
    seen.add(e.action_hash);
  }
  const intact = entries.length - breaks;
  const score = Math.max(0, Math.round((intact / entries.length) * 100));
  return {
    name: 'trust-chain',
    score,
    weight: 25,
    detail: `${breaks} integrity break(s) across ${entries.length} entries`,
  };
}

// --- 4. Type-drift detector -----------------------------------------------

/**
 * Cheap check: compare the SHA-256 of the generated artifact to a recorded
 * "expected" digest in a manifest file. If they disagree, the score is 0
 * (drift present). If the manifest is absent, the sub-score is null.
 */
export function typeDriftScore(generatedPath: string, manifestPath: string): SubScore {
  if (!existsSync(manifestPath)) {
    return { name: 'type-drift', score: null, weight: 25, detail: 'drift manifest not found' };
  }
  let manifest: { expectedSha256?: string };
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return { name: 'type-drift', score: 0, weight: 25, detail: 'drift manifest parse error' };
  }
  if (!existsSync(generatedPath)) {
    return { name: 'type-drift', score: 0, weight: 25, detail: 'generated file missing' };
  }
  const body = readFileSync(generatedPath);
  const sha = createHash('sha256').update(body).digest('hex');
  if (manifest.expectedSha256 === sha) {
    return { name: 'type-drift', score: 100, weight: 25, detail: 'generated artifact matches recorded SHA' };
  }
  return {
    name: 'type-drift',
    score: 0,
    weight: 25,
    detail: `SHA mismatch: got ${sha.slice(0, 12)}, expected ${(manifest.expectedSha256 ?? '<none>').slice(0, 12)}`,
  };
}

// --- aggregate ------------------------------------------------------------

export function aggregateHealth(subs: SubScore[]): HealthReport {
  const live = subs.filter(s => s.score !== null);
  let aggregate = 0;
  if (live.length > 0) {
    const totalWeight = live.reduce((a, s) => a + s.weight, 0);
    const weightedSum = live.reduce((a, s) => a + (s.score as number) * s.weight, 0);
    aggregate = Math.round(weightedSum / totalWeight);
  }
  const notes = subs
    .filter(s => s.score === null)
    .map(s => `${s.name}: skipped — ${s.detail}`);
  return { aggregate, subScores: subs, notes };
}

// --- helper for the CLI: walk a tree for source files --------------------

export function collectSourceFiles(root: string, exts = ['.ts', '.tsx', '.js', '.mjs']): string[] {
  const out: string[] = [];
  const skip = /(?:^|\/)(?:node_modules|\.git|\.next|dist|build|coverage|\.generated|docs\/archive)(?:\/|$)/;
  function walk(p: string) {
    // Normalise to forward slashes before testing the skip regex.
    // node:path.join() returns platform-specific separators ('\' on
    // Windows), and a regex anchored on '/' silently fails to match
    // there, causing the walk to descend into node_modules etc.
    const normalised = p.replace(/\\/g, '/');
    if (skip.test(normalised)) return;
    let s;
    try { s = statSync(p); } catch { return; }
    if (s.isDirectory()) {
      let entries: string[] = [];
      try { entries = readdirSync(p); } catch { return; }
      for (const e of entries) walk(join(p, e));
    } else if (s.isFile()) {
      if (exts.some(ext => p.endsWith(ext))) out.push(p);
    }
  }
  walk(root);
  return out;
}
