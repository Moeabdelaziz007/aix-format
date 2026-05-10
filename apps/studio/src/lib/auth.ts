/**
 * Authentication Helper
 * 
 * Provides authentication utilities for API routes:
 * - Token verification
 * - User extraction
 * - Auth middleware
 * 
 * @module auth
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { env } from './env';

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.string().optional(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

const JWT_SECRET = env.JWT_SECRET;

/**
 * Verify JWT token
 * 
 * @param token - JWT token
 * @returns Decoded user or null
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = AuthUserSchema.safeParse(decoded);

    if (!result.success) {
      console.error('[Auth] Token payload validation failed:', result.error);
      return null;
    }
    
    return result.data;
    
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Get auth token from request
 * 
 * @param req - Next.js request
 * @returns Token or null
 */
export function getAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

/**
 * Require authentication (throws if not authenticated)
 * 
 * @param req - Next.js request
 * @returns Authenticated user
 * @throws Error if not authenticated
 */
export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const token = getAuthToken(req);
  
  if (!token) {
    throw new Error('Unauthorized: No token provided');
  }
  
  const user = await verifyToken(token);
  
  if (!user) {
    throw new Error('Unauthorized: Invalid token');
  }
  
  return user;
}

/**
 * Optional authentication (returns null if not authenticated)
 * 
 * @param req - Next.js request
 * @returns User or null
 */
export async function optionalAuth(req: NextRequest): Promise<AuthUser | null> {
  const token = getAuthToken(req);
  
  if (!token) {
    return null;
  }
  
  return await verifyToken(token);
}

/**
 * Check if user has required role
 * 
 * @param user - User object
 * @param requiredRole - Required role
 * @returns True if user has role
 */
export function hasRole(user: AuthUser, requiredRole: string): boolean {
  return user.role === requiredRole || user.role === 'admin';
}

/**
 * Require specific role (throws if user doesn't have role)
 * 
 * @param user - User object
 * @param requiredRole - Required role
 * @throws Error if user doesn't have role
 */
export function requireRole(user: AuthUser, requiredRole: string): void {
  if (!hasRole(user, requiredRole)) {
    throw new Error(`Forbidden: Requires ${requiredRole} role`);
  }
}

/**
 * Generate JWT token (for login/signup)
 * 
 * @param user - User object
 * @returns JWT token
 */
export async function generateToken(user: AuthUser): Promise<string> {
  const payload = AuthUserSchema.parse(user);
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d'
  });
  return token;
}

/**
 * Hash password
 * 
 * @param password - Plain password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

/**
 * Verify password
 * 
 * @param password - Plain password
 * @param hash - Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Made with Moe Abdelaziz
