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

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * Verify JWT token
 * 
 * @param token - JWT token
 * @returns Decoded user or null
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    // TODO: Implement actual JWT verification
    // For now, use mock verification
    
    if (!token || token.length < 10) {
      return null;
    }
    
    // In production, use jsonwebtoken:
    // const decoded = verify(token, process.env.JWT_SECRET!);
    // return decoded as AuthUser;
    
    // Mock user for development
    return {
      id: 'user_' + token.substring(0, 8),
      email: 'user@example.com',
      role: 'user'
    };
    
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
  // TODO: Implement actual JWT generation
  // For now, return mock token
  
  // In production, use jsonwebtoken:
  // const token = sign(user, process.env.JWT_SECRET!, {
  //   expiresIn: '7d'
  // });
  // return token;
  
  return 'mock_token_' + user.id + '_' + Date.now();
}

/**
 * Hash password
 * 
 * @param password - Plain password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // TODO: Implement actual password hashing
  // For now, return mock hash
  
  // In production, use bcrypt:
  // const salt = await bcrypt.genSalt(10);
  // const hash = await bcrypt.hash(password, salt);
  // return hash;
  
  return 'hashed_' + password;
}

/**
 * Verify password
 * 
 * @param password - Plain password
 * @param hash - Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // TODO: Implement actual password verification
  // For now, use mock verification
  
  // In production, use bcrypt:
  // return await bcrypt.compare(password, hash);
  
  return hash === 'hashed_' + password;
}

// Made with Moe Abdelaziz
