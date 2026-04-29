#!/usr/bin/env node
/**
 * abom-check.js — AI-SBOM compatible ABOM validator for AIX manifests
 * 
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 * Part of the AIX Format project (https://github.com/Moeabdelaziz007/aix-format)
 *
 * Usage:
 *   node scripts/abom-check.js <path-to-file.aix>
 *   node scripts/abom-check.js examples/*.aix
 *
 * Exit codes:
 *   0 — all constituents clean
 *   1 — one or more hard errors (revoked, invalid fields, etc.)
 *   2 — warnings only (unverified, vulnerable, missing hash)
 */

import fs from 'fs';
import path from 'path';
import { AIXParser } from '../core/parser.js';

const RESET  = '\x1b[0m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN  = '\x1b[32m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';

function banner(text, color = BOLD) {
  console.log(`\n${color}${text}${RESET}`);
}

function checkFile(filePath) {
  const abs = path.resolve(filePath);
  banner(`── ${abs}`, BOLD);

  let agent;
  try {
    const parser = new AIXParser();
    agent = parser.parseFile(abs);
  } catch (err) {
    // Surface ABOM-specific errors embedded in validation failure
    if (err.errors) {
      const abomErrors = err.errors.filter(e => e.section && e.section.startsWith('abom'));
      const otherErrors = err.errors.filter(e => !e.section || !e.section.startsWith('abom'));

      if (abomErrors.length > 0) {
        banner('  ABOM Errors:', RED);
        for (const e of abomErrors) {
          console.log(`  ${RED}✖ [${e.code}]${RESET} ${e.message}`);
        }
      }
      if (otherErrors.length > 0) {
        banner('  Other Parse/Validation Errors:', DIM);
        for (const e of otherErrors) {
          console.log(`  ${DIM}✖ [${e.code}]${RESET} ${e.message}`);
        }
      }
      return { errors: err.errors.length, warnings: 0 };
    }
    console.error(`  ${RED}✖ Failed to parse: ${err.message}${RESET}`);
    return { errors: 1, warnings: 0 };
  }

  // Filter ABOM-specific warnings from parser
  const abomWarnings = agent.warnings.filter(w => w.section && w.section.startsWith('abom'));
  const summary = agent.abomSummary();

  // Print summary table
  banner('  AI-SBOM Summary:', BOLD);
  console.log(`  Total constituents : ${summary.total}`);
  console.log(`  ${GREEN}Verified           : ${summary.verified}${RESET}`);
  console.log(`  ${DIM}Community          : ${summary.community}${RESET}`);
  console.log(`  ${YELLOW}Unverified         : ${summary.unverified}${RESET}`);
  console.log(`  ${RED}Revoked            : ${summary.revoked}${RESET}`);
  console.log(`  ${YELLOW}Vulnerable         : ${summary.vulnerable}${RESET}`);
  console.log(`  ${YELLOW}Missing hash       : ${summary.missing_hash}${RESET}`);

  if (abomWarnings.length > 0) {
    banner('  ABOM Warnings:', YELLOW);
    for (const w of abomWarnings) {
      console.log(`  ${YELLOW}⚠ [${w.code}]${RESET} ${w.message}`);
    }
  }

  const hasHardErrors = summary.revoked > 0;
  const hasWarnings   = abomWarnings.length > 0;

  if (!hasHardErrors && !hasWarnings) {
    console.log(`  ${GREEN}✔ ABOM is clean${RESET}`);
  }

  return {
    errors:   hasHardErrors ? summary.revoked : 0,
    warnings: abomWarnings.length
  };
}

// ─── CLI entry point ─────────────────────────────────────────────────────────
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));

if (args.length === 0) {
  console.error(`${RED}Usage: node scripts/abom-check.js <file.aix> [file2.aix ...]${RESET}`);
  process.exit(1);
}

let totalErrors   = 0;
let totalWarnings = 0;

for (const arg of args) {
  const result = checkFile(arg);
  totalErrors   += result.errors;
  totalWarnings += result.warnings;
}

console.log('');
if (totalErrors > 0) {
  console.log(`${RED}${BOLD}ABOM check FAILED — ${totalErrors} error(s), ${totalWarnings} warning(s)${RESET}`);
  process.exit(1);
} else if (totalWarnings > 0) {
  console.log(`${YELLOW}${BOLD}ABOM check passed with ${totalWarnings} warning(s)${RESET}`);
  process.exit(2);
} else {
  console.log(`${GREEN}${BOLD}ABOM check passed — all constituents clean${RESET}`);
  process.exit(0);
}
