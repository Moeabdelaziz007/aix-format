import { NextRequest, NextResponse } from 'next/server';
import { identity } from '@aix-core';
import { requireAuth } from '@/lib/api-helpers';

/**
 * API: KYC Verification
 * ENTRY: HTTP Gate for Identity.
 * 
 * Thin wrapper over IdentityService.
 * Made with Moe Abdelaziz
 */

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const { kycToken } = body;

    if (!kycToken) {
      return NextResponse.json({ error: 'kycToken is required' }, { status: 400 });
    }

    const isValid = await identity.verifyKycToken(session.user.id, kycToken);
    const status = await identity.getKycStatus(session.user.id);

    return NextResponse.json({ 
      valid: isValid,
      level: isValid ? status.level : 'none',
    });
    
  } catch (error: any) {
    console.error('[API:Identity] Verification failed (redacted)');
    return NextResponse.json({ error: 'Token verification failed' }, { status: 500 });
  }
}

// Made with Moe Abdelaziz
