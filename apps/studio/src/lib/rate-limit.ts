/**
 * Rate Limiting Helper
 * 
 * Provides rate limiting utilities for API routes using Redis
 * 
 * @module rate-limit
 */

interface RateLimitConfig {
  limit: number;        // Max requests
  windowSeconds: number; // Time window in seconds
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a key
 * 
 * @param key - Rate limit key (e.g., "invoke:user123:agent456")
 * @param limit - Max requests allowed
 * @param windowSeconds - Time window in seconds
 * @returns Rate limit result
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    // TODO: Implement Redis-based rate limiting
    // For now, use in-memory cache (not production-ready)
    
    const current = await incrementKey(key);
    
    if (current === 1) {
      await setExpiry(key, windowSeconds);
    }
    
    const allowed = current <= limit;
    const remaining = Math.max(0, limit - current);
    const resetAt = Date.now() + (windowSeconds * 1000);
    
    return {
      allowed,
      remaining,
      resetAt
    };
    
  } catch (error) {
    console.error('[Rate Limit Error]', error);
    // On error, allow the request (fail open)
    return {
      allowed: true,
      remaining: limit,
      resetAt: Date.now() + (windowSeconds * 1000)
    };
  }
}

/**
 * Rate limit configurations for different operations
 */
export const RATE_LIMITS = {
  // Agent operations
  AGENT_INVOKE: { limit: 10, windowSeconds: 60 },      // 10 req/min
  AGENT_TRAIN: { limit: 5, windowSeconds: 3600 },      // 5 req/hour
  AGENT_DEPLOY: { limit: 10, windowSeconds: 3600 },    // 10 req/hour
  AGENT_CLONE: { limit: 5, windowSeconds: 60 },        // 5 req/min
  
  // Financial operations (stricter)
  MARKETPLACE_STAKE: { limit: 5, windowSeconds: 60 },  // 5 req/min
  MARKETPLACE_UNSTAKE: { limit: 5, windowSeconds: 60 }, // 5 req/min
  PAYMENT_SETUP: { limit: 10, windowSeconds: 60 },     // 10 req/min
  
  // KYC operations (very strict)
  KYC_SIGN: { limit: 3, windowSeconds: 3600 },         // 3 req/hour
  KYC_VERIFY: { limit: 10, windowSeconds: 60 },        // 10 req/min
  
  // General API
  API_GENERAL: { limit: 100, windowSeconds: 60 },      // 100 req/min
  API_HEAVY: { limit: 10, windowSeconds: 60 },         // 10 req/min
} as const;

/**
 * Check rate limit with predefined config
 * 
 * @param key - Rate limit key
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export async function checkRateLimitWithConfig(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return checkRateLimit(key, config.limit, config.windowSeconds);
}

/**
 * Create rate limit key
 * 
 * @param prefix - Key prefix (e.g., "invoke", "stake")
 * @param userId - User ID
 * @param resourceId - Resource ID (optional)
 * @returns Rate limit key
 */
export function createRateLimitKey(
  prefix: string,
  userId: string,
  resourceId?: string
): string {
  if (resourceId) {
    return `ratelimit:${prefix}:${userId}:${resourceId}`;
  }
  return `ratelimit:${prefix}:${userId}`;
}

// In-memory cache for development (NOT production-ready)
const cache = new Map<string, { count: number; expiresAt: number }>();

/**
 * Increment key in cache
 * 
 * @param key - Cache key
 * @returns Current count
 */
async function incrementKey(key: string): Promise<number> {
  const now = Date.now();
  const entry = cache.get(key);
  
  if (!entry || entry.expiresAt < now) {
    cache.set(key, { count: 1, expiresAt: now + 60000 });
    return 1;
  }
  
  entry.count++;
  return entry.count;
  
  // In production, use Redis:
  // const redis = await getRedisClient();
  // return await redis.incr(key);
}

/**
 * Set expiry for key
 * 
 * @param key - Cache key
 * @param seconds - Expiry in seconds
 */
async function setExpiry(key: string, seconds: number): Promise<void> {
  const entry = cache.get(key);
  if (entry) {
    entry.expiresAt = Date.now() + (seconds * 1000);
  }
  
  // In production, use Redis:
  // const redis = await getRedisClient();
  // await redis.expire(key, seconds);
}

/**
 * Clean up expired entries (for in-memory cache)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Reset rate limit for a key (admin function)
 * 
 * @param key - Rate limit key
 */
export async function resetRateLimit(key: string): Promise<void> {
  cache.delete(key);
  
  // In production, use Redis:
  // const redis = await getRedisClient();
  // await redis.del(key);
}

/**
 * Get current rate limit status
 * 
 * @param key - Rate limit key
 * @param limit - Max requests allowed
 * @returns Current status
 */
export async function getRateLimitStatus(
  key: string,
  limit: number
): Promise<{ current: number; remaining: number }> {
  const entry = cache.get(key);
  const current = entry?.count || 0;
  const remaining = Math.max(0, limit - current);
  
  return { current, remaining };
  
  // In production, use Redis:
  // const redis = await getRedisClient();
  // const current = await redis.get(key);
  // const count = current ? parseInt(current) : 0;
  // return { current: count, remaining: Math.max(0, limit - count) };
}

// Made with Bob
