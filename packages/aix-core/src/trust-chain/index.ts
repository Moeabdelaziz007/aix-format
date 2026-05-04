/**
 * AIX Trust Chain - API Facade
 * Unifies the internal TrustChain implementation with external consumers.
 * 
 * Made with Moe Abdelaziz
 */

export { 
  getTrustChain, 
  TrustChain, 
  type SignatureData, 
  type LineageRecord 
} from '../trust-chain';

import { getTrustChain } from '../trust-chain';

/**
 * Singleton instance for simple consumers
 */
export const trustChain = getTrustChain();

// Legacy compatibility types if needed
export type TrustEntry = any; 
