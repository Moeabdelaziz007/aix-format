import { kv } from './redis';

/**
 * AIX Rate Limiter (Redis-backed)
 * Uses a sliding window (or simple counter for now) to limit requests.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const current = await kv.get<number>(key) ?? 0;
    
    if (current >= limit) {
      return false;
    }
    
    await kv.set(key, current + 1, { ex: windowSeconds });
    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Fail open to avoid blocking users on Redis issues
  }
}
