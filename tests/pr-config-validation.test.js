/**
 * PR Config Validation Tests
 *
 * Tests for structural integrity of configuration files added/modified in this PR:
 *  - .env.example (restructured to AIX Format layout)
 *  - .cursorignore (new file)
 *  - .cursorrules (new file)
 *  - .github/workflows/*.yml (ai-guardrails, aix-validation, ci, dead-code-scan,
 *                              deploy-studio, health-autonomy, health-check)
 *  - .cursor/rules/openmemory.mdc (new file)
 *  - .cursor/rules/peak-arabic-unified-bom.mdc (new file)
 *  - .backups/.gitkeep (new file)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Read a file relative to the repo root, return its text content.
 */
function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

/**
 * Parse an env-file string and return an object of {KEY: value} pairs.
 * Skips comment lines and blank lines.
 */
function parseEnvFile(content) {
  const entries = {};
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim();
    if (key) entries[key] = value;
  }
  return entries;
}

/**
 * Minimal YAML key extractor — finds the top-level keys in a YAML document.
 * Only inspects lines that start a key (no leading whitespace).
 */
function parseYamlTopLevelKeys(content) {
  const keys = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):/);
    if (m) keys.push(m[1]);
  }
  return keys;
}

// ─── .env.example ────────────────────────────────────────────────────────────

describe('.env.example — restructured environment template', () => {
  let content;
  let env;

  it('file exists at repo root', () => {
    const filePath = path.join(ROOT, '.env.example');
    assert.ok(fs.existsSync(filePath), '.env.example must exist');
    content = readFile('.env.example');
    env = parseEnvFile(content);
  });

  it('has the new AIX Format header (not the old AIX SOVEREIGN header)', () => {
    assert.ok(!content.includes('AIX SOVEREIGN $0 STACK'), 'Old header must be removed');
    assert.ok(content.includes('AIX Format'), 'New "AIX Format" header must be present');
  });

  it('contains CRITICAL section marker', () => {
    assert.ok(content.includes('CRITICAL'), 'Must have a CRITICAL section');
  });

  it('contains UPSTASH_REDIS_REST_URL (critical Redis key)', () => {
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'UPSTASH_REDIS_REST_URL'),
      'UPSTASH_REDIS_REST_URL must be declared');
  });

  it('contains UPSTASH_REDIS_REST_TOKEN (critical Redis token)', () => {
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'UPSTASH_REDIS_REST_TOKEN'),
      'UPSTASH_REDIS_REST_TOKEN must be declared');
  });

  it('contains Pi Network authentication variables', () => {
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'PI_API_KEY'), 'PI_API_KEY must be declared');
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'PI_APP_ID'), 'PI_APP_ID must be declared');
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'PI_ENVIRONMENT'), 'PI_ENVIRONMENT must be declared');
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'NEXT_PUBLIC_PI_APP_ID'), 'NEXT_PUBLIC_PI_APP_ID must be declared');
  });

  it('PI_ENVIRONMENT value is "sandbox" in example (safe default)', () => {
    // Strip inline comments to get the raw value
    const rawValue = env['PI_ENVIRONMENT'].split('#')[0].trim();
    assert.strictEqual(rawValue, 'sandbox', 'PI_ENVIRONMENT should default to sandbox in the example');
  });

  it('contains voice service variables (GROQ_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, XAI_API_KEY)', () => {
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'GROQ_API_KEY'), 'GROQ_API_KEY must be declared');
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'GOOGLE_GENERATIVE_AI_API_KEY'),
      'GOOGLE_GENERATIVE_AI_API_KEY must be declared');
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'XAI_API_KEY'), 'XAI_API_KEY must be declared');
  });

  it('contains optional AI service variables', () => {
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'OPENAI_API_KEY'), 'OPENAI_API_KEY must be declared');
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'ANTHROPIC_API_KEY'), 'ANTHROPIC_API_KEY must be declared');
  });

  it('contains security & identity variables', () => {
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'AIX_UID_HASH_SALT'), 'AIX_UID_HASH_SALT must be declared');
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'JWT_SECRET'), 'JWT_SECRET must be declared');
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'AXIOM_AUTHORITY'), 'AXIOM_AUTHORITY must be declared');
  });

  it('AXIOM_AUTHORITY is set to axiomid.app (the canonical trust authority)', () => {
    assert.strictEqual(env['AXIOM_AUTHORITY'], 'axiomid.app',
      'AXIOM_AUTHORITY must be the trust anchor axiomid.app');
  });

  it('contains app configuration variables', () => {
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'NEXT_PUBLIC_APP_URL'), 'NEXT_PUBLIC_APP_URL must be declared');
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'NODE_ENV'), 'NODE_ENV must be declared');
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'NEXT_PUBLIC_STUDIO_VERSION'),
      'NEXT_PUBLIC_STUDIO_VERSION must be declared');
  });

  it('contains monitoring/debug flags', () => {
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'DEBUG'), 'DEBUG must be declared');
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'SKIP_SIGNATURE_VERIFICATION'),
      'SKIP_SIGNATURE_VERIFICATION must be declared');
  });

  it('SKIP_SIGNATURE_VERIFICATION defaults to false (security guard)', () => {
    assert.strictEqual(env['SKIP_SIGNATURE_VERIFICATION'], 'false',
      'SKIP_SIGNATURE_VERIFICATION must default to false to prevent bypassing security');
  });

  it('contains Swarm Router port variable', () => {
    assert.ok(Object.prototype.hasOwnProperty.call(env, 'SWARM_ROUTER_PORT'), 'SWARM_ROUTER_PORT must be declared');
  });

  it('placeholder values do not contain real-looking API keys (no actual secrets)', () => {
    // A real Groq key starts with "gsk_" followed by long chars, not "gsk_your_..."
    const groqVal = env['GROQ_API_KEY'] || '';
    assert.ok(!groqVal.match(/^gsk_[A-Za-z0-9]{20,}$/),
      'GROQ_API_KEY must be a placeholder, not a real key');

    // A real Stripe live key starts with "sk_live_" followed by long random chars
    const stripeVal = env['STRIPE_SECRET_KEY'] || '';
    assert.ok(!stripeVal.match(/^sk_live_[A-Za-z0-9]{20,}[^_]$/),
      'STRIPE_SECRET_KEY must be a placeholder, not a real key');

    // WalletConnect ID should be a placeholder
    const walletVal = env['NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID'] || '';
    assert.ok(!walletVal.match(/^[0-9a-f]{32}$/),
      'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID must be a placeholder, not a real 32-char hex project ID');
  });

  it('all lines are either blank, comments, or valid KEY=value format', () => {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd();
      // Allow blank lines, comment lines, and valid KEY=value lines
      const isBlank = line.trim() === '';
      const isComment = line.trimStart().startsWith('#');
      const isKeyValue = /^[A-Z][A-Z0-9_]*=/.test(line);
      assert.ok(isBlank || isComment || isKeyValue,
        `Line ${i + 1} is not a valid env file line: "${line}"`);
    }
  });

  it('does not reference old "AIX SOVEREIGN" branding in non-comment lines', () => {
    const nonCommentLines = content.split('\n')
      .filter(l => l.trim() && !l.trimStart().startsWith('#'));
    for (const line of nonCommentLines) {
      assert.ok(!line.includes('SOVEREIGN'), `Non-comment line must not mention SOVEREIGN: "${line}"`);
    }
  });

  it('NEXT_PUBLIC_APP_URL defaults to localhost:3000 for development', () => {
    assert.strictEqual(env['NEXT_PUBLIC_APP_URL'], 'http://localhost:3000',
      'Default app URL should be localhost for local development');
  });
});

// ─── .cursorignore ───────────────────────────────────────────────────────────

describe('.cursorignore — cursor IDE ignore patterns', () => {
  let content;
  let patterns;

  it('file exists at repo root', () => {
    const filePath = path.join(ROOT, '.cursorignore');
    assert.ok(fs.existsSync(filePath), '.cursorignore must exist');
    content = readFile('.cursorignore');
    patterns = content.split('\n').map(l => l.trim()).filter(Boolean);
  });

  it('excludes node_modules/', () => {
    assert.ok(patterns.includes('node_modules/'), 'Must ignore node_modules/');
  });

  it('excludes .next/ build output', () => {
    assert.ok(patterns.includes('.next/'), 'Must ignore .next/ directory');
  });

  it('excludes dist/ build output', () => {
    assert.ok(patterns.includes('dist/'), 'Must ignore dist/ directory');
  });

  it('excludes build/ directory', () => {
    assert.ok(patterns.includes('build/'), 'Must ignore build/ directory');
  });

  it('excludes .git/ directory', () => {
    assert.ok(patterns.includes('.git/'), 'Must ignore .git/ directory');
  });

  it('excludes .cursor/ rules directory (self-referential ignore)', () => {
    assert.ok(patterns.includes('.cursor/'), 'Must ignore .cursor/ to prevent re-indexing of cursor rules');
  });

  it('excludes npm cache directories', () => {
    const cachePatterns = patterns.filter(p => p.includes('.npm'));
    assert.ok(cachePatterns.length > 0, 'Must ignore npm cache directories');
  });

  it('excludes log files', () => {
    assert.ok(patterns.includes('*.log'), 'Must ignore *.log files');
  });

  it('excludes package-lock.json (pnpm project uses pnpm-lock.yaml)', () => {
    assert.ok(patterns.includes('package-lock.json'), 'Must ignore package-lock.json');
  });

  it('excludes .vercel/ deployment cache', () => {
    assert.ok(patterns.includes('.vercel/'), 'Must ignore .vercel/ directory');
  });

  it('has no empty patterns or whitespace-only lines', () => {
    const nonEmptyLines = content.split('\n').filter(l => l !== '' && l !== '\n');
    for (const line of nonEmptyLines) {
      assert.ok(line.trim() !== '', `Pattern line must not be whitespace-only: "${line}"`);
    }
  });
});

// ─── .cursorrules ────────────────────────────────────────────────────────────

describe('.cursorrules — Cursor IDE agent rules', () => {
  let content;

  it('file exists at repo root', () => {
    const filePath = path.join(ROOT, '.cursorrules');
    assert.ok(fs.existsSync(filePath), '.cursorrules must exist');
    content = readFile('.cursorrules');
  });

  it('contains "WHO YOU ARE" section defining agent role', () => {
    assert.ok(content.includes('WHO YOU ARE'), 'Must have a WHO YOU ARE section');
  });

  it('contains PROJECT OVERVIEW section', () => {
    assert.ok(content.includes('PROJECT OVERVIEW'), 'Must have a PROJECT OVERVIEW section');
  });

  it('contains CRITICAL RULES section', () => {
    assert.ok(content.includes('CRITICAL RULES'), 'Must have a CRITICAL RULES section');
  });

  it('documents the KNOWN WEAKNESSES section', () => {
    assert.ok(content.includes('KNOWN WEAKNESSES'), 'Must have a KNOWN WEAKNESSES section');
  });

  it('contains DEVELOPMENT WORKFLOW section', () => {
    assert.ok(content.includes('DEVELOPMENT WORKFLOW'), 'Must have a DEVELOPMENT WORKFLOW section');
  });

  it('contains GLOSSARY section', () => {
    assert.ok(content.includes('GLOSSARY'), 'Must have a GLOSSARY section');
  });

  it('documents YAML as the primary format (key design decision)', () => {
    assert.ok(content.includes('YAML'), 'Must document YAML as primary format');
  });

  it('mentions pnpm workspaces + Turborepo (monorepo tooling)', () => {
    assert.ok(content.includes('pnpm'), 'Must reference pnpm');
    assert.ok(content.includes('Turborepo'), 'Must reference Turborepo');
  });

  it('mentions SHA-256 (core security mechanism)', () => {
    assert.ok(content.includes('SHA-256'), 'Must mention SHA-256 hashing');
  });

  it('mentions DID (Decentralized Identifier — core identity)', () => {
    assert.ok(content.includes('DID'), 'Must mention DID');
  });

  it('mentions ABOM (Agent Bill of Materials — supply chain)', () => {
    assert.ok(content.includes('ABOM'), 'Must mention ABOM');
  });

  it('mentions Pi Network KYC (trust anchor)', () => {
    assert.ok(content.includes('Pi Network') || content.includes('Pi KYC'),
      'Must mention Pi Network KYC');
  });

  it('references apps/studio as a DEMO layer (not production KYC)', () => {
    assert.ok(content.includes('apps/studio'), 'Must reference apps/studio');
    assert.ok(content.includes('DEMO') || content.includes('demo'),
      'Must document that studio is a demo layer');
  });

  it('ends with "End of .cursorrules" marker for completeness', () => {
    assert.ok(content.includes('End of .cursorrules'),
      'Must end with closing marker');
  });
});

// ─── GitHub Workflow Files ────────────────────────────────────────────────────

describe('.github/workflows — CI/CD workflow definitions', () => {

  /**
   * Check that a workflow YAML file has the minimum required top-level keys:
   * name, on, jobs
   */
  function assertWorkflowStructure(relPath, label) {
    const filePath = path.join(ROOT, relPath);
    assert.ok(fs.existsSync(filePath), `${label} must exist at ${relPath}`);
    const content = readFile(relPath);
    assert.ok(content.includes('name:'), `${label} must have a "name:" field`);
    // "on:" is a YAML reserved key — check for it
    assert.ok(content.includes('\non:') || content.startsWith('on:'),
      `${label} must have an "on:" trigger block`);
    assert.ok(content.includes('jobs:'), `${label} must have a "jobs:" block`);
    return content;
  }

  describe('ci.yml', () => {
    let content;

    it('exists and has required YAML structure', () => {
      content = assertWorkflowStructure('.github/workflows/ci.yml', 'ci.yml');
    });

    it('triggers on push to main and pull_request to main', () => {
      assert.ok(content.includes('push'), 'Must trigger on push');
      assert.ok(content.includes('pull_request'), 'Must trigger on pull_request');
      assert.ok(content.includes('main'), 'Must target main branch');
    });

    it('has a build job', () => {
      assert.ok(content.includes('build:'), 'Must have a build job');
    });

    it('has a test job', () => {
      assert.ok(content.includes('test:'), 'Must have a test job');
    });

    it('has a deploy job', () => {
      assert.ok(content.includes('deploy:'), 'Must have a deploy job');
    });

    it('deploy job depends on build and test (safety gate)', () => {
      assert.ok(content.includes('needs: [build, test]'),
        'Deploy must need build and test to pass first');
    });

    it('deploy job only runs on main push (not on PRs)', () => {
      assert.ok(content.includes("github.event_name == 'push'"),
        'Deploy must only trigger on push events, not PRs');
    });

    it('uses pnpm setup action', () => {
      assert.ok(content.includes('pnpm/action-setup'), 'Must use pnpm/action-setup');
    });
  });

  describe('aix-validation.yml', () => {
    let content;

    it('exists and has required YAML structure', () => {
      content = assertWorkflowStructure('.github/workflows/aix-validation.yml', 'aix-validation.yml');
    });

    it('triggers on pull_request for AIX file changes', () => {
      assert.ok(content.includes('pull_request'), 'Must trigger on pull_request');
      assert.ok(content.includes('**/*.aix'), 'Must watch for .aix file changes');
    });

    it('validates changed AIX files using the aix-validate bin', () => {
      assert.ok(content.includes('aix-validate'), 'Must run aix-validate');
    });

    it('also validates all example AIX files unconditionally', () => {
      assert.ok(content.includes('validate:examples'), 'Must run validate:examples');
    });

    it('uses concurrency to cancel in-progress runs on new pushes', () => {
      assert.ok(content.includes('concurrency'), 'Must configure concurrency');
      assert.ok(content.includes('cancel-in-progress: true'), 'Must cancel stale runs');
    });
  });

  describe('ai-guardrails.yml', () => {
    let content;

    it('exists and has required YAML structure', () => {
      content = assertWorkflowStructure('.github/workflows/ai-guardrails.yml', 'ai-guardrails.yml');
    });

    it('detects AI-origin commits (Jules, Copilot)', () => {
      assert.ok(content.includes('google-labs-jules') || content.includes('jules'),
        'Must detect Jules bot commits');
      assert.ok(content.includes('copilot'), 'Must detect Copilot bot commits');
    });

    it('scans for hardcoded secrets in AI PRs', () => {
      assert.ok(content.includes('Scanning for forbidden patterns'),
        'Must scan for hardcoded secrets');
    });

    it('blocks PRs with high-risk files unless human-reviewed label is present', () => {
      assert.ok(content.includes('human-reviewed'), 'Must enforce human-reviewed label gate');
    });

    it('checks ADR-002: TokenBucket must not be in core/', () => {
      assert.ok(content.includes('TokenBucket'), 'Must enforce ADR-002 TokenBucket exclusion from core/');
      assert.ok(content.includes('ADR-002'), 'Must reference the ADR');
    });

    it('has detect-ai-origin job', () => {
      assert.ok(content.includes('detect-ai-origin:'), 'Must have detect-ai-origin job');
    });

    it('has high-risk-gate job', () => {
      assert.ok(content.includes('high-risk-gate:'), 'Must have high-risk-gate job');
    });
  });

  describe('dead-code-scan.yml', () => {
    let content;

    it('exists and has required YAML structure', () => {
      content = assertWorkflowStructure('.github/workflows/dead-code-scan.yml', 'dead-code-scan.yml');
    });

    it('runs on pull_request for code file changes', () => {
      assert.ok(content.includes('pull_request'), 'Must trigger on pull_request');
    });

    it('runs on push to main branch', () => {
      assert.ok(content.includes('push'), 'Must trigger on main push');
      assert.ok(content.includes('main'), 'Must target main branch');
    });

    it('has a weekly schedule (Monday 00:00 UTC)', () => {
      assert.ok(content.includes('schedule'), 'Must have a schedule trigger');
      assert.ok(content.includes('cron'), 'Must use cron schedule');
      // Monday at midnight
      assert.ok(content.includes('0 0 * * 1'), 'Must schedule Monday at 00:00 UTC');
    });

    it('uploads markdown and JSON reports as artifacts', () => {
      assert.ok(content.includes('dead-code-report-md'), 'Must upload markdown report artifact');
      assert.ok(content.includes('dead-code-report-json'), 'Must upload JSON report artifact');
    });

    it('runs the dead-code-scan.sh script', () => {
      assert.ok(content.includes('dead-code-scan.sh'), 'Must execute dead-code-scan.sh');
    });

    it('creates a weekly GitHub issue on schedule', () => {
      assert.ok(content.includes('Create Weekly Issue'), 'Must create weekly issue on schedule');
    });
  });

  describe('deploy-studio.yml', () => {
    let content;

    it('exists (kept as no-op for reference compatibility)', () => {
      const filePath = path.join(ROOT, '.github/workflows/deploy-studio.yml');
      assert.ok(fs.existsSync(filePath), 'deploy-studio.yml must exist');
      content = readFile('.github/workflows/deploy-studio.yml');
    });

    it('is marked as DEPRECATED', () => {
      assert.ok(content.includes('DEPRECATED') || content.includes('deprecated'),
        'deploy-studio.yml must be marked as deprecated');
    });

    it('directs users to ci.yml for actual deployments', () => {
      assert.ok(content.includes('ci.yml'), 'Must reference ci.yml as the replacement');
    });

    it('only triggers on workflow_dispatch (manual, non-automatic)', () => {
      assert.ok(content.includes('workflow_dispatch'),
        'Deprecated workflow should only run on manual dispatch');
      // Should NOT have push or pull_request triggers
      const hasPush = /^\s*push:/m.test(content);
      const hasPR = /^\s*pull_request:/m.test(content);
      assert.ok(!hasPush, 'Deprecated workflow must not auto-trigger on push');
      assert.ok(!hasPR, 'Deprecated workflow must not auto-trigger on pull_request');
    });
  });

  describe('health-check.yml', () => {
    let content;

    it('exists and has required YAML structure', () => {
      content = assertWorkflowStructure('.github/workflows/health-check.yml', 'health-check.yml');
    });

    it('runs on weekly schedule (Sunday 00:00 UTC)', () => {
      assert.ok(content.includes('schedule'), 'Must have a schedule trigger');
      assert.ok(content.includes('0 0 * * 0'), 'Must schedule Sunday at 00:00 UTC');
    });

    it('can be triggered manually (workflow_dispatch)', () => {
      assert.ok(content.includes('workflow_dispatch'), 'Must support manual dispatch');
    });

    it('validates all JSON schemas', () => {
      assert.ok(content.includes('Validate JSON Schemas') || content.includes('schemas/*.json'),
        'Must validate JSON schemas');
    });

    it('checks did:web compliance (no legacy did:axiom references)', () => {
      assert.ok(content.includes('did:axiom') || content.includes('did:web'),
        'Must check DID compliance');
    });

    it('validates all example AIX files', () => {
      assert.ok(content.includes('validate:examples'),
        'Must run validate:examples during health check');
    });

    it('posts a summary to GitHub Actions step summary', () => {
      assert.ok(content.includes('GITHUB_STEP_SUMMARY'),
        'Must post results to GITHUB_STEP_SUMMARY');
    });
  });

  describe('health-autonomy.yml', () => {
    let content;

    it('exists and has required YAML structure', () => {
      content = assertWorkflowStructure('.github/workflows/health-autonomy.yml', 'health-autonomy.yml');
    });

    it('triggers on push to main, pull_request, and daily schedule', () => {
      assert.ok(content.includes('push'), 'Must trigger on push');
      assert.ok(content.includes('pull_request'), 'Must trigger on pull_request');
      assert.ok(content.includes('schedule'), 'Must have a daily schedule');
      assert.ok(content.includes('0 0 * * *'), 'Must schedule daily at midnight UTC');
    });

    it('has write permissions for issues and pull-requests', () => {
      assert.ok(content.includes('issues: write'), 'Must have issues:write permission');
      assert.ok(content.includes('pull-requests: write'), 'Must have pull-requests:write permission');
    });

    it('blocks merge when health trend is CRITICAL', () => {
      assert.ok(content.includes('CRITICAL'), 'Must block on CRITICAL health trend');
    });

    it('auto-remediates by creating GitHub issues when score drops below 75', () => {
      assert.ok(content.includes('auto-remediate') || content.includes('auto_remediate'),
        'Must have auto-remediation job');
      assert.ok(content.includes('75'), 'Must use 75 as the remediation threshold');
    });

    it('has an auto-remediate job', () => {
      assert.ok(content.includes('auto-remediate:'), 'Must have auto-remediate job');
    });

    it('generates .generated/ artifacts (health score, trend)', () => {
      assert.ok(content.includes('.generated'), 'Must use .generated/ directory for artifacts');
    });
  });
});

// ─── Cursor MCP Rule Files (.cursor/rules/) ──────────────────────────────────

describe('.cursor/rules/ — Cursor MCP rule files', () => {

  describe('openmemory.mdc', () => {
    let content;

    it('file exists', () => {
      const filePath = path.join(ROOT, '.cursor/rules/openmemory.mdc');
      assert.ok(fs.existsSync(filePath), 'openmemory.mdc must exist');
      content = readFile('.cursor/rules/openmemory.mdc');
    });

    it('has YAML frontmatter delimiters', () => {
      assert.ok(content.startsWith('---'), 'Must start with YAML frontmatter ---');
    });

    it('has a description field in frontmatter', () => {
      // Check within the frontmatter block
      const frontmatterEnd = content.indexOf('---', 3);
      const frontmatter = content.slice(0, frontmatterEnd);
      assert.ok(frontmatter.includes('description:'), 'Frontmatter must include description:');
    });

    it('defines a project_id as "AIX"', () => {
      assert.ok(content.includes('project_id') && content.includes('AIX'),
        'Must define project_id as AIX');
    });

    it('defines a user_id for memory scoping', () => {
      assert.ok(content.includes('user_id'), 'Must define user_id for memory scoping');
    });

    it('documents mandatory memory operation requirements', () => {
      assert.ok(content.includes('NON-NEGOTIABLE') || content.includes('MANDATORY'),
        'Must document mandatory memory requirements');
    });

    it('documents the search-memory tool usage', () => {
      assert.ok(content.includes('search-memory'), 'Must document search-memory tool');
    });

    it('documents the add-memory tool usage', () => {
      assert.ok(content.includes('add-memory'), 'Must document add-memory tool');
    });

    it('includes security guardrail against storing secrets', () => {
      assert.ok(content.includes('NEVER store') || content.includes('Never Store') || content.includes('SECURITY'),
        'Must include security guardrail for secrets');
      assert.ok(content.includes('API key') || content.includes('API keys') || content.includes('secrets'),
        'Must warn about API keys/secrets');
    });

    it('documents git metadata integration (git_repo_name, git_branch, git_commit_hash)', () => {
      assert.ok(content.includes('git_repo_name'), 'Must document git_repo_name metadata');
      assert.ok(content.includes('git_branch'), 'Must document git_branch metadata');
      assert.ok(content.includes('git_commit_hash'), 'Must document git_commit_hash metadata');
    });
  });

  describe('peak-arabic-unified-bom.mdc', () => {
    let content;

    it('file exists', () => {
      const filePath = path.join(ROOT, '.cursor/rules/peak-arabic-unified-bom.mdc');
      assert.ok(fs.existsSync(filePath), 'peak-arabic-unified-bom.mdc must exist');
      content = readFile('.cursor/rules/peak-arabic-unified-bom.mdc');
    });

    it('has YAML frontmatter delimiters', () => {
      assert.ok(content.startsWith('---'), 'Must start with YAML frontmatter ---');
    });

    it('has alwaysApply: false (not a global rule)', () => {
      const frontmatterEnd = content.indexOf('---', 3);
      const frontmatter = content.slice(0, frontmatterEnd);
      assert.ok(frontmatter.includes('alwaysApply: false'),
        'peak-arabic-unified-bom must not be an always-apply rule');
    });

    it('targets AIX-relevant file globs (*.aix, schemas/, core/)', () => {
      const frontmatterEnd = content.indexOf('---', 3);
      const frontmatter = content.slice(0, frontmatterEnd);
      assert.ok(frontmatter.includes('**/*.aix'), 'Must target .aix files');
      assert.ok(frontmatter.includes('schemas/**'), 'Must target schemas/');
      assert.ok(frontmatter.includes('core/**'), 'Must target core/');
    });

    it('documents the Unified BOM concept (saas_refs, ai_refs, infra_refs)', () => {
      assert.ok(content.includes('saas_refs'), 'Must document saas_refs');
      assert.ok(content.includes('ai_refs'), 'Must document ai_refs');
      assert.ok(content.includes('infra_refs'), 'Must document infra_refs');
    });

    it('includes a compliance_profiles section mapping to EU AI Act and CISA', () => {
      assert.ok(content.includes('EU_AI_ACT') || content.includes('EU AI Act'),
        'Must reference EU AI Act compliance');
      assert.ok(content.includes('CISA'), 'Must reference CISA compliance');
    });

    it('documents a risk_summary with overall risk and open_gaps fields', () => {
      assert.ok(content.includes('risk_summary'), 'Must document risk_summary');
      assert.ok(content.includes('open_gaps'), 'Must document open_gaps');
    });

    it('documents bilingual (Arabic + English) output approach', () => {
      // The file itself contains Arabic text as evidence of bilingual support
      assert.ok(content.includes('Arabic') || content.includes('العربية') || content.includes('عربي'),
        'Must document bilingual Arabic/English approach');
      assert.ok(content.includes('English') || content.includes('إنجليزي'),
        'Must document English output');
    });

    it('documents MCP tool names for BOM querying', () => {
      assert.ok(content.includes('list_unified_bom'), 'Must document list_unified_bom MCP tool');
      assert.ok(content.includes('export_compliance_bundle'),
        'Must document export_compliance_bundle MCP tool');
    });
  });

  describe('duplicate file: peak-arabic-unified-bom 2.mdc', () => {
    it('file exists (space in filename — the duplicate copy)', () => {
      const filePath = path.join(ROOT, '.cursor/rules/peak-arabic-unified-bom 2.mdc');
      assert.ok(fs.existsSync(filePath), 'peak-arabic-unified-bom 2.mdc must exist');
    });

    it('has identical content to peak-arabic-unified-bom.mdc', () => {
      const original = readFile('.cursor/rules/peak-arabic-unified-bom.mdc');
      const duplicate = readFile('.cursor/rules/peak-arabic-unified-bom 2.mdc');
      assert.strictEqual(original, duplicate,
        'Both files must have identical content (duplicate added in PR)');
    });
  });
});

// ─── .backups/ Directory ─────────────────────────────────────────────────────

describe('.backups/ — backup directory sentinel', () => {
  it('.gitkeep exists (ensures the .backups/ directory is tracked by git)', () => {
    const filePath = path.join(ROOT, '.backups/.gitkeep');
    assert.ok(fs.existsSync(filePath), '.backups/.gitkeep must exist');
  });

  it('.gitkeep is empty (pure directory placeholder)', () => {
    const filePath = path.join(ROOT, '.backups/.gitkeep');
    const stat = fs.statSync(filePath);
    assert.strictEqual(stat.size, 0, '.backups/.gitkeep must be an empty file');
  });

  it('.backups/ directory exists and is a directory', () => {
    const dirPath = path.join(ROOT, '.backups');
    assert.ok(fs.existsSync(dirPath), '.backups/ directory must exist');
    assert.ok(fs.statSync(dirPath).isDirectory(), '.backups/ must be a directory');
  });
});

// ─── Deleted aix-hints files — ensure they no longer exist ───────────────────

describe('.aix-hints/ — deleted hint files', () => {
  const deletedFiles = [
    '.aix-hints/CONSTITUTION.md',
    '.aix-hints/cold/ring-0-rust.md',
    '.aix-hints/cold/ring-1-zkkyc.md',
    '.aix-hints/cold/ring-2-swarm.md',
    '.aix-hints/cold/ring-3-studio.md',
  ];

  for (const relPath of deletedFiles) {
    it(`${relPath} has been removed from the repository`, () => {
      const filePath = path.join(ROOT, relPath);
      assert.ok(!fs.existsSync(filePath),
        `${relPath} should be deleted but still exists`);
    });
  }
});
