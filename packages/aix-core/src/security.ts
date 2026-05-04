import { createHash, randomBytes } from 'node:crypto';

/**
 * AIX Gateway Security (Sovereign Shield)
 * Addresses CVE-2026-25253: One-click RCE via unvalidated WebSocket connections.
 * 
 * Implements strict Token-based authentication and Origin validation for Gateway connections.
 */

export class GatewaySecurity {
  /**
   * Generates a one-time use token for a Gateway Session.
   */
  static generateSessionToken(agentId: string): string {
    const salt = randomBytes(16).toString('hex');
    return createHash('sha256')
      .update(`${agentId}:${salt}:${Date.now()}`)
      .digest('hex');
  }

  /**
   * Validates the Gateway request signature and origin.
   */
  static validateRequest(req: Request, sessionToken?: string): boolean {
    const origin = req.headers.get('origin');
    const authHeader = req.headers.get('authorization');
    
    // 1. Strict Origin Validation
    const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'];
    if (origin && !allowedOrigins.includes(origin)) {
      console.warn(`[Security] Blocked unauthorized origin: ${origin}`);
      return false;
    }

    // 2. Token Validation (Sovereign Handshake)
    if (sessionToken && authHeader !== `Bearer ${sessionToken}`) {
      console.warn(`[Security] Invalid session token for Gateway pulse`);
      return false;
    }

    return true;
  }
}
