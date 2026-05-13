// بسم الله الرحمن الرحيم
// @axiom/lint — unified lint pipeline for the Axiom stack.
//
// Each rule is a pure function (LintRule) over a file path + content. Rules
// emit LintFinding objects with severity. The runner walks a file set, applies
// every enabled rule, returns a structured report. No auto-fix here (that's
// @axiom/autofix) — this tool is detection only, by design, so it can run on
// PRs without write access.

import { readFileSync, statSync } from 'node:fs';
import { extname, basename } from 'node:path';

export type Severity = 'error' | 'warning' | 'info';

export interface LintFinding {
  rule: string;
  severity: Severity;
  file: string;
  line?: number;
  column?: number;
  message: string;
  /** Inline excerpt of the offending region, max 80 chars. */
  context?: string;
}

export interface LintRule {
  /** Stable id used to opt-out via config (e.g. "no-em-dash"). */
  id: string;
  /** Human-readable summary, one sentence. */
  description: string;
  /** Default severity; can be overridden in config. */
  defaultSeverity: Severity;
  /** Optional file glob filter; if absent, the rule runs on every file. */
  filePattern?: RegExp;
  /** Examine one file. Return zero or more findings. */
  check: (file: string, content: string) => LintFinding[];
}

export interface LintConfig {
  /** Disable specific rules by id. */
  disable?: string[];
  /** Override default severity per rule. */
  severities?: Record<string, Severity>;
  /** Max file size in bytes; default 500_000. */
  maxFileBytes?: number;
  /** Naming convention for source files. */
  naming?: 'kebab-case' | 'snake_case' | 'mixed';
  /** Paths (regex) to skip wholesale. */
  exclude?: RegExp[];
}

export interface LintReport {
  totalFiles: number;
  filesWithFindings: number;
  findings: LintFinding[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

// --- individual rules -----------------------------------------------------

const SECRET_PATTERNS: { id: string; re: RegExp }[] = [
  { id: 'aws-access-key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'aws-secret', re: /\baws_secret_access_key\s*[:=]\s*["']?[A-Za-z0-9/+=]{40}\b/i },
  { id: 'github-pat', re: /\bghp_[A-Za-z0-9]{36}\b/ },
  { id: 'github-fine-grained', re: /\bgithub_pat_[A-Za-z0-9_]{82}\b/ },
  { id: 'slack-token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  { id: 'openai-key', re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/ },
  { id: 'private-key-pem', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/ },
  { id: 'pi-network-secret', re: /\bpi_(?:app|api)_secret\s*[:=]\s*["'][^"']{16,}["']/i },
];

const ruleSecretsScan: LintRule = {
  id: 'no-secrets',
  description: 'Detect hard-coded credentials (AWS, GitHub PATs, OpenAI keys, private keys, Pi secrets).',
  defaultSeverity: 'error',
  // Skip lockfiles and binary-ish encodings to keep false positives bounded.
  // Three orthogonal alternatives are stitched together:
  //   1. Source extensions we know to scan (ts/js/json/yaml/sh/py/go/rs/md/toml).
  //   2. .env and every .env.<suffix> variant (.env.local, .env.production,
  //      .env.test, .env.example, ...).
  //   3. Key-file conventions: any *.pem / *.key / *.crt / *.cer / *.p12 /
  //      *.pfx file, plus the unsuffixed id_rsa / id_dsa / id_ed25519 /
  //      id_ecdsa files SSH writes by default. The directory boundary on
  //      the id_* alternative accepts either '/' or '\' so SSH keys living
  //      in a Windows-style path like C:\Users\me\.ssh\id_rsa are matched
  //      the same way they would be on POSIX.
  filePattern: /\.(?:ts|tsx|js|jsx|mjs|cjs|json|jsonc|yaml|yml|sh|py|go|rs|md|toml|pem|key|crt|cer|p12|pfx)$|\.env(?:\.[A-Za-z0-9_-]+)?$|(?:^|[\\/])id_(?:rsa|dsa|ed25519|ecdsa)(?:\.[A-Za-z0-9_-]+)?$/i,
  check(file, content) {
    const out: LintFinding[] = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const p of SECRET_PATTERNS) {
        const m = lines[i].match(p.re);
        if (m) {
          out.push({
            rule: `no-secrets/${p.id}`,
            severity: 'error',
            file,
            line: i + 1,
            column: (m.index ?? 0) + 1,
            message: `possible ${p.id} leaked at ${file}:${i + 1}`,
            context: lines[i].slice(0, 80),
          });
        }
      }
    }
    return out;
  },
};

const ruleEmDash: LintRule = {
  id: 'no-em-dash',
  description: 'Reject the U+2014 em dash in any text file (use period/colon/comma instead).',
  defaultSeverity: 'warning',
  filePattern: /\.(md|txt|ts|tsx|js|jsx|json|jsonc|yaml|yml|py|go|rs)$/i,
  check(file, content) {
    const out: LintFinding[] = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let col = lines[i].indexOf('\u2014');
      while (col !== -1) {
        out.push({
          rule: 'no-em-dash',
          severity: 'warning',
          file,
          line: i + 1,
          column: col + 1,
          message: 'em dash (U+2014) is not allowed; use a period, colon, or comma',
          context: lines[i].slice(Math.max(0, col - 20), col + 20),
        });
        col = lines[i].indexOf('\u2014', col + 1);
      }
    }
    return out;
  },
};

const ruleTabInMarkdown: LintRule = {
  id: 'no-tab-in-markdown',
  description: 'Tabs in markdown break renderers; use 2 or 4 spaces instead.',
  defaultSeverity: 'warning',
  filePattern: /\.(md|mdx)$/i,
  check(file, content) {
    const out: LintFinding[] = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const tabCol = lines[i].indexOf('\t');
      if (tabCol !== -1) {
        out.push({
          rule: 'no-tab-in-markdown',
          severity: 'warning',
          file,
          line: i + 1,
          column: tabCol + 1,
          message: 'tab character in markdown — use spaces',
        });
      }
    }
    return out;
  },
};

const ruleTodoMarker: LintRule = {
  id: 'no-todo-marker',
  description: 'TODO / FIXME / XXX markers must be tracked as issues, not buried in source.',
  defaultSeverity: 'info',
  filePattern: /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|md)$/i,
  check(file, content) {
    const out: LintFinding[] = [];
    const re = /\b(TODO|FIXME|XXX|HACK)\b/;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(re);
      if (m) {
        out.push({
          rule: 'no-todo-marker',
          severity: 'info',
          file,
          line: i + 1,
          column: (m.index ?? 0) + 1,
          message: `${m[1]} marker — open an issue or remove the marker`,
          context: lines[i].slice(0, 80),
        });
      }
    }
    return out;
  },
};

function ruleFileSize(maxBytes: number): LintRule {
  return {
    id: 'max-file-size',
    description: `Reject files larger than ${maxBytes} bytes — split or refactor.`,
    defaultSeverity: 'warning',
    check(file, content) {
      const bytes = Buffer.byteLength(content, 'utf8');
      if (bytes > maxBytes) {
        return [{
          rule: 'max-file-size',
          severity: 'warning',
          file,
          message: `file is ${bytes} bytes, exceeds limit ${maxBytes}`,
        }];
      }
      return [];
    },
  };
}

function ruleNaming(convention: 'kebab-case' | 'snake_case' | 'mixed'): LintRule {
  // Mixed disables the check. Otherwise we enforce on the BASENAME (sans ext)
  // of source files only, ignoring well-known framework files (README, LICENSE,
  // index, page.tsx, etc.).
  const exempt = new Set([
    'README', 'LICENSE', 'CHANGELOG', 'CONTRIBUTING', 'AGENTS', 'CLAUDE',
    'index', 'main', 'page', 'layout', 'error', 'loading', 'route',
  ]);
  const isKebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const isSnake = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
  return {
    id: 'naming-convention',
    description: `Filenames must be ${convention}.`,
    defaultSeverity: 'warning',
    filePattern: /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|md|json|yaml|yml)$/i,
    check(file) {
      if (convention === 'mixed') return [];
      // Use path.basename so Windows paths (joined with '\') resolve to the
      // same basename a POSIX path would. The previous `file.split('/').pop()`
      // returned the full path on Windows, so naming checks silently
      // skipped every file there.
      const base = basename(file).replace(/\.[^.]+$/, '');
      if (exempt.has(base) || exempt.has(base.replace(/\..+$/, ''))) return [];
      // Allow .config.ts, .test.ts, etc. by stripping all extensions.
      const root = base.split('.')[0];
      if (!root) return [];
      const pattern = convention === 'kebab-case' ? isKebab : isSnake;
      if (!pattern.test(root)) {
        return [{
          rule: 'naming-convention',
          severity: 'warning',
          file,
          message: `filename "${root}" is not ${convention}`,
        }];
      }
      return [];
    },
  };
}

// --- runner ---------------------------------------------------------------

export const DEFAULT_RULES: LintRule[] = [
  ruleSecretsScan,
  ruleEmDash,
  ruleTabInMarkdown,
  ruleTodoMarker,
  // size + naming are added by buildRules() with config values
];

export function buildRules(config: LintConfig): LintRule[] {
  const disabled = new Set(config.disable ?? []);
  const rules = [
    ...DEFAULT_RULES,
    ruleFileSize(config.maxFileBytes ?? 500_000),
    ruleNaming(config.naming ?? 'mixed'),
  ];
  // Apply per-rule severity overrides without mutating the originals.
  return rules
    .filter(r => !disabled.has(r.id))
    .map(r => {
      const override = config.severities?.[r.id];
      if (!override) return r;
      return { ...r, defaultSeverity: override };
    });
}

// HARD_READ_LIMIT is the byte ceiling above which we refuse to pull the
// file's contents into memory. It is an implementation guard against
// runaway RAM use on multi-GB inputs, NOT a configurable policy — that
// role belongs to the user-controlled `max-file-size` rule, whose
// threshold comes from config.maxFileBytes (CLI: --max-bytes). The two
// limits are deliberately separate:
//
//   - File ≤ configured limit AND ≤ HARD_READ_LIMIT → content-rules run,
//     and (configured/HARD) rules can fire.
//   - File > configured limit AND ≤ HARD_READ_LIMIT → content-rules
//     still run; size rule fires from inside the rule (sees real bytes).
//   - File > HARD_READ_LIMIT → we synthesise a size finding ONLY if the
//     configured threshold says it should fire, then skip content rules.
//     We never invent a size finding the user did not ask for.
const HARD_READ_LIMIT = 5_000_000;

/** Extract the configured max-file-size threshold from the rule set. */
function getConfiguredMaxBytes(rules: LintRule[]): number {
  const sizeRule = rules.find(r => r.id === 'max-file-size');
  if (!sizeRule) return Number.POSITIVE_INFINITY;
  // The rule embeds its threshold inside the description string ("Reject
  // files larger than N bytes..."). Parse it back so this function does
  // not need to know how ruleFileSize was constructed. If parsing fails
  // we fall back to HARD_READ_LIMIT, the conservative default.
  const m = sizeRule.description.match(/larger than (\d+)/);
  if (!m) return HARD_READ_LIMIT;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : HARD_READ_LIMIT;
}

export function lintFile(file: string, rules: LintRule[]): LintFinding[] {
  let s: ReturnType<typeof statSync>;
  try {
    s = statSync(file);
  } catch {
    return [];
  }
  if (!s.isFile()) return [];

  const findings: LintFinding[] = [];
  const configuredMax = getConfiguredMaxBytes(rules);

  // For very large files we cannot safely read the content into a
  // string. But the size rule itself only needs s.size, so we
  // synthesise its finding stat-only, AND we honour the user's
  // configured threshold so `--max-bytes 10000000` does NOT flag a
  // 6MB file just because it is over our internal HARD_READ_LIMIT.
  if (s.size > HARD_READ_LIMIT) {
    const sizeRule = rules.find(r => r.id === 'max-file-size');
    if (sizeRule && s.size > configuredMax) {
      findings.push({
        rule: 'max-file-size',
        severity: sizeRule.defaultSeverity,
        file,
        message: `file is ${s.size} bytes, exceeds limit ${configuredMax}`,
      });
    }
    return findings;
  }

  let content: string;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    return findings;
  }

  for (const rule of rules) {
    if (rule.filePattern && !rule.filePattern.test(file)) continue;
    const raw = rule.check(file, content);
    for (const f of raw) {
      // Severity is always sourced from the rule's defaultSeverity (which
      // may itself have been overridden by config in buildRules), so a
      // hard-coded severity inside check() never escapes the override.
      findings.push({ ...f, severity: rule.defaultSeverity });
    }
  }
  return findings;
}

export function lintFiles(files: string[], config: LintConfig = {}): LintReport {
  const rules = buildRules(config);
  const exclude = config.exclude ?? [];
  const all: LintFinding[] = [];
  let filesWithFindings = 0;
  for (const file of files) {
    if (exclude.some(re => re.test(file))) continue;
    const findings = lintFile(file, rules);
    if (findings.length > 0) filesWithFindings += 1;
    all.push(...findings);
  }
  return {
    totalFiles: files.length,
    filesWithFindings,
    findings: all,
    errorCount: all.filter(f => f.severity === 'error').length,
    warningCount: all.filter(f => f.severity === 'warning').length,
    infoCount: all.filter(f => f.severity === 'info').length,
  };
}

// Convenience for the CLI: turn relative ext into our extname helper.
export function fileExtension(path: string): string {
  return extname(path).toLowerCase();
}
