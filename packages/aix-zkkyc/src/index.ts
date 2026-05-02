/**
 * @aix-format/aix-zkkyc
 * 
 * Zero-Knowledge KYC verification module for AIX Format
 * Provides cryptographic proof verification and replay attack prevention
 */

// Export ProofVerifier and related types
export { ProofVerifier } from './ProofVerifier';
export type { ZKProof, VerificationResult } from './ProofVerifier';

// Export NullifierRegistry and related types
export { NullifierRegistry, ProofReplayError } from './NullifierRegistry';
export type { NullifierRecord } from './NullifierRegistry';

// Made with Bob
