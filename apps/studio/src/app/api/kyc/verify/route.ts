import { NextRequest } from 'next/server';
import { requireAuth, successResponse, ERR, parseBody } from '@/lib/api-helpers';
import { kv } from '@/lib/redis';
import { KEYS } from '@/lib/redis-keys';

/**
 * POST /api/kyc/verify
 * Verifies an existing KYC token for the authenticated user
 * 
 * SECURITY: Requires authentication - users can only verify their own tokens
 * PRIVACY: Never logs token values or verification details
 */

interface VerifyRequest {
  kycToken: string;
}

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { body, error: parseError } = await parseBody<VerifyRequest>(req);
    if (parseError) return parseError;

    if (!body.kycToken) {
      return ERR.VALIDATION('kycToken is required');
    }

    // Verify token against stored KYC data
    const kycKey = KEYS.kycStatus(session.user.id);
    const storedKyc = await kv.get<{
      token?: string;
      verified: boolean;
      level: string;
    }>(kycKey);

    // Check if token matches and KYC is verified
    const isValid = storedKyc?.verified === true && 
                    storedKyc?.token === body.kycToken;

    return successResponse({ 
      valid: isValid,
      level: isValid ? storedKyc?.level : 'none',
    });
    
  } catch (error: unknown) {
    // NEVER log error details (may contain token data)
    console.error('[kyc/verify] Token verification failed (details redacted)');
    return ERR.INTERNAL('Token verification failed');
  }
}

// Made with Moe Abdelaziz
