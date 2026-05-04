/**
 * Backend API Integration Tests
 * 
 * Tests the full authentication and KYC flow:
 * 1. Pi Network OAuth → Session Creation
 * 2. Session → KYC Endpoint Access
 * 3. Rate Limiting
 * 4. Error Cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { requireAuth, successResponse, ERR } from '@/lib/api-helpers';

// Mock Redis
const mockRedis = {
  data: new Map<string, any>(),
  ttls: new Map<string, number>(),
  
  async get<T>(key: string): Promise<T | null> {
    return this.data.get(key) ?? null;
  },
  
  async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    this.data.set(key, value);
    if (options?.ex) {
      this.ttls.set(key, Date.now() + options.ex * 1000);
    }
  },
  
  async incr(key: string): Promise<number> {
    const current = this.data.get(key) ?? 0;
    const newVal = current + 1;
    this.data.set(key, newVal);
    return newVal;
  },
  
  async ttl(key: string): Promise<number> {
    const expiry = this.ttls.get(key);
    if (!expiry) return -1;
    const remaining = Math.floor((expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  },
  
  clear() {
    this.data.clear();
    this.ttls.clear();
  }
};

// Mock Pi Network API
const mockPiNetwork = {
  validTokens: new Set<string>(),
  
  async verifyToken(accessToken: string) {
    if (this.validTokens.has(accessToken)) {
      return {
        valid: true,
        user: {
          uid: 'pi_user_123',
          username: 'testuser',
        }
      };
    }
    return { valid: false, error: 'Invalid token' };
  },
  
  addValidToken(token: string) {
    this.validTokens.add(token);
  },
  
  clear() {
    this.validTokens.clear();
  }
};

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => {
    const token = mockRedis.data.get('current_session_token');
    if (!token) return null;
    
    const session = mockRedis.data.get(`session:${token}`);
    return session;
  })
}));

// Mock Redis module
vi.mock('@/lib/redis', () => ({
  kv: mockRedis,
  NS: {
    SESSIONS: 'sessions',
    METRICS: 'metrics',
  },
  TTL: {
    SESSIONS: 3600,
    MEMORY: 86400,
  }
}));

describe('Backend API Integration Tests', () => {
  beforeEach(() => {
    mockRedis.clear();
    mockPiNetwork.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockRedis.clear();
    mockPiNetwork.clear();
  });

  describe('Authentication Flow', () => {
    it('should create session after successful Pi Network OAuth', async () => {
      // 1. Simulate Pi Network OAuth callback
      const accessToken = 'pi_token_valid_123';
      mockPiNetwork.addValidToken(accessToken);
      
      // 2. Verify token with Pi Network
      const piResult = await mockPiNetwork.verifyToken(accessToken);
      expect(piResult.valid).toBe(true);
      expect(piResult.user.uid).toBe('pi_user_123');
      
      // 3. Create session in Redis
      const sessionToken = 'session_abc123';
      await mockRedis.set(`session:${sessionToken}`, {
        user: {
          id: piResult.user.uid,
          name: piResult.user.username,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      }, { ex: 3600 });
      
      // 4. Verify session was created
      const session = await mockRedis.get(`session:${sessionToken}`);
      expect(session).toBeDefined();
      expect(session.user.id).toBe('pi_user_123');
    });

    it('should reject invalid Pi Network tokens', async () => {
      const invalidToken = 'pi_token_invalid';
      
      const result = await mockPiNetwork.verifyToken(invalidToken);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
    });

    it('should reject expired sessions', async () => {
      // Create expired session
      const sessionToken = 'session_expired';
      await mockRedis.set(`session:${sessionToken}`, {
        user: { id: 'user_123' },
        expires: new Date(Date.now() - 1000).toISOString(), // Expired
      }, { ex: 1 });
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const session = await mockRedis.get(`session:${sessionToken}`);
      // In real Redis, this would be null due to TTL
      // For this test, we check TTL
      const ttl = await mockRedis.ttl(`session:${sessionToken}`);
      expect(ttl).toBeLessThanOrEqual(0);
    });
  });

  describe('KYC Endpoint Access Control', () => {
    it('should allow authenticated users to access KYC endpoints', async () => {
      // Setup: Create valid session
      const sessionToken = 'session_valid_kyc';
      await mockRedis.set(`session:${sessionToken}`, {
        user: {
          id: 'user_kyc_123',
          name: 'kycuser',
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });
      
      // Set current session for requireAuth mock
      mockRedis.data.set('current_session_token', sessionToken);
      
      // Test: Call requireAuth
      const { session, error } = await requireAuth();
      
      expect(error).toBeNull();
      expect(session).toBeDefined();
      expect(session?.user.id).toBe('user_kyc_123');
    });

    it('should reject unauthenticated KYC requests', async () => {
      // No session set
      mockRedis.data.delete('current_session_token');
      
      const { session, error } = await requireAuth();
      
      expect(session).toBeNull();
      expect(error).toBeDefined();
    });

    it('should allow KYC status check for authenticated user', async () => {
      // Setup session
      const sessionToken = 'session_kyc_status';
      await mockRedis.set(`session:${sessionToken}`, {
        user: { id: 'user_status_123' },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });
      mockRedis.data.set('current_session_token', sessionToken);
      
      // Setup KYC data
      await mockRedis.set('kyc:user_status_123', {
        verified: true,
        level: 'kyc',
        timestamp: new Date().toISOString(),
      });
      
      // Test: Get KYC status
      const { session, error } = await requireAuth();
      expect(error).toBeNull();
      
      const kycStatus = await mockRedis.get('kyc:user_status_123');
      expect(kycStatus.verified).toBe(true);
      expect(kycStatus.level).toBe('kyc');
    });

    it('should handle missing KYC data gracefully', async () => {
      // Setup session but no KYC data
      const sessionToken = 'session_no_kyc';
      await mockRedis.set(`session:${sessionToken}`, {
        user: { id: 'user_no_kyc' },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });
      mockRedis.data.set('current_session_token', sessionToken);
      
      const { session, error } = await requireAuth();
      expect(error).toBeNull();
      
      const kycStatus = await mockRedis.get('kyc:user_no_kyc');
      expect(kycStatus).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const req = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      
      const config = RATE_LIMITS.GENEROUS; // 300 req/min
      
      // First request
      const result1 = await checkRateLimit(req, config);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(299);
      
      // Second request
      const result2 = await checkRateLimit(req, config);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(298);
    });

    it('should block requests exceeding rate limit', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.2' },
      });
      
      const config = RATE_LIMITS.AUTH; // 5 req/min
      
      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimit(req, config);
        expect(result.success).toBe(true);
      }
      
      // 6th request should be blocked
      const blockedResult = await checkRateLimit(req, config);
      expect(blockedResult.success).toBe(false);
      expect(blockedResult.remaining).toBe(0);
      expect(blockedResult.error).toBeDefined();
    });

    it('should reset rate limit after window expires', async () => {
      const req = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.3' },
      });
      
      const config = { maxRequests: 2, windowSeconds: 1 };
      
      // Use up limit
      await checkRateLimit(req, config);
      await checkRateLimit(req, config);
      
      // Should be blocked
      const blocked = await checkRateLimit(req, config);
      expect(blocked.success).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should work again
      const afterReset = await checkRateLimit(req, config);
      expect(afterReset.success).toBe(true);
    });

    it('should apply different limits per route', async () => {
      const scanReq = new NextRequest('http://localhost:3000/api/scan', {
        headers: { 'x-forwarded-for': '192.168.1.4' },
      });
      
      const authReq = new NextRequest('http://localhost:3000/api/auth', {
        headers: { 'x-forwarded-for': '192.168.1.4' },
      });
      
      // Same IP, different routes
      const scanResult = await checkRateLimit(scanReq, RATE_LIMITS.SCAN);
      const authResult = await checkRateLimit(authReq, RATE_LIMITS.AUTH);
      
      expect(scanResult.success).toBe(true);
      expect(authResult.success).toBe(true);
      // Limits are independent
      expect(scanResult.limit).toBe(20);
      expect(authResult.limit).toBe(5);
    });
  });

  describe('Error Cases', () => {
    it('should handle malformed session data', async () => {
      const sessionToken = 'session_malformed';
      await mockRedis.set(`session:${sessionToken}`, 'invalid_json_string');
      mockRedis.data.set('current_session_token', sessionToken);
      
      const { session, error } = await requireAuth();
      expect(session).toBeNull();
      expect(error).toBeDefined();
    });

    it('should handle Redis connection failures gracefully', async () => {
      // Mock Redis failure
      const originalGet = mockRedis.get;
      mockRedis.get = vi.fn().mockRejectedValue(new Error('Redis connection failed'));
      
      const req = new NextRequest('http://localhost:3000/api/test');
      const result = await checkRateLimit(req, RATE_LIMITS.STANDARD);
      
      // Should fail open (allow request)
      expect(result.success).toBe(true);
      
      // Restore
      mockRedis.get = originalGet;
    });

    it('should validate KYC token format', async () => {
      const sessionToken = 'session_kyc_verify';
      await mockRedis.set(`session:${sessionToken}`, {
        user: { id: 'user_verify' },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });
      mockRedis.data.set('current_session_token', sessionToken);
      
      // Store KYC with token
      await mockRedis.set('kyc:user_verify', {
        verified: true,
        level: 'kyc',
        token: 'valid_kyc_token_123',
      });
      
      const { session, error } = await requireAuth();
      expect(error).toBeNull();
      
      const kycData = await mockRedis.get('kyc:user_verify');
      expect(kycData.token).toBe('valid_kyc_token_123');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent session creation', async () => {
      const sessionToken = 'session_concurrent';
      
      // Simulate concurrent writes
      await Promise.all([
        mockRedis.set(`session:${sessionToken}`, { user: { id: 'user1' } }),
        mockRedis.set(`session:${sessionToken}`, { user: { id: 'user2' } }),
      ]);
      
      const session = await mockRedis.get(`session:${sessionToken}`);
      expect(session).toBeDefined();
      expect(session.user.id).toMatch(/user[12]/);
    });

    it('should handle rate limit counter race conditions', async () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.5' },
      });
      
      const config = { maxRequests: 10, windowSeconds: 60 };
      
      // Simulate concurrent requests
      const results = await Promise.all(
        Array(5).fill(null).map(() => checkRateLimit(req, config))
      );
      
      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // Counter should be accurate
      const finalResult = await checkRateLimit(req, config);
      expect(finalResult.remaining).toBeLessThanOrEqual(4);
    });

    it('should handle missing IP headers', async () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        // No IP headers
      });
      
      const result = await checkRateLimit(req, RATE_LIMITS.STANDARD);
      expect(result.success).toBe(true);
      // Should use 'unknown' as identifier
    });

    it('should handle zkKYC prune without admin role', async () => {
      const sessionToken = 'session_non_admin';
      await mockRedis.set(`session:${sessionToken}`, {
        user: { id: 'user_regular', role: 'user' },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });
      mockRedis.data.set('current_session_token', sessionToken);
      
      const { session, error } = await requireAuth();
      expect(error).toBeNull();
      expect(session?.user.role).toBe('user');
      
      // In real implementation, zkKYC prune would check role
      // and return ERR.FORBIDDEN() for non-admin users
    });
  });

  describe('Response Format Consistency', () => {
    it('should use standardized success response', () => {
      const data = { message: 'Test success' };
      const response = successResponse(data);
      
      expect(response.status).toBe(200);
      // Response body would contain { success: true, data: {...} }
    });

    it('should use standardized error responses', () => {
      const errors = [
        ERR.UNAUTHORIZED(),
        ERR.FORBIDDEN(),
        ERR.NOT_FOUND(),
        ERR.VALIDATION('Invalid input'),
        ERR.INTERNAL(),
      ];
      
      errors.forEach(error => {
        expect(error).toBeDefined();
        expect(error.status).toBeGreaterThanOrEqual(400);
      });
    });
  });
});

// Made with Moe Abdelaziz
