#!/usr/bin/env node
// axiom-validate CLI — runs schema, golden, and skill-md checkers per the
// subcommand. The drift checker is exposed but expects the caller to provide
// the regenerated types via stdin, so it stays infra-agnostic.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  validateManifestFiles,
  validateSkills,
  checkTypeDrift,
  validateGoldens,
  mergeReports,
} from '../src/index.ts';

function usage() {
  console.error(`axiom-validate <subcommand>

  schema <schema.json> <manifest.json>...
  goldens <schema.json> <dir>
  skill <file.md>...
  drift <generated.d.ts>   (reads expected output from stdin)

Flags:
  --json           emit JSON report
  --fail-on error|warning  (default: error)
`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

let json = false;
let failOn = 'error';
const positional = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--json') json = true;
  else if (a === '--fail-on') {
    const v = args[i + 1];
    if (v === undefined || v.startsWith('-')) {
      console.error('--fail-on requires a value (error|warning)');
      process.exit(2);
    }
    if (!['error', 'warning'].includes(v)) {
      console.error(`--fail-on must be one of error|warning, got ${JSON.stringify(v)}`);
      process.exit(2);
    }
    failOn = v;
    i += 1;
  }
  else positional.push(a);
}

const [subcommand, ...rest] = positional;

async function readStdin() {
  return new Promise((res) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (buf += chunk));
    process.stdin.on('end', () => res(buf));
  });
}

let report;
switch (subcommand) {
  case 'schema': {
    if (rest.length < 2) usage();
    const [schemaPath, ...manifests] = rest;
    report = validateManifestFiles(resolve(schemaPath), manifests.map(resolve));
    break;
  }
  case 'goldens': {
    if (rest.length < 2) usage();
    const [schemaPath, dir] = rest;
    report = validateGoldens(resolve(schemaPath), resolve(dir), (d) =>
      readdirSync(d).map((f) => join(d, f))
    );
    break;
  }
  case 'skill': {
    if (rest.length === 0) usage();
    report = validateSkills(rest.map(resolve));
    break;
  }
  case 'drift': {
    if (rest.length !== 1) usage();
    const filePath = resolve(rest[0]);
    if (!existsSync(filePath)) {
      console.error(`drift: file not found: ${filePath}`);
      process.exit(2);
    }
    // Refuse to block forever waiting on stdin when invoked
    // interactively. CI / pipeline use is the supported case; an
    // operator who runs `axiom-validate drift foo.d.ts` without
    // piping anything should get a clear error, not a hung process.
    if (process.stdin.isTTY) {
      console.error('drift: expected type output piped on stdin (e.g. `tool | axiom-validate drift <file>`)');
      process.exit(2);
    }
    const current = readFileSync(filePath, 'utf8');
    const expected = await readStdin();
    const findings = checkTypeDrift(filePath, current, expected);
    report = { totalFiles: 1, passed: findings.length === 0 ? 1 : 0, failed: findings.length === 0 ? 0 : 1, findings };
    break;
  }
  default:
    usage();
}

report = mergeReports([report]);

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const f of report.findings) {
    const loc = f.path ? ` at ${f.path}` : '';
    console.log(`${f.severity.toUpperCase().padEnd(7)} ${f.checker.padEnd(12)} ${f.file}${loc}  ${f.message}`);
  }
  console.log('');
  console.log(`${report.totalFiles} files: ${report.passed} pass / ${report.failed} fail`);
}

const severityRank = { warning: 1, error: 2 };
const threshold = severityRank[failOn] ?? 2;
const worst = report.findings.reduce((acc, f) => Math.max(acc, severityRank[f.severity] ?? 0), 0);
process.exit(worst >= threshold ? 1 : 0);
