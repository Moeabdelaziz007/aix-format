#!/usr/bin/env node
// axiom-lint CLI — walks the given paths and prints findings as JSON or text.

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { lintFiles } from '../src/index.ts';

function walk(root, out, exclude) {
  const stack = [root];
  while (stack.length > 0) {
    const p = stack.pop();
    if (exclude.some(re => re.test(p))) continue;
    let s;
    try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) {
      let entries;
      try { entries = readdirSync(p); } catch { continue; }
      for (const e of entries) stack.push(join(p, e));
    } else if (s.isFile()) {
      out.push(p);
    }
  }
}

function parseArgs(argv) {
  const out = { paths: [], format: 'text', maxBytes: 500_000, naming: 'mixed', failOn: 'error' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.format = 'json';
    else if (a === '--max-bytes') out.maxBytes = Number(argv[++i]);
    else if (a === '--naming') out.naming = argv[++i];
    else if (a === '--fail-on') out.failOn = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log(`axiom-lint <path...> [--json] [--max-bytes N] [--naming kebab-case|snake_case|mixed] [--fail-on error|warning|info]`);
      process.exit(0);
    } else {
      out.paths.push(a);
    }
  }
  if (out.paths.length === 0) out.paths.push('.');
  return out;
}

const opts = parseArgs(process.argv.slice(2));

// Skip vendored / generated trees by default. Repo can extend via env.
const defaultExclude = [
  /\/node_modules\//,
  /\/\.git\//,
  /\/\.next\//,
  /\/dist\//,
  /\/build\//,
  /\/coverage\//,
  /\/\.generated\//,
  /\/docs\/archive\//,
];

const files = [];
for (const p of opts.paths) {
  const abs = resolve(p);
  if (!existsSync(abs)) {
    console.error(`axiom-lint: path not found: ${p}`);
    process.exit(2);
  }
  walk(abs, files, defaultExclude);
}

const report = lintFiles(files, {
  maxFileBytes: opts.maxBytes,
  naming: opts.naming,
  exclude: defaultExclude,
});

if (opts.format === 'json') {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const f of report.findings) {
    const loc = f.line ? `:${f.line}${f.column ? `:${f.column}` : ''}` : '';
    console.log(`${f.severity.toUpperCase().padEnd(7)} ${f.rule.padEnd(28)} ${f.file}${loc}  ${f.message}`);
  }
  console.log('');
  console.log(`${report.totalFiles} files scanned, ${report.filesWithFindings} with findings: ${report.errorCount} error / ${report.warningCount} warning / ${report.infoCount} info`);
}

const severityRank = { info: 0, warning: 1, error: 2 };
const threshold = severityRank[opts.failOn] ?? 2;
const worst = report.findings.reduce((acc, f) => Math.max(acc, severityRank[f.severity] ?? 0), 0);
process.exit(worst >= threshold ? 1 : 0);
