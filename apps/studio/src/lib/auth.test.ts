import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyToken, generateToken, hashPassword, verifyPassword } from './auth';
import { verify, sign } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from './env';

vi.mock('jsonwebtoken', () => ({
  verify: vi.fn(),
  sign: vi.fn(),
}));

vi.mock('./env', () => ({
  env: {
    JWT_SECRET: 'test_secret_32_chars_long_minimum_length',
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue('salt'),
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn(),
  }
}));

describe('Authentication Library', () => {
  const mockUser = { id: '123', email: 'test@example.com' };
  const mockSecret = 'test_secret_32_chars_long_minimum_length';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = mockSecret;
  });

  describe('verifyToken', () => {
    it('should return null if no token is provided', async () => {
      expect(await verifyToken('')).toBeNull();
    });

    it('should return decoded user on valid token', async () => {
      vi.mocked(verify).mockReturnValue(mockUser as any);
      const result = await verifyToken('valid_token');
      expect(result).toEqual(mockUser);
      expect(verify).toHaveBeenCalledWith('valid_token', mockSecret);
    });

    it('should return null on invalid token', async () => {
      vi.mocked(verify).mockImplementation(() => { throw new Error('Invalid'); });
      expect(await verifyToken('invalid_token')).toBeNull();
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token', async () => {
      vi.mocked(sign).mockReturnValue('generated_token' as any);
      const token = await generateToken(mockUser);
      expect(token).toBe('generated_token');
      expect(sign).toHaveBeenCalled();
    });

    it('should throw if JWT_SECRET is missing', async () => {
      const originalSecret = env.JWT_SECRET;
      // @ts-ignore
      env.JWT_SECRET = '';
      await expect(generateToken(mockUser)).rejects.toThrow('JWT_SECRET is not defined');
      // @ts-ignore
      env.JWT_SECRET = originalSecret;
    });
  });

  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const hash = await hashPassword('password123');
      expect(hash).toBe('hashed_password');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
    });

    it('should verify a correct password', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      expect(await verifyPassword('password123', 'hashed_password')).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      expect(await verifyPassword('wrong', 'hashed_password')).toBe(false);
    });
  });
});
