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
import { generateDID } from '../core/src/converters/agentcard.js';

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
    // "Agent #007! (Top Secret)" -> "agent #007! (top secret)"
    // -> "agent-#007!-(top-secret)"
    // -> "agent-007-top-secret"
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

  it('should handle names with only special characters by defaulting or resulting in an empty-ish slug', () => {
    // If name is "!!!", it's not falsy, so it stays "!!!"
    // -> "!!!" (lowercased)
    // -> "!!!" (trimmed)
    // -> "!!!" (spaces replaced)
    // -> "" (symbols removed)
    // So it results in "did:axiom:axiomid.app:"
    const result = generateDID('!!!');
    assert.strictEqual(result, 'did:axiom:axiomid.app:');
  });
});
