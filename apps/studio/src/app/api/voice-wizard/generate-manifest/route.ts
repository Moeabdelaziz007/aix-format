import { NextResponse } from 'next/server';
import { buildManifestFromVoice, VoiceWizardData } from '@aix-core/voice/ManifestBuilder';
import { validateSovereignManifest } from '@/lib/protocol-validator';

/**
 * AIX Voice Wizard - Manifest Generation Endpoint
 * POST /api/voice-wizard/generate-manifest
 * 
 * Converts conversational data into a validated AIX v0.369.0 manifest
 */
export async function POST(req: Request) {
  try {
    const data: VoiceWizardData = await req.json();

    // Validate input data
    const inputErrors = validateInput(data);
    if (inputErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: inputErrors 
        },
        { status: 400 }
      );
    }

    // Build manifest from voice wizard data
    const { manifest, validation } = buildManifestFromVoice(data);

    // Perform additional sovereign protocol validation
    const sovereignValidation = validateSovereignManifest(manifest);

    // Combine validation results
    const allErrors = [
      ...validation.errors,
      ...sovereignValidation.errors
    ];

    const allWarnings = sovereignValidation.warnings;

    if (allErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Manifest validation failed',
          errors: allErrors,
          warnings: allWarnings,
          manifest // Return manifest for debugging
        },
        { status: 422 } // Unprocessable Entity
      );
    }

    // Success - return validated manifest
    return NextResponse.json({
      success: true,
      manifest,
      warnings: allWarnings,
      risk_score: sovereignValidation.risk_score,
      metadata: {
        generated_at: new Date().toISOString(),
        builder_version: '1.3.0',
        format_version: manifest.meta.format_version
      }
    });

  } catch (error: unknown) {
    console.error('[Manifest Generation] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate manifest',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Validate input data from voice wizard
 */
function validateInput(data: VoiceWizardData): string[] {
  const errors: string[] = [];

  if (!data.agentName || data.agentName.trim().length === 0) {
    errors.push('agentName is required');
  }

  if (data.agentName && data.agentName.length < 3) {
    errors.push('agentName must be at least 3 characters');
  }

  if (!data.role || data.role.trim().length === 0) {
    errors.push('role is required');
  }

  if (!data.capabilities || !Array.isArray(data.capabilities)) {
    errors.push('capabilities must be an array');
  } else if (data.capabilities.length === 0) {
    errors.push('At least one capability is required');
  }

  if (!data.identityPreference) {
    errors.push('identityPreference is required');
  } else if (!['pi_network', 'web', 'key', 'none'].includes(data.identityPreference)) {
    errors.push('identityPreference must be one of: pi_network, web, key, none');
  }

  if (!data.monetizationTier) {
    errors.push('monetizationTier is required');
  } else if (!['free', 'basic', 'premium', 'enterprise'].includes(data.monetizationTier)) {
    errors.push('monetizationTier must be one of: free, basic, premium, enterprise');
  }

  return errors;
}

// Made with Moe Abdelaziz
