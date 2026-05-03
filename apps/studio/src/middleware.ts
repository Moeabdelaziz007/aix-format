/**
 * Global API Middleware
 * 
 * ONE FILE protects 57+ routes instead of editing 67 files!
 * 
 * Security layers:
 * 1. Public routes → Allow immediately
 * 2. Auth routes → Require valid token
 * 3. Sensitive routes → Require token + strict rate limiting
 * 
 * @module middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { checkRateLimit, RATE_LIMITS, createRateLimitKey } from '@/lib/rate-limit';

/**
 * Public routes - no authentication required
 */
const PUBLIC_ROUTES = [
  '/api/health',
  '/api/spec',
  '/api/marketplace',          // Discovery is public
  '/api/mcp-discovery',
  '/api/pricing/oracle',
  '/api/pulse',
  '/api/gateway/pulse',
  '/api/space/graph',
  '/.well-known',
];

/**
 * Auth routes - require authentication only
 */
const AUTH_ROUTES = [
  '/api/agents',
  '/api/skills',
  '/api/analytics',
  '/api/registry',
  '/api/scan',
  '/api/compression',
  '/api/voice-wizard',
  '/api/fleet',
  '/api/abom-scan',
  '/api/knowledge',
  '/api/topology',
];

/**
 * Sensitive routes - require authentication + strict rate limiting
 * (Financial, KYC, Security operations)
 */
const SENSITIVE_ROUTES = [
  '/api/marketplace/stake',
  '/api/marketplace/unstake',
  '/api/marketplace/clone',
  '/api/kyc',
  '/api/stripe',
  '/api/pi/payment',
  '/api/pi/import-config',
  '/api/dna/sign',
  '/api/zkkyc',
  '/api/security/redline',
  '/api/rl/train',
  '/api/rl/evaluate',
  '/api/swarm/orchestrate',
  '/api/deploy-agent',
  '/api/agents/bulk-deploy',
  '/api/channels/telegram/setup',
  '/api/economics',
  '/api/mcp-router',
];

/**
 * Main middleware function
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip non-API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // 1. PUBLIC ROUTES → Allow immediately
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // 2. Extract and verify token
  const token = extractToken(req);
  
  if (!token) {
    return NextResponse.json(
      { 
        error: 'Unauthorized',
        code: 'NO_TOKEN',
        message: 'Authentication token is required'
      },
      { status: 401 }
    );
  }
  
  const user = await verifyToken(token);
  
  if (!user) {
    return NextResponse.json(
      { 
        error: 'Unauthorized',
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token'
      },
      { status: 401 }
    );
  }
  
  // 3. SENSITIVE ROUTES → Apply strict rate limiting
  if (isSensitiveRoute(pathname)) {
    const rateLimitResult = await applySensitiveRateLimit(pathname, user.id);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded for sensitive operation',
          resetAt: rateLimitResult.resetAt
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(getRateLimitForRoute(pathname).limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetAt)
          }
        }
      );
    }
  }
  
  // 4. AUTH ROUTES → Apply general rate limiting
  if (isAuthRoute(pathname)) {
    const rateLimitResult = await applyGeneralRateLimit(pathname, user.id);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          resetAt: rateLimitResult.resetAt
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMITS.API_GENERAL.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetAt)
          }
        }
      );
    }
  }
  
  // 5. Add user info to request headers for downstream use
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-email', user.email);
  if (user.role) {
    requestHeaders.set('x-user-role', user.role);
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if route requires auth
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if route is sensitive
 */
function isSensitiveRoute(pathname: string): boolean {
  return SENSITIVE_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Extract token from request
 */
function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

/**
 * Apply strict rate limiting for sensitive routes
 */
async function applySensitiveRateLimit(pathname: string, userId: string) {
  const config = getRateLimitForRoute(pathname);
  const key = createRateLimitKey('sensitive', userId, pathname);
  
  return await checkRateLimit(key, config.limit, config.windowSeconds);
}

/**
 * Apply general rate limiting for auth routes
 */
async function applyGeneralRateLimit(pathname: string, userId: string) {
  const key = createRateLimitKey('general', userId);
  
  return await checkRateLimit(
    key,
    RATE_LIMITS.API_GENERAL.limit,
    RATE_LIMITS.API_GENERAL.windowSeconds
  );
}

/**
 * Get rate limit config for specific route
 */
function getRateLimitForRoute(pathname: string): { limit: number; windowSeconds: number } {
  // Financial operations
  if (pathname.includes('/stake') || pathname.includes('/unstake')) {
    return RATE_LIMITS.MARKETPLACE_STAKE;
  }
  
  // KYC operations
  if (pathname.includes('/kyc/sign')) {
    return RATE_LIMITS.KYC_SIGN;
  }
  if (pathname.includes('/kyc')) {
    return RATE_LIMITS.KYC_VERIFY;
  }
  
  // Payment operations
  if (pathname.includes('/payment') || pathname.includes('/stripe') || pathname.includes('/pi/payment')) {
    return RATE_LIMITS.PAYMENT_SETUP;
  }
  
  // Agent operations
  if (pathname.includes('/invoke')) {
    return RATE_LIMITS.AGENT_INVOKE;
  }
  if (pathname.includes('/train')) {
    return RATE_LIMITS.AGENT_TRAIN;
  }
  if (pathname.includes('/deploy')) {
    return RATE_LIMITS.AGENT_DEPLOY;
  }
  if (pathname.includes('/clone')) {
    return RATE_LIMITS.AGENT_CLONE;
  }
  
  // Default: Heavy API operations
  return RATE_LIMITS.API_HEAVY;
}

/**
 * Middleware configuration
 * Apply to all API routes
 */
export const config = {
  matcher: ['/api/:path*'],
};

// Made with Moe Abdelaziz
