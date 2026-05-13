/**
 * PR: Archive one-shot reports and fix dead links
 *
 * Validates all structural changes from this PR:
 *   - .generated/COMPREHENSIVE_DEEP_DIVE_ANALYSIS.md (deleted)
 *   - .generated/QUANTUM_TOPOLOGY_ANALYSIS.md (deleted)
 *   - README.md: two link corrections (ABOM_SAAS_BOM.md → SECURITY.md,
 *     SPEC_V1_3.md → AIX_SPEC.md)
 *   - docs/archive/*: 22 files moved from docs/ into docs/archive/
 *   - docs/checkpoint/2026-05-01_v1.3_stabilization.md → docs/archive/
 *   - tests/e2e/{convert-cli,full-lifecycle,plugins-cli,validate-cli}.test.js (deleted)
 *   - package.json: removed "test:e2e:node" and "test:all" scripts
 *   - vitest.config.ts: simplified include pattern and coverage config
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');

function repoPath(...parts) {
  return resolve(REPO, ...parts);
}

function fileExists(relPath) {
  return existsSync(repoPath(relPath));
}

function readText(relPath) {
  return readFileSync(repoPath(relPath), 'utf8');
}

// ---------------------------------------------------------------------------
// Deleted generated reports
// ---------------------------------------------------------------------------

describe('Deleted generated reports: must not exist', () => {
  it('.generated/COMPREHENSIVE_DEEP_DIVE_ANALYSIS.md was removed', () => {
    expect(fileExists('.generated/COMPREHENSIVE_DEEP_DIVE_ANALYSIS.md')).toBe(false);
  });

  it('.generated/QUANTUM_TOPOLOGY_ANALYSIS.md was removed', () => {
    expect(fileExists('.generated/QUANTUM_TOPOLOGY_ANALYSIS.md')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Deleted e2e test files
// ---------------------------------------------------------------------------

describe('Deleted e2e test files: must not exist', () => {
  it('tests/e2e/convert-cli.test.js was removed', () => {
    expect(fileExists('tests/e2e/convert-cli.test.js')).toBe(false);
  });

  it('tests/e2e/full-lifecycle.test.js was removed', () => {
    expect(fileExists('tests/e2e/full-lifecycle.test.js')).toBe(false);
  });

  it('tests/e2e/plugins-cli.test.js was removed', () => {
    expect(fileExists('tests/e2e/plugins-cli.test.js')).toBe(false);
  });

  it('tests/e2e/validate-cli.test.js was removed', () => {
    expect(fileExists('tests/e2e/validate-cli.test.js')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// README.md: corrected doc links
// ---------------------------------------------------------------------------

describe('README.md: fixed dead links', () => {
  let readme;

  beforeAll(() => {
    readme = readText('README.md');
  });

  it('ABOM Scanner row links to docs/SECURITY.md (not docs/ABOM_SAAS_BOM.md)', () => {
    expect(readme).toContain('docs/SECURITY.md');
    expect(readme).not.toContain('docs/ABOM_SAAS_BOM.md');
  });

  it('KYC Identity row links to docs/AIX_SPEC.md (not docs/SPEC_V1_3.md)', () => {
    expect(readme).toContain('docs/AIX_SPEC.md');
    expect(readme).not.toContain('docs/SPEC_V1_3.md');
  });

  it('docs/SECURITY.md actually exists at the linked path', () => {
    expect(fileExists('docs/SECURITY.md')).toBe(true);
  });

  it('docs/AIX_SPEC.md actually exists at the linked path', () => {
    expect(fileExists('docs/AIX_SPEC.md')).toBe(true);
  });

  it('ABOM Scanner row contains the [Security] link label pointing to SECURITY.md', () => {
    expect(readme).toMatch(/ABOM Scanner[\s\S]{0,200}docs\/SECURITY\.md/);
  });

  it('KYC Identity row contains the [Spec] link label pointing to AIX_SPEC.md', () => {
    expect(readme).toMatch(/KYC Identity[\s\S]{0,200}docs\/AIX_SPEC\.md/);
  });
});

// ---------------------------------------------------------------------------
// Archived files: new location must exist
// ---------------------------------------------------------------------------

describe('Archived docs: must exist in docs/archive/', () => {
  const archivedFiles = [
    'docs/archive/2026-05-01_v1.3_stabilization.md',
    'docs/archive/AGENTIC_COMPRESSION_STRATEGIC_PLAN.md',
    'docs/archive/ARCHITECTURE_RESOLUTION_SUMMARY.md',
    'docs/archive/CODE_DENSITY_ANALYSIS.md',
    'docs/archive/COMPRESSION_REPORT_v0.369.md',
    'docs/archive/CRITICAL_FIXES_APPLIED.md',
    'docs/archive/DEEP_DIVE_CODE_REVIEW.md',
    'docs/archive/FINAL_DENSITY_VERDICT.md',
    'docs/archive/FRONTEND_ARCHITECTURE_MAP.md',
    'docs/archive/FRONTEND_AUDIT_REPORT.md',
    'docs/archive/FRONTEND_CLEANUP_PLAN.md',
    'docs/archive/FRONTEND_ISSUES.md',
    'docs/archive/HALF_LOOP_REPORT.md',
    'docs/archive/IMPLEMENTATION_PROGRESS.md',
    'docs/archive/JULES_CLEANUP_NOTES.md',
    'docs/archive/META_COMPRESSION_REPORT.md',
    'docs/archive/PATTERN_ANALYSIS.md',
    'docs/archive/PI_INTEGRATION_AUDIT.md',
    'docs/archive/PI_VALIDATION_KEY_REPORT.md',
    'docs/archive/PI_VERCEL_RECOVERY.md',
    'docs/archive/SCRIPT_CONSOLIDATION_PLAN.md',
    'docs/archive/V1.4.0_ACTION_PLAN.md',
  ];

  for (const f of archivedFiles) {
    it(`${f} exists in archive`, () => {
      expect(fileExists(f)).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// Old paths must not exist in docs/ root (files were moved, not copied)
// ---------------------------------------------------------------------------

describe('Old doc paths: must not remain in docs/ root after move', () => {
  const movedFromDocs = [
    'docs/AGENTIC_COMPRESSION_STRATEGIC_PLAN.md',
    'docs/ARCHITECTURE_RESOLUTION_SUMMARY.md',
    'docs/CODE_DENSITY_ANALYSIS.md',
    'docs/COMPRESSION_REPORT_v0.369.md',
    'docs/CRITICAL_FIXES_APPLIED.md',
    'docs/DEEP_DIVE_CODE_REVIEW.md',
    'docs/FINAL_DENSITY_VERDICT.md',
    'docs/FRONTEND_ARCHITECTURE_MAP.md',
    'docs/FRONTEND_AUDIT_REPORT.md',
    'docs/FRONTEND_CLEANUP_PLAN.md',
    'docs/FRONTEND_ISSUES.md',
    'docs/HALF_LOOP_REPORT.md',
    'docs/IMPLEMENTATION_PROGRESS.md',
    'docs/JULES_CLEANUP_NOTES.md',
    'docs/META_COMPRESSION_REPORT.md',
    'docs/PATTERN_ANALYSIS.md',
    'docs/PI_INTEGRATION_AUDIT.md',
    'docs/PI_VALIDATION_KEY_REPORT.md',
    'docs/PI_VERCEL_RECOVERY.md',
    'docs/SCRIPT_CONSOLIDATION_PLAN.md',
    'docs/V1.4.0_ACTION_PLAN.md',
  ];

  for (const f of movedFromDocs) {
    it(`${f} no longer exists in docs/ root`, () => {
      expect(fileExists(f)).toBe(false);
    });
  }

  it('docs/checkpoint/2026-05-01_v1.3_stabilization.md was moved out of checkpoint/', () => {
    expect(fileExists('docs/checkpoint/2026-05-01_v1.3_stabilization.md')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// package.json: removed scripts
// ---------------------------------------------------------------------------

describe('package.json: script changes', () => {
  let pkg;

  beforeAll(() => {
    pkg = JSON.parse(readText('package.json'));
  });

  it('"test:e2e:node" script was removed', () => {
    expect(pkg.scripts).not.toHaveProperty('test:e2e:node');
  });

  it('"test:all" script was removed', () => {
    expect(pkg.scripts).not.toHaveProperty('test:all');
  });

  it('"test" script still exists and runs vitest', () => {
    expect(pkg.scripts).toHaveProperty('test');
    expect(pkg.scripts.test).toContain('vitest');
  });

  it('"test:coverage" script still exists', () => {
    expect(pkg.scripts).toHaveProperty('test:coverage');
    expect(pkg.scripts['test:coverage']).toContain('coverage');
  });

  it('"test:e2e" script still exists (Playwright)', () => {
    expect(pkg.scripts).toHaveProperty('test:e2e');
    expect(pkg.scripts['test:e2e']).toContain('playwright');
  });

  it('"test:watch" script still exists', () => {
    expect(pkg.scripts).toHaveProperty('test:watch');
  });
});

// ---------------------------------------------------------------------------
// vitest.config.ts: simplified configuration
// ---------------------------------------------------------------------------

describe('vitest.config.ts: updated test discovery and coverage settings', () => {
  let configSource;

  beforeAll(() => {
    configSource = readText('vitest.config.ts');
  });

  it('include pattern covers tests/**/*.test.js', () => {
    expect(configSource).toContain("'tests/**/*.test.js'");
  });

  it('include pattern covers packages/**/*.test.ts', () => {
    expect(configSource).toContain("'packages/**/*.test.ts'");
  });

  it('does not include .ts test files in tests/ directory (pattern is .js only)', () => {
    // The old pattern was tests/**/*.test.{js,ts}; new is tests/**/*.test.js
    expect(configSource).not.toMatch(/tests\/\*\*\/\*\.test\.\{js,ts\}/);
  });

  it('coverage reporters list does not include lcov', () => {
    expect(configSource).not.toContain("'lcov'");
  });

  it('coverage reporters include text, json, and html', () => {
    expect(configSource).toContain("'text'");
    expect(configSource).toContain("'json'");
    expect(configSource).toContain("'html'");
  });

  it('coverage thresholds block was removed', () => {
    expect(configSource).not.toContain('thresholds');
  });

  it('environment is set to node', () => {
    expect(configSource).toContain("environment: 'node'");
  });

  it('globals is enabled', () => {
    expect(configSource).toContain('globals: true');
  });

  it('tests/e2e/ is no longer explicitly excluded (exclusion was removed)', () => {
    expect(configSource).not.toContain('tests/e2e/**');
  });

  it('coverage provider is v8', () => {
    expect(configSource).toContain("provider: 'v8'");
  });

  it('does not specify explicit coverage include paths (removed from config)', () => {
    // Old config had: include: ['core/**/*.{js,ts}', 'bin/**/*.{js,ts}', ...]
    // New config omits the coverage include array entirely
    const coverageSection = configSource.split('coverage:')[1] ?? '';
    expect(coverageSection).not.toMatch(/include:\s*\[/);
  });
});
