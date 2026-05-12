import { NextRequest } from 'next/server';
import { AIXTokenBucket } from '@aix-core';

/**
 * Rate Limit Configurations
 */
export const RATE_LIMITS = {
  STANDARD: { maxRequests: 60, windowSeconds: 60 },
  AUTH: { maxRequests: 5, windowSeconds: 60 },
  SCAN: { maxRequests: 20, windowSeconds: 60 },
  GENEROUS: { maxRequests: 300, windowSeconds: 60 },
};

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  reset: number;
  error?: string;
}

/**
 * Check rate limit for a request
 *
 * @param req - Next.js request
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.STANDARD
): Promise<RateLimitResult> {
  // Get IP from headers or fallback
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') ||
             'unknown';

  // Create a unique key per route and IP
  const url = new URL(req.url);
  const path = url.pathname;
  const key = `${path}:${ip}`;

  try {
    // Use AIXTokenBucket from aix-core for Redis-backed distributed rate limiting
    const bucket = new AIXTokenBucket(config.maxRequests, config.windowSeconds * 1000);

    // Attempt to consume 1 token
    const success = await bucket.consume(key, 1);

    return {
      success,
      remaining: success ? -1 : 0,
      limit: config.maxRequests,
      reset: Math.floor(Date.now() / 1000) + config.windowSeconds,
      error: success ? undefined : 'Rate limit exceeded'
    };

  } catch (error) {
    console.error('[RateLimit] Error checking limit:', error);
    // Security First: Fail closed in case of rate limiter error
    return {
      success: false,
      remaining: 0,
      limit: config.maxRequests,
      reset: 0,
      error: 'Rate limit check failed'
    };
  }
}

// Made with Moe Abdelaziz
