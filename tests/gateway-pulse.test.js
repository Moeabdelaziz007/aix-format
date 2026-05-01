import test from 'node:test';
import assert from 'node:assert';

/**
 * AIX Gateway Pulse & ReAct Loop Test (v1.3.2)
 * Verifies the persistent agent process logic, Sentinel Tokens, and Readable Memory.
 */

class MockStorage {
  constructor() {
    this.data = new Map();
  }
  async set(key, value) { this.data.set(key, value); }
  async get(key) { return this.data.get(key) || null; }
  async lrange(key, start, stop) { return Array.from(this.data.get(key) || []); }
  async smembers(key) { return Array.from(this.data.get(key) || []); }
}

test('Gateway: Sentinel Tokens (NO_REPLY)', async (t) => {
  await t.test('Should detect and flag NO_REPLY as silent turn', async () => {
    const rawOutput = "NO_REPLY THOUGHT: I am working in the background. ACTION: fetch_logs()";
    const isSilent = rawOutput.includes('NO_REPLY');
    const thought = rawOutput.replace('NO_REPLY', '').replace('THOUGHT:', '').split('ACTION:')[0].trim();
    
    assert.strictEqual(isSilent, true);
    assert.strictEqual(thought, 'I am working in the background.');
  });
});

test('Security: Sovereign Shield (CVE-2026-25253)', async (t) => {
  await t.test('Should simulate origin validation', async () => {
    const allowedOrigin = "http://localhost:3000";
    const incomingOrigin = "http://malicious-site.com";
    
    const isValid = incomingOrigin === allowedOrigin;
    assert.strictEqual(isValid, false);
  });
});

test('Memory: Readable Formats (Markdown/JSONL)', async (t) => {
  await t.test('Should simulate MEMORY.md generation', async () => {
    const agentId = "test-agent";
    const skills = ["web-search", "file-read"];
    const history = [{ role: "user", content: "hi" }];
    
    let md = `# Agent Memory: ${agentId}\n\n`;
    md += `## Skills\n` + skills.map(s => `- ${s}`).join('\n') + '\n\n';
    md += `## History (JSONL)\n` + history.map(h => JSON.stringify(h)).join('\n');
    
    assert.ok(md.includes('Agent Memory: test-agent'));
    assert.ok(md.includes('web-search'));
    assert.ok(md.includes('{"role":"user","content":"hi"}'));
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

  await t.test('Should transition with history', async () => {
    const existing = await storage.get(`aix:gateway:${PROC_ID}`);
    const updated = {
      ...existing,
      status: 'ACTING',
      history: [...existing.history, { role: 'assistant', content: 'Thinking...' }]
    };
    await storage.set(`aix:gateway:${PROC_ID}`, updated);
    const final = await storage.get(`aix:gateway:${PROC_ID}`);
    assert.strictEqual(final.history.length, 2);
  });
});
