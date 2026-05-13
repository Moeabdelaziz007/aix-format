/**
 * Distributed Rate Limiting for AIX Studio
 * Powered by aix-core Sovereign Storage.
 *
 * Made with Moe Abdelaziz
 */

import { AIXTokenBucket, RATE_LIMITS } from '@aix-core';

// Studio-specific limits
export const STUDIO_LIMITS = {
  ...RATE_LIMITS,
  AUTH: { capacity: 5, windowMs: 60000 }, // 5 auth attempts per minute
  DEPLOY: { capacity: 3, windowMs: 300000 }, // 3 deploys per 5 minutes
};

/**
 * Check if a request should be rate limited.
 *
 * @param identifier - Unique identifier (IP, userId, etc.)
 * @param action - The action being performed
 * @returns boolean - true if allowed, false if limited
 */
export async function checkRateLimit(
  identifier: string,
  action: keyof typeof STUDIO_LIMITS = 'INVOKE'
): Promise<boolean> {
  const config = STUDIO_LIMITS[action];
  const bucket = new AIXTokenBucket(config.capacity, config.windowMs);

  try {
    const isAllowed = await bucket.consume(`${identifier}:${action}`);
    return isAllowed;
  } catch (error) {
    console.error(`[RateLimit] Failed to check limit for ${identifier}:`, error);
    // Fail-closed in studio for security
    return false;
  }
}

// Made with Moe Abdelaziz
