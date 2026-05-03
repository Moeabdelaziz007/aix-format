import { NextRequest } from 'next/server';
import { successResponse, errorResponse, parseBody, ERR } from '@/lib/api-helpers';
import { ProofVerifier, ZKProof } from '@aix-format/aix-zkkyc';
import { NullifierRegistry } from '@aix-format/aix-zkkyc';

/**
 * POST /api/zkkyc/verify-proof
 * Verifies a zero-knowledge proof using groth16 cryptographic verification
 * 
 * SECURITY:
 * - Validates proof cryptographically using snarkjs groth16
 * - Prevents replay attacks via NullifierRegistry
 * - Enforces timestamp recency (5 minute window)
 * - Validates nullifier format (64-char hex)
 * 
 * PRIVACY:
 * - Never logs sensitive proof data
 * - Only stores nullifier hash for replay prevention
 * - No personal information exposed in responses
 */

// Singleton instances for performance
let verifierInstance: ProofVerifier | null = null;
let registryInstance: NullifierRegistry | null = null;

/**
 * Get or create ProofVerifier instance
 */
function getVerifier(): ProofVerifier {
  if (!verifierInstance) {
    // Initialize registry (30 days TTL)
    registryInstance = new NullifierRegistry(30 * 24 * 60 * 60 * 1000);
    
    // Load verification key from environment or use default
    // In production, this should be loaded from a secure location
    const verificationKey = process.env.ZK_VERIFICATION_KEY 
      ? JSON.parse(process.env.ZK_VERIFICATION_KEY)
      : getDefaultVerificationKey();
    
    // Initialize verifier with 5 minute proof expiry
    verifierInstance = new ProofVerifier(
      registryInstance,
      verificationKey,
      5 * 60 * 1000 // 5 minutes
    );
  }
  
  return verifierInstance;
}

/**
 * Default verification key for development/testing
 * In production, this should be replaced with actual verification key
 */
function getDefaultVerificationKey() {
  // This is a placeholder - in production, load from secure storage
  return {
    protocol: "groth16",
    curve: "bn128",
    nPublic: 1,
    vk_alpha_1: [],
    vk_beta_2: [],
    vk_gamma_2: [],
    vk_delta_2: [],
    vk_alphabeta_12: [],
    IC: []
  };
}

/**
 * Request body interface
 */
interface VerifyProofRequest {
  proof: Record<string, unknown>;
  publicSignals: string[];
  nullifier: string;
  timestamp: number;
  verificationKey?: Record<string, unknown>; // Optional override
}

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const { body, error } = await parseBody<VerifyProofRequest>(req);
    if (error) return error;

    // Validate required fields
    if (!body.proof || !body.publicSignals || !body.nullifier || !body.timestamp) {
      return ERR.VALIDATION('Missing required fields: proof, publicSignals, nullifier, timestamp');
    }

    // Validate publicSignals is an array
    if (!Array.isArray(body.publicSignals)) {
      return ERR.VALIDATION('publicSignals must be an array');
    }

    // Validate timestamp is a number
    if (typeof body.timestamp !== 'number') {
      return ERR.VALIDATION('timestamp must be a number');
    }

    // Validate nullifier is a string
    if (typeof body.nullifier !== 'string') {
      return ERR.VALIDATION('nullifier must be a string');
    }

    // Construct ZKProof object
    const zkProof: ZKProof = {
      proof: body.proof,
      publicSignals: body.publicSignals,
      nullifier: body.nullifier,
      timestamp: body.timestamp
    };

    // Get verifier instance
    const verifier = getVerifier();

    // Perform verification
    const result = await verifier.verify(zkProof);

    // Handle verification result
    if (!result.valid) {
      // Map error codes to HTTP status codes
      switch (result.errorCode) {
        case 'REPLAY_ATTACK':
          return errorResponse(
            'REPLAY_ATTACK',
            result.error || 'Proof has already been used',
            409 // Conflict
          );
        
        case 'EXPIRED':
          return errorResponse(
            'PROOF_EXPIRED',
            result.error || 'Proof has expired',
            400 // Bad Request
          );
        
        case 'INVALID_NULLIFIER':
          return errorResponse(
            'INVALID_NULLIFIER',
            result.error || 'Invalid nullifier format',
            400 // Bad Request
          );
        
        case 'INVALID_PROOF':
        default:
          return errorResponse(
            'INVALID_PROOF',
            result.error || 'Proof verification failed',
            400 // Bad Request
          );
      }
    }

    // Success - proof is valid and nullifier has been registered

    return successResponse({
      verified: true,
      nullifier: result.nullifier,
      timestamp: new Date().toISOString()
    }, 200);

  } catch (error: unknown) {
    // NEVER log error details (may contain sensitive proof data)
    console.error('[zkKYC Verify] Operation failed (details redacted)');
    return ERR.INTERNAL('Proof verification failed');
  }
}

// Made with Moe Abdelaziz
