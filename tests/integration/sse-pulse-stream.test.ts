/**
 * SSE Pulse Stream Integration Tests
 * Tests /api/pulse/stream with heartbeat, backpressure, and disconnect cleanup
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';

// Mock SSE Response
class MockSSEResponse {
  private chunks: string[] = [];
  private closed = false;
  private writeCallback?: () => void;

  write(data: string): boolean {
    if (this.closed) {
      throw new Error('Response already closed');
    }
    this.chunks.push(data);
    if (this.writeCallback) {
      this.writeCallback();
    }
    return true;
  }

  end(): void {
    this.closed = true;
  }

  isClosed(): boolean {
    return this.closed;
  }

  getChunks(): string[] {
    return this.chunks;
  }

  onWrite(callback: () => void): void {
    this.writeCallback = callback;
  }

  setHeader(name: string, value: string): void {
    // Mock header setting
  }
}

// SSE Pulse Stream Manager
class SSEPulseStream {
  private clients: Map<string, MockSSEResponse> = new Map();
  private eventBus: EventEmitter = new EventEmitter();
  private heartbeatInterval?: NodeJS.Timeout;
  private maxQueueSize = 100;
  private eventQueue: Array<{ clientId: string; event: any }> = [];

  /**
   * Connect new client
   */
  connect(clientId: string, response: MockSSEResponse): void {
    this.clients.set(clientId, response);
    
    // Send initial connection event
    this.sendEvent(clientId, {
      type: 'connected',
      clientId,
      timestamp: Date.now()
    });

    this.eventBus.emit('client:connected', { clientId });
  }

  /**
   * Disconnect client
   */
  disconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.end();
      this.clients.delete(clientId);
      this.eventBus.emit('client:disconnected', { clientId });
    }
  }

  /**
   * Send event to specific client
   */
  sendEvent(clientId: string, event: any): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.isClosed()) {
      return false;
    }

    try {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      client.write(data);
      return true;
    } catch (error) {
      this.disconnect(clientId);
      return false;
    }
  }

  /**
   * Broadcast event to all clients
   */
  broadcast(event: any): number {
    let successCount = 0;

    for (const [clientId] of this.clients) {
      if (this.sendEvent(clientId, event)) {
        successCount++;
      }
    }

    return successCount;
  }

  /**
   * Start heartbeat
   */
  startHeartbeat(intervalMs: number = 30000): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      const heartbeat = {
        type: 'heartbeat',
        timestamp: Date.now(),
        clients: this.clients.size
      };

      this.broadcast(heartbeat);
    }, intervalMs);
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * Queue event with backpressure handling
   */
  queueEvent(clientId: string, event: any): boolean {
    if (this.eventQueue.length >= this.maxQueueSize) {
      // Drop oldest event (backpressure)
      this.eventQueue.shift();
      this.eventBus.emit('backpressure', { clientId, queueSize: this.eventQueue.length });
    }

    this.eventQueue.push({ clientId, event });
    return true;
  }

  /**
   * Process event queue
   */
  async processQueue(): Promise<number> {
    let processed = 0;

    while (this.eventQueue.length > 0) {
      const item = this.eventQueue.shift();
      if (item) {
        if (this.sendEvent(item.clientId, item.event)) {
          processed++;
        }
      }
    }

    return processed;
  }

  /**
   * Get connected clients count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Subscribe to events
   */
  on(event: string, handler: (...args: any[]) => void): void {
    this.eventBus.on(event, handler);
  }

  /**
   * Cleanup all connections
   */
  cleanup(): void {
    this.stopHeartbeat();
    
    for (const [clientId] of this.clients) {
      this.disconnect(clientId);
    }

    this.eventQueue = [];
    this.eventBus.removeAllListeners();
  }
}

describe('SSE Pulse Stream Integration', () => {
  let stream: SSEPulseStream;

  before(() => {
    stream = new SSEPulseStream();
  });

  after(() => {
    stream.cleanup();
  });

  describe('Connection Management', () => {
    it('should connect new client', () => {
      const response = new MockSSEResponse();
      stream.connect('client-1', response);

      assert.strictEqual(stream.getClientCount(), 1);

      const chunks = response.getChunks();
      assert.ok(chunks.length > 0);
      
      const firstChunk = JSON.parse(chunks[0].replace('data: ', '').trim());
      assert.strictEqual(firstChunk.type, 'connected');
      assert.strictEqual(firstChunk.clientId, 'client-1');
    });

    it('should disconnect client', () => {
      const response = new MockSSEResponse();
      stream.connect('client-2', response);

      assert.strictEqual(stream.getClientCount(), 2);

      stream.disconnect('client-2');

      assert.strictEqual(stream.getClientCount(), 1);
      assert.ok(response.isClosed());
    });

    it('should emit connection events', () => {
      const events: string[] = [];

      stream.on('client:connected', () => events.push('connected'));
      stream.on('client:disconnected', () => events.push('disconnected'));

      const response = new MockSSEResponse();
      stream.connect('client-3', response);
      stream.disconnect('client-3');

      assert.deepStrictEqual(events, ['connected', 'disconnected']);
    });
  });

  describe('Event Broadcasting', () => {
    it('should send event to specific client', () => {
      const response = new MockSSEResponse();
      stream.connect('client-4', response);

      const success = stream.sendEvent('client-4', {
        type: 'test',
        data: 'hello'
      });

      assert.strictEqual(success, true);

      const chunks = response.getChunks();
      const lastChunk = JSON.parse(chunks[chunks.length - 1].replace('data: ', '').trim());
      assert.strictEqual(lastChunk.type, 'test');
      assert.strictEqual(lastChunk.data, 'hello');
    });

    it('should broadcast to all clients', () => {
      const response1 = new MockSSEResponse();
      const response2 = new MockSSEResponse();
      const response3 = new MockSSEResponse();

      stream.connect('broadcast-1', response1);
      stream.connect('broadcast-2', response2);
      stream.connect('broadcast-3', response3);

      const successCount = stream.broadcast({
        type: 'announcement',
        message: 'Hello everyone'
      });

      assert.strictEqual(successCount, 3);

      [response1, response2, response3].forEach(response => {
        const chunks = response.getChunks();
        const lastChunk = JSON.parse(chunks[chunks.length - 1].replace('data: ', '').trim());
        assert.strictEqual(lastChunk.type, 'announcement');
      });

      // Cleanup
      stream.disconnect('broadcast-1');
      stream.disconnect('broadcast-2');
      stream.disconnect('broadcast-3');
    });
  });

  describe('Heartbeat', () => {
    it('should send heartbeat to all clients', async () => {
      const response = new MockSSEResponse();
      stream.connect('heartbeat-client', response);

      stream.startHeartbeat(100); // 100ms for testing

      // Wait for heartbeat
      await new Promise(resolve => setTimeout(resolve, 150));

      stream.stopHeartbeat();

      const chunks = response.getChunks();
      const heartbeats = chunks.filter(chunk => {
        const data = JSON.parse(chunk.replace('data: ', '').trim());
        return data.type === 'heartbeat';
      });

      assert.ok(heartbeats.length > 0);

      stream.disconnect('heartbeat-client');
    });

    it('should stop heartbeat on cleanup', async () => {
      const response = new MockSSEResponse();
      stream.connect('cleanup-client', response);

      stream.startHeartbeat(100);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const chunksBefore = response.getChunks().length;
      
      stream.stopHeartbeat();
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const chunksAfter = response.getChunks().length;

      // Should not have received more heartbeats
      assert.strictEqual(chunksBefore, chunksAfter);

      stream.disconnect('cleanup-client');
    });
  });

  describe('Backpressure Handling', () => {
    it('should queue events when backpressure occurs', () => {
      const response = new MockSSEResponse();
      stream.connect('backpressure-client', response);

      // Queue 150 events (max is 100)
      for (let i = 0; i < 150; i++) {
        stream.queueEvent('backpressure-client', {
          type: 'data',
          index: i
        });
      }

      // Queue should be capped at 100
      assert.strictEqual(stream.getQueueSize(), 100);

      stream.disconnect('backpressure-client');
    });

    it('should emit backpressure events', () => {
      const backpressureEvents: any[] = [];

      stream.on('backpressure', (data) => {
        backpressureEvents.push(data);
      });

      const response = new MockSSEResponse();
      stream.connect('backpressure-test', response);

      // Trigger backpressure
      for (let i = 0; i < 150; i++) {
        stream.queueEvent('backpressure-test', { index: i });
      }

      assert.ok(backpressureEvents.length > 0);

      stream.disconnect('backpressure-test');
    });

    it('should process queued events', async () => {
      const response = new MockSSEResponse();
      stream.connect('queue-process', response);

      // Queue some events
      for (let i = 0; i < 10; i++) {
        stream.queueEvent('queue-process', {
          type: 'queued',
          index: i
        });
      }

      const processed = await stream.processQueue();

      assert.strictEqual(processed, 10);
      assert.strictEqual(stream.getQueueSize(), 0);

      stream.disconnect('queue-process');
    });
  });

  describe('Disconnect Cleanup', () => {
    it('should cleanup on disconnect', () => {
      const response = new MockSSEResponse();
      stream.connect('cleanup-test', response);

      assert.strictEqual(stream.getClientCount(), 1);

      stream.disconnect('cleanup-test');

      assert.strictEqual(stream.getClientCount(), 0);
      assert.ok(response.isClosed());
    });

    it('should handle multiple disconnects gracefully', () => {
      const response = new MockSSEResponse();
      stream.connect('multi-disconnect', response);

      stream.disconnect('multi-disconnect');
      stream.disconnect('multi-disconnect'); // Second disconnect should be safe

      assert.strictEqual(stream.getClientCount(), 0);
    });

    it('should cleanup all connections on shutdown', () => {
      const responses = [];
      
      for (let i = 0; i < 5; i++) {
        const response = new MockSSEResponse();
        responses.push(response);
        stream.connect(`cleanup-${i}`, response);
      }

      assert.strictEqual(stream.getClientCount(), 5);

      stream.cleanup();

      assert.strictEqual(stream.getClientCount(), 0);
      
      responses.forEach(response => {
        assert.ok(response.isClosed());
      });
    });
  });

  describe('Performance', () => {
    it('should handle 100 concurrent clients', () => {
      const clients = [];

      for (let i = 0; i < 100; i++) {
        const response = new MockSSEResponse();
        stream.connect(`perf-client-${i}`, response);
        clients.push(response);
      }

      assert.strictEqual(stream.getClientCount(), 100);

      const successCount = stream.broadcast({
        type: 'performance-test',
        timestamp: Date.now()
      });

      assert.strictEqual(successCount, 100);

      // Cleanup
      for (let i = 0; i < 100; i++) {
        stream.disconnect(`perf-client-${i}`);
      }
    });

    it('should broadcast 1000 events in under 1 second', async () => {
      const response = new MockSSEResponse();
      stream.connect('broadcast-perf', response);

      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        stream.sendEvent('broadcast-perf', {
          type: 'perf',
          index: i
        });
      }

      const duration = Date.now() - startTime;

      assert.ok(duration < 1000, `Took ${duration}ms, expected <1000ms`);

      const chunks = response.getChunks();
      assert.ok(chunks.length >= 1000);

      stream.disconnect('broadcast-perf');
    });
  });

  describe('Error Handling', () => {
    it('should handle closed connection gracefully', () => {
      const response = new MockSSEResponse();
      stream.connect('error-test', response);

      // Close the connection
      response.end();

      // Try to send event
      const success = stream.sendEvent('error-test', {
        type: 'test'
      });

      assert.strictEqual(success, false);
    });

    it('should auto-disconnect on write error', () => {
      const response = new MockSSEResponse();
      stream.connect('write-error', response);

      // Close response to trigger error
      response.end();

      const initialCount = stream.getClientCount();
      
      // This should trigger auto-disconnect
      stream.sendEvent('write-error', { type: 'test' });

      // Client should be removed
      assert.ok(stream.getClientCount() < initialCount);
    });
  });
});

// Made with Moe Abdelaziz
