import test from 'node:test';
import assert from 'node:assert';

/**
 * AIX Storage Resilience Test
 * Mocks a failing Upstash client to verify retry logic and graceful degradation.
 */

// Mock Redis client that fails
class FailingRedis {
  async get() {
    throw new Error("Redis Connection Refused");
  }
  async set() {
    throw new Error("Redis Write Timeout");
  }
}

// Minimal UpstashRedisAdapter-like logic for testing retries
class TestAdapter {
  constructor(client) {
    this.client = client;
  }

  async withRetry(operation, label, retries = 2) {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        return await operation();
      } catch (error) {
        attempt++;
        if (attempt > retries) {
          console.log(`[TestLog] ${label} failed permanently after ${attempt} attempts.`);
          return null;
        }
      }
    }
    return null;
  }

  async get(key) {
    return this.withRetry(() => this.client.get(key), 'GET');
  }
}

test('Storage Resilience: Retry Logic', async (t) => {
  const failingClient = new FailingRedis();
  const adapter = new TestAdapter(failingClient);

  await t.test('GET should return null and not throw after exhausting retries', async () => {
    const result = await adapter.get('test:key');
    assert.strictEqual(result, null, "Should return null on permanent failure.");
  });
});
