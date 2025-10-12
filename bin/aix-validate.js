#!/usr/bin/env node

/**
 * AIX Validation Tool
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2025
 * 
 * Command-line tool for validating AIX files.
 * Checks structure, format, and security (checksums and signatures).
 * 
 * Usage: aix-validate <file.aix> [--verbose] [--security]
 * 
 * Copyright © 2025 Mohamed Abdelaziz / AMRIKYY AI Solutions
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
  --json             Output results in JSON format
  --help, -h         Show this help message

Examples:
  aix-validate my-agent.aix
  aix-validate examples/persona-agent.aix --verbose
  aix-validate agent.aix --security --json

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
  const agent = parser.parseFile(resolvedPath);
  
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
        created: agent.meta.created
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
      
      if (agent.apis.length > 0) {
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
      
      if (checkSecurity && agent.security) {
        console.log('\n   Security:');
        console.log(`     - Checksum: ${agent.security.checksum.algorithm}`);
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
    }
    
    if (agent.warnings.length > 0) {
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
    console.log(`   Error: ${error.message}`);
    
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
    
    if (verbose && parser.warnings.length > 0) {
      console.log(`   ${parser.warnings.length} warning(s):\n`);
      parser.warnings.forEach((w, index) => {
        console.log(`   ${index + 1}. [${w.code}] ${w.message}`);
        if (w.section) console.log(`      Section: ${w.section}`);
        console.log('');
      });
    }
  }
  
  process.exit(1);
}

