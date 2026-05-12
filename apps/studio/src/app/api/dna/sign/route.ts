import { NextRequest } from 'next/server';
import { generateDNAFingerprint } from '@aix-core';
import { successResponse, ERR, parseBody } from '@/lib/api-helpers';

/**
 * POST /api/dna/sign
 * Generates DNA fingerprint hash for an agent manifest
 *
 * PUBLIC: No auth required - allows public DNA generation
 */
export async function POST(req: NextRequest) {
  try {
    const { body, error } = await parseBody<any>(req);
    if (error) return error;

    if (!body || typeof body !== 'object') {
      return ERR.VALIDATION('Valid manifest object required');
    }

    const hash = generateDNAFingerprint(body);
    return successResponse({ dna_hash: hash });
    
  } catch (error: unknown) {
    console.error('[dna/sign] DNA generation failed:', error.message);
    return ERR.INTERNAL('DNA fingerprint generation failed');
  }
}
