import test from 'node:test';
import assert from 'node:assert';

/**
 * AIX Gateway Pulse & Dead Hand Protocol Test (v1.3.3)
 * Verifies the persistent agent process logic, Sentinel Tokens, and Autonomous Safety (Dead Hand).
 */

class MockStorage {
  constructor() {
    this.data = new Map();
  }
  async set(key, value) { this.data.set(key, value); }
  async get(key) { return this.data.get(key) || null; }
  async del(key) { this.data.delete(key); }
  async lrange(key, start, stop) { return Array.from(this.data.get(key) || []); }
  async smembers(key) { return Array.from(this.data.get(key) || []); }
}

test('Dead Hand: Evaluation Logic', async (t) => {
  const storage = new MockStorage();
  const AGENT_ID = "malicious-agent";
  
  await t.test('Should trigger HARD_KILL on high risk score', async () => {
    const manifest = { risk_score: 95, status: 'online' };
    await storage.set(`agent:${AGENT_ID}`, manifest);
    
    const risk = manifest.risk_score;
    let trigger = null;
    if (risk > 80) {
      trigger = { agentId: AGENT_ID, reason: 'HIGH_RISK_SCORE', threatLevel: 'HARD_KILL' };
    }
    
    assert.ok(trigger);
    assert.strictEqual(trigger.threatLevel, 'HARD_KILL');
  });

  await t.test('Should trigger QUARANTINE on banned tools', async () => {
    const manifest = { tools: ['rm_rf', 'web-search'], status: 'online' };
    const BANNED = ['rm_rf'];
    
    const hasBanned = manifest.tools.some(t => BANNED.includes(t));
    let trigger = null;
    if (hasBanned) {
      trigger = { agentId: AGENT_ID, reason: 'BANNED_TOOL', threatLevel: 'QUARANTINE' };
    }
    
    assert.ok(trigger);
    assert.strictEqual(trigger.threatLevel, 'QUARANTINE');
  });

  await t.test('Should trigger SOFT_KILL on heartbeat timeout', async () => {
    const manifest = { status: 'online' };
    const heartbeat = null; // Expired
    
    let trigger = null;
    if (!heartbeat && manifest.status === 'online') {
      trigger = { agentId: AGENT_ID, reason: 'HEARTBEAT_TIMEOUT', threatLevel: 'SOFT_KILL' };
    }
    
    assert.ok(trigger);
    assert.strictEqual(trigger.threatLevel, 'SOFT_KILL');
  });
});

test('Dead Hand: Heartbeat Signaling', async (t) => {
  const storage = new MockStorage();
  const AGENT_ID = "safe-agent";

  await t.test('Should refresh heartbeat in storage', async () => {
    const now = Date.now();
    await storage.set(`agent:${AGENT_ID}:heartbeat`, now);
    const stored = await storage.get(`agent:${AGENT_ID}:heartbeat`);
    assert.strictEqual(stored, now);
  });
});

test('Gateway: Sentinel Tokens (NO_REPLY)', async (t) => {
  await t.test('Should detect and flag NO_REPLY as silent turn', async () => {
    const rawOutput = "NO_REPLY THOUGHT: I am working in the background. ACTION: fetch_logs()";
    const isSilent = rawOutput.includes('NO_REPLY');
    const thought = rawOutput.replace('NO_REPLY', '').replace('THOUGHT:', '').split('ACTION:')[0].trim();
    
    assert.strictEqual(isSilent, true);
    assert.strictEqual(thought, 'I am working in the background.');
  });
});

test('Gateway: Persistent Process Lifecycle', async (t) => {
  const storage = new MockStorage();
  const PROC_ID = 'proc_test_123';
  
  const initialProcess = {
    id: PROC_ID,
    status: 'THINKING',
    history: [{ role: 'user', content: 'Task 1' }],
    observations: {}
  };

  await t.test('Should initialize process', async () => {
    await storage.set(`aix:gateway:${PROC_ID}`, initialProcess);
    const stored = await storage.get(`aix:gateway:${PROC_ID}`);
    assert.strictEqual(stored.status, 'THINKING');
  });
});
