#!/usr/bin/env node

import { resolve } from 'node:path';
import {
  deadCodeScore,
  coverageScore,
  trustChainScore,
  typeDriftScore,
  aggregateHealth,
  collectSourceFiles,
} from '../src/index.ts';

function parseArgs(argv) {
  const opts = {
    root: '.',
    coverage: '',
    chain: '',
    generated: '',
    driftManifest: '',
    minCoverage: 70,
    json: false,
    failBelow: 60,
  };
  // Helper guards every flag that consumes a value. The old loop happily
  // accepted `argv[++i]` returning undefined or another flag, which produced
  // `resolve(undefined)` exceptions and NaN thresholds that silently
  // bypassed --fail-below logic.
  const takeValue = (flag, i) => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('-')) {
      console.error(`${flag} requires a value`);
      process.exit(2);
    }
    return v;
  };
  const takeNumber = (flag, i) => {
    const raw = takeValue(flag, i);
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      console.error(`${flag} must be numeric, got ${JSON.stringify(raw)}`);
      process.exit(2);
    }
    return n;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') { opts.root = takeValue(a, i); i += 1; }
    else if (a === '--coverage') { opts.coverage = takeValue(a, i); i += 1; }
    else if (a === '--chain') { opts.chain = takeValue(a, i); i += 1; }
    else if (a === '--generated') { opts.generated = takeValue(a, i); i += 1; }
    else if (a === '--drift-manifest') { opts.driftManifest = takeValue(a, i); i += 1; }
    else if (a === '--min-coverage') { opts.minCoverage = takeNumber(a, i); i += 1; }
    else if (a === '--fail-below') { opts.failBelow = takeNumber(a, i); i += 1; }
    else if (a === '--json') opts.json = true;
    else if (a === '--help' || a === '-h') {
      console.log(`axiom-health [--root .] [--coverage path.json] [--chain chain.json] [--generated path] [--drift-manifest path.json] [--min-coverage N] [--fail-below N] [--json]`);
      process.exit(0);
    }
    else {
      // Unknown options used to silently no-op, which masked typos like
      // --json-output or --coverag in CI configs and let stale defaults
      // bypass the user's intent. Fail fast with a clear message and the
      // GNU-conventional exit code 2 for usage errors.
      console.error(`axiom-health: unknown option: ${a}`);
      process.exit(2);
    }
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
const root = resolve(opts.root);

const sources = collectSourceFiles(root);
const dead = deadCodeScore(root, sources);
const cov = opts.coverage ? coverageScore(resolve(opts.coverage), opts.minCoverage) : { name: 'coverage', score: null, weight: 25, detail: 'no --coverage given' };
const chain = opts.chain ? trustChainScore(resolve(opts.chain)) : { name: 'trust-chain', score: null, weight: 25, detail: 'no --chain given' };
const drift = (opts.generated && opts.driftManifest)
  ? typeDriftScore(resolve(opts.generated), resolve(opts.driftManifest))
  : { name: 'type-drift', score: null, weight: 25, detail: 'no --generated/--drift-manifest given' };

const report = aggregateHealth([dead, cov, chain, drift]);

if (opts.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Aggregate: ${report.aggregate}/100`);
  for (const s of report.subScores) {
    const v = s.score === null ? 'skip' : `${s.score}/100`;
    console.log(`  ${s.name.padEnd(14)} ${v.padEnd(8)} (weight ${s.weight})  ${s.detail}`);
  }
  if (report.notes.length > 0) {
    console.log('\nnotes:');
    for (const n of report.notes) console.log(`  - ${n}`);
  }
}

process.exit(report.aggregate < opts.failBelow ? 1 : 0);
