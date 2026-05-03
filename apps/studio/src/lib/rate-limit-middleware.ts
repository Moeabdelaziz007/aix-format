import { NextRequest } from 'next/server';
import { kv } from '@/lib/redis';
import { ERR } from '@/lib/api-helpers';

/**
 * Rate Limiting Middleware
 * 
 * Implements token bucket algorithm with Redis for distributed rate limiting.
 * Supports per-IP and per-user rate limits.
 */

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Optional: Use user ID instead of IP for authenticated routes */
  useUserId?: boolean;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  error?: ReturnType<typeof ERR.RATE_LIMITED>;
}

/**
 * Check rate limit for a request
 * 
 * @param req - Next.js request object
 * @param config - Rate limit configuration
 * @param userId - Optional user ID for authenticated routes
 * @returns Rate limit result with remaining quota
 */
export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  userId?: string
): Promise<RateLimitResult> {
  try {
    // Determine identifier (IP or user ID)
    const identifier = userId || getClientIp(req);
    const route = new URL(req.url).pathname;
    
    // Redis key for this rate limit
    const key = `ratelimit:${identifier}:${route}`;
    
    // Get current count
    const current = await kv.get<number>(key);
    const now = Math.floor(Date.now() / 1000);
    
    if (current === null) {
      // First request in window
      await kv.set(key, 1, { ex: config.windowSeconds });
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: now + config.windowSeconds,
      };
    }
    
    if (current >= config.maxRequests) {
      // Rate limit exceeded
      const ttl = await kv.ttl(key);
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: now + (ttl > 0 ? ttl : config.windowSeconds),
        error: ERR.RATE_LIMITED(
          `Rate limit exceeded. Try again in ${ttl > 0 ? ttl : config.windowSeconds} seconds.`
        ),
      };
    }
    
    // Increment counter
    await kv.incr(key);
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - (current + 1),
      reset: now + (await kv.ttl(key)),
    };
    
  } catch (error) {
    console.error('[rate-limit] Check failed:', error);
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Math.floor(Date.now() / 1000) + config.windowSeconds,
    };
  }
}

/**
 * Extract client IP from request
 * Handles various proxy headers (Vercel, Cloudflare, etc.)
 */
function getClientIp(req: NextRequest): string {
  // Check common proxy headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to 'unknown' if no IP found
  return 'unknown';
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  /** Strict: 10 requests per minute (for sensitive operations) */
  STRICT: {
    maxRequests: 10,
    windowSeconds: 60,
  },
  
  /** Standard: 60 requests per minute (for normal API calls) */
  STANDARD: {
    maxRequests: 60,
    windowSeconds: 60,
  },
  
  /** Generous: 300 requests per minute (for public endpoints) */
  GENEROUS: {
    maxRequests: 300,
    windowSeconds: 60,
  },
  
  /** Scan: 20 requests per hour (for expensive operations) */
  SCAN: {
    maxRequests: 20,
    windowSeconds: 3600,
  },
  
  /** Auth: 5 requests per minute (for login/signup) */
  AUTH: {
    maxRequests: 5,
    windowSeconds: 60,
  },
} as const;

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Made with Moe Abdelaziz
