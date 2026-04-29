#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import yaml from 'js-yaml';

function detectFormat(content, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return 'json';
  if (ext === '.yaml' || ext === '.yml') return 'yaml';
  const trimmed = content.trim();
  return trimmed.startsWith('{') ? 'json' : 'yaml';
}

function parseAix(content, format) {
  return format === 'json' ? JSON.parse(content) : yaml.load(content, { schema: yaml.JSON_SCHEMA });
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

function signAgent(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const format = detectFormat(raw, filePath);
  const parsed = parseAix(raw, format);
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid AIX payload: expected object root');

  const next = structuredClone(parsed);
  next.security = (next.security && typeof next.security === 'object') ? next.security : {};
  delete next.security.checksum;
  delete next.security.signature;

  const digest = crypto.createHash('sha256').update(stableStringify(next), 'utf8').digest('hex');
  next.security.checksum = { algorithm: 'sha256', value: digest };

  const output = format === 'json'
    ? `${JSON.stringify(next, null, 2)}\n`
    : yaml.dump(next, { sortKeys: true, lineWidth: 120, noRefs: true });

  fs.writeFileSync(filePath, output, 'utf8');
  return digest;
}

const [, , inputPath] = process.argv;
if (!inputPath) {
  console.error('Usage: node scripts/agent-sign.js <file.aix|file.json|file.yaml|file.yml>');
  process.exit(1);
}

try {
  console.log(`✅ checksum updated: ${signAgent(path.resolve(inputPath))}`);
} catch (error) {
  console.error(`❌ signing failed: ${error.message}`);
  process.exit(1);
}
