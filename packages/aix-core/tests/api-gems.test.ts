/**
 * Test Suite for API Gems
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // LLM Tricks
  promptCache,
  streamToString,
  retryWithBackoff,
  promptTemplate,
  tokenCounter,
  contextWindow,
  stopSequence,
  promptChain,
  parallelLLM,
  llmFallback,
  // Performance
  memoize,
  debounce,
  throttle,
  batchRequests,
  lazyLoad,
  cacheAside,
  prefetch,
  pooledExecution,
  // Error Handling
  circuitBreaker,
  retryPolicy,
  fallbackChain,
  errorBoundary,
  gracefulDegradation,
  // State Management
  redisLock,
  optimisticUpdate,
  eventSourcing,
  cqrsPattern,
  stateSnapshot,
  // Security
  rateLimit,
  inputSanitize,
  encrypt,
  decrypt,
  signPayload,
  verifySignature,
} from '../src/api-gems';

describe('LLM Tricks', () => {
  describe('promptCache', () => {
    it('should cache prompt responses', async () => {
      const cache = promptCache(1000);
      let callCount = 0;
      
      const fn = async () => {
        callCount++;
        return 'result';
      };
      
      const result1 = await cache.get('prompt', fn);
      const result2 = await cache.get('prompt', fn);
      
      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(callCount).toBe(1);
    });

    it('should expire cached values after TTL', async () => {
      const cache = promptCache(100);
      let callCount = 0;
      
      const fn = async () => {
        callCount++;
        return 'result';
      };
      
      await cache.get('prompt', fn);
      await new Promise(resolve => setTimeout(resolve, 150));
      await cache.get('prompt', fn);
      
      expect(callCount).toBe(2);
    });
  });

  describe('streamToString', () => {
    it('should convert async generator to string', async () => {
      async function* generator() {
        yield 'Hello';
        yield ' ';
        yield 'World';
      }
      
      const result = await streamToString(generator());
      expect(result).toBe('Hello World');
    });
  });

  describe('retryWithBackoff', () => {
    it('should retry on failure', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Fail');
        return 'success';
      };
      
      const result = await retryWithBackoff(fn, 3, 10);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max retries', async () => {
      const fn = async () => {
        throw new Error('Always fails');
      };
      
      await expect(retryWithBackoff(fn, 2, 10)).rejects.toThrow('Always fails');
    });
  });

  describe('promptTemplate', () => {
    it('should replace template variables', () => {
      const template = promptTemplate('Hello {{name}}, you are {{age}} years old');
      const result = template({ name: 'Alice', age: 30 });
      
      expect(result).toBe('Hello Alice, you are 30 years old');
    });

    it('should handle missing variables', () => {
      const template = promptTemplate('Hello {{name}}');
      const result = template({});
      
      expect(result).toBe('Hello ');
    });
  });

  describe('tokenCounter', () => {
    it('should estimate token count', () => {
      const count = tokenCounter('Hello world');
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(10);
    });
  });

  describe('contextWindow', () => {
    it('should manage context window', () => {
      const window = contextWindow(100);
      
      window.add('Message 1');
      window.add('Message 2');
      
      const messages = window.getMessages();
      expect(messages.length).toBe(2);
    });

    it('should evict old messages when full', () => {
      const window = contextWindow(20);
      
      window.add('Very long message that takes many tokens');
      window.add('Another message');
      
      const messages = window.getMessages();
      expect(messages.length).toBeLessThanOrEqual(2);
    });
  });

  describe('stopSequence', () => {
    it('should detect stop sequences', () => {
      const detector = stopSequence(['END', 'STOP']);
      
      expect(detector.check('This is the END')).toBe(true);
      expect(detector.check('Keep going')).toBe(false);
    });

    it('should extract text before stop sequence', () => {
      const detector = stopSequence(['END']);
      const result = detector.extract('Hello world END extra text');
      
      expect(result).toBe('Hello world ');
    });
  });

  describe('promptChain', () => {
    it('should chain multiple steps', async () => {
      const chain = promptChain([
        async (input: string) => input.toUpperCase(),
        async (input: string) => input + '!',
      ]);
      
      const result = await chain('hello');
      expect(result).toBe('HELLO!');
    });
  });

  describe('parallelLLM', () => {
    it('should execute calls in parallel', async () => {
      const results = await parallelLLM([
        async () => 'result1',
        async () => 'result2',
        async () => 'result3',
      ]);
      
      expect(results).toEqual(['result1', 'result2', 'result3']);
    });
  });

  describe('llmFallback', () => {
    it('should use fallback on failure', async () => {
      const result = await llmFallback([
        async () => { throw new Error('Primary failed'); },
        async () => 'fallback result',
      ]);
      
      expect(result).toBe('fallback result');
    });

    it('should throw if all providers fail', async () => {
      await expect(llmFallback([
        async () => { throw new Error('Fail 1'); },
        async () => { throw new Error('Fail 2'); },
      ])).rejects.toThrow();
    });
  });
});

describe('Performance', () => {
  describe('memoize', () => {
    it('should memoize function results', () => {
      let callCount = 0;
      const fn = (x: number) => {
        callCount++;
        return x * 2;
      };
      
      const memoized = memoize(fn, 1000);
      
      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);
      expect(callCount).toBe(1);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const fn = () => callCount++;
      const debounced = debounce(fn, 100);
      
      debounced();
      debounced();
      debounced();
      
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(callCount).toBe(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      let callCount = 0;
      const fn = () => callCount++;
      const throttled = throttle(fn, 100);
      
      throttled();
      throttled();
      throttled();
      
      expect(callCount).toBe(1);
    });
  });

  describe('batchRequests', () => {
    it('should batch multiple requests', async () => {
      const batcher = batchRequests(
        async (ids: number[]) => ids.map(id => ({ id, data: `data-${id}` })),
        50
      );
      
      const results = await Promise.all([
        batcher.add(1),
        batcher.add(2),
        batcher.add(3),
      ]);
      
      expect(results.length).toBe(3);
      expect(results[0].id).toBe(1);
    });
  });

  describe('lazyLoad', () => {
    it('should lazy load modules', async () => {
      let loadCount = 0;
      const loader = lazyLoad(async () => {
        loadCount++;
        return { value: 42 };
      });
      
      const result1 = await loader();
      const result2 = await loader();
      
      expect(result1.value).toBe(42);
      expect(result2.value).toBe(42);
      expect(loadCount).toBe(1);
    });
  });

  describe('cacheAside', () => {
    it('should implement cache-aside pattern', async () => {
      const cache = new Map<string, any>();
      let sourceCallCount = 0;
      
      const cacheImpl = cacheAside(
        async (key) => cache.get(key) || null,
        async (key, value) => { cache.set(key, value); },
        async (key) => {
          sourceCallCount++;
          return `value-${key}`;
        }
      );
      
      const result1 = await cacheImpl.get('key1');
      const result2 = await cacheImpl.get('key1');
      
      expect(result1).toBe('value-key1');
      expect(result2).toBe('value-key1');
      expect(sourceCallCount).toBe(1);
    });
  });

  describe('prefetch', () => {
    it('should prefetch data', async () => {
      let loadCount = 0;
      const prefetcher = prefetch(async (id: number) => {
        loadCount++;
        return `data-${id}`;
      });
      
      prefetcher.warm([1, 2, 3]);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = await prefetcher.get(1);
      expect(result).toBe('data-1');
      expect(loadCount).toBeGreaterThan(0);
    });
  });

  describe('pooledExecution', () => {
    it('should limit concurrent executions', async () => {
      const pool = pooledExecution(2);
      let maxActive = 0;
      let currentActive = 0;
      
      const task = async () => {
        currentActive++;
        maxActive = Math.max(maxActive, currentActive);
        await new Promise(resolve => setTimeout(resolve, 50));
        currentActive--;
      };
      
      await Promise.all([
        pool.execute(task),
        pool.execute(task),
        pool.execute(task),
        pool.execute(task),
      ]);
      
      expect(maxActive).toBeLessThanOrEqual(2);
    });
  });
});

describe('Error Handling', () => {
  describe('circuitBreaker', () => {
    it('should open circuit after threshold', async () => {
      let callCount = 0;
      const breaker = circuitBreaker(
        async () => {
          callCount++;
          throw new Error('Fail');
        },
        3,
        1000
      );
      
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute()).rejects.toThrow();
      }
      
      expect(breaker.getState()).toBe('open');
      await expect(breaker.execute()).rejects.toThrow('Circuit breaker is open');
    });

    it('should reset on success', async () => {
      let shouldFail = true;
      const breaker = circuitBreaker(
        async () => {
          if (shouldFail) throw new Error('Fail');
          return 'success';
        },
        3,
        100
      );
      
      await expect(breaker.execute()).rejects.toThrow();
      shouldFail = false;
      
      const result = await breaker.execute();
      expect(result).toBe('success');
      expect(breaker.getState()).toBe('closed');
    });
  });

  describe('retryPolicy', () => {
    it('should retry with exponential backoff', async () => {
      let attempts = 0;
      const policy = retryPolicy({ maxRetries: 3, backoff: 'exponential', baseDelay: 10 });
      
      const result = await policy.execute(async () => {
        attempts++;
        if (attempts < 3) throw new Error('Fail');
        return 'success';
      });
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
  });

  describe('fallbackChain', () => {
    it('should try fallbacks in order', async () => {
      const result = await fallbackChain([
        () => { throw new Error('Fail 1'); },
        () => { throw new Error('Fail 2'); },
        () => 'success',
      ]);
      
      expect(result).toBe('success');
    });
  });

  describe('errorBoundary', () => {
    it('should catch errors and return fallback', async () => {
      const safe = errorBoundary(
        () => { throw new Error('Fail'); },
        () => 'fallback'
      );
      
      const result = await safe();
      expect(result).toBe('fallback');
    });
  });

  describe('gracefulDegradation', () => {
    it('should degrade gracefully', async () => {
      const service = gracefulDegradation(
        async () => { throw new Error('Full feature failed'); },
        async () => 'reduced feature',
      );
      
      const result = await service.execute();
      expect(result).toBe('reduced feature');
    });
  });
});

describe('State Management', () => {
  describe('redisLock', () => {
    it('should acquire and release lock', async () => {
      const lock = redisLock('resource', 1000);
      
      const acquired = await lock.acquire();
      expect(acquired).toBe(true);
      expect(lock.isLocked()).toBe(true);
      
      await lock.release();
      expect(lock.isLocked()).toBe(false);
    });

    it('should not acquire if already locked', async () => {
      const lock = redisLock('resource', 1000);
      
      await lock.acquire();
      const secondAcquire = await lock.acquire();
      
      expect(secondAcquire).toBe(false);
    });
  });

  describe('optimisticUpdate', () => {
    it('should apply optimistic updates', async () => {
      let state = { value: 1 };
      const updater = optimisticUpdate<{ value: number }>(
        (data) => { state = data; },
        async (data) => { /* persist */ },
        (prev) => { state = prev; }
      );
      
      await updater.update({ value: 2 }, { value: 1 });
      expect(state.value).toBe(2);
    });

    it('should rollback on error', async () => {
      let state = { value: 1 };
      const updater = optimisticUpdate<{ value: number }>(
        (data) => { state = data; },
        async (data) => { throw new Error('Persist failed'); },
        (prev) => { state = prev; }
      );
      
      await expect(updater.update({ value: 2 }, { value: 1 })).rejects.toThrow();
      expect(state.value).toBe(1);
    });
  });

  describe('eventSourcing', () => {
    it('should append and replay events', () => {
      const store = eventSourcing<{ type: string; data: any }>();
      
      store.append({ type: 'INCREMENT', data: 1 });
      store.append({ type: 'INCREMENT', data: 2 });
      
      const state = store.replay(
        (state, event) => state + event.data,
        0
      );
      
      expect(state).toBe(3);
    });
  });

  describe('cqrsPattern', () => {
    it('should separate commands and queries', async () => {
      let state = { value: 0 };
      
      const cqrs = cqrsPattern(
        async (cmd: any) => { state.value = cmd.value; },
        async (query: any) => state
      );
      
      await cqrs.command({ value: 42 });
      const result = await cqrs.query({});
      
      expect(result.value).toBe(42);
    });
  });

  describe('stateSnapshot', () => {
    it('should save and restore state', () => {
      const snapshot = stateSnapshot();
      const state = { value: 42, nested: { data: 'test' } };
      
      snapshot.save('key1', state);
      const restored = snapshot.restore('key1');
      
      expect(restored).toEqual(state);
      expect(restored).not.toBe(state); // Deep copy
    });
  });
});

describe('Security', () => {
  describe('rateLimit', () => {
    it('should limit requests', async () => {
      const limiter = rateLimit(3, 1000);
      
      expect(await limiter.check('user1')).toBe(true);
      expect(await limiter.check('user1')).toBe(true);
      expect(await limiter.check('user1')).toBe(true);
      expect(await limiter.check('user1')).toBe(false);
    });

    it('should reset after window', async () => {
      const limiter = rateLimit(2, 100);
      
      await limiter.check('user1');
      await limiter.check('user1');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(await limiter.check('user1')).toBe(true);
    });
  });

  describe('inputSanitize', () => {
    it('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = inputSanitize(input);
      
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const sanitized = inputSanitize(input);
      
      expect(sanitized).not.toContain('javascript:');
    });
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt data', () => {
      const original = 'secret data';
      const key = 'my-secret-key';
      
      const encrypted = encrypt(original, key);
      const decrypted = decrypt(encrypted, key);
      
      expect(decrypted).toBe(original);
      expect(encrypted).not.toBe(original);
    });

    it('should produce different ciphertext each time', () => {
      const original = 'secret data';
      const key = 'my-secret-key';
      
      const encrypted1 = encrypt(original, key);
      const encrypted2 = encrypt(original, key);
      
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('signPayload and verifySignature', () => {
    it('should sign and verify payloads', () => {
      const payload = { data: 'important', timestamp: Date.now() };
      const secret = 'secret-key';
      
      const signature = signPayload(payload, secret);
      const isValid = verifySignature(payload, signature, secret);
      
      expect(isValid).toBe(true);
    });

    it('should reject tampered payloads', () => {
      const payload = { data: 'important' };
      const tamperedPayload = { data: 'tampered' };
      const secret = 'secret-key';
      
      const signature = signPayload(payload, secret);
      const isValid = verifySignature(tamperedPayload, signature, secret);
      
      expect(isValid).toBe(false);
    });
  });
});

// Made with Moe Abdelaziz
