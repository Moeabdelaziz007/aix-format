/**
 * Agent Card Converter Test Suite
 * Created by Jules (AIX UI/UX Architect)
 *
 * Test suite for the agent card converter utility functions.
 *
 * Usage: node --test tests/agentcard.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateDID, fromA2A, toA2A } from '../core/src/converters/agentcard.js';

describe('AgentCard Converter - generateDID', () => {
  it('should generate a valid DID slug from a normal name', () => {
    const result = generateDID('My Agent');
    assert.strictEqual(result, 'did:axiom:axiomid.app:my-agent');
  });

  it('should lowercase the name in the DID slug', () => {
    const result = generateDID('UPPERCASE');
    assert.strictEqual(result, 'did:axiom:axiomid.app:uppercase');
  });

  it('should trim leading and trailing whitespace', () => {
    const result = generateDID('  trimmed agent  ');
    assert.strictEqual(result, 'did:axiom:axiomid.app:trimmed-agent');
  });

  it('should replace multiple spaces with a single hyphen', () => {
    const result = generateDID('Agent    With    Spaces');
    assert.strictEqual(result, 'did:axiom:axiomid.app:agent-with-spaces');
  });

  it('should remove special characters but keep hyphens and alphanumeric', () => {
    const result = generateDID('Agent #007! (Top Secret)');
    assert.strictEqual(result, 'did:axiom:axiomid.app:agent-007-top-secret');
  });

  it('should handle alphanumeric names correctly', () => {
    const result = generateDID('AgentX-2026');
    assert.strictEqual(result, 'did:axiom:axiomid.app:agentx-2026');
  });

  it('should default to "agent" if name is missing or empty', () => {
    assert.strictEqual(generateDID(), 'did:axiom:axiomid.app:agent');
    assert.strictEqual(generateDID(null), 'did:axiom:axiomid.app:agent');
    assert.strictEqual(generateDID(''), 'did:axiom:axiomid.app:agent');
  });

  it('should handle names with only special characters', () => {
    const result = generateDID('!!!');
    assert.strictEqual(result, 'did:axiom:axiomid.app:');
  });
});

describe('AgentCard Converter - fromA2A', () => {
  it('should convert a full A2A AgentCard to AIX Manifest', () => {
    const a2aCard = {
      id: 'agent-001',
      name: 'Test Agent',
      description: 'A helpful assistant',
      version: '2.0.0',
      provider: { name: 'Axiom Corp' },
      url: 'https://api.axiom.app/v1',
      tags: ['test', 'helper'],
      skills: ['chat', 'search'],
      capabilities: {
        streaming: true,
        pushNotifications: true,
        stateTransitionHistory: false,
        voiceInteraction: true
      },
      authenticationSchemes: [{ scheme: 'apiKey' }]
    };

    const result = fromA2A(a2aCard);

    assert.strictEqual(result.meta.id, 'agent-001');
    assert.strictEqual(result.meta.name, 'Test Agent');
    assert.strictEqual(result.meta.version, '2.0.0');
    assert.strictEqual(result.meta.author, 'Axiom Corp');
    assert.deepStrictEqual(result.meta.tags, ['test', 'helper']);
    assert.strictEqual(result.distribution.endpoint, 'https://api.axiom.app/v1');
    assert.deepStrictEqual(result.skills, ['chat', 'search']);
    assert.strictEqual(result.capabilities.streaming, true);
    assert.strictEqual(result.capabilities.push_notifications, true);
    assert.strictEqual(result.capabilities.state_history, false);
    assert.strictEqual(result.capabilities.voice_interaction, true);
    assert.deepStrictEqual(result.security.authentication, [{ scheme: 'apiKey' }]);
    assert.strictEqual(result.lineage.source_format, 'a2a/v1.0');
  });

  it('should handle authentication field as fallback', () => {
    const result = fromA2A({ authentication: [{ scheme: 'bearer' }] });
    assert.deepStrictEqual(result.security.authentication, [{ scheme: 'bearer' }]);
  });

  it('should use default values for empty input', () => {
    const result = fromA2A({});
    assert.strictEqual(result.meta.version, '1.0.0');
    assert.strictEqual(result.capabilities.streaming, false);
    assert.strictEqual(result.security.authentication.length, 0);
    assert.strictEqual(result.lineage.imported_from, 'unknown');
  });
});

describe('AgentCard Converter - toA2A', () => {
  it('should convert AIX Manifest back to A2A format', () => {
    const aixManifest = {
      meta: {
        id: 'aix-001',
        name: 'AIX Agent',
        description: 'Sovereign Intelligence',
        version: '1.5.0',
        author: 'Jules',
        tags: ['sovereign']
      },
      distribution: { endpoint: 'https://aix.app/api' },
      skills: ['protocol-v1'],
      apis: {
        streaming: true,
        push_notifications: false,
        state_history: true,
        raw_capabilities: {
          custom_feat: true
        }
      },
      security: {
        authentication: [{ scheme: 'oauth2' }]
      },
      identity_layer: { did: 'did:axiom:123' }
    };

    const result = toA2A(aixManifest);

    assert.strictEqual(result.id, 'aix-001');
    assert.strictEqual(result.name, 'AIX Agent');
    assert.strictEqual(result.version, '1.5.0');
    assert.strictEqual(result.provider.name, 'Jules');
    assert.strictEqual(result.provider.url, 'did:axiom:123');
    assert.strictEqual(result.url, 'https://aix.app/api');
    assert.deepStrictEqual(result.skills, ['protocol-v1']);
    assert.strictEqual(result.capabilities.streaming, true);
    assert.strictEqual(result.capabilities.stateTransitionHistory, true);
    assert.strictEqual(result.capabilities.custom_feat, true);
    assert.deepStrictEqual(result.authenticationSchemes, [{ scheme: 'oauth2' }]);
    assert.ok(result['x-aix-metadata']);
    assert.deepStrictEqual(result['x-aix-metadata'].security, aixManifest.security);
    assert.deepStrictEqual(result.tags, ['sovereign']);
  });

  it('should provide default authentication scheme if missing', () => {
    const result = toA2A({ security: { authentication: [] } });
    assert.strictEqual(result.authenticationSchemes[0].scheme, 'bearer');
  });

  it('should handle missing sections gracefully', () => {
    const result = toA2A({});
    assert.strictEqual(result.id, '');
    assert.strictEqual(result.name, '');
    assert.strictEqual(result.capabilities.streaming, false);
    assert.strictEqual(result.capabilities.pushNotifications, false);
    assert.deepStrictEqual(result['x-aix-metadata'].abom, {});
  });
});
