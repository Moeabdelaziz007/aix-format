/**
 * Rate Limiting Helper
 *
 * Provides rate limiting utilities for API routes using Redis
 *
 * @module rate-limit
 */

import { kv } from '@/lib/redis';

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
 * Check rate limit for a key using Redis
 *
 * @param key - Rate limit key (e.g., "ratelimit:invoke:user123")
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
    // Get current count from Redis
    const current = await kv.get<number>(key);
    const now = Math.floor(Date.now() / 1000);
    
    if (current === null) {
      // First request in window
      await kv.set(key, 1, { ex: windowSeconds });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowSeconds,
      };
    }
    
    if (current >= limit) {
      // Rate limit exceeded
      const ttl = await kv.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + (ttl > 0 ? ttl : windowSeconds),
      };
    }
    
    // Increment counter
    await kv.incr(key);
    
    return {
      allowed: true,
      remaining: limit - (current + 1),
      resetAt: now + (await kv.ttl(key)),
    };
    
  } catch (error) {
    console.error('[Rate Limit Error]', error);
    // On error, allow the request (fail open)
    return {
      allowed: true,
      remaining: limit,
      resetAt: Math.floor(Date.now() / 1000) + windowSeconds,
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

/**
 * Reset rate limit for a key (admin function)
 *
 * @param key - Rate limit key
 */
export async function resetRateLimit(key: string): Promise<void> {
  await kv.del(key);
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
  const current = await kv.get<number>(key);
  const count = current || 0;
  return { current: count, remaining: Math.max(0, limit - count) };
}

// Made with Moe Abdelaziz
