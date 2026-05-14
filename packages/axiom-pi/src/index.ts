/**
 * @axiom/pi — Unified Pi Network integration for the AIX Sovereign Stack.
 *
 * Public API:
 *   - authenticateUser     Pi SDK login (browser) / bypass (server)
 *   - verifyKyc            Generate KYC proof + identity layer from auth result
 *   - generateKycEnvelope  Generate a full AIX KYC manifest
 *   - createPayment        Create user-to-app Pi payment
 *   - getPiEnv             Server-side Pi environment configuration
 */

export { authenticateUser } from "./auth.js";
export type { PiUser } from "./auth.js";

export { verifyKyc, generateKycEnvelope, hashPiUid } from "./kyc.js";
export type { KycOptions, KycProof, IdentityLayer, KycResult } from "./kyc.js";

export { createPayment } from "./payment.js";
export type { PaymentInput, PaymentCallbacks } from "./payment.js";

export { getPiEnv, __resetPiEnvCache } from "./env.js";
export type { PiEnv } from "./env.js";
