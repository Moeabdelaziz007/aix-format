/**
 * Pi Network KYC Adapter
 *
 * Thin wrapper around @axiom/pi for backward compatibility.
 * New code should import directly from '@axiom/pi'.
 *
 * @deprecated Use `verifyKyc` from `@axiom/pi` instead.
 */

export {
  verifyKyc,
  generateKycEnvelope,
  hashPiUid,
} from "@axiom/pi";
export type {
  KycInput as PiAuthResult,
  KycOptions as AdapterOptions,
  KycResult as GenerateIdentityResult,
  IdentityLayer,
  KycProof,
} from "@axiom/pi";
