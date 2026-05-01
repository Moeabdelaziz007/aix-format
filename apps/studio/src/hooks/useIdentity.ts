'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthResult, PiUser } from '@/lib/types';
import { toast } from 'sonner';

/**
 * useIdentity Hook
 * Manages user authentication and identity state (Pi Network, AxiomID).
 */
export function useIdentity() {
  const [user, setUser] = useState<PiUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      // Logic for checking existing session (e.g. from local storage or cookie)
      const storedUser = localStorage.getItem('aix_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Identity check failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      if (!response.ok) throw new Error('Authentication failed');
      
      const result: AuthResult = await response.json();
      setUser(result.user);
      localStorage.setItem('aix_user', JSON.stringify(result.user));
      toast.success(`Welcome, ${result.user.username}`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem('aix_user');
    toast.info('Logged out');
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };
}
