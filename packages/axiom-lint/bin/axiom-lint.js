#!/usr/bin/env node
// axiom-lint CLI — walks the given paths and prints findings as JSON or text.

import { readdirSync, statSync, lstatSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { lintFiles } from '../src/index.ts';

// Walk uses lstatSync (does NOT follow symlinks) instead of statSync.
// A directory symlinked back to one of its ancestors (`loop -> ..`)
// previously caused the linter to recurse forever and the CI job to
// stall until killed. We now refuse to enter any symlinked entry at
// all — the rare benefit of following is dwarfed by the loop risk.
function walk(root, out, exclude) {
  const stack = [root];
  while (stack.length > 0) {
    const p = stack.pop();
    if (exclude.some(re => re.test(p))) continue;
    let s;
    try { s = lstatSync(p); } catch { continue; }
    if (s.isSymbolicLink()) continue;
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
  // Helper: consume the next token as the value for the flag at index i.
  // Refuses missing values and tokens that look like another flag, so a
  // command like `axiom-lint . --max-bytes --naming snake_case` no longer
  // turns --max-bytes into NaN by silently swallowing the next flag.
  const takeValue = (flag, i) => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('-')) {
      console.error(`${flag} requires a value`);
      process.exit(2);
    }
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.format = 'json';
    else if (a === '--max-bytes') {
      const raw = takeValue(a, i);
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        console.error(`--max-bytes must be a non-negative number, got ${JSON.stringify(raw)}`);
        process.exit(2);
      }
      out.maxBytes = parsed;
      i += 1;
    }
    else if (a === '--naming') {
      const v = takeValue(a, i);
      if (!['kebab-case', 'snake_case', 'mixed'].includes(v)) {
        console.error(`--naming must be one of kebab-case|snake_case|mixed, got ${JSON.stringify(v)}`);
        process.exit(2);
      }
      out.naming = v;
      i += 1;
    }
    else if (a === '--fail-on') {
      const v = takeValue(a, i);
      if (!['error', 'warning', 'info'].includes(v)) {
        console.error(`--fail-on must be one of error|warning|info, got ${JSON.stringify(v)}`);
        process.exit(2);
      }
      out.failOn = v;
      i += 1;
    }
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

// Skip vendored / generated trees by default. Patterns accept either '/'
// or '\\' as the segment separator so Windows paths (where node:path.join
// emits backslashes) are excluded the same way POSIX paths are. The
// previous patterns were anchored on '/' only, so on Windows the walker
// happily descended into node_modules / .git / dist and either produced
// noisy findings or massively slowed down the scan.
const sep = '[\\\\/]';
const defaultExclude = [
  new RegExp(`${sep}node_modules${sep}`),
  new RegExp(`${sep}\\.git${sep}`),
  new RegExp(`${sep}\\.next${sep}`),
  new RegExp(`${sep}dist${sep}`),
  new RegExp(`${sep}build${sep}`),
  new RegExp(`${sep}coverage${sep}`),
  new RegExp(`${sep}\\.generated${sep}`),
  new RegExp(`${sep}docs${sep}archive${sep}`),
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

// Exit-code policy:
//   - If there are zero findings we always exit 0, no matter what
//     --fail-on says. The previous code initialised `worst` to 0 and
//     compared `worst >= threshold`; with `--fail-on info` the threshold
//     is also 0, so a perfectly clean run reported a failure. That
//     made `--fail-on info` unusable in CI.
//   - With findings present, the worst observed severity must reach the
//     configured threshold to fail. info < warning < error.
const severityRank = { info: 0, warning: 1, error: 2 };
const threshold = severityRank[opts.failOn] ?? 2;
if (report.findings.length === 0) {
  process.exit(0);
}
const worst = report.findings.reduce((acc, f) => Math.max(acc, severityRank[f.severity] ?? 0), 0);
process.exit(worst >= threshold ? 1 : 0);
