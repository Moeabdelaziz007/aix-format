// بسم الله الرحمن الرحيم
// @axiom/autofix — the ONLY auto-fix entry point in the Axiom stack.
//
// Design contract (do not violate):
//
//   1. Every transform is deterministic and idempotent (applying it twice
//      yields the same result as applying it once).
//   2. The runner refuses to write files unless --approve <token> is passed.
//      Tokens are produced by the operator via `axiom-autofix mint-token`.
//   3. No git operations. No PR creation. No remote pushes. The tool emits
//      a diff and a branch-name suggestion; humans drive git.
//
// These three rules kill the auto-PR antipattern that TawbahLoop and
// sentinel-autofix introduced.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export interface Fix {
  /** Stable id, mirrors a corresponding lint rule where applicable. */
  id: string;
  description: string;
  /** Returns the new content, or null if nothing to fix. */
  transform: (content: string) => string | null;
}

export interface FixResult {
  file: string;
  fix: string;
  applied: boolean;
  before: string;
  after: string;
  /** Set when --approve was missing; the tool computed the change but did not write. */
  blockedByGate?: true;
}

// --- transforms -----------------------------------------------------------

export const fixEmDash: Fix = {
  id: 'no-em-dash',
  description: 'Replace U+2014 with " - " (space-hyphen-space) preserving surrounding whitespace.',
  transform(content) {
    if (!content.includes('\u2014')) return null;
    // Normalise " — " (with spaces) to " - " in one step, then catch any
    // remaining bare em dashes.
    let next = content.replace(/[ \t]?\u2014[ \t]?/g, ' - ');
    // Collapse the corner case "  -  " into " - ".
    next = next.replace(/ {2,}- {2,}/g, ' - ');
    return next === content ? null : next;
  },
};

export const fixTabInMarkdown: Fix = {
  id: 'no-tab-in-markdown',
  description: 'Replace leading tabs with two spaces in markdown files.',
  transform(content) {
    if (!content.includes('\t')) return null;
    const next = content
      .split('\n')
      .map(line => line.replace(/^\t+/, m => '  '.repeat(m.length)))
      .join('\n');
    return next === content ? null : next;
  },
};

export const fixTrailingWhitespace: Fix = {
  id: 'no-trailing-whitespace',
  description: 'Strip trailing whitespace at end of every line.',
  transform(content) {
    const next = content.split('\n').map(line => line.replace(/[ \t]+$/, '')).join('\n');
    return next === content ? null : next;
  },
};

export const fixFinalNewline: Fix = {
  id: 'final-newline',
  description: 'Ensure file ends with exactly one newline.',
  transform(content) {
    if (content.length === 0) return null;
    const trimmed = content.replace(/\n+$/, '') + '\n';
    return trimmed === content ? null : trimmed;
  },
};

export const DEFAULT_FIXES: Fix[] = [
  fixEmDash,
  fixTabInMarkdown,
  fixTrailingWhitespace,
  fixFinalNewline,
];

// --- approval gate --------------------------------------------------------

/**
 * Tokens are 32-byte random hex strings prefixed with "axfx-". The tool
 * stores the SHA-256 of the most recent minted token in a sidecar file; a
 * valid --approve value must match the recorded SHA. Token files are
 * single-use: applying a fix consumes the file and rotates the SHA.
 */
const TOKEN_PREFIX = 'axfx-';

export function mintApprovalToken(): { token: string; sha: string } {
  const token = TOKEN_PREFIX + randomBytes(32).toString('hex');
  const sha = createHash('sha256').update(token).digest('hex');
  return { token, sha };
}

export function validateApprovalToken(supplied: string, recordedSha: string): boolean {
  if (!supplied || !supplied.startsWith(TOKEN_PREFIX)) return false;
  const sha = createHash('sha256').update(supplied).digest('hex');
  // True constant-time compare via node:crypto.timingSafeEqual. The earlier
  // .every() pattern short-circuited on first mismatch and leaked the
  // matching prefix length through timing, contradicting the design contract.
  // timingSafeEqual requires equal-length inputs, so we length-check first
  // (length itself is not secret: it is a fixed property of the SHA-256
  // hex encoding).
  if (sha.length !== recordedSha.length) return false;
  return timingSafeEqual(Buffer.from(sha), Buffer.from(recordedSha));
}

// --- runner ---------------------------------------------------------------

export interface RunOptions {
  /** When false (default), the tool computes diffs but does NOT write to disk. */
  approved?: boolean;
  fixes?: Fix[];
}

export function applyFixesToFile(filePath: string, opts: RunOptions = {}): FixResult[] {
  if (!existsSync(filePath)) return [];
  const original = readFileSync(filePath, 'utf8');
  const fixes = opts.fixes ?? DEFAULT_FIXES;
  const results: FixResult[] = [];
  let current = original;
  for (const fix of fixes) {
    const next = fix.transform(current);
    if (next === null) continue;
    const result: FixResult = {
      file: filePath,
      fix: fix.id,
      applied: !!opts.approved,
      before: current,
      after: next,
    };
    if (!opts.approved) result.blockedByGate = true;
    results.push(result);
    current = next;
  }
  if (opts.approved && current !== original) {
    writeFileSync(filePath, current, 'utf8');
  }
  return results;
}

export function applyFixesToFiles(files: string[], opts: RunOptions = {}): FixResult[] {
  const out: FixResult[] = [];
  for (const f of files) out.push(...applyFixesToFile(f, opts));
  return out;
}

/** Produce a unified-diff-ish text representation; tiny, no external dep. */
export function summarise(results: FixResult[]): string {
  const lines: string[] = [];
  for (const r of results) {
    const status = r.applied ? 'WROTE' : r.blockedByGate ? 'GATED' : 'NOOP';
    lines.push(`${status.padEnd(6)} ${r.fix.padEnd(24)} ${r.file}`);
  }
  return lines.join('\n');
}
