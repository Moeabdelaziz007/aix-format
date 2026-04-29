#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { signManifest, signBuildProvenance } from '../core/src/security/signature.js';

function detectFormat(content, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return 'json';
  if (ext === '.yaml' || ext === '.yml') return 'yaml';
  return content.trim().startsWith('{') ? 'json' : 'yaml';
}

function parseAix(content, format) {
  return format === 'json' ? JSON.parse(content) : yaml.load(content, { schema: yaml.JSON_SCHEMA });
}


const args = process.argv.slice(2);
const inputPath = args[0];

const getArg = (flag) => {
  const idx = args.findIndex(a => a === flag);
  return idx !== -1 ? args[idx + 1] : null;
};
const hasArg = (flag) => args.includes(flag);

const privateKeyPath = getArg('--private-key');
const kid = getArg('--kid') || 'local-ed25519';

const addProvenance = hasArg('--provenance');
const sourceCommit = getArg('--commit') || '';
const sourceRepo = getArg('--repo') || '';
const builder = getArg('--builder') || 'local';

if (!inputPath || !privateKeyPath) {
  console.error('Usage: node scripts/agent-sign.js <manifest.aix> --private-key <ed25519-private.pem> [--kid <key-id>] [--provenance --commit <SHA> --repo <URL> --builder <name>]');
  process.exit(1);
}


try {
  const resolvedInput = path.resolve(inputPath);
  const raw = fs.readFileSync(resolvedInput, 'utf8');
  const format = detectFormat(raw, resolvedInput);
  const manifest = parseAix(raw, format);
  manifest.security = manifest.security && typeof manifest.security === 'object' ? manifest.security : {};


  const privateKeyPem = fs.readFileSync(path.resolve(privateKeyPath), 'utf8');

  if (addProvenance) {
    const buildTimestamp = new Date().toISOString();
    const provenanceData = {
      builder: builder,
      source_commit: sourceCommit,
      source_repo: sourceRepo,
      build_timestamp: buildTimestamp
    };

    const builderSig = signBuildProvenance(provenanceData, privateKeyPem);

    manifest.build_provenance = {
      ...provenanceData,
      builder_signature: builderSig,
      slsa_level: 2
    };
  }

  const result = signManifest(manifest, privateKeyPem, kid);


  manifest.security.checksum = { algorithm: 'sha256', value: result.checksum };
  manifest.security.signature = result.signature;

  const output = format === 'json'
    ? `${JSON.stringify(manifest, null, 2)}\n`
    : yaml.dump(manifest, { sortKeys: true, noRefs: true, lineWidth: 120 });

  fs.writeFileSync(resolvedInput, output, 'utf8');
  console.log(`✅ signed: ${resolvedInput}`);
  console.log(`checksum=${result.checksum}`);
  console.log(`signature_b64=${result.signature.value}`);
  console.log(`canonical_bytes=${Buffer.byteLength(result.canonicalString, 'utf8')}`);
} catch (error) {
  console.error(`❌ signing failed: ${error.message}`);
  process.exit(1);
}
