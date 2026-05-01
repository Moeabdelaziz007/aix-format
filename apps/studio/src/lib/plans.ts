/**
 * AIX Studio Subscription Plans
 * Defines the limits and features for each pricing tier.
 */

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
      api_access: true
    },
    features: [
      'Unlimited Agents',
      'Full Format Export (JSON, MCP)',
      'Advanced Risk Scanning (50/mo)',
      'API Access',
      'Priority Support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    stripePriceId: 'price_pro_premium',
    limits: {
      agents: -1,
      exports: ['yaml', 'json', 'mcp', 'sdk'],
      abom_scans: -1,
      api_access: true
    },
    features: [
      'Everything in Builder',
      'SDK Generation',
      'Unlimited Risk Scanning',
      'Custom Branding',
      'Dedicated Infrastructure'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    limits: {
      agents: -1,
      exports: ['all'],
      abom_scans: -1,
      api_access: true
    },
    features: [
      'Unlimited Everything',
      'SLA Guarantees',
      'On-premise Deployment',
      'Multi-tenant Management',
      'White-label Identity Authority'
    ]
  }
};
