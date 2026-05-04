import { DEFAULT_PRICING, KYC_CONFIG, RISK_PREMIUMS } from './constants';
import { PriceBreakdown } from './types';
import { ensureSafeValue } from './utils';

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

  // 2. Trust Discount (Resistance to Gaming)
  // Logic: High Pi Stake reduces platform fees
  const trustDiscount = safeRisk < 40 ? 0.1 : 0; // 10% discount for safe agents

  // 2. Complexity multiplier
  const complexityMap: Record<string, number> = {
    stdio: 1.0,
    http:  1.2,
    sse:   1.5,
  };
  const complexityMultiplier = complexityMap[endpointType] ?? 1.0;

  // 3. Calculation: Pt = ((Bp × Mc) × (1 + Rp)) * (1 - Td)
  const baseCost = config.base_price * complexityMultiplier;
  const totalCost = (baseCost * (1 + riskMultiplier)) * (1 - trustDiscount);
  
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
