import test from 'node:test';
import assert from 'node:assert';
import { createHash } from 'node:crypto';

/**
 * AIX Hermes & Symphony Protocol Test
 * Verifies the extraction of feedback-driven skills and A2A orchestration patterns.
 */

class MockStorage {
  constructor() {
    this.data = new Map();
  }

  async set(key, value) {
    this.data.set(key, value);
  }

  async get(key) {
    return this.data.get(key) || null;
  }

  async sadd(key, member) {
    if (!this.data.has(key)) this.data.set(key, new Set());
    this.data.get(key).add(member);
    return 1;
  }

  async smembers(key) {
    const set = this.data.get(key) || new Set();
    return Array.from(set);
  }
}

// Logic copied from learning.ts and invoke route for pure unit testing
function simulateExtractSkill(prompt, response) {
  const hash = createHash('sha256')
    .update(`${prompt}:${response.slice(0, 50)}`)
    .digest('hex')
    .slice(0, 16);
  return hash;
}

function simulateA2ADetection(text) {
  // Regex must support underscores and colons in DID/AgentID
  const match = text.match(/\[CALL:(did:[a-z0-9:_]+)\]([\s\S]*?)\[\/CALL\]/i);
  if (match) {
    return { subAgentId: match[1], subMessage: match[2].trim() };
  }
  return null;
}

test('Hermes: Skill Extraction Logic', async (t) => {
  const storage = new MockStorage();
  const AGENT_ID = 'test-agent';
  const PROMPT = "How to build a sovereign agent?";
  const RESPONSE = "You must first define a DID and an ABOM...";

  await t.test('Should generate a consistent hash for a specific prompt-response pair', async () => {
    const hash1 = simulateExtractSkill(PROMPT, RESPONSE);
    const hash2 = simulateExtractSkill(PROMPT, RESPONSE);
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 16);
  });

  await t.test('Should store skill in Redis pattern', async () => {
    const hash = simulateExtractSkill(PROMPT, RESPONSE);
    const skillDetailKey = `agent:${AGENT_ID}:skill:${hash}`;
    const skillsListKey = `agent:${AGENT_ID}:skills`;

    await storage.set(skillDetailKey, { prompt: PROMPT, response: RESPONSE, successCount: 1 });
    await storage.sadd(skillsListKey, hash);

    const storedSkill = await storage.get(skillDetailKey);
    const storedHashes = await storage.smembers(skillsListKey);

    assert.strictEqual(storedSkill.prompt, PROMPT);
    assert.ok(storedHashes.includes(hash));
  });
});

test('Symphony: Agent-to-Agent (A2A) Detection', async (t) => {
  await t.test('Should correctly extract sub-agent call with underscores', async () => {
    const orchestratorOutput = "I will delegate this. [CALL:did:axiom:security_bot] Please scan this manifest. [/CALL] I'll wait for the result.";
    const callData = simulateA2ADetection(orchestratorOutput);

    assert.ok(callData);
    assert.strictEqual(callData.subAgentId, 'did:axiom:security_bot');
    assert.strictEqual(callData.subMessage, 'Please scan this manifest.');
  });

  await t.test('Should correctly extract sub-agent call with colons', async () => {
    const orchestratorOutput = "[CALL:did:aix:pi:1234] Initialize KYC check. [/CALL]";
    const callData = simulateA2ADetection(orchestratorOutput);

    assert.ok(callData);
    assert.strictEqual(callData.subAgentId, 'did:aix:pi:1234');
    assert.strictEqual(callData.subMessage, 'Initialize KYC check.');
  });

  await t.test('Should return null if no call pattern exists', async () => {
    const normalOutput = "The agent is valid and ready for deployment.";
    const callData = simulateA2ADetection(normalOutput);
    assert.strictEqual(callData, null);
  });
});

test('Protocol: Sovereign Multi-Agent Revenue Integrity', async (t) => {
  await t.test('Should simulate multi-agent billing trace', async () => {
    const trace = [
      { agent: 'did:aix:manager', fee: 0.1 },
      { agent: 'did:aix:worker', fee: 0.05 }
    ];
    const total = trace.reduce((sum, step) => sum + step.fee, 0);
    assert.strictEqual(Math.round(total * 100) / 100, 0.15);
  });
});
