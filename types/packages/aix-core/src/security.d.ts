/**
 * AIX Gateway Security (Sovereign Shield)
 * Addresses CVE-2026-25253: One-click RCE via unvalidated WebSocket connections.
 *
 * Implements strict Token-based authentication and Origin validation for Gateway connections.
 */
export declare class GatewaySecurity {
    /**
     * Generates a one-time use token for a Gateway Session.
     */
    static generateSessionToken(agentId: string): string;
    /**
     * Validates the Gateway request signature and origin.
     */
    static validateRequest(req: Request, sessionToken?: string): boolean;
}
/**
 * AIX Envelope Security
 * Handles content integrity and checksum validation using JCS (RFC 8785).
 */
export declare class EnvelopeSecurity {
    /**
     * Calculates the SHA-256 hash of the document content (excluding the security layer).
     * Uses canonical-json to ensure deterministic hashing regardless of key order.
     */
    static calculateHash(doc: any): string;
    /**
     * Verifies if the envelope's checksum matches its content.
     */
    static verifyIntegrity(doc: any): boolean;
}
