/**
 * AIX Studio Revenue & Pricing Engine
 * Integrated Logic for Platform Tiers, Risk-Adjusted Costs, and Subscription Plans.
 */

import { PLANS, PlanType, Plan } from './plans';

// ─── PART 2: Operational Pricing & Quotas ────────────────────

export interface PricingConfig {
  base_price: number;
  platform_fee: number;
  quota: number;
  cutoff: "hard" | "grace" | "soft";
}

export const PI_SCALE = 1_000_000;

export const KYC_CONFIG: Record<string, { fee: number; limit: number }> = {
  anonymous:     { fee: 0.05, limit: 0 },         // View Only, high security fee
  basic:         { fee: 0.02, limit: 1000 },      // 2% Fee, <$1K
  verified:      { fee: 0.01, limit: 10000 },     // 1% Fee, $1K-$10K
  sovereign:     { fee: 0.005, limit: 100000 },   // 0.5% Fee, >$10K
  institutional: { fee: 0.002, limit: -1 },       // Custom/Minimal Fee, Unlimited
};

export const DEFAULT_PRICING: Record<string, PricingConfig> = {
  free:       { base_price: 0,     platform_fee: 0.02, quota: 100,   cutoff: "hard"  },
  builder:    { base_price: 0.005, platform_fee: 0.01, quota: 1000,  cutoff: "hard"  },
  pro:        { base_price: 0.01,  platform_fee: 0.005, quota: 10000, cutoff: "grace" },
  enterprise: { base_price: 0.05,  platform_fee: 0.002, quota: -1,    cutoff: "soft"  },
};

export const RISK_PREMIUMS = [
  { min: 90, multiplier: 0.5   }, // 90-100 = Critical Risk
  { min: 70, multiplier: 0.25  }, // 70-89  = High Risk
  { min: 40, multiplier: 0.1   }, // 40-69  = Moderate Risk
  { min: 0,  multiplier: 0.0   }, // 0-39   = Safe
];

export interface PriceBreakdown {
  totalCost: number;
  platformFee: number;
  developerShare: number;
  riskMultiplier: number;
}

/**
 * Ensures a numeric value is a safe, positive number.
 */
export function ensureSafeValue(value: any, defaultValue = 0): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return defaultValue;
  return Math.max(0, value);
}

/**
 * Calculates the total cost for an MCP tool call based on tier, risk, and complexity.
 */
export function calculatePrice(
  tier: string,
  riskScore: number,
  endpointType: string = 'stdio'
): PriceBreakdown {
  const config = DEFAULT_PRICING[tier] ?? DEFAULT_PRICING.free;
  const safeRisk = ensureSafeValue(riskScore);
  
  // 1. Risk multiplier
  const riskMultiplier = RISK_PREMIUMS.find((p) => safeRisk >= p.min)?.multiplier ?? 0;

  // 2. Complexity multiplier
  const complexityMap: Record<string, number> = {
    stdio: 1.0,
    http:  1.2,
    sse:   1.5,
  };
  const complexityMultiplier = complexityMap[endpointType] ?? 1.0;

  // 3. Calculation: Pt = (Bp × Mc) × (1 + Rp)
  const baseCost = config.base_price * complexityMultiplier;
  const totalCost = baseCost * (1 + riskMultiplier);
  
  // 4. KYC-Adjusted Platform Fee
  const kycConfig = KYC_CONFIG[tier] || KYC_CONFIG.anonymous;
  const platformFee = totalCost * kycConfig.fee;
  const developerShare = totalCost - platformFee;

  return {
    totalCost: Number(totalCost.toFixed(6)),
    platformFee: Number(platformFee.toFixed(6)),
    developerShare: Number(developerShare.toFixed(6)),
    riskMultiplier
  };
}

/**
 * Validates if a user has remaining quota.
 */
export function isQuotaExceeded(used: number, tier: string): boolean {
  const safeUsed = ensureSafeValue(used);
  const config = DEFAULT_PRICING[tier] ?? DEFAULT_PRICING.free;
  if (config.quota === -1) return false;
  return safeUsed >= config.quota;
}
