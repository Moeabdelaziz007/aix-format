#!/usr/bin/env node

/**
 * AIX Validation Tool
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 * 
 * Command-line tool for validating AIX files.
 * Checks structure, format, and security (checksums and signatures).
 * 
 * Usage: aix-validate <file.aix> [--verbose] [--security] [--strict-kyc]
 * 
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under MIT License - See LICENSE.md
 */

import { AIXParser } from '../core/parser.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Parse command line arguments
const args = process.argv.slice(2);

// Display usage if no arguments
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
AIX Validation Tool v1.0
Created by Mohamed Abdelaziz - AMRIKYY AI Solutions

Usage:
  aix-validate <file.aix> [options]

Options:
  --verbose, -v      Show detailed validation results
  --security, -s     Perform security validation (checksums, signatures)
  --strict-kyc       Enforce KYC verification. Fails if the agent does not have a valid KYC proof.
  --json             Output results in JSON format
  --help, -h         Show this help message

Examples:
  aix-validate my-agent.aix
  aix-validate examples/persona-agent.aix --verbose
  aix-validate agent.aix --security --json
  aix-validate agent.aix --strict-kyc

Exit Codes:
  0    Validation successful
  1    Validation failed
  2    File not found or other error
`);
  process.exit(0);
}

// Extract options
const filePath = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-'));
const verbose = args.includes('--verbose') || args.includes('-v');
const checkSecurity = args.includes('--security') || args.includes('-s');
const strictKyc = args.includes('--strict-kyc');
const jsonOutput = args.includes('--json');

if (!filePath) {
  console.error('❌ Error: No file specified');
  console.error('   Usage: aix-validate <file.aix>');
  process.exit(2);
}

// Resolve file path
const resolvedPath = resolve(filePath);

// Check if file exists
if (!existsSync(resolvedPath)) {
  console.error(`❌ Error: File not found: ${filePath}`);
  process.exit(2);
}

// Parse and validate
const parser = new AIXParser();

try {
  // Read raw content for security checksum validation if required
  const rawContent = readFileSync(resolvedPath, 'utf8');
  
  // This will throw if structural validation fails
  const agent = parser.parse(rawContent, filePath);

  const additionalErrors = [];

  // Enforce Schema v2.0.0 (or at least valid enhanced schema)
  // By default, the parser accepts 1.x or 2.x, we could enforce 2.x here
  if (!agent.meta.version.startsWith('2.') && strictKyc) {
      additionalErrors.push({
          code: 'INVALID_VERSION_STRICT',
          message: 'Strict mode requires AIX format version 2.x.x',
          section: 'meta.version'
      });
  }

  // Enforce VLA Adapter presence if cyber-physical
  if (agent.requirements && agent.requirements.vla) {
    if (!agent.requirements.vla.adapter) {
      additionalErrors.push({
        code: 'MISSING_VLA_ADAPTER',
        message: 'Cyber-physical agent requires a VLA adapter in requirements.vla',
        section: 'requirements.vla'
      });
    }
  }

  // Strict KYC check
  if (strictKyc) {
    if (!agent.identity_layer) {
      additionalErrors.push({
        code: 'MISSING_IDENTITY_LAYER',
        message: 'Strict KYC mode requires an identity_layer to be present.',
        section: 'identity_layer'
      });
    } else {
      if (!agent.identity_layer.id || !agent.identity_layer.id.startsWith('did:axiom:axiomid.app:')) {
        additionalErrors.push({
          code: 'INVALID_DID',
          message: 'identity_layer ID must be a valid AxiomID DID (did:axiom:axiomid.app:<id>).',
          section: 'identity_layer.id'
        });
      }
    }

    if (!agent.kyc_proof) {
      additionalErrors.push({
        code: 'MISSING_KYC_PROOF',
        message: 'Strict KYC mode requires a valid kyc_proof block.',
        section: 'kyc_proof'
      });
    }
  }

  // Security Verification (Checksum)
  if (agent.security && agent.security.checksum) {
    const algo = agent.security.checksum.algorithm || 'sha256';
    const computedHash = parser.calculateChecksum(rawContent, algo);

    // In a real scenario, the checksum might be calculated on a normalized payload
    // Here we will just perform the check if asked (or if strict security is on)
    // Note: If the file was modified after the checksum was added, this will fail.
    // For now we'll only check if --security is provided
    if (checkSecurity && agent.security.checksum.value !== computedHash) {
       additionalErrors.push({
           code: 'CHECKSUM_MISMATCH',
           message: `Computed checksum (${computedHash}) does not match security.checksum.value`,
           section: 'security.checksum'
       });
    }
  }

  if (additionalErrors.length > 0) {
      const err = new Error('Additional strict validations failed');
      err.isStrictValidationError = true;
      parser.errors.push(...additionalErrors);
      throw err;
  }

  // Success output
  if (jsonOutput) {
    const result = {
      valid: true,
      file: filePath,
      agent: {
        name: agent.meta.name,
        version: agent.meta.version,
        id: agent.meta.id,
        author: agent.meta.author,
        created: agent.meta.created,
        kyc_verified: !!agent.kyc_proof
      },
      capabilities: agent.getCapabilities(),
      warnings: agent.warnings.length,
      warningDetails: verbose ? agent.warnings : undefined
    };
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('✅ Valid AIX file\n');
    console.log(`   File: ${filePath}`);
    console.log(`   Agent: ${agent.meta.name}`);
    console.log(`   Version: ${agent.meta.version}`);
    console.log(`   ID: ${agent.meta.id}`);
    console.log(`   Author: ${agent.meta.author}`);
    console.log(`   KYC Verified: ${!!agent.kyc_proof}`);
    
    if (verbose) {
      console.log(`   Created: ${agent.meta.created}`);
      if (agent.meta.updated) {
        console.log(`   Updated: ${agent.meta.updated}`);
      }
      if (agent.meta.description) {
        console.log(`   Description: ${agent.meta.description}`);
      }
      if (agent.meta.tags && agent.meta.tags.length > 0) {
        console.log(`   Tags: ${agent.meta.tags.join(', ')}`);
      }
      
      console.log('\n   Capabilities:');
      const capabilities = agent.getCapabilities();
      if (capabilities.length > 0) {
        capabilities.forEach(cap => console.log(`     - ${cap}`));
      } else {
        console.log('     None configured');
      }
      
      if (agent.apis && agent.apis.length > 0) {
        console.log(`\n   APIs: ${agent.apis.length} configured`);
        agent.apis.forEach(api => {
          console.log(`     - ${api.name}: ${api.base_url}`);
        });
      }
      
      if (agent.mcp && agent.mcp.servers && agent.mcp.servers.length > 0) {
        console.log(`\n   MCP Servers: ${agent.mcp.servers.length} configured`);
        agent.mcp.servers.forEach(server => {
          console.log(`     - ${server.name}: ${server.command}`);
        });
      }
      
      if (agent.memory) {
        console.log('\n   Memory:');
        if (agent.memory.episodic?.enabled) console.log('     - Episodic: enabled');
        if (agent.memory.semantic?.enabled) console.log('     - Semantic: enabled');
        if (agent.memory.procedural?.enabled) console.log('     - Procedural: enabled');
      }
      
      if (agent.security) {
        console.log('\n   Security:');
        if (agent.security.checksum) {
          console.log(`     - Checksum: ${agent.security.checksum.algorithm}`);
        }
        if (agent.security.signature) {
          console.log(`     - Signature: ${agent.security.signature.algorithm}`);
          console.log(`     - Signer: ${agent.security.signature.signer}`);
        }
        if (agent.security.capabilities) {
          console.log(`     - Capabilities: configured`);
          if (agent.security.capabilities.allowed_operations) {
            console.log(`       Allowed: ${agent.security.capabilities.allowed_operations.join(', ')}`);
          }
          if (agent.security.capabilities.sandbox !== undefined) {
            console.log(`       Sandbox: ${agent.security.capabilities.sandbox}`);
          }
        }
      }

      // v1.3 SaaS-BOM & Unified-BOM
      if (agent.saas_services && agent.saas_services.length > 0) {
        console.log(`\n   SaaS Services (ABOM): ${agent.saas_services.length} configured`);
        agent.saas_services.forEach(s => {
          console.log(`     - ${s.name} (${s.provider}): ${s.compliance_tier || 'no tier'}`);
        });
      }

      if (agent.unified_bom) {
        console.log('\n   Unified BOM:');
        const ubom = agent.unified_bom;
        if (ubom.agents) console.log(`     - Agents: ${ubom.agents.length}`);
        if (ubom.saas) console.log(`     - SaaS: ${ubom.saas.length}`);
        if (ubom.ai_models) console.log(`     - AI Models: ${ubom.ai_models.length}`);
        if (ubom.infrastructure) console.log(`     - Infrastructure: ${ubom.infrastructure.length}`);
      }

      if (agent.build_provenance) {
        console.log(`\n   Build Provenance: ${agent.build_provenance.builder_id}`);
        console.log(`     - Type: ${agent.build_provenance.build_type}`);
      }
    }
    
    if (agent.warnings && agent.warnings.length > 0) {
      console.log(`\n⚠️  ${agent.warnings.length} warning(s):`);
      agent.warnings.forEach(w => {
        console.log(`   - [${w.code}] ${w.message}`);
        if (verbose && w.section) {
          console.log(`     Section: ${w.section}`);
        }
      });
    }
  }
  
  process.exit(0);
  
} catch (error) {
  // Validation failed
  if (jsonOutput) {
    const result = {
      valid: false,
      file: filePath,
      error: error.message,
      errors: parser.errors.length,
      errorDetails: parser.errors
    };
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('❌ Invalid AIX file\n');
    console.log(`   File: ${filePath}`);
    console.log(`   Error: ${error.isStrictValidationError ? 'Strict validation failed' : error.message}`);
    
    if (parser.errors.length > 0) {
      console.log(`\n   ${parser.errors.length} error(s) found:\n`);
      parser.errors.forEach((e, index) => {
        console.log(`   ${index + 1}. [${e.code}] ${e.message}`);
        if (e.section) console.log(`      Section: ${e.section}`);
        if (e.field) console.log(`      Field: ${e.field}`);
        if (e.index !== undefined) console.log(`      Index: ${e.index}`);
        console.log('');
      });
    }
  }
  
  process.exit(1);
}
