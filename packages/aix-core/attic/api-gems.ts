/**
 * AIX API Gems - 33 Production-Ready Utilities
 * 
 * Categories:
 * 1. LLM Tricks (10 gems)
 * 2. Performance (8 gems)
 * 3. Error Handling (5 gems)
 * 4. State Management (5 gems)
 * 5. Security (5 gems)
 */

import crypto from 'crypto';

// ============================================================================
// CATEGORY 1: LLM TRICKS (10 gems)
// ============================================================================

/**
 * Cache LLM responses by prompt hash
 * @example
 * const cached = promptCache();
 * const result = await cached.get('prompt', async () => llm.complete('prompt'));
 */
export function promptCache(ttl: number = 3600000) {
  const cache = new Map<string, { value: any; expires: number }>();
  
  return {
    async get<T>(prompt: string, fn: () => Promise<T>): Promise<T> {
      const key = crypto.createHash('sha256').update(prompt).digest('hex');
      const cached = cache.get(key);
      
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      }
      
      const result = await fn();
      cache.set(key, { value: result, expires: Date.now() + ttl });
      return result;
    },
    clear: () => cache.clear(),
    size: () => cache.size,
  };
}

/**
 * Convert AsyncGenerator to string
 * @example
 * const text = await streamToString(llm.stream('prompt'));
 */
export async function streamToString(stream: AsyncGenerator<string>): Promise<string> {
  const chunks: string[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return chunks.join('');
}

/**
 * Exponential backoff for LLM calls
 * @example
 * const result = await retryWithBackoff(() => llm.complete('prompt'), 3);
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Template engine for prompts
 * @example
 * const template = promptTemplate('Hello {{name}}, you are {{age}} years old');
 * const result = template({ name: 'Alice', age: 30 });
 */
export function promptTemplate(template: string) {
  return (vars: Record<string, any>): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return String(vars[key] ?? '');
    });
  };
}

/**
 * Estimate token count before API call
 * @example
 * const count = tokenCounter('Hello world');
 */
export function tokenCounter(text: string): number {
  // Rough estimation: ~4 chars per token
  return Math.ceil(text.length / 4);
}

/**
 * Manage context window size
 * @example
 * const window = contextWindow(4096);
 * window.add('message 1');
 * window.add('message 2');
 * const messages = window.getMessages();
 */
export function contextWindow(maxTokens: number) {
  const messages: string[] = [];
  let currentTokens = 0;
  
  return {
    add(message: string): void {
      const tokens = tokenCounter(message);
      
      while (currentTokens + tokens > maxTokens && messages.length > 0) {
        const removed = messages.shift()!;
        currentTokens -= tokenCounter(removed);
      }
      
      if (tokens <= maxTokens) {
        messages.push(message);
        currentTokens += tokens;
      }
    },
    getMessages(): string[] {
      return [...messages];
    },
    clear(): void {
      messages.length = 0;
      currentTokens = 0;
    },
    getTokenCount(): number {
      return currentTokens;
    },
  };
}

/**
 * Smart stop sequence detection
 * @example
 * const detector = stopSequence(['END', 'STOP']);
 * const shouldStop = detector.check('This is the END');
 */
export function stopSequence(sequences: string[]) {
  return {
    check(text: string): boolean {
      return sequences.some(seq => text.includes(seq));
    },
    extract(text: string): string {
      for (const seq of sequences) {
        const idx = text.indexOf(seq);
        if (idx !== -1) {
          return text.substring(0, idx);
        }
      }
      return text;
    },
  };
}

/**
 * Chain multiple LLM calls
 * @example
 * const chain = promptChain([
 *   async (input) => llm.complete(`Summarize: ${input}`),
 *   async (summary) => llm.complete(`Translate to French: ${summary}`)
 * ]);
 * const result = await chain('Long text...');
 */
export function promptChain<T = string>(steps: Array<(input: any) => Promise<any>>) {
  return async (initialInput: T): Promise<any> => {
    let result = initialInput;
    for (const step of steps) {
      result = await step(result);
    }
    return result;
  };
}

/**
 * Execute multiple LLM calls in parallel
 * @example
 * const results = await parallelLLM([
 *   () => llm.complete('prompt 1'),
 *   () => llm.complete('prompt 2')
 * ]);
 */
export async function parallelLLM<T>(
  calls: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(calls.map(call => call()));
}

/**
 * Fallback chain for LLM providers
 * @example
 * const result = await llmFallback([
 *   () => primaryLLM.complete('prompt'),
 *   () => secondaryLLM.complete('prompt'),
 *   () => tertiaryLLM.complete('prompt')
 * ]);
 */
export async function llmFallback<T>(
  providers: Array<() => Promise<T>>
): Promise<T> {
  let lastError: any;
  
  for (const provider of providers) {
    try {
      return await provider();
    } catch (error) {
      lastError = error;
    }
  }
  
  throw new Error(`All LLM providers failed: ${lastError?.message}`);
}

// ============================================================================
// CATEGORY 2: PERFORMANCE (8 gems)
// ============================================================================

/**
 * Memoization with TTL
 * @example
 * const cached = memoize(expensiveFunction, 60000);
 * const result = await cached(arg1, arg2);
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  ttl: number = 60000
): T {
  const cache = new Map<string, { value: any; expires: number }>();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }
    
    const result = fn(...args);
    cache.set(key, { value: result, expires: Date.now() + ttl });
    return result;
  }) as T;
}

/**
 * Debounce function calls
 * @example
 * const debounced = debounce(() => console.log('Called'), 1000);
 * debounced(); // Only executes after 1s of no calls
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function calls
 * @example
 * const throttled = throttle(() => console.log('Called'), 1000);
 * throttled(); // Executes at most once per second
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Batch multiple requests
 * @example
 * const batcher = batchRequests(async (ids) => fetchUsers(ids), 100);
 * const user = await batcher.add(userId);
 */
export function batchRequests<T, R>(
  fn: (items: T[]) => Promise<R[]>,
  delay: number = 50
) {
  let batch: T[] = [];
  let timeoutId: NodeJS.Timeout | null = null;
  const pending: Array<{ resolve: (value: R) => void; reject: (error: any) => void }> = [];
  
  const flush = async () => {
    if (batch.length === 0) return;
    
    const currentBatch = batch;
    const currentPending = [...pending];
    batch = [];
    pending.length = 0;
    
    try {
      const results = await fn(currentBatch);
      results.forEach((result, idx) => {
        currentPending[idx].resolve(result);
      });
    } catch (error) {
      currentPending.forEach(p => p.reject(error));
    }
  };
  
  return {
    add(item: T): Promise<R> {
      return new Promise((resolve, reject) => {
        batch.push(item);
        pending.push({ resolve, reject });
        
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(flush, delay);
      });
    },
    flush,
  };
}

/**
 * Lazy load modules
 * @example
 * const getModule = lazyLoad(() => import('./heavy-module'));
 * const module = await getModule();
 */
export function lazyLoad<T>(loader: () => Promise<T>) {
  let cached: T | null = null;
  let loading: Promise<T> | null = null;
  
  return async (): Promise<T> => {
    if (cached) return cached;
    if (loading) return loading;
    
    loading = loader();
    cached = await loading;
    loading = null;
    return cached;
  };
}

/**
 * Cache-aside pattern
 * @example
 * const cache = cacheAside(
 *   async (key) => redis.get(key),
 *   async (key, value) => redis.set(key, value),
 *   async (key) => database.get(key)
 * );
 * const value = await cache.get('key');
 */
export function cacheAside<T>(
  getCache: (key: string) => Promise<T | null>,
  setCache: (key: string, value: T) => Promise<void>,
  getSource: (key: string) => Promise<T>
) {
  return {
    async get(key: string): Promise<T> {
      const cached = await getCache(key);
      if (cached !== null) return cached;
      
      const value = await getSource(key);
      await setCache(key, value);
      return value;
    },
  };
}

/**
 * Prefetch data
 * @example
 * const prefetcher = prefetch(async (id) => fetchUser(id));
 * prefetcher.warm([1, 2, 3]); // Prefetch in background
 * const user = await prefetcher.get(1); // Instant if prefetched
 */
export function prefetch<K, V>(loader: (key: K) => Promise<V>) {
  const cache = new Map<K, Promise<V>>();
  
  return {
    warm(keys: K[]): void {
      keys.forEach(key => {
        if (!cache.has(key)) {
          cache.set(key, loader(key));
        }
      });
    },
    async get(key: K): Promise<V> {
      if (!cache.has(key)) {
        cache.set(key, loader(key));
      }
      return cache.get(key)!;
    },
    clear(): void {
      cache.clear();
    },
  };
}

/**
 * Execute with connection pool
 * @example
 * const pool = pooledExecution(5);
 * const result = await pool.execute(() => heavyTask());
 */
export function pooledExecution(maxConcurrent: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  
  const tryNext = () => {
    if (active < maxConcurrent && queue.length > 0) {
      const next = queue.shift()!;
      next();
    }
  };
  
  return {
    async execute<T>(fn: () => Promise<T>): Promise<T> {
      if (active >= maxConcurrent) {
        await new Promise<void>(resolve => queue.push(resolve));
      }
      
      active++;
      try {
        return await fn();
      } finally {
        active--;
        tryNext();
      }
    },
    getActive(): number {
      return active;
    },
    getQueued(): number {
      return queue.length;
    },
  };
}

// ============================================================================
// CATEGORY 3: ERROR HANDLING (5 gems)
// ============================================================================

/**
 * Circuit breaker pattern
 * @example
 * const breaker = circuitBreaker(async () => apiCall(), 5, 30000);
 * const result = await breaker.execute();
 */
export function circuitBreaker<T>(
  fn: () => Promise<T>,
  threshold: number = 5,
  timeout: number = 30000
) {
  let failures = 0;
  let lastFailure = 0;
  let state: 'closed' | 'open' | 'half-open' = 'closed';
  
  return {
    async execute(): Promise<T> {
      if (state === 'open') {
        if (Date.now() - lastFailure > timeout) {
          state = 'half-open';
        } else {
          throw new Error('Circuit breaker is open');
        }
      }
      
      try {
        const result = await fn();
        failures = 0;
        state = 'closed';
        return result;
      } catch (error) {
        failures++;
        lastFailure = Date.now();
        
        if (failures >= threshold) {
          state = 'open';
        }
        
        throw error;
      }
    },
    getState(): string {
      return state;
    },
    reset(): void {
      failures = 0;
      state = 'closed';
    },
  };
}

/**
 * Configurable retry policy
 * @example
 * const policy = retryPolicy({ maxRetries: 3, backoff: 'exponential' });
 * const result = await policy.execute(() => apiCall());
 */
export function retryPolicy(config: {
  maxRetries?: number;
  backoff?: 'linear' | 'exponential';
  baseDelay?: number;
  shouldRetry?: (error: any) => boolean;
} = {}) {
  const {
    maxRetries = 3,
    backoff = 'exponential',
    baseDelay = 1000,
    shouldRetry = () => true,
  } = config;
  
  return {
    async execute<T>(fn: () => Promise<T>): Promise<T> {
      let lastError: any;
      
      for (let i = 0; i <= maxRetries; i++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error;
          
          if (i < maxRetries && shouldRetry(error)) {
            const delay = backoff === 'exponential'
              ? baseDelay * Math.pow(2, i)
              : baseDelay * (i + 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      throw lastError;
    },
  };
}

/**
 * Fallback chain for errors
 * @example
 * const result = await fallbackChain([
 *   () => primaryService(),
 *   () => secondaryService(),
 *   () => defaultValue
 * ]);
 */
export async function fallbackChain<T>(
  fns: Array<() => T | Promise<T>>
): Promise<T> {
  let lastError: any;
  
  for (const fn of fns) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
    }
  }
  
  throw new Error(`All fallbacks failed: ${lastError?.message}`);
}

/**
 * Error boundary wrapper
 * @example
 * const safe = errorBoundary(riskyFunction, (error) => defaultValue);
 * const result = await safe();
 */
export function errorBoundary<T>(
  fn: () => T | Promise<T>,
  fallback: (error: any) => T
): () => Promise<T> {
  return async () => {
    try {
      return await fn();
    } catch (error) {
      return fallback(error);
    }
  };
}

/**
 * Graceful degradation
 * @example
 * const service = gracefulDegradation(
 *   () => fullFeature(),
 *   () => reducedFeature(),
 *   () => minimalFeature()
 * );
 * const result = await service.execute();
 */
export function gracefulDegradation<T>(
  ...levels: Array<() => Promise<T>>
) {
  return {
    async execute(): Promise<T> {
      for (const level of levels) {
        try {
          return await level();
        } catch (error) {
          // Try next level
        }
      }
      throw new Error('All degradation levels failed');
    },
  };
}

// ============================================================================
// CATEGORY 4: STATE MANAGEMENT (5 gems)
// ============================================================================

/**
 * Distributed lock with Redis (mock implementation)
 * @example
 * const lock = redisLock('resource-key', 5000);
 * await lock.acquire();
 * try {
 *   // Critical section
 * } finally {
 *   await lock.release();
 * }
 */
export function redisLock(key: string, ttl: number = 5000) {
  let locked = false;
  let lockId: string | null = null;
  
  return {
    async acquire(): Promise<boolean> {
      if (locked) return false;
      
      lockId = crypto.randomBytes(16).toString('hex');
      locked = true;
      
      // Auto-release after TTL
      setTimeout(() => {
        if (locked) {
          locked = false;
          lockId = null;
        }
      }, ttl);
      
      return true;
    },
    async release(): Promise<void> {
      locked = false;
      lockId = null;
    },
    isLocked(): boolean {
      return locked;
    },
  };
}

/**
 * Optimistic UI updates
 * @example
 * const updater = optimisticUpdate(
 *   (data) => setState(data),
 *   async (data) => api.update(data),
 *   (prev) => setState(prev)
 * );
 * await updater.update(newData);
 */
export function optimisticUpdate<T>(
  applyUpdate: (data: T) => void,
  persistUpdate: (data: T) => Promise<void>,
  rollback: (previous: T) => void
) {
  return {
    async update(data: T, previous: T): Promise<void> {
      applyUpdate(data);
      
      try {
        await persistUpdate(data);
      } catch (error) {
        rollback(previous);
        throw error;
      }
    },
  };
}

/**
 * Event sourcing pattern
 * @example
 * const store = eventSourcing<UserEvent>();
 * store.append({ type: 'USER_CREATED', data: { id: 1 } });
 * const state = store.replay();
 */
export function eventSourcing<T extends { type: string; data: any }>() {
  const events: T[] = [];
  
  return {
    append(event: T): void {
      events.push(event);
    },
    replay<S>(reducer: (state: S, event: T) => S, initialState: S): S {
      return events.reduce(reducer, initialState);
    },
    getEvents(): T[] {
      return [...events];
    },
    clear(): void {
      events.length = 0;
    },
  };
}

/**
 * CQRS pattern helper
 * @example
 * const cqrs = cqrsPattern(
 *   async (cmd) => handleCommand(cmd),
 *   async (query) => handleQuery(query)
 * );
 * await cqrs.command({ type: 'CREATE_USER', data: {} });
 * const result = await cqrs.query({ type: 'GET_USER', id: 1 });
 */
export function cqrsPattern<C, Q, R>(
  commandHandler: (command: C) => Promise<void>,
  queryHandler: (query: Q) => Promise<R>
) {
  return {
    async command(cmd: C): Promise<void> {
      await commandHandler(cmd);
    },
    async query(query: Q): Promise<R> {
      return await queryHandler(query);
    },
  };
}

/**
 * State snapshot/restore
 * @example
 * const snapshot = stateSnapshot();
 * snapshot.save('key', { data: 'value' });
 * const restored = snapshot.restore('key');
 */
export function stateSnapshot<T = any>() {
  const snapshots = new Map<string, T>();
  
  return {
    save(key: string, state: T): void {
      snapshots.set(key, JSON.parse(JSON.stringify(state)));
    },
    restore(key: string): T | undefined {
      const snapshot = snapshots.get(key);
      return snapshot ? JSON.parse(JSON.stringify(snapshot)) : undefined;
    },
    delete(key: string): void {
      snapshots.delete(key);
    },
    clear(): void {
      snapshots.clear();
    },
    list(): string[] {
      return Array.from(snapshots.keys());
    },
  };
}

// ============================================================================
// CATEGORY 5: SECURITY (5 gems)
// ============================================================================

/**
 * Rate limiting with Redis (mock implementation)
 * @example
 * const limiter = rateLimit(100, 60000); // 100 requests per minute
 * const allowed = await limiter.check('user-id');
 */
export function rateLimit(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>();
  
  return {
    async check(key: string): Promise<boolean> {
      const now = Date.now();
      const userRequests = requests.get(key) || [];
      
      // Remove old requests outside window
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return false;
      }
      
      validRequests.push(now);
      requests.set(key, validRequests);
      return true;
    },
    reset(key: string): void {
      requests.delete(key);
    },
    getCount(key: string): number {
      const now = Date.now();
      const userRequests = requests.get(key) || [];
      return userRequests.filter(time => now - time < windowMs).length;
    },
  };
}

/**
 * Input sanitization
 * @example
 * const clean = inputSanitize('<script>alert("xss")</script>');
 */
export function inputSanitize(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * AES-256 encryption
 * @example
 * const encrypted = encrypt('secret data', 'my-secret-key');
 */
export function encrypt(text: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const keyHash = crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, keyHash, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256 decryption
 * @example
 * const decrypted = decrypt(encrypted, 'my-secret-key');
 */
export function decrypt(encryptedText: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const keyHash = crypto.createHash('sha256').update(key).digest();
  
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, keyHash, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * HMAC signature
 * @example
 * const signature = signPayload({ data: 'value' }, 'secret-key');
 * const isValid = verifySignature({ data: 'value' }, signature, 'secret-key');
 */
export function signPayload(payload: any, secret: string): string {
  const data = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

export function verifySignature(payload: any, signature: string, secret: string): boolean {
  const expected = signPayload(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// ============================================================================
// EXPORTS
// ============================================================================

export const APIGems = {
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
};

// Made with Moe Abdelaziz
