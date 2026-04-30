'use client';

import { useState, useCallback } from 'react';
import { AbomData } from '@/lib/types';

export interface AbomScanResult {
  score: number;
  grade: string;
  risks: Array<{ category: string; severity: string; message: string }>;
  recommendations: string[];
  compliance: {
    eu_cra: boolean;
    nist_ai_rmf: boolean;
    kyc_complete: boolean;
  };
}

/**
 * useAbom Hook
 * Manages AI-SBOM scanning and risk analysis for AIX agents.
 */
export function useAbom() {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [report, setReport] = useState<AbomScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanYaml = useCallback(async (yaml: string) => {
    setIsScanning(true);
    setError(null);
    try {
      const response = await fetch('/api/abom-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yaml }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'ABOM scan failed');
      }

      const data: AbomScanResult = await response.json();
      setReport(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown ABOM scan error';
      setError(msg);
      throw err;
    } finally {
      setIsScanning(false);
    }
  }, []);

  return {
    scanYaml,
    isScanning,
    report,
    error
  };
}
