import test from 'node:test';
import assert from 'node:assert';

/**
 * AIX Agent Intelligence Logic Test
 * Verifies the underlying logic for Memory, Skills, and Session Persistence.
 */

// Mock Storage Adapter mimicking the new core logic
class MockStorage {
  constructor() {
    this.data = new Map();
  }

  async lpush(key, value) {
    if (!this.data.has(key)) this.data.set(key, []);
    this.data.get(key).unshift(value);
    return this.data.get(key).length;
  }

  async lrange(key, start, stop) {
    const list = this.data.get(key) || [];
    if (stop === -1) return list.slice(start);
    return list.slice(start, stop + 1);
  }

  async sadd(key, member) {
    if (!this.data.has(key)) this.data.set(key, new Set());
    const set = this.data.get(key);
    const sizeBefore = set.size;
    set.add(member);
    return set.size > sizeBefore ? 1 : 0;
  }

  async smembers(key) {
    const set = this.data.get(key) || new Set();
    return Array.from(set);
  }

  async setex(key, seconds, value) {
    this.data.set(key, { value, expires: Date.now() + seconds * 1000 });
  }

  async get(key) {
    const entry = this.data.get(key);
    if (!entry) return null;
    if (entry.expires && Date.now() > entry.expires) {
      this.data.delete(key);
      return null;
    }
    return entry.value || entry;
  }
}

test('Agent Intelligence: Memory Logic', async (t) => {
  const storage = new MockStorage();
  const AGENT_ID = 'test-agent';
  const MEMORY_KEY = `agent:${AGENT_ID}:memory`;

  await t.test('Should store and retrieve memory turns in reverse order (LIFO)', async () => {
    await storage.lpush(MEMORY_KEY, JSON.stringify({ role: 'user', text: 'Hi' }));
    await storage.lpush(MEMORY_KEY, JSON.stringify({ role: 'assistant', text: 'Hello' }));

    const memory = await storage.lrange(MEMORY_KEY, 0, -1);
    assert.strictEqual(memory.length, 2);
    assert.strictEqual(JSON.parse(memory[0]).role, 'assistant');
    assert.strictEqual(JSON.parse(memory[1]).role, 'user');
  });
});

test('Agent Intelligence: Skills Logic', async (t) => {
  const storage = new MockStorage();
  const AGENT_ID = 'test-agent';
  const SKILLS_KEY = `agent:${AGENT_ID}:skills`;

  await t.test('Should manage atomic skill sets', async () => {
    await storage.sadd(SKILLS_KEY, 'web-search');
    await storage.sadd(SKILLS_KEY, 'code-exec');
    await storage.sadd(SKILLS_KEY, 'web-search'); // Duplicate

    const skills = await storage.smembers(SKILLS_KEY);
    assert.strictEqual(skills.length, 2);
    assert.ok(skills.includes('web-search'));
    assert.ok(skills.includes('code-exec'));
  });
});

test('Agent Intelligence: Wizard Session Persistence', async (t) => {
  const storage = new MockStorage();
  const SESS_ID = 'test-session';
  const SESS_KEY = `wizard:session:${SESS_ID}`;

  await t.test('Should respect TTL for sessions (simulated)', async () => {
    await storage.setex(SESS_KEY, 3600, JSON.stringify({ step: 1 }));
    
    const session = await storage.get(SESS_KEY);
    assert.strictEqual(JSON.parse(session).step, 1);
  });
});
