#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import {
  scanPromptInjection,
  verifyABOMIntegrity,
  auditIdentity,
  calculateTrustTier
} from './src/scanner.js';

// ANSI Colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const [,, command, targetPath] = process.argv;

if (command !== 'scan' || !targetPath) {
  console.log(`${colors.bright}AIX Detective v1.0.0${colors.reset}`);
  console.log(`Usage: npx aix-detective scan <path-to-aix-or-skill-md>`);
  process.exit(1);
}

async function run() {
  console.log(`${colors.cyan}🔍 Auditing AI Agent: ${path.basename(targetPath)}...${colors.reset}\n`);

  try {
    const content = fs.readFileSync(targetPath, 'utf8');
    let data;

    if (targetPath.endsWith('.md')) {
      // Very basic markdown extraction if it's a SKILL.md
      // In a real scenario, we'd use a markdown parser
      data = { persona: { instructions: content } };
    } else {
      data = yaml.load(content);
    }

    // 1. ABOM Integrity
    const abomAudit = verifyABOMIntegrity(data.abom);

    // 2. Identity & KYC
    const idAudit = auditIdentity(data.identity_layer);

    // 3. Prompt Injection
    const instructions = data.persona?.instructions || "";
    const injections = scanPromptInjection(instructions);

    // 4. Final Trust Tier
    const trustTier = calculateTrustTier({
      injectionCount: injections.length,
      abomValid: abomAudit.valid,
      identityStatus: idAudit.status
    });

    // Output Report
    console.log(`${colors.bright}--- Audit Report ---${colors.reset}`);

    // ABOM Status
    if (abomAudit.valid) {
      console.log(`${colors.green}✅ ABOM Integrity: PASSED${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ ABOM Integrity: FAILED${colors.reset}`);
      abomAudit.errors.forEach(err => console.log(`   - ${err}`));
    }

    // Identity Status
    const idColor = idAudit.verified ? colors.green : colors.yellow;
    console.log(`${idColor}🆔 Identity Layer: ${idAudit.status.toUpperCase()} (Tier ${idAudit.tier})${colors.reset}`);

    // Security Status
    if (injections.length === 0) {
      console.log(`${colors.green}🛡️ Security: No malicious patterns detected.${colors.reset}`);
    } else {
      console.log(`${colors.red}⚠️ Security: ${injections.length} potential injection patterns found!${colors.reset}`);
      injections.forEach(inj => console.log(`   - [${inj.severity.toUpperCase()}] ${inj.name}`));
    }

    console.log(`\n${colors.bright}Trust Decision: ${getTrustBanner(trustTier)}${colors.reset}`);

  } catch (err) {
    console.error(`${colors.red}Error reading or parsing file: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

function getTrustBanner(tier) {
  switch (tier) {
    case 'trusted': return `${colors.green}TRUSTED (Axiom Sovereign)${colors.reset}`;
    case 'caution': return `${colors.yellow}CAUTION (Unverified/Incomplete)${colors.reset}`;
    case 'malicious': return `${colors.red}MALICIOUS (High Risk)${colors.reset}`;
    default: return 'UNKNOWN';
  }
}

run();
