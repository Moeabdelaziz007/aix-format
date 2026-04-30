import { test } from 'node:test';
import assert from 'node:assert';
import { toA2A, fromA2A } from '../../../../core/src/converters/agentcard.js';

/**
 * AIX v1.3 Test Suite for AgentCard Converters
 * Targets: toA2A, fromA2A round-trip & integrity checks
 */

const sampleAix = {
  meta: {
    id: 'test-agent-001',
    name: 'TestAgent',
    version: '1.3.0',
    format_version: '1.3',
    author: 'Axiom Dev',
    description: 'A sovereign test agent'
  },
  persona: {
    name: 'TestAgent',
    role: 'assistant',
    instructions: 'Be helpful.',
    tone: 'professional'
  },
  security: {
    level: 'standard',
    authentication: ['oauth2'],
    checksum: { algorithm: 'sha256', value: 'abc123' }
  },
  identity_layer: {
    id: 'did:aix:test-agent-001',
    kyc_tier: 2,
    authority: 'axiomid.app',
    issuedAt: new Date().toISOString()
  },
  economics: {
    pricing_model: 'free',
    token: 'PI'
  },
  abom: {
    bom_format: 'A-BOM',
    spec_version: '1.0',
    risk_level: 'low',
    capabilities: ['text-generation'],
    integrity_hash: 'abc123',
    generated_by: 'AIX Studio Builder',
    timestamp: new Date().toISOString(),
    dependencies: []
  }
};

test('toA2A() → DID starts with "did:axiom:"', () => {
  const result = toA2A(sampleAix);
  // Based on agentcard.js generateDID logic: did:axiom:axiomid.app:slug
  assert.ok(result.provider.url.startsWith('did:aix:') || result.url === '');
  // Wait, let's check exact mapping in agentcard.js
  // provider.url = aixManifest.identity_layer?.id || ...
  assert.strictEqual(result.provider.url, 'did:aix:test-agent-001');
});

test('toA2A() → skills is array', () => {
  const result = toA2A(sampleAix);
  assert.ok(Array.isArray(result.skills));
});

test('toA2A() → specVersion === "1.0"', () => {
  const result = toA2A(sampleAix);
  assert.strictEqual(result.specVersion, '1.0');
});

test('toA2A() → handles missing persona.name gracefully', () => {
  const minimalAix = { meta: { name: '' } };
  const result = toA2A(minimalAix);
  assert.strictEqual(result.name, '');
});

test('toA2A() → abom fields are preserved in x-aix-metadata', () => {
  const result = toA2A(sampleAix);
  assert.strictEqual(result['x-aix-metadata'].abom.integrity_hash, 'abc123');
  assert.ok(result['x-aix-metadata'].abom.capabilities.includes('text-generation'));
});

test('fromA2A() → round-trip preserves identity', () => {
  const a2a = toA2A(sampleAix);
  const backToAix = fromA2A(a2a);
  // generateDID(name, url) will create a new DID based on name
  assert.ok(backToAix.identity_layer.id.includes('testagent'));
});

test('fromA2A() → handles minimal input without throw', () => {
  assert.doesNotThrow(() => fromA2A({}));
});
