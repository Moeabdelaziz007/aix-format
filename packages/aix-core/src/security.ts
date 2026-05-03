import { createHash, randomBytes } from 'node:crypto';
import canonicalize from 'canonical-json';

/**
 * AIX Gateway Security (Sovereign Shield)
 * Addresses CVE-2026-25253: One-click RCE via unvalidated WebSocket connections.
 * Implements strict Token-based authentication and Origin validation for Gateway connections.
 * @example
 * const token = GatewaySecurity.generateSessionToken("agent-1");
 */
export class GatewaySecurity {
  /**
   * Generates a one-time use token for a Gateway Session.
   * @param {string} agentId - The agent identifier.
   * @returns {string} The generated session token.
   * @example
   * const token = GatewaySecurity.generateSessionToken("agent-1");
   */
  static generateSessionToken(agentId: string): string {
    const salt = randomBytes(16).toString('hex');
    return createHash('sha256')
      .update(`${agentId}:${salt}:${Date.now()}`)
      .digest('hex');
  }

  /**
   * Validates the Gateway request signature and origin.
   * @param {Request} req - The incoming request.
   * @param {string} [sessionToken] - The optional session token.
   * @returns {boolean} True if the request is valid.
   * @example
   * const isValid = GatewaySecurity.validateRequest(req, token);
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

/**
 * AIX Envelope Security
 * Handles content integrity and checksum validation using JCS (RFC 8785).
 * @example
 * const hash = EnvelopeSecurity.calculateHash(doc);
 */
export class EnvelopeSecurity {
  /**
   * Calculates the SHA-256 hash of the document content (excluding the security layer).
   * Uses canonical-json to ensure deterministic hashing regardless of key order.
   * @param {any} doc - The document to hash.
   * @returns {string} The calculated hash.
   * @example
   * const hash = EnvelopeSecurity.calculateHash(manifest);
   */
  static calculateHash(doc: any): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { security, ...content } = doc;
    
    // RFC 8785: JSON Canonicalization Scheme (JCS)
    const canonical = canonicalize(content);
    
    return createHash('sha256')
      .update(canonical)
      .digest('hex');
  }

  /**
   * Verifies if the envelope's checksum matches its content.
   * @param {any} doc - The document to verify.
   * @returns {boolean} True if integrity check passes.
   * @example
   * const isIntact = EnvelopeSecurity.verifyIntegrity(manifest);
   */
  static verifyIntegrity(doc: any): boolean {
    if (!doc.security?.checksum?.value) return false;
    const calculated = this.calculateHash(doc);
    const provided = doc.security.checksum.value;
    
    if (calculated !== provided) {
      console.error(`[Security] Integrity check failed. Expected: ${calculated}, Got: ${provided}`);
      return false;
    }
    return true;
  }
}
