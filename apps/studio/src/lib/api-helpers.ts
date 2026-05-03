import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { NextRequest } from 'next/server'

// ─── Response Helpers ───────────────────────────────────────

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(
  code: string,
  message: string,
  status: number
) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// ─── Standard Error Codes ───────────────────────────────────

export const ERR = {
  UNAUTHORIZED:    (m = 'Authentication required')   => errorResponse('UNAUTHORIZED', m, 401),
  FORBIDDEN:       (m = 'Permission denied')         => errorResponse('FORBIDDEN', m, 403),
  NOT_FOUND:       (m = 'Resource not found')        => errorResponse('NOT_FOUND', m, 404),
  VALIDATION:      (m = 'Invalid request data')      => errorResponse('VALIDATION_ERROR', m, 400),
  INTERNAL:        (m = 'An unexpected error occurred') => errorResponse('INTERNAL_ERROR', m, 500),
  PI_AUTH_FAILED:  (m = 'Pi Network authentication failed') => errorResponse('PI_AUTH_FAILED', m, 401),
  KYC_REQUIRED:    (m = 'KYC verification required') => errorResponse('KYC_REQUIRED', m, 403),
  RATE_LIMITED:    (m = 'Too many requests')         => errorResponse('RATE_LIMITED', m, 429),
  NOT_CONFIGURED:  (m = 'Service not configured')    => errorResponse('SERVICE_NOT_CONFIGURED', m, 503),
} as const

// ─── Auth Guard ─────────────────────────────────────────────

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { session: null, error: ERR.UNAUTHORIZED() }
  return { session, error: null }
}

// ─── Body Parser ────────────────────────────────────────────

export async function parseBody<T>(req: NextRequest): Promise<
  { body: T; error: null } | { body: null; error: NextResponse }
> {
  try {
    const body = await req.json() as T
    return { body, error: null }
  } catch {
    return { body: null, error: ERR.VALIDATION('Invalid JSON body') }
  }
}

// ─── Env Guard ──────────────────────────────────────────────

export function requireEnv(key: string): string | null {
  const val = process.env[key]
  if (!val) {
    console.error(`[api-helpers] Missing required env: ${key}`)
    return null
  }
  return val
}

// Made with Moe Abdelaziz
