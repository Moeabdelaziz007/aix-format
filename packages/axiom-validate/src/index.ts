// بسم الله الرحمن الرحيم
// @axiom/validate — unified validation pipeline.
//
// Four independent checks share a common ValidationReport shape so consumers
// (CLI, CI, IDE plugins) can stream results without caring which checker
// produced them. Every checker is a pure function over file paths + content.

import { readFileSync, existsSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationFinding {
  checker: string;
  severity: ValidationSeverity;
  file: string;
  path?: string;
  message: string;
}

export interface ValidationReport {
  totalFiles: number;
  passed: number;
  failed: number;
  findings: ValidationFinding[];
}

function emptyReport(): ValidationReport {
  return { totalFiles: 0, passed: 0, failed: 0, findings: [] };
}

// --- 1. Schema validation -------------------------------------------------

/** Validate one manifest (already parsed) against an Ajv-compiled schema. */
export function validateAgainstSchema(
  schema: object,
  manifest: unknown,
  filePath = '<inline>',
): ValidationFinding[] {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  // ajv-formats v3 default export is the addFormats function.
  (addFormats as unknown as (a: unknown) => void)(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(manifest);
  if (ok) return [];
  return (validate.errors ?? []).map(err => ({
    checker: 'schema',
    severity: 'error' as const,
    file: filePath,
    path: err.instancePath || '/',
    message: `${err.instancePath || '/'} ${err.message ?? 'unknown'}${err.params ? ' (' + JSON.stringify(err.params) + ')' : ''}`,
  }));
}

export function validateManifestFiles(
  schemaPath: string,
  manifestPaths: string[],
): ValidationReport {
  const report = emptyReport();
  if (!existsSync(schemaPath)) {
    report.findings.push({
      checker: 'schema',
      severity: 'error',
      file: schemaPath,
      message: `schema not found: ${schemaPath}`,
    });
    report.failed = 1;
    return report;
  }
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  for (const f of manifestPaths) {
    report.totalFiles += 1;
    if (!existsSync(f)) {
      report.findings.push({ checker: 'schema', severity: 'error', file: f, message: 'file not found' });
      report.failed += 1;
      continue;
    }
    let manifest: unknown;
    try {
      manifest = JSON.parse(readFileSync(f, 'utf8'));
    } catch (e) {
      report.findings.push({
        checker: 'schema',
        severity: 'error',
        file: f,
        message: `JSON parse error: ${(e as Error).message}`,
      });
      report.failed += 1;
      continue;
    }
    const findings = validateAgainstSchema(schema, manifest, f);
    if (findings.length === 0) {
      report.passed += 1;
    } else {
      report.failed += 1;
      report.findings.push(...findings);
    }
  }
  return report;
}

// --- 2. Skill markdown shape ---------------------------------------------

/**
 * A skill markdown file must start with YAML frontmatter containing:
 *   ---
 *   name: <kebab-case>
 *   tier: <0..5>
 *   description: <one sentence>
 *   ---
 * followed by at least one `## Purpose` heading.
 */
export function validateSkillMarkdown(file: string): ValidationFinding[] {
  if (!existsSync(file)) {
    return [{ checker: 'skill-md', severity: 'error', file, message: 'file not found' }];
  }
  const content = readFileSync(file, 'utf8');
  const out: ValidationFinding[] = [];

  // Frontmatter check.
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    out.push({ checker: 'skill-md', severity: 'error', file, message: 'missing YAML frontmatter' });
    return out;
  }
  const fm = fmMatch[1];
  for (const required of ['name:', 'tier:', 'description:']) {
    if (!fm.includes(required)) {
      out.push({
        checker: 'skill-md',
        severity: 'error',
        file,
        message: `frontmatter missing required key "${required.replace(':', '')}"`,
      });
    }
  }

  // Name kebab-case.
  const nameMatch = fm.match(/^name:\s*(.+)$/m);
  if (nameMatch && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(nameMatch[1].trim())) {
    out.push({
      checker: 'skill-md',
      severity: 'warning',
      file,
      message: `name "${nameMatch[1].trim()}" is not kebab-case`,
    });
  }

  // Tier 0..5.
  const tierMatch = fm.match(/^tier:\s*(\d+)/m);
  if (tierMatch) {
    const tier = Number(tierMatch[1]);
    if (tier < 0 || tier > 5) {
      out.push({
        checker: 'skill-md',
        severity: 'error',
        file,
        message: `tier ${tier} out of range 0..5`,
      });
    }
  }

  // Body shape.
  const body = content.slice(fmMatch[0].length);
  if (!/^##\s+Purpose/m.test(body)) {
    out.push({
      checker: 'skill-md',
      severity: 'warning',
      file,
      message: 'missing "## Purpose" heading in body',
    });
  }

  // TODO-only body (no real content).
  if (/^##\s+Purpose:\s*TODO\b/m.test(body)) {
    out.push({
      checker: 'skill-md',
      severity: 'warning',
      file,
      message: 'Purpose is a TODO stub',
    });
  }

  return out;
}

export function validateSkills(files: string[]): ValidationReport {
  const report = emptyReport();
  for (const f of files) {
    report.totalFiles += 1;
    const findings = validateSkillMarkdown(f);
    if (findings.length === 0) report.passed += 1;
    else {
      report.failed += 1;
      report.findings.push(...findings);
    }
  }
  return report;
}

// --- 3. Type drift check --------------------------------------------------

/**
 * Compare a "current" generated types file against the expected output.
 * The caller produces `expected` by re-running the schema -> ts codegen tool;
 * we just diff the strings here. Returns one finding per drift line block.
 */
export function checkTypeDrift(filePath: string, current: string, expected: string): ValidationFinding[] {
  if (current === expected) return [];
  // Locate the first line that differs to give the user a concrete pointer.
  const curLines = current.split('\n');
  const expLines = expected.split('\n');
  let firstDiff = -1;
  const max = Math.max(curLines.length, expLines.length);
  for (let i = 0; i < max; i++) {
    if (curLines[i] !== expLines[i]) {
      firstDiff = i + 1;
      break;
    }
  }
  return [{
    checker: 'type-drift',
    severity: 'error',
    file: filePath,
    message: firstDiff > 0
      ? `generated types drift starting at line ${firstDiff}; run "pnpm run generate:types" and commit the result`
      : 'generated types drift detected',
  }];
}

// --- 4. Golden fixtures aggregator ---------------------------------------

export function validateGoldens(schemaPath: string, fixtureDir: string, listDir: (d: string) => string[]): ValidationReport {
  if (!existsSync(fixtureDir)) {
    const r = emptyReport();
    r.findings.push({ checker: 'goldens', severity: 'error', file: fixtureDir, message: 'fixture directory not found' });
    r.failed = 1;
    return r;
  }
  const fixtures = listDir(fixtureDir).filter(f => f.endsWith('.aix.json') || f.endsWith('.json'));
  return validateManifestFiles(schemaPath, fixtures);
}

export function mergeReports(reports: ValidationReport[]): ValidationReport {
  const out = emptyReport();
  for (const r of reports) {
    out.totalFiles += r.totalFiles;
    out.passed += r.passed;
    out.failed += r.failed;
    out.findings.push(...r.findings);
  }
  return out;
}
