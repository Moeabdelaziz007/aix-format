/**
 * AIX Studio Revenue & Pricing Engine
 * Integrated Logic for Platform Tiers, Risk-Adjusted Costs, and Subscription Plans.
 */

// ─── PART 1: Subscription Plans (from plans.ts) ──────────────────────────────

export type PlanType = 'free' | 'builder' | 'pro' | 'enterprise';

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  stripePriceId?: string;
  limits: {
    agents: number; // -1 for unlimited
    exports: string[];
    abom_scans: number; // -1 for unlimited
    api_access: boolean;
  };
  features: string[];
}

export const PLANS: Record<PlanType, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    limits: {
      agents: 3,
      exports: ['yaml'],
      abom_scans: 5,
      api_access: false
    },
    features: [
      'Up to 3 AI Agents',
      'AIX YAML Export',
      'Basic Risk Scanning (5/mo)',
      'Community Support'
    ]
  },
  builder: {
    id: 'builder',
    name: 'Builder',
    price: 19,
    stripePriceId: 'price_builder_standard',
    limits: {
      agents: -1,
      exports: ['yaml', 'json', 'mcp'],
      abom_scans: 50,
      api_access: false
    },
    features: [
      'Unlimited AI Agents',
      'YAML, JSON & MCP Export',
      'Advanced ABOM Scans (50/mo)',
      'Email Support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Studio Pro',
    price: 49,
    stripePriceId: 'price_pro_standard',
    limits: {
      agents: -1,
      exports: ['yaml', 'json', 'mcp', 'pdf'],
      abom_scans: -1,
      api_access: true
    },
    features: [
      'Everything in Builder',
      'PDF Risk Reports',
      'Unlimited ABOM Scans',
      'REST API Access',
      'Priority Support'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    stripePriceId: 'price_enterprise_custom',
    limits: {
      agents: -1,
      exports: ['yaml', 'json', 'mcp', 'pdf', 'custom'],
      abom_scans: -1,
      api_access: true
    },
    features: [
      'Everything in Pro',
      'Custom Compliance Rules',
      'SSO Integration',
      'White-label Reports',
      'Dedicated Account Manager'
    ]
  }
};

// ─── PART 2: Operational Pricing & Quotas (from pricing.ts) ────────────────────

export interface PricingConfig {
  base_price: number;
  platform_fee: number;
  quota: number;
  cutoff: "hard" | "grace" | "soft";
}

export const PI_SCALE = 1_000_000;

export const DEFAULT_PRICING: Record<string, PricingConfig> = {
  free:       { base_price: 0,     platform_fee: 0.20, quota: 100,   cutoff: "hard"  },
  builder:    { base_price: 0.005, platform_fee: 0.20, quota: 1000,  cutoff: "hard"  },
  pro:        { base_price: 0.01,  platform_fee: 0.10, quota: 10000, cutoff: "grace" },
  enterprise: { base_price: 0.05,  platform_fee: 0.05, quota: -1,    cutoff: "soft"  },
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
 * Calculates the total cost for an MCP tool call based on tier, risk, and complexity.
 */
export function calculatePrice(
  tier: string,
  riskScore: number,
  endpointType: string = 'stdio'
): PriceBreakdown {
  const config = DEFAULT_PRICING[tier] ?? DEFAULT_PRICING.free;
  
  // 1. Risk multiplier
  const riskMultiplier = RISK_PREMIUMS.find((p) => riskScore >= p.min)?.multiplier ?? 0;

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
  const platformFee = totalCost * config.platform_fee;
  const developerShare = totalCost - platformFee;

  return {
    totalCost,
    platformFee,
    developerShare,
    riskMultiplier
  };
}

/**
 * Validates if a user has remaining quota.
 */
export function isQuotaExceeded(used: number, tier: string): boolean {
  if (!Number.isFinite(used) || used < 0) return false;
  const config = DEFAULT_PRICING[tier] ?? DEFAULT_PRICING.free;
  if (config.quota === -1) return false;
  return used >= config.quota;
}
