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
import { logger, style } from './src/logger.js';

const [,, command, targetPath] = process.argv;

if (command !== 'scan' || !targetPath) {
  logger.header(`AIX Detective v1.0.0`);
  logger.info(`Usage: npx aix-detective scan <path-to-aix-or-skill-md>`);
  process.exit(1);
}

async function run() {
  logger.cyan(`🔍 Auditing AI Agent: ${path.basename(targetPath)}...\n`);

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

    // 3. Prompt Injection (Expanded to cover Persona, Skills, APIs, and MCP)
    const injections = [];
    
    // Scan Persona Instructions
    if (data.persona?.instructions) {
      injections.push(...scanPromptInjection(data.persona.instructions).map(inj => ({ ...inj, source: 'Persona Instructions' })));
    }

    // Scan Skills
    if (data.skills) {
      data.skills.forEach((skill, idx) => {
        const source = `Skill [${idx}: ${skill.name || 'unnamed'}]`;
        injections.push(...scanPromptInjection(skill.description).map(inj => ({ ...inj, source })));
        injections.push(...scanPromptInjection(skill.instructions).map(inj => ({ ...inj, source })));
      });
    }

    // Scan APIs
    if (data.apis) {
      data.apis.forEach((api, idx) => {
        const source = `API [${idx}: ${api.name || 'unnamed'}]`;
        injections.push(...scanPromptInjection(api.description).map(inj => ({ ...inj, source })));
      });
    }

    // Scan MCP Servers & Tools
    if (data.mcp) {
      data.mcp.forEach((server, idx) => {
        const sourceBase = `MCP Server [${idx}: ${server.name || 'unnamed'}]`;
        if (server.tools) {
          server.tools.forEach((tool, tIdx) => {
            const source = `${sourceBase} Tool [${tIdx}: ${tool.name || 'unnamed'}]`;
            injections.push(...scanPromptInjection(tool.description).map(inj => ({ ...inj, source })));
          });
        }
      });
    }

    // 4. Final Trust Tier
    const trustTier = calculateTrustTier({
      injectionCount: injections.length,
      abomValid: abomAudit.valid,
      identityStatus: idAudit.status
    });

    // Output Report
    logger.header(`--- Audit Report ---`);
    
    // ABOM Status
    if (abomAudit.valid) {
      logger.success(`✅ ABOM Integrity: PASSED`);
    } else {
      logger.error(`❌ ABOM Integrity: FAILED`);
      abomAudit.errors.forEach(err => logger.info(`   - ${err}`));
    }

    // Identity Status
    if (idAudit.verified) {
      logger.success(`🆔 Identity Layer: ${idAudit.status.toUpperCase()} (Tier ${idAudit.tier})`);
    } else {
      logger.warn(`🆔 Identity Layer: ${idAudit.status.toUpperCase()} (Tier ${idAudit.tier})`);
    }

    // Security Status
    if (injections.length === 0) {
      logger.success(`🛡️ Security: No malicious patterns detected.`);
    } else {
      logger.error(`⚠️ Security: ${injections.length} potential injection patterns found!`);
      injections.forEach(inj => logger.info(`   - [${inj.severity.toUpperCase()}] ${inj.name} (Source: ${inj.source})`));
    }

    logger.header(`\nTrust Decision: ${getTrustBanner(trustTier)}`);

  } catch (err) {
    logger.fatal(`Error reading or parsing file: ${err.message}`);
    process.exit(1);
  }
}

function getTrustBanner(tier) {
  switch (tier) {
    case 'trusted': return style.green(`TRUSTED (Axiom Sovereign)`);
    case 'caution': return style.yellow(`CAUTION (Unverified/Incomplete)`);
    case 'malicious': return style.red(`MALICIOUS (High Risk)`);
    default: return 'UNKNOWN';
  }
}

run();
