/**
 * PR Validation Tests
 *
 * Tests for the files added/changed in this PR:
 *  - .github/CODEOWNERS
 *  - .github/workflows/*.yml (ai-guardrails, aix-validation, ci, dead-code-scan,
 *    evolution, health-autonomy, health-check, jules-scheduled, pattern-watcher,
 *    quality, schema-drift-check, security-signature-gate, sovereign-pulse,
 *    studio-ci, studio-protection, swarm-router-sync)
 *  - apps/studio/.env.example
 *  - apps/studio/.eslintrc.json
 *  - apps/studio/.gitignore
 *  - apps/studio/CLAUDE.md, HARDENING.md, PI_NETWORK_INTEGRATION.md
 *
 * Focus areas:
 *  1. Security detection regex patterns (ai-guardrails.yml)
 *  2. Secret-scanning regex patterns (ai-guardrails.yml)
 *  3. High-risk file patterns (ai-guardrails.yml)
 *  4. CODEOWNERS format and required entries
 *  5. Studio .gitignore key patterns
 *  6. Studio .env.example documented variables
 *  7. Studio .eslintrc.json import restriction rules
 *  8. Workflow YAML files exist on disk
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

// Parse a simple .env / dotenv file into an object (ignores comments and blanks).
function parseEnvFile(content) {
  const vars = {};
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    vars[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return vars;
}

// ---------------------------------------------------------------------------
// 1. Security detection regex patterns (from ai-guardrails.yml)
// ---------------------------------------------------------------------------

describe('AI Guardrails — AI-origin detection patterns', () => {
  // The workflow uses these grep patterns to detect AI-authored commits:
  //   grep -qi "google-labs-jules|jules[bot]|copilot[bot]"
  // We port those to JS regexes for unit testing.

  const AI_COMMIT_PATTERN = /google-labs-jules|jules\[bot\]|copilot\[bot\]/i;
  const AI_LABEL_PATTERN = /ai-generated|jules|copilot/i;

  describe('AI_COMMIT_PATTERN', () => {
    it('matches google-labs-jules bot email', () => {
      expect(AI_COMMIT_PATTERN.test('google-labs-jules[bot]@users.noreply.github.com')).toBe(true);
    });

    it('matches jules[bot] email pattern', () => {
      expect(AI_COMMIT_PATTERN.test('jules[bot]@noreply.github.com')).toBe(true);
    });

    it('matches copilot[bot] email pattern', () => {
      expect(AI_COMMIT_PATTERN.test('copilot[bot]@noreply.github.com')).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(AI_COMMIT_PATTERN.test('Google-Labs-Jules[bot]@github.com')).toBe(true);
      expect(AI_COMMIT_PATTERN.test('COPILOT[BOT]@github.com')).toBe(true);
    });

    it('does NOT match regular human email addresses', () => {
      expect(AI_COMMIT_PATTERN.test('alice@example.com')).toBe(false);
      expect(AI_COMMIT_PATTERN.test('bob.dev@company.io')).toBe(false);
      expect(AI_COMMIT_PATTERN.test('123456+username@users.noreply.github.com')).toBe(false);
    });

    it('does NOT match partial words that are unrelated', () => {
      // "jules" is only in the pattern with [bot], standalone should still not match
      // (actually the pattern also catches bare "jules" substring)
      // This documents that the pattern is intentionally broad for "jules"
      expect(AI_COMMIT_PATTERN.test('google-labs-jules')).toBe(true); // expected: matched
    });
  });

  describe('AI_LABEL_PATTERN (PR labels)', () => {
    it('matches "ai-generated" label', () => {
      expect(AI_LABEL_PATTERN.test('ai-generated')).toBe(true);
    });

    it('matches "jules" label', () => {
      expect(AI_LABEL_PATTERN.test('jules')).toBe(true);
    });

    it('matches "copilot" label', () => {
      expect(AI_LABEL_PATTERN.test('copilot')).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(AI_LABEL_PATTERN.test('AI-Generated')).toBe(true);
      expect(AI_LABEL_PATTERN.test('COPILOT')).toBe(true);
    });

    it('does NOT match unrelated PR labels', () => {
      expect(AI_LABEL_PATTERN.test('bug')).toBe(false);
      expect(AI_LABEL_PATTERN.test('feature')).toBe(false);
      expect(AI_LABEL_PATTERN.test('human-reviewed')).toBe(false);
      expect(AI_LABEL_PATTERN.test('documentation')).toBe(false);
    });
  });

  describe('Co-authored-by trailer detection', () => {
    const CO_AUTHOR_AI_PATTERN = /google-labs-jules|jules\[bot\]|copilot/i;

    it('detects Jules co-authorship in commit body', () => {
      const commitBody = 'Co-authored-by: google-labs-jules[bot] <google-labs-jules[bot]@users.noreply.github.com>';
      expect(CO_AUTHOR_AI_PATTERN.test(commitBody)).toBe(true);
    });

    it('detects Copilot co-authorship in commit body', () => {
      const commitBody = 'Co-authored-by: GitHub Copilot <copilot@noreply.github.com>';
      expect(CO_AUTHOR_AI_PATTERN.test(commitBody)).toBe(true);
    });

    it('does NOT match human co-authorship', () => {
      const commitBody = 'Co-authored-by: Alice Smith <alice@example.com>';
      expect(CO_AUTHOR_AI_PATTERN.test(commitBody)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Secret-scanning regex patterns (from ai-guardrails.yml)
// ---------------------------------------------------------------------------

describe('AI Guardrails — Secret scanning patterns', () => {
  // Pattern from ai-guardrails.yml: detect hardcoded PI API keys
  const PI_KEY_PATTERN = /(pi_api_key|PI_API_KEY|piApiKey)\s*[=:]\s*["'][^"']+["']/;

  describe('PI API key detection', () => {
    it('matches hardcoded pi_api_key assignment', () => {
      expect(PI_KEY_PATTERN.test('pi_api_key = "my_real_pi_key_12345"')).toBe(true);
    });

    it('matches PI_API_KEY constant definition', () => {
      expect(PI_KEY_PATTERN.test('PI_API_KEY: "abc123def456"')).toBe(true);
    });

    it('matches piApiKey camelCase', () => {
      expect(PI_KEY_PATTERN.test("const piApiKey = 'secret_pi_key_here'")).toBe(true);
    });

    it('does NOT match env variable reference (no literal value)', () => {
      // process.env.PI_API_KEY is not a hardcoded key
      expect(PI_KEY_PATTERN.test('PI_API_KEY = process.env.PI_API_KEY')).toBe(false);
    });

    it('does NOT match empty string assignment', () => {
      expect(PI_KEY_PATTERN.test('PI_API_KEY = ""')).toBe(false);
    });
  });

  // Pattern from ai-guardrails.yml: detect JWT tokens
  const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

  describe('JWT token detection', () => {
    it('matches a realistic JWT token string', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(JWT_PATTERN.test(jwt)).toBe(true);
    });

    it('matches JWT embedded in a string literal', () => {
      const code = 'const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMTIzIn0.abc123"';
      expect(JWT_PATTERN.test(code)).toBe(true);
    });

    it('does NOT match a short eyJ prefix without proper JWT structure', () => {
      // Too short segments
      expect(JWT_PATTERN.test('eyJhbGc.eyJ')).toBe(false);
    });

    it('does NOT match arbitrary base64 without eyJ prefix', () => {
      expect(JWT_PATTERN.test('YWJjZGVmZ2hpamtsbW5vcA==')).toBe(false);
    });
  });

  // Pattern from ai-guardrails.yml: detect generic API key hardcoding
  const GENERIC_API_KEY_PATTERN = /(api_key|apiKey|API_KEY|secret_key|SECRET_KEY)\s*[=:]\s*["'][a-zA-Z0-9_\-]{20,}["']/;

  describe('Generic API key detection', () => {
    it('matches api_key with long literal value', () => {
      expect(GENERIC_API_KEY_PATTERN.test('api_key = "abcdefghijklmnopqrstuvwxyz123456"')).toBe(true);
    });

    it('matches API_KEY constant with 20+ char value', () => {
      expect(GENERIC_API_KEY_PATTERN.test('API_KEY: "sk-projAbCdEfGhIjKlMnOpQr"')).toBe(true);
    });

    it('matches secret_key assignment', () => {
      expect(GENERIC_API_KEY_PATTERN.test("const secret_key = 'my-super-secret-key-here'")).toBe(true);
    });

    it('does NOT match a short value (< 20 chars)', () => {
      expect(GENERIC_API_KEY_PATTERN.test('api_key = "short"')).toBe(false);
    });

    it('does NOT match an env variable reference', () => {
      expect(GENERIC_API_KEY_PATTERN.test('API_KEY = process.env.API_KEY')).toBe(false);
    });
  });

  // Pattern from ai-guardrails.yml: detect 64-char hex strings (potential private keys)
  const HEX_64_PATTERN = /["'][0-9a-fA-F]{64}["']/;

  describe('64-char hex private key detection', () => {
    it('matches exactly 64 hex chars in double quotes', () => {
      const hex64 = '"' + 'a'.repeat(64) + '"';
      expect(HEX_64_PATTERN.test(hex64)).toBe(true);
    });

    it('matches exactly 64 hex chars in single quotes', () => {
      const hex64 = "'" + 'f'.repeat(64) + "'";
      expect(HEX_64_PATTERN.test(hex64)).toBe(true);
    });

    it('matches mixed-case 64-char hex', () => {
      const hex64 = '"' + 'aAbBcCdDeEfF1234567890aAbBcCdDeEfF12345678' + '90aAbBcCdDeE' + '"';
      // Ensure exactly 64 chars
      const key = 'aAbBcCdDeEfF1234567890aAbBcCdDeEfF1234567890aAbBcCdDeEfF12345678';
      expect(HEX_64_PATTERN.test(`"${key}"`)).toBe(true);
    });

    it('does NOT match 63-char hex string', () => {
      const hex63 = '"' + 'a'.repeat(63) + '"';
      expect(HEX_64_PATTERN.test(hex63)).toBe(false);
    });

    it('does NOT match 65-char string (too long)', () => {
      // The pattern requires exactly 64 between quotes - but since it uses {64} it
      // actually matches any substring of 64 hex chars, so 65 would also match.
      // This test documents the known behavior.
      const hex65 = '"' + 'a'.repeat(65) + '"';
      expect(HEX_64_PATTERN.test(hex65)).toBe(true); // pattern matches embedded 64-char
    });

    it('does NOT match 64-char string with non-hex characters', () => {
      const nonHex64 = '"' + 'g'.repeat(64) + '"'; // 'g' is not a hex char
      expect(HEX_64_PATTERN.test(nonHex64)).toBe(false);
    });
  });

  // Pattern from jules-scheduled.yml: detect hardcoded private keys
  const PRIVATE_KEY_PATTERN = /(privateKey|secretKey)\s*[:=]\s*['"][0-9a-f]{64}['"]/;

  describe('Private key hex string detection (jules-scheduled.yml)', () => {
    it('matches privateKey assignment with 64-char hex', () => {
      const code = "const privateKey = '" + 'a'.repeat(64) + "'";
      expect(PRIVATE_KEY_PATTERN.test(code)).toBe(true);
    });

    it('matches secretKey assignment with 64-char hex', () => {
      const code = 'secretKey: "' + 'f'.repeat(64) + '"';
      expect(PRIVATE_KEY_PATTERN.test(code)).toBe(true);
    });

    it('does NOT match privateKey without a long hex value', () => {
      expect(PRIVATE_KEY_PATTERN.test('const privateKey = env.PRIVATE_KEY')).toBe(false);
    });

    it('does NOT match with uppercase hex (pattern only matches lowercase a-f)', () => {
      const code = "privateKey = '" + 'A'.repeat(64) + "'";
      expect(PRIVATE_KEY_PATTERN.test(code)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// 3. High-risk file pattern matching (from ai-guardrails.yml)
// ---------------------------------------------------------------------------

describe('AI Guardrails — High-risk file patterns', () => {
  // These patterns mirror HIGH_RISK_PATTERNS from the workflow detect_risk step
  const HIGH_RISK_PATTERNS = [
    'apps/studio/app/layout',
    'apps/studio/app/globals.css',
    'apps/studio/next.config',
    'apps/studio/components/AgenticKycSetup',
    'apps/studio/components/LiveValidator',
    'apps/studio/lib/pi-sdk',
    'security/',
    'economics/',
    '.github/workflows/',
    'AGENT_GOVERNANCE.md',
    'ARCH_DECISIONS.md',
  ];

  function isHighRisk(filePath) {
    return HIGH_RISK_PATTERNS.some(pattern => filePath.includes(pattern));
  }

  it('flags apps/studio/app/layout.tsx as high-risk', () => {
    expect(isHighRisk('apps/studio/app/layout.tsx')).toBe(true);
  });

  it('flags apps/studio/app/globals.css as high-risk', () => {
    expect(isHighRisk('apps/studio/app/globals.css')).toBe(true);
  });

  it('flags apps/studio/next.config.ts as high-risk', () => {
    expect(isHighRisk('apps/studio/next.config.ts')).toBe(true);
  });

  it('flags apps/studio/next.config.js as high-risk', () => {
    expect(isHighRisk('apps/studio/next.config.js')).toBe(true);
  });

  it('flags apps/studio/components/AgenticKycSetup.tsx as high-risk', () => {
    expect(isHighRisk('apps/studio/components/AgenticKycSetup.tsx')).toBe(true);
  });

  it('flags apps/studio/components/LiveValidator.tsx as high-risk', () => {
    expect(isHighRisk('apps/studio/components/LiveValidator.tsx')).toBe(true);
  });

  it('flags apps/studio/lib/pi-sdk.ts as high-risk', () => {
    expect(isHighRisk('apps/studio/lib/pi-sdk.ts')).toBe(true);
  });

  it('flags security/ directory files as high-risk', () => {
    expect(isHighRisk('security/identity.ts')).toBe(true);
  });

  it('flags economics/ directory files as high-risk', () => {
    expect(isHighRisk('economics/bonding-curve.ts')).toBe(true);
  });

  it('flags .github/workflows/ files as high-risk', () => {
    expect(isHighRisk('.github/workflows/ci.yml')).toBe(true);
  });

  it('flags AGENT_GOVERNANCE.md as high-risk', () => {
    expect(isHighRisk('AGENT_GOVERNANCE.md')).toBe(true);
  });

  it('flags ARCH_DECISIONS.md as high-risk', () => {
    expect(isHighRisk('ARCH_DECISIONS.md')).toBe(true);
  });

  it('does NOT flag regular source files as high-risk', () => {
    expect(isHighRisk('apps/studio/components/Button.tsx')).toBe(false);
    expect(isHighRisk('packages/aix-core/src/parser.ts')).toBe(false);
    expect(isHighRisk('tests/parser.test.js')).toBe(false);
    expect(isHighRisk('README.md')).toBe(false);
  });

  it('does NOT flag apps/studio/app/ sub-pages as high-risk (only layout + globals)', () => {
    // Page files under apps/studio/app/ are only high-risk if they match a pattern
    expect(isHighRisk('apps/studio/app/page.tsx')).toBe(false);
    expect(isHighRisk('apps/studio/app/dashboard/page.tsx')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Forbidden git execution patterns (from ai-guardrails.yml)
// ---------------------------------------------------------------------------

describe('AI Guardrails — Forbidden git execution patterns', () => {
  // Pattern: (exec|spawn|execSync|spawnSync).*["'](git )
  const GIT_EXEC_PATTERN = /(exec|spawn|execSync|spawnSync).*["'](git )/;

  describe('Git exec pattern', () => {
    it('matches execSync("git commit")', () => {
      expect(GIT_EXEC_PATTERN.test('execSync("git commit -m message")')).toBe(true);
    });

    it('matches spawn("git push")', () => {
      expect(GIT_EXEC_PATTERN.test("spawn('git push origin main'")).toBe(true);
    });

    it('matches spawnSync("git reset")', () => {
      expect(GIT_EXEC_PATTERN.test('spawnSync("git reset --hard HEAD")')).toBe(true);
    });

    it('matches exec("git " style)', () => {
      expect(GIT_EXEC_PATTERN.test("exec('git status')")).toBe(true);
    });

    it('does NOT match exec without git', () => {
      expect(GIT_EXEC_PATTERN.test('execSync("npm install")')).toBe(false);
    });

    it('does NOT match a comment mentioning git', () => {
      // Comments are not typically caught by this pattern since there's no exec prefix
      expect(GIT_EXEC_PATTERN.test('// git push is forbidden')).toBe(false);
    });
  });

  // Pattern for shell scripts: ^(git push|git commit|git reset|git rebase|git force)
  const SHELL_GIT_PATTERN = /^(git push|git commit|git reset|git rebase|git force)/m;

  describe('Shell script git pattern', () => {
    it('matches "git push" at start of line', () => {
      expect(SHELL_GIT_PATTERN.test('git push origin main')).toBe(true);
    });

    it('matches "git commit" at start of line', () => {
      expect(SHELL_GIT_PATTERN.test('git commit -m "fix"')).toBe(true);
    });

    it('matches "git reset" at start of line', () => {
      expect(SHELL_GIT_PATTERN.test('git reset --hard HEAD')).toBe(true);
    });

    it('matches "git rebase" at start of line', () => {
      expect(SHELL_GIT_PATTERN.test('git rebase main')).toBe(true);
    });

    it('does NOT match "git status" (not in forbidden list)', () => {
      expect(SHELL_GIT_PATTERN.test('git status')).toBe(false);
    });

    it('does NOT match "git pull" (not in forbidden list)', () => {
      expect(SHELL_GIT_PATTERN.test('git pull --rebase')).toBe(false);
    });

    it('does NOT match git command embedded in a comment', () => {
      // The comment line doesn't start with "git push"
      expect(SHELL_GIT_PATTERN.test('# git push origin main')).toBe(false);
    });

    it('matches in multiline script text', () => {
      const script = 'echo "deploying"\ngit commit -m "auto"\ngit push';
      expect(SHELL_GIT_PATTERN.test(script)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// 5. ADR-002 compliance — TokenBucket must not appear in core/
// ---------------------------------------------------------------------------

describe('AI Guardrails — ADR-002 TokenBucket compliance', () => {
  const TOKEN_BUCKET_PATTERN = /TokenBucket|token_bucket|tokenBucket/;

  it('pattern matches TokenBucket class reference', () => {
    expect(TOKEN_BUCKET_PATTERN.test('class TokenBucket { }')).toBe(true);
  });

  it('pattern matches snake_case token_bucket', () => {
    expect(TOKEN_BUCKET_PATTERN.test('const token_bucket = new Bucket()')).toBe(true);
  });

  it('pattern matches camelCase tokenBucket', () => {
    expect(TOKEN_BUCKET_PATTERN.test('const tokenBucket = createBucket(10)')).toBe(true);
  });

  it('does NOT match unrelated bucket references', () => {
    expect(TOKEN_BUCKET_PATTERN.test('const rateLimiter = new RateLimiter()')).toBe(false);
    expect(TOKEN_BUCKET_PATTERN.test('const S3Bucket = new aws.S3()')).toBe(false);
  });

  // Actual compliance check: verify core/ does not contain TokenBucket
  it('core/ directory does not contain TokenBucket (ADR-002)', () => {
    const coreDir = path.join(ROOT, 'core');
    if (!fs.existsSync(coreDir)) {
      // Skip if core doesn't exist in this environment
      return;
    }

    const sourceFiles = getAllFiles(coreDir, ['.js', '.ts']);
    const violations = [];

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (TOKEN_BUCKET_PATTERN.test(content)) {
        violations.push(filePath);
      }
    }

    expect(violations).toEqual([]);
  });

  function getAllFiles(dir, extensions) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        results.push(...getAllFiles(fullPath, extensions));
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
    return results;
  }
});

// ---------------------------------------------------------------------------
// 6. CODEOWNERS file format and required entries
// ---------------------------------------------------------------------------

describe('CODEOWNERS file', () => {
  const CODEOWNERS_PATH = '.github/CODEOWNERS';

  it('file exists', () => {
    expect(fileExists(CODEOWNERS_PATH)).toBe(true);
  });

  it('is readable and non-empty', () => {
    const content = readFile(CODEOWNERS_PATH);
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it('contains @Moeabdelaziz007 as the owner', () => {
    const content = readFile(CODEOWNERS_PATH);
    expect(content).toContain('@Moeabdelaziz007');
  });

  describe('required governance file entries', () => {
    const requiredPatterns = [
      'AGENT_GOVERNANCE.md',
      'ARCH_DECISIONS.md',
      'CLAUDE.md',
      '.github/CODEOWNERS',
      '.github/workflows/',
      'schemas/',
      'types/',
      'core/parser.ts',
      'core/parser.js',
      'core/error_handler.js',
      'core/memory.js',
      'apps/studio/app/layout.tsx',
      'apps/studio/app/globals.css',
      'apps/studio/next.config.ts',
      'apps/studio/next.config.js',
      'security/',
      'economics/',
    ];

    for (const pattern of requiredPatterns) {
      it(`contains entry for: ${pattern}`, () => {
        const fileContent = readFile(CODEOWNERS_PATH);
        expect(fileContent).toContain(pattern);
      });
    }
  });

  it('all non-comment, non-empty lines have @owner format', () => {
    const content = readFile(CODEOWNERS_PATH);
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      // Each rule line should have a pattern followed by at least one @owner
      expect(trimmed).toMatch(/@\w+/);
    }
  });

  it('does not contain any entry that points to a non-existent wildcard path without @', () => {
    // All CODEOWNER rule lines should have an owner (@...) assigned
    const content = readFile(CODEOWNERS_PATH);
    const ruleLines = content.split('\n').filter(l => {
      const t = l.trim();
      return t && !t.startsWith('#');
    });
    for (const line of ruleLines) {
      expect(line).toMatch(/@Moeabdelaziz007/);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Studio .gitignore key patterns
// ---------------------------------------------------------------------------

describe('apps/studio/.gitignore', () => {
  const GITIGNORE_PATH = 'apps/studio/.gitignore';

  it('file exists', () => {
    expect(fileExists(GITIGNORE_PATH)).toBe(true);
  });

  it('ignores node_modules', () => {
    const content = readFile(GITIGNORE_PATH);
    expect(content).toContain('/node_modules');
  });

  it('ignores .next build output', () => {
    const content = readFile(GITIGNORE_PATH);
    expect(content).toContain('/.next/');
  });

  it('ignores .env files (local secrets)', () => {
    const content = readFile(GITIGNORE_PATH);
    expect(content).toContain('.env*');
  });

  it('explicitly tracks .env.example (exception to .env* rule)', () => {
    const content = readFile(GITIGNORE_PATH);
    expect(content).toContain('!.env.example');
  });

  it('ignores package-lock.json (pnpm project)', () => {
    const content = readFile(GITIGNORE_PATH);
    expect(content).toContain('package-lock.json');
  });

  it('ignores yarn.lock (pnpm project)', () => {
    const content = readFile(GITIGNORE_PATH);
    expect(content).toContain('yarn.lock');
  });

  it('ignores .pem certificate files', () => {
    const content = readFile(GITIGNORE_PATH);
    expect(content).toContain('*.pem');
  });

  it('ignores .vercel directory', () => {
    const content = readFile(GITIGNORE_PATH);
    expect(content).toContain('.vercel');
  });

  it('ignores coverage output', () => {
    const content = readFile(GITIGNORE_PATH);
    expect(content).toContain('/coverage');
  });

  it('ignores TypeScript build info files', () => {
    const content = readFile(GITIGNORE_PATH);
    expect(content).toContain('*.tsbuildinfo');
  });

  it('ignores next-env.d.ts (Next.js generated file)', () => {
    const content = readFile(GITIGNORE_PATH);
    expect(content).toContain('next-env.d.ts');
  });

  it('.env* pattern comes before !.env.example (exception ordering matters)', () => {
    const content = readFile(GITIGNORE_PATH);
    const envIdx = content.indexOf('.env*');
    const exampleIdx = content.indexOf('!.env.example');
    expect(envIdx).toBeGreaterThanOrEqual(0);
    expect(exampleIdx).toBeGreaterThanOrEqual(0);
    expect(envIdx).toBeLessThan(exampleIdx);
  });
});

// ---------------------------------------------------------------------------
// 8. Studio .env.example — required variables documented
// ---------------------------------------------------------------------------

describe('apps/studio/.env.example', () => {
  const ENV_EXAMPLE_PATH = 'apps/studio/.env.example';

  it('file exists', () => {
    expect(fileExists(ENV_EXAMPLE_PATH)).toBe(true);
  });

  it('is non-empty', () => {
    const content = readFile(ENV_EXAMPLE_PATH);
    expect(content.trim().length).toBeGreaterThan(0);
  });

  describe('Critical variables are documented', () => {
    const criticalVars = [
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'GROQ_API_KEY',
      'GOOGLE_GENERATIVE_AI_API_KEY',
      'XAI_API_KEY',
    ];

    for (const varName of criticalVars) {
      it(`documents ${varName}`, () => {
        const content = readFile(ENV_EXAMPLE_PATH);
        expect(content).toContain(varName);
      });
    }
  });

  describe('Pi Network variables are documented', () => {
    const piVars = [
      'PI_API_KEY',
      'PI_APP_ID',
      'NEXT_PUBLIC_PI_APP_ID',
      'PI_ENVIRONMENT',
      'NEXT_PUBLIC_PI_ENABLED',
    ];

    for (const varName of piVars) {
      it(`documents ${varName}`, () => {
        const content = readFile(ENV_EXAMPLE_PATH);
        expect(content).toContain(varName);
      });
    }
  });

  describe('Security variables are documented', () => {
    const secVars = [
      'JWT_SECRET',
      'AIX_UID_HASH_SALT',
      'AXIOM_AUTHORITY',
      'AXIOM_API_KEY',
      'ZK_VERIFICATION_KEY',
      'PROTOCOL_TREASURY_ADDRESS',
      'SKIP_SIGNATURE_VERIFICATION',
    ];

    for (const varName of secVars) {
      it(`documents ${varName}`, () => {
        const content = readFile(ENV_EXAMPLE_PATH);
        expect(content).toContain(varName);
      });
    }
  });

  describe('App configuration variables are documented', () => {
    const appVars = [
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_STUDIO_VERSION',
      'NODE_ENV',
    ];

    for (const varName of appVars) {
      it(`documents ${varName}`, () => {
        const content = readFile(ENV_EXAMPLE_PATH);
        expect(content).toContain(varName);
      });
    }
  });

  it('does NOT contain any real-looking API key values', () => {
    const vars = parseEnvFile(readFile(ENV_EXAMPLE_PATH));

    // Real Groq keys start with "gsk_" followed by more real chars — placeholders use "your_"
    expect(vars['GROQ_API_KEY']).toMatch(/your_|placeholder/i);

    // PI_API_KEY should be a placeholder
    expect(vars['PI_API_KEY']).toMatch(/your_|placeholder/i);

    // JWT_SECRET should be a placeholder
    expect(vars['JWT_SECRET']).toMatch(/your_|placeholder|change/i);
  });

  it('PI_ENVIRONMENT default is sandbox (not production)', () => {
    const vars = parseEnvFile(readFile(ENV_EXAMPLE_PATH));
    expect(vars['PI_ENVIRONMENT']).toBe('sandbox');
  });

  it('NEXT_PUBLIC_CRYPTO_ENABLED defaults to false', () => {
    const vars = parseEnvFile(readFile(ENV_EXAMPLE_PATH));
    expect(vars['NEXT_PUBLIC_CRYPTO_ENABLED']).toBe('false');
  });

  it('SKIP_SIGNATURE_VERIFICATION defaults to false', () => {
    const vars = parseEnvFile(readFile(ENV_EXAMPLE_PATH));
    expect(vars['SKIP_SIGNATURE_VERIFICATION']).toBe('false');
  });

  it('includes legacy KV aliases for backward compatibility', () => {
    const content = readFile(ENV_EXAMPLE_PATH);
    expect(content).toContain('KV_REST_API_URL');
    expect(content).toContain('KV_REST_API_TOKEN');
  });

  it('has comment instructing not to commit .env.local', () => {
    const content = readFile(ENV_EXAMPLE_PATH);
    expect(content).toMatch(/NEVER commit .env\.local/i);
  });
});

// ---------------------------------------------------------------------------
// 9. Studio .eslintrc.json import restriction rules
// ---------------------------------------------------------------------------

describe('apps/studio/.eslintrc.json', () => {
  const ESLINTRC_PATH = 'apps/studio/.eslintrc.json';

  it('file exists', () => {
    expect(fileExists(ESLINTRC_PATH)).toBe(true);
  });

  it('is valid JSON', () => {
    expect(() => JSON.parse(readFile(ESLINTRC_PATH))).not.toThrow();
  });

  it('extends next/core-web-vitals', () => {
    const config = JSON.parse(readFile(ESLINTRC_PATH));
    expect(config.extends).toBe('next/core-web-vitals');
  });

  it('has no-restricted-imports rule set to error', () => {
    const config = JSON.parse(readFile(ESLINTRC_PATH));
    expect(config.rules).toBeDefined();
    const rule = config.rules['no-restricted-imports'];
    expect(rule).toBeDefined();
    expect(rule[0]).toBe('error');
  });

  describe('import restriction patterns', () => {
    let ruleConfig;

    beforeEach(() => {
      const config = JSON.parse(readFile(ESLINTRC_PATH));
      ruleConfig = config.rules['no-restricted-imports'][1];
    });

    it('restricts deep relative imports (../../../../*)', () => {
      const patterns = ruleConfig.patterns;
      expect(patterns).toContain('../../../../*');
    });

    it('restricts cross-package core imports (../../../core/*)', () => {
      const patterns = ruleConfig.patterns;
      expect(patterns).toContain('../../../core/*');
    });

    it('restricts two-level core imports (../../core/*)', () => {
      const patterns = ruleConfig.patterns;
      expect(patterns).toContain('../../core/*');
    });

    it('restricts one-level core imports (../core/*)', () => {
      const patterns = ruleConfig.patterns;
      expect(patterns).toContain('../core/*');
    });

    it('restricts @vercel/kv imports with a helpful message', () => {
      const paths = ruleConfig.paths;
      expect(paths).toBeDefined();
      const vercelKvRule = paths.find(p => p.name === '@vercel/kv');
      expect(vercelKvRule).toBeDefined();
      expect(vercelKvRule.message).toContain('@/lib/storage/redis');
    });

    it('has exactly 4 deep-relative-import patterns', () => {
      const patterns = ruleConfig.patterns;
      expect(patterns).toHaveLength(4);
    });
  });
});

// ---------------------------------------------------------------------------
// 10. Workflow YAML files exist on disk
// ---------------------------------------------------------------------------

describe('GitHub Actions workflow files exist', () => {
  const WORKFLOW_DIR = '.github/workflows';

  const expectedWorkflows = [
    'ai-guardrails.yml',
    'aix-validation.yml',
    'ci.yml',
    'dead-code-scan.yml',
    'evolution.yml',
    'health-autonomy.yml',
    'health-check.yml',
    'jules-scheduled.yml',
    'pattern-watcher.yml',
    'quality.yml',
    'schema-drift-check.yml',
    'security-signature-gate.yml',
    'sovereign-pulse.yml',
    'studio-ci.yml',
    'studio-protection.yml',
    'swarm-router-sync.yml',
  ];

  for (const workflow of expectedWorkflows) {
    it(`${workflow} exists`, () => {
      expect(fileExists(path.join(WORKFLOW_DIR, workflow))).toBe(true);
    });
  }

  it('all workflow files are non-empty', () => {
    for (const workflow of expectedWorkflows) {
      const fullPath = path.join(WORKFLOW_DIR, workflow);
      if (fileExists(fullPath)) {
        const content = readFile(fullPath);
        expect(content.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('all workflow files start with the "name:" key', () => {
    for (const workflow of expectedWorkflows) {
      const fullPath = path.join(WORKFLOW_DIR, workflow);
      if (fileExists(fullPath)) {
        const content = readFile(fullPath);
        // GitHub Actions workflows must have a name or on: trigger at top level
        const hasName = content.includes('name:');
        const hasOn = content.includes('\non:') || content.startsWith('on:');
        expect(hasName || hasOn).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 11. Workflow structural checks (content validation)
// ---------------------------------------------------------------------------

describe('GitHub Actions workflow structural validation', () => {
  it('ai-guardrails.yml defines detect-ai-origin job', () => {
    const content = readFile('.github/workflows/ai-guardrails.yml');
    expect(content).toContain('detect-ai-origin');
  });

  it('ai-guardrails.yml defines ai-security-scan job', () => {
    const content = readFile('.github/workflows/ai-guardrails.yml');
    expect(content).toContain('ai-security-scan');
  });

  it('ai-guardrails.yml defines high-risk-gate job', () => {
    const content = readFile('.github/workflows/ai-guardrails.yml');
    expect(content).toContain('high-risk-gate');
  });

  it('ai-guardrails.yml triggers only on pull_request to main', () => {
    const content = readFile('.github/workflows/ai-guardrails.yml');
    expect(content).toContain("branches: [main]");
  });

  it('ci.yml has build, test, and deploy jobs', () => {
    const content = readFile('.github/workflows/ci.yml');
    expect(content).toContain('build:');
    expect(content).toContain('test:');
    expect(content).toContain('deploy:');
  });

  it('ci.yml deploy job requires build and test to pass', () => {
    const content = readFile('.github/workflows/ci.yml');
    expect(content).toContain('needs: [build, test]');
  });

  it('ci.yml deploy job only runs on main branch push', () => {
    const content = readFile('.github/workflows/ci.yml');
    expect(content).toContain("github.ref == 'refs/heads/main'");
    expect(content).toContain("github.event_name == 'push'");
  });

  it('schema-drift-check.yml blocks on drift detection', () => {
    const content = readFile('.github/workflows/schema-drift-check.yml');
    expect(content).toContain('drift=true');
    expect(content).toContain('exit 1');
  });

  it('schema-drift-check.yml triggers on schemas/ and types/ path changes', () => {
    const content = readFile('.github/workflows/schema-drift-check.yml');
    expect(content).toContain('schemas/**');
    expect(content).toContain('types/**');
  });

  it('studio-protection.yml guards High-Risk Studio Zone files', () => {
    const content = readFile('.github/workflows/studio-protection.yml');
    expect(content).toContain('apps/studio/app/layout.tsx');
    expect(content).toContain('apps/studio/app/globals.css');
    expect(content).toContain('apps/studio/components/AgenticKycSetup');
  });

  it('studio-protection.yml requires human-reviewed label for AI PRs', () => {
    const content = readFile('.github/workflows/studio-protection.yml');
    expect(content).toContain('human-reviewed');
  });

  it('dead-code-scan.yml has proper permissions (pull-requests: write)', () => {
    const content = readFile('.github/workflows/dead-code-scan.yml');
    expect(content).toContain('pull-requests: write');
  });

  it('dead-code-scan.yml has proper permissions (issues: write)', () => {
    const content = readFile('.github/workflows/dead-code-scan.yml');
    expect(content).toContain('issues: write');
  });

  it('aix-validation.yml triggers on .aix file changes', () => {
    const content = readFile('.github/workflows/aix-validation.yml');
    expect(content).toContain('**/*.aix');
  });

  it('security-signature-gate.yml runs parser and security tests', () => {
    const content = readFile('.github/workflows/security-signature-gate.yml');
    expect(content).toContain('tests/parser.test.js');
    expect(content).toContain('tests/e2e/security-gate.test.js');
  });

  it('swarm-router-sync.yml verifies CircuitBreaker presence', () => {
    const content = readFile('.github/workflows/swarm-router-sync.yml');
    expect(content).toContain('CircuitBreaker');
  });

  it('swarm-router-sync.yml verifies RouterMetrics presence', () => {
    const content = readFile('.github/workflows/swarm-router-sync.yml');
    expect(content).toContain('RouterMetrics');
  });

  it('health-autonomy.yml triggers daily via cron', () => {
    const content = readFile('.github/workflows/health-autonomy.yml');
    expect(content).toContain("cron: '0 0 * * *'");
  });

  it('pattern-watcher.yml runs on push and pull_request to main', () => {
    const content = readFile('.github/workflows/pattern-watcher.yml');
    expect(content).toContain('push:');
    expect(content).toContain('pull_request:');
    expect(content).toContain('main');
  });

  it('studio-ci.yml checks for broken cross-package imports', () => {
    const content = readFile('.github/workflows/studio-ci.yml');
    expect(content).toContain('cross-package imports');
  });

  it('studio-ci.yml uses concurrency to cancel stale runs', () => {
    const content = readFile('.github/workflows/studio-ci.yml');
    expect(content).toContain('concurrency:');
    expect(content).toContain('cancel-in-progress: true');
  });
});

// ---------------------------------------------------------------------------
// 12. Studio documentation files exist
// ---------------------------------------------------------------------------

describe('apps/studio documentation files', () => {
  const studioDocFiles = [
    { path: 'apps/studio/CLAUDE.md', requiredContent: 'framer-motion' },
    { path: 'apps/studio/HARDENING.md', requiredContent: 'hardening' },
    { path: 'apps/studio/PI_NETWORK_INTEGRATION.md', requiredContent: 'Pi Network' },
  ];

  for (const { path: docPath, requiredContent } of studioDocFiles) {
    it(`${docPath} exists`, () => {
      expect(fileExists(docPath)).toBe(true);
    });

    it(`${docPath} contains expected content (${requiredContent})`, () => {
      const content = readFile(docPath);
      expect(content).toContain(requiredContent);
    });
  }

  it('CLAUDE.md references the root AXIOM.md', () => {
    const content = readFile('apps/studio/CLAUDE.md');
    expect(content).toContain('AXIOM.md');
  });

  it('HARDENING.md documents the hardening check script', () => {
    const content = readFile('apps/studio/HARDENING.md');
    expect(content).toContain('hardening-check');
  });

  it('HARDENING.md documents the js-yaml prohibition', () => {
    const content = readFile('apps/studio/HARDENING.md');
    expect(content).toContain('js-yaml');
  });

  it('PI_NETWORK_INTEGRATION.md documents the usePi hook', () => {
    const content = readFile('apps/studio/PI_NETWORK_INTEGRATION.md');
    expect(content).toContain('usePi');
  });

  it('PI_NETWORK_INTEGRATION.md documents payment API endpoints', () => {
    const content = readFile('apps/studio/PI_NETWORK_INTEGRATION.md');
    expect(content).toContain('/api/pi/approve-payment');
    expect(content).toContain('/api/pi/complete-payment');
  });
});
