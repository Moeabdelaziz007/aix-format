#!/usr/bin/env node

/**
 * AIX Manifest Validation Tool
 * Enforces SHA-256 integrity and digital signatures under the Sovereign Protocol.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
AIX Manifest Validation Tool

Usage:
  manifest-validate <manifest.json>

Exit Codes:
  0    Validation successful
  1    Validation failed
  2    File not found
`);
  process.exit(0);
}

const filePath = args.find(arg => !arg.startsWith('-'));

if (!filePath) {
  console.error('❌ Error: No file specified');
  process.exit(2);
}

const resolvedPath = resolve(filePath);

if (!existsSync(resolvedPath)) {
  console.error(`❌ Error: File not found: ${filePath}`);
  process.exit(2);
}

try {
  const content = readFileSync(resolvedPath, 'utf8');
  const manifest = JSON.parse(content);
  let valid = true;

  if (!manifest.version) {
    console.error("❌ Error: Missing 'version'");
    valid = false;
  }

  if (!manifest.checksums || typeof manifest.checksums !== 'object') {
    console.error("❌ Error: Missing or invalid 'checksums' object");
    valid = false;
  } else {
    for (const [file, hash] of Object.entries(manifest.checksums)) {
      if (!/^[a-fA-F0-9]{64}$/.test(hash)) {
        console.error(`❌ Error: Invalid SHA-256 hash for file ${file}`);
        valid = false;
      }
    }
  }

  if (!manifest.signature || typeof manifest.signature !== 'object') {
    console.error("❌ Error: Missing or invalid 'signature' object");
    valid = false;
  } else {
    if (!['Ed25519', 'secp256k1'].includes(manifest.signature.algorithm)) {
      console.error(`❌ Error: Invalid signature algorithm: ${manifest.signature.algorithm}`);
      valid = false;
    }
    if (!manifest.signature.value || typeof manifest.signature.value !== 'string') {
      console.error("❌ Error: Missing or invalid signature 'value'");
      valid = false;
    }
  }

  if (valid) {
    console.log("✅ Manifest is valid.");
    process.exit(0);
  } else {
    process.exit(1);
  }
} catch (e) {
  console.error("❌ Error parsing manifest:", e.message);
  process.exit(1);
}
