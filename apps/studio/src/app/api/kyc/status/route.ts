import { requireAuth, successResponse } from '@/lib/api-helpers';
import { kv } from '@/lib/redis';
import { KEYS } from '@/lib/redis-keys';

/**
 * GET /api/kyc/status
 * Returns the current user's KYC verification status
 * 
 * SECURITY: Requires authentication - users can only check their own status
 */
export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    // Fetch KYC status from Redis
    const kycKey = KEYS.kycStatus(session.user.id);
    const status = await kv.get<{
      verified: boolean;
      level: 'none' | 'basic' | 'kyc' | 'zkkyc';
      timestamp: string;
    }>(kycKey);

    return successResponse({
      userId: session.user.id,
      verified: status?.verified ?? false,
      level: status?.level ?? 'none',
      verifiedAt: status?.timestamp ?? null,
    });
    
  } catch (error: unknown) {
    console.error('[kyc/status] Failed to fetch KYC status');
    return successResponse({
      userId: 'unknown',
      verified: false,
      level: 'none',
      verifiedAt: null,
    });
  }
}

// Made with Moe Abdelaziz
