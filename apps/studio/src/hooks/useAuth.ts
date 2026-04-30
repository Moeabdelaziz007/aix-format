'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  username: string;
  uid: string;
  did: string;
  kycTier: number;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('aix_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof window !== 'undefined' && window.Pi) {
        window.Pi.init({ version: '2.0', sandbox: true });
        const authResult = await window.Pi.authenticate(['username', 'payments'], (payment: any) => {
          console.warn('Incomplete payment:', payment);
        });
        
        const newUser: AuthUser = {
          username: authResult.user.username,
          uid: authResult.user.uid,
          did: `did:pi:axiom:${authResult.user.uid}`,
          kycTier: 1, // Basic tier by default
        };
        
        setUser(newUser);
        localStorage.setItem('aix_user', JSON.stringify(newUser));
      } else {
        // Dev Fallback
        const mockUser: AuthUser = {
          username: 'Pioneer_Dev',
          uid: 'dev_123456',
          did: 'did:pi:axiom:dev_123456',
          kycTier: 1,
        };
        setUser(mockUser);
        localStorage.setItem('aix_user', JSON.stringify(mockUser));
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('aix_user');
  }, []);

  return { user, loading, error, login, logout };
}
