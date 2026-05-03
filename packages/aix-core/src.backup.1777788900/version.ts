/**
 * AIX Format Version Constants
 * 
 * Tracks the evolution of the AIX Format specification across
 * core identity, payment layer, and universal passport features.
 */

/**
 * AIX Core Format Version
 * Includes: Identity (did:axiom), MCP, ABOM, Security
 */
export const AIX_CORE_VERSION = '1.3.0';

/**
 * AIX Payment Layer Version
 * Includes: HTTP 402, Multi-Chain, DeFi, Revenue Routing
 */
export const AIX_PAYMENT_VERSION = '1.0.0';

/**
 * AIX Universal Passport Version
 * Complete integration of Core + Payment + Platform Adapters
 */
export const AIX_PASSPORT_VERSION = '1.4.0';

/**
 * Version History
 */
export const VERSION_HISTORY = {
  '1.0.0': {
    date: '2026-04-01',
    features: ['Basic agent manifest', 'Persona', 'Skills', 'APIs'],
    breaking: false
  },
  '1.1.0': {
    date: '2026-04-15',
    features: ['MCP integration', 'Memory system', 'Requirements'],
    breaking: false
  },
  '1.2.0': {
    date: '2026-04-20',
    features: ['ABOM', 'Live Voice', 'Meta Arbiter'],
    breaking: false
  },
  '1.3.0': {
    date: '2026-04-29',
    features: ['did:axiom identity', 'Pi Network KYC', 'ZK-proofs', 'Economics'],
    breaking: false
  },
  '1.4.0': {
    date: '2026-05-02',
    features: [
      'HTTP 402 integration',
      'Multi-chain wallets (Base, Solana, Ethereum)',
      'Fiat on/off ramps (Stripe, PayPal)',
      'Payment routing engine',
      'Platform adapters (OpenClaw, Hermes, Kelos, Manus, IBM watsonx)',
      'DeFi strategies (Flash loans, arbitrage)',
      'Universal Agent Passport'
    ],
    breaking: false,
    payment_version: '1.0.0'
  }
} as const;

/**
 * Feature Flags
 */
export const FEATURES = {
  // Core Features (v1.3.0)
  IDENTITY: true,
  MCP: true,
  ABOM: true,
  ZK_KYC: true,
  
  // Payment Features (v1.0.0)
  HTTP_402: true,
  MULTI_CHAIN: true,
  PAYMENT_ROUTING: true,
  FIAT_RAMPS: true,
  
  // DeFi Features (Beta)
  FLASH_LOANS: false, // Beta - enable with caution
  ARBITRAGE: false,   // Beta - enable with caution
  TREASURY_YIELD: true,
  
  // Platform Features (Beta)
  OPENCLAW_ADAPTER: false,  // Beta
  HERMES_ADAPTER: false,    // Beta
  KELOS_ADAPTER: false,     // Beta
  MANUS_ADAPTER: false,     // Beta
  IBM_WATSONX_ADAPTER: false // Beta
} as const;

/**
 * Supported Payment Chains
 */
export const SUPPORTED_CHAINS = {
  BASE: {
    chain_id: 8453,
    name: 'Base',
    rpc: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    native_token: 'ETH',
    stablecoins: ['USDC', 'USDT'],
    avg_tx_cost_usd: 0.0001,
    finality_seconds: 2,
    status: 'production'
  },
  SOLANA: {
    chain_id: 900,
    name: 'Solana',
    rpc: 'https://api.mainnet-beta.solana.com',
    explorer: 'https://solscan.io',
    native_token: 'SOL',
    stablecoins: ['USDC', 'PYUSD'],
    avg_tx_cost_usd: 0.00025,
    finality_seconds: 0.4,
    status: 'production'
  },
  ETHEREUM: {
    chain_id: 1,
    name: 'Ethereum',
    rpc: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
    native_token: 'ETH',
    stablecoins: ['USDC', 'USDT', 'DAI'],
    avg_tx_cost_usd: 5.0,
    finality_seconds: 12,
    status: 'production'
  },
  PI_NETWORK: {
    chain_id: 314159,
    name: 'Pi Network',
    rpc: 'https://api.minepi.com',
    explorer: 'https://blockexplorer.minepi.com',
    native_token: 'PI',
    stablecoins: [],
    avg_tx_cost_usd: 0.0,
    finality_seconds: 5,
    status: 'production'
  }
} as const;

/**
 * Supported Fiat Providers
 */
export const FIAT_PROVIDERS = {
  STRIPE: {
    name: 'Stripe',
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    fee_percent: 2.9,
    fee_fixed_usd: 0.30,
    settlement_days: 2,
    status: 'production'
  },
  PAYPAL: {
    name: 'PayPal',
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    fee_percent: 3.49,
    fee_fixed_usd: 0.49,
    settlement_days: 1,
    status: 'production'
  }
} as const;

/**
 * Get current version info
 */
export function getVersionInfo() {
  return {
    core: AIX_CORE_VERSION,
    payment: AIX_PAYMENT_VERSION,
    passport: AIX_PASSPORT_VERSION,
    features: FEATURES,
    chains: Object.keys(SUPPORTED_CHAINS),
    fiat_providers: Object.keys(FIAT_PROVIDERS)
  };
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}

/**
 * Get version history
 */
export function getVersionHistory() {
  return VERSION_HISTORY;
}

/**
 * Get latest version
 */
export function getLatestVersion(): string {
  return AIX_PASSPORT_VERSION;
}

/**
 * Compare versions
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  
  return 0;
}

/**
 * Check if version is compatible
 */
export function isVersionCompatible(version: string, minVersion: string): boolean {
  return compareVersions(version, minVersion) >= 0;
}

export default {
  AIX_CORE_VERSION,
  AIX_PAYMENT_VERSION,
  AIX_PASSPORT_VERSION,
  VERSION_HISTORY,
  FEATURES,
  SUPPORTED_CHAINS,
  FIAT_PROVIDERS,
  getVersionInfo,
  isFeatureEnabled,
  getVersionHistory,
  getLatestVersion,
  compareVersions,
  isVersionCompatible
};

// Made with Moe Abdelaziz
