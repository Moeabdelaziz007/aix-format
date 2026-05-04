import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * AIX Studio Middleware — Unified Governance Layer
 * 1. Protects /api routes from unauthenticated mutations.
 * 2. Bypasses discovery (.well-known) for AI agent crawlers.
 * 3. Injects security and protocol headers.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // 1. Discovery Bypass (Sovereign Pattern: Crawler Friendly)
  if (
    pathname.startsWith('/.well-known') ||
    pathname.startsWith('/api/.well-known') ||
    pathname.includes('/favicon.ico') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // 2. API Governance
  if (pathname.startsWith('/api')) {
    const authHeader = request.headers.get('authorization');
    const sessionCookie = request.cookies.get('aix-session');

    // Strict mutation check (POST/PUT/DELETE)
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      // In production, we require a valid Pi Network session or Auth header
      if (process.env.NODE_ENV === 'production' && !authHeader && !sessionCookie) {
        return NextResponse.json(
          { error: 'Unauthorized: Sovereign Identity required for mutations' },
          { status: 401 }
        );
      }
    }
  }

  // 3. Response Enrichment
  const response = NextResponse.next();
  response.headers.set('X-AIX-Protocol', '1.3.0');
  response.headers.set('X-AIX-Environment', process.env.NODE_ENV || 'development');
  response.headers.set('X-AIX-Arbiter', 'meta-1.3.0');

  // Standard Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

/**
 * Matcher configuration
 * Excludes static files for performance optimization.
 */
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
