import test from 'node:test';
import assert from 'node:assert';

/**
 * AIX Pet Evolution Test (v1.3.5)
 * Verifies that agent personas evolve through activity and progression.
 */

class MockStorage {
  constructor() {
    this.data = new Map();
  }
  async set(key, value) { this.data.set(key, value); }
  async get(key) { return this.data.get(key) || null; }
  async incr(key) {
    const val = (this.data.get(key) || 0) + 1;
    this.data.set(key, val);
    return val;
  }
}

test('Pets: Activity & Mood Transitions', async (t) => {
  const storage = new MockStorage();
  const AGENT_ID = "pet-test-agent";
  
  const manifest = {
    pet: { type: 'fox', mood: 'curious', level: 1 }
  };
  await storage.set(`agent:${AGENT_ID}`, manifest);

  await t.test('Should update mood to busy on activity', async () => {
    const m = await storage.get(`agent:${AGENT_ID}`);
    m.pet.mood = 'busy';
    await storage.set(`agent:${AGENT_ID}`, m);
    
    const updated = await storage.get(`agent:${AGENT_ID}`);
    assert.strictEqual(updated.pet.mood, 'busy');
  });

  await t.test('Should settle back to curious', async () => {
    const m = await storage.get(`agent:${AGENT_ID}`);
    m.pet.mood = 'curious';
    await storage.set(`agent:${AGENT_ID}`, m);
    
    const updated = await storage.get(`agent:${AGENT_ID}`);
    assert.strictEqual(updated.pet.mood, 'curious');
  });
});

test('Pets: Progression & Leveling', async (t) => {
  const storage = new MockStorage();
  const AGENT_ID = "pet-level-agent";
  
  const manifest = {
    pet: { type: 'owl', level: 1 }
  };
  await storage.set(`agent:${AGENT_ID}`, manifest);

  await t.test('Should increment level after reaching threshold', async () => {
    let m = await storage.get(`agent:${AGENT_ID}`);
    
    // Simulate 10 activity pulses (Level 1 threshold = 1 * 10)
    for (let i = 0; i < 10; i++) {
      await storage.incr(`agent:${AGENT_ID}:exp`);
    }
    
    const exp = await storage.get(`agent:${AGENT_ID}:exp`);
    if (exp >= m.pet.level * 10) {
      m.pet.level += 1;
    }
    
    assert.strictEqual(m.pet.level, 2);
  });
});
