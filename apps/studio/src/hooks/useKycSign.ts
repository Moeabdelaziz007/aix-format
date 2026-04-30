'use client';

import { useState, useCallback } from 'react';
import { AuthUser } from './useAuth';

export interface KycProof {
  uid_hash: string;
  verified_at: string;
  assurance_level: 'basic' | 'verified' | 'institutional';
  fingerprint: string;
}

export function useKycSign(user: AuthUser | null) {
  const [isSigning, setIsSigning] = useState(false);
  const [proof, setProof] = useState<KycProof | null>(null);

  const upgradeKyc = useCallback(async () => {
    if (!user) return;
    setIsSigning(true);
    
    // Simulate PiKycAdapter flow
    try {
      await new Promise(r => setTimeout(r, 2000));
      
      const newProof: KycProof = {
        uid_hash: 'sha256:8f4e...9a2b',
        verified_at: new Date().toISOString(),
        assurance_level: 'verified',
        fingerprint: 'ed25519:a1b2...c3d4'
      };
      
      setProof(newProof);
      
      // Update local storage tier if needed
      const saved = localStorage.getItem('aix_user');
      if (saved) {
        const userData = JSON.parse(saved);
        userData.kycTier = 2; // Verified
        localStorage.setItem('aix_user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('KYC Upgrade failed', error);
    } finally {
      setIsSigning(false);
    }
  }, [user]);

  return { isSigning, proof, upgradeKyc };
}
