import { describe, it, expect, vi } from 'vitest';
import { generateToken, verifyToken, hashPassword, verifyPassword } from './auth';
import jwt from 'jsonwebtoken';

// Mock env for testing
vi.mock('./env', () => ({
  env: {
    JWT_SECRET: 'test_secret_369'
  }
}));

describe('Auth Utilities', () => {
  const user = {
    id: 'user_123',
    email: 'test@example.com',
    role: 'user'
  };

  it('should generate and verify a valid token', async () => {
    const token = await generateToken(user);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = await verifyToken(token);
    expect(decoded).toMatchObject(user);
  });

  it('should return null for an invalid token', async () => {
    const result = await verifyToken('invalid.token.here');
    expect(result).toBeNull();
  });

  it('should hash and verify a password', async () => {
    const password = 'SecurePassword123!';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });
});
