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
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import { env } from './env';

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * NextAuth Configuration Options
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Sovereign ID",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // This is a placeholder for actual database lookup
        if (credentials?.email === "admin@axiomid.app" && credentials?.password === "admin123") {
          return { id: "1", email: "admin@axiomid.app", role: "admin" };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
  },
  secret: env.NEXTAUTH_SECRET,
};

/**
 * Verify JWT token
 * 
 * @param token - JWT token
 * @returns Decoded user or null
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    if (!token) return null;
    
    const secret = env.JWT_SECRET;
    if (!secret) {
        console.error('[Auth] JWT_SECRET not configured');
        return null;
    }
    const decoded = jwt.verify(token, secret) as any;
    
    return {
      id: decoded.id || decoded.sub,
      email: decoded.email,
      role: decoded.role
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
  const secret = env.JWT_SECRET;
  if (!secret) {
      throw new Error('JWT_SECRET not configured');
  }
  
  return jwt.sign(
    {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn: '7d' }
  );
}

/**
 * Hash password
 * 
 * @param password - Plain password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
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
