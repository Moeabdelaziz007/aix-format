import { NextRequest, NextResponse } from "next/server";
import { PiKycAdapter } from "@core/pi_kyc_adapter";
import { requireAuth, successResponse, ERR } from '@/lib/api-helpers';
import { z } from 'zod';

/**
 * POST /api/kyc/sign
 * Generates KYC identity signature from Pi Network verification
 *
 * SECURITY: Requires authentication
 * PRIVACY: Never logs sensitive identity data
 */

// Zod validation schema for KYC signing
const KYCSignSchema = z.object({
  user: z.object({
    uid: z.string().min(1, 'User UID is required')
  }),
  accessToken: z.string().min(1, 'Access token is required'),
  signature: z.string().min(1, 'Signature is required'),
  publicKey: z.string().min(1, 'Public key is required')
});

export async function POST(req: NextRequest) {
  try {
    // Auth check - KYC endpoints require authentication
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    // Parse and validate request body with Zod
    const rawBody = await req.json();
    const validationResult = KYCSignSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid KYC request',
        details: validationResult.error.issues
      }, { status: 400 });
    }
    
    const body = validationResult.data;

    // Generate KYC identity
    const result = PiKycAdapter.generateIdentity(body);

    return successResponse(result);
    
  } catch (error: unknown) {
    // NEVER log error details (may contain identity data)
    console.error('[kyc/sign] KYC signing failed (details redacted for security)');
    return ERR.INTERNAL('KYC signing failed');
  }
}
