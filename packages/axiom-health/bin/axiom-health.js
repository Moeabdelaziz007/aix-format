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
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') opts.root = argv[++i];
    else if (a === '--coverage') opts.coverage = argv[++i];
    else if (a === '--chain') opts.chain = argv[++i];
    else if (a === '--generated') opts.generated = argv[++i];
    else if (a === '--drift-manifest') opts.driftManifest = argv[++i];
    else if (a === '--min-coverage') opts.minCoverage = Number(argv[++i]);
    else if (a === '--fail-below') opts.failBelow = Number(argv[++i]);
    else if (a === '--json') opts.json = true;
    else if (a === '--help' || a === '-h') {
      console.log(`axiom-health [--root .] [--coverage path.json] [--chain chain.json] [--generated path] [--drift-manifest path.json] [--min-coverage N] [--fail-below N] [--json]`);
      process.exit(0);
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
