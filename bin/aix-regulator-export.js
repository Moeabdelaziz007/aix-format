#!/usr/bin/env node

/**
 * AIX Regulator Export Tool
 * Export signed traces, ABOM, and Manifest to a verifiable "Regulator Package".
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import yaml from 'js-yaml';
import { verifyLogEntry } from '../core/src/security/blackbox.js';

const args = process.argv.slice(2);
const inputPath = args[0];
const outPath = args[1];
const pubKeyArgIndex = args.findIndex((a) => a === '--public-key');
const publicKeyPath = pubKeyArgIndex !== -1 ? args[pubKeyArgIndex + 1] : null;

if (!inputPath || !outPath || !publicKeyPath) {
  console.error('Usage: node bin/aix-regulator-export.js <manifest.aix> <output.json> --public-key <ed25519-public.pem>');
  process.exit(1);
}

try {
  const resolvedInput = path.resolve(inputPath);
  const raw = fs.readFileSync(resolvedInput, 'utf8');

  const ext = path.extname(resolvedInput).toLowerCase();
  const isYaml = ext === '.yaml' || ext === '.yml' || (!raw.trim().startsWith('{'));

  const manifest = isYaml ? yaml.load(raw, { schema: yaml.JSON_SCHEMA }) : JSON.parse(raw);
  const publicKeyPem = fs.readFileSync(path.resolve(publicKeyPath), 'utf8');

  const traces = manifest.black_box?.traces || [];

  if (traces.length === 0) {
      console.warn("⚠️ No black box traces found in manifest.");
  }

  const invalidTraces = [];
  traces.forEach((trace, idx) => {
    if (!verifyLogEntry(trace, publicKeyPem)) {
      invalidTraces.push(idx);
    }
  });

  if (invalidTraces.length > 0) {
     console.error(`❌ Regulator Export Failed! Found ${invalidTraces.length} invalid/tampered traces at indices: ${invalidTraces.join(', ')}`);
     process.exit(1);
  }

  const regulatorPackage = {
    meta: manifest.meta,
    identity: manifest.identity_layer,
    abom: manifest.abom,
    black_box_logs: traces,
    export_timestamp: new Date().toISOString(),
    verification_status: "VERIFIED_VALID"
  };

  fs.writeFileSync(path.resolve(outPath), JSON.stringify(regulatorPackage, null, 2));
  console.log(`✅ Regulator package securely exported to: ${outPath}`);
  console.log(`Verified Traces: ${traces.length}`);

} catch (err) {
  console.error(`❌ Export failed: ${err.message}`);
  process.exit(1);
}
