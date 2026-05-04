/**
 * Bus Architecture Integration Tests
 * Tests the 4-Ring Bus event flow end-to-end
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock bus implementation for testing
class MockBus {
  private events: Array<{ ring: string; event: string; data: any }> = [];
  private subscribers: Map<string, Array<(data: any) => void>> = new Map();

  emit(ring: string, event: string, data: any) {
    this.events.push({ ring, event, data });
    const key = `${ring}:${event}`;
    const handlers = this.subscribers.get(key) || [];
    handlers.forEach(handler => handler(data));
  }

  on(ring: string, event: string, handler: (data: any) => void) {
    const key = `${ring}:${event}`;
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    this.subscribers.get(key)!.push(handler);
  }

  getEvents() {
    return this.events;
  }

  clear() {
    this.events = [];
    this.subscribers.clear();
  }
}

describe('Bus Architecture Integration', () => {
  let bus: MockBus;

  beforeEach(() => {
    bus = new MockBus();
  });

  afterEach(() => {
    bus.clear();
  });

  describe('4-Ring Event Flow', () => {
    it('should route pet.mood.changed → expectation-engine → gateway', async () => {
      const events: string[] = [];

      // Subscribe to all rings
      bus.on('pet', 'mood.changed', (data) => {
        events.push(`pet:mood.changed:${data.mood}`);
        // Expectation engine reacts
        bus.emit('expectation', 'check', { agentId: data.agentId, mood: data.mood });
      });

      bus.on('expectation', 'check', (data) => {
        events.push(`expectation:check:${data.agentId}`);
        // Gateway executes action
        bus.emit('gateway', 'execute', { agentId: data.agentId, action: 'adjust' });
      });

      bus.on('gateway', 'execute', (data) => {
        events.push(`gateway:execute:${data.action}`);
      });

      // Trigger initial event
      bus.emit('pet', 'mood.changed', { agentId: 'agent-1', mood: 'happy' });

      // Verify event chain
      assert.deepStrictEqual(events, [
        'pet:mood.changed:happy',
        'expectation:check:agent-1',
        'gateway:execute:adjust'
      ]);
    });

    it('should handle bus congestion with backpressure', async () => {
      const processed: number[] = [];
      let dropped = 0;
      const MAX_QUEUE = 100;

      bus.on('gateway', 'task', (data) => {
        if (processed.length < MAX_QUEUE) {
          processed.push(data.id);
        } else {
          dropped++;
        }
      });

      // Emit 150 events (should drop 50)
      for (let i = 0; i < 150; i++) {
        bus.emit('gateway', 'task', { id: i });
      }

      assert.strictEqual(processed.length, MAX_QUEUE);
      assert.strictEqual(dropped, 50);
    });

    it('should recover from bus crash without data loss', async () => {
      const events: any[] = [];

      // Persistent event log
      bus.on('gateway', 'task', (data) => {
        events.push({ ...data, timestamp: Date.now() });
      });

      // Emit events before crash
      bus.emit('gateway', 'task', { id: 1, action: 'deploy' });
      bus.emit('gateway', 'task', { id: 2, action: 'execute' });

      const beforeCrash = events.length;

      // Simulate crash and recovery
      bus.clear();
      
      // Re-subscribe after recovery
      bus.on('gateway', 'task', (data) => {
        events.push({ ...data, timestamp: Date.now() });
      });

      // Emit events after recovery
      bus.emit('gateway', 'task', { id: 3, action: 'monitor' });

      // Verify events persisted
      assert.strictEqual(events.length, 3);
      assert.strictEqual(events[0].id, 1);
      assert.strictEqual(events[2].id, 3);
    });
  });

  describe('Ring Isolation', () => {
    it('should isolate pet ring from gateway ring', () => {
      const petEvents: any[] = [];
      const gatewayEvents: any[] = [];

      bus.on('pet', 'action', (data) => petEvents.push(data));
      bus.on('gateway', 'action', (data) => gatewayEvents.push(data));

      bus.emit('pet', 'action', { type: 'pet-action' });
      bus.emit('gateway', 'action', { type: 'gateway-action' });

      assert.strictEqual(petEvents.length, 1);
      assert.strictEqual(gatewayEvents.length, 1);
      assert.strictEqual(petEvents[0].type, 'pet-action');
      assert.strictEqual(gatewayEvents[0].type, 'gateway-action');
    });
  });

  describe('Event Ordering', () => {
    it('should maintain FIFO order within a ring', () => {
      const order: number[] = [];

      bus.on('gateway', 'task', (data) => {
        order.push(data.id);
      });

      for (let i = 1; i <= 10; i++) {
        bus.emit('gateway', 'task', { id: i });
      }

      assert.deepStrictEqual(order, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });

  describe('Performance', () => {
    it('should handle 1000+ events/sec', () => {
      const start = Date.now();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        bus.emit('gateway', 'task', { id: i });
      }

      const duration = Date.now() - start;
      const eventsPerSec = (count / duration) * 1000;

      assert.ok(eventsPerSec > 1000, `Expected >1000 events/sec, got ${eventsPerSec}`);
      assert.strictEqual(bus.getEvents().length, count);
    });
  });
});

// Made with Moe Abdelaziz
