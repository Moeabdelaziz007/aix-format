export type KYATier = 0 | 1 | 2 | 3 | 4;

export interface MarketplaceItem {
  id: string;
  type: 'agent' | 'skill' | 'mcp' | 'plugin' | 'api';
  name: string;
  description: string;
  author: {
    name: string;
    avatar?: string;
  };
  kyaTier: KYATier;
  trustScore: number;
  rating: number;
  reviewCount: number;
  price: {
    type: 'free' | 'pay-per-call' | 'subscription';
    amount?: number;
    currency?: string;
    unit?: string;
  };
  stats: {
    downloads: number;
    usage: number;
    users: number;
  };
  tags: string[];
  image?: string;
  verified: boolean;
  slsaLevel?: 1 | 2 | 3;
}

export const SAMPLE_DATA: MarketplaceItem[] = [
  {
    id: '1',
    type: 'agent',
    name: 'Sovereign Debt Arbiter',
    description: 'Autonomous agent specialized in cross-chain debt settlement and liquidity optimization.',
    author: { name: 'Axiom Labs', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=axiom' },
    kyaTier: 4,
    trustScore: 98,
    rating: 4.9,
    reviewCount: 124,
    price: { type: 'pay-per-call', amount: 0.001, currency: 'SOL', unit: 'call' },
    stats: { downloads: 1200, usage: 50000, users: 450 },
    tags: ['DeFi', 'Arbitrage', 'Sovereign'],
    verified: true,
    slsaLevel: 3
  },
  {
    id: '2',
    type: 'skill',
    name: 'SHA-256 Manifest Signer',
    description: 'Cryptographic skill for generating and verifying AIX manifest signatures.',
    author: { name: 'CryptoNative', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=crypto' },
    kyaTier: 3,
    trustScore: 95,
    rating: 4.7,
    reviewCount: 89,
    price: { type: 'free' },
    stats: { downloads: 3500, usage: 100000, users: 1200 },
    tags: ['Security', 'Cryptography', 'AIX'],
    verified: true,
    slsaLevel: 2
  },
  {
    id: '3',
    type: 'mcp',
    name: 'PostgreSQL Knowledge Base',
    description: 'MCP server providing high-performance vector search and retrieval for Postgres databases.',
    author: { name: 'Supabase', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=supabase' },
    kyaTier: 2,
    trustScore: 88,
    rating: 4.5,
    reviewCount: 56,
    price: { type: 'subscription', amount: 29, currency: 'USD', unit: 'mo' },
    stats: { downloads: 800, usage: 15000, users: 300 },
    tags: ['Database', 'Vector Search', 'MCP'],
    verified: true,
    slsaLevel: 2
  },
  {
    id: '4',
    type: 'agent',
    name: 'Content Guardian',
    description: 'AI moderator that filters and flags harmful content using real-time policy enforcement.',
    author: { name: 'SafeGuard AI', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=safe' },
    kyaTier: 1,
    trustScore: 75,
    rating: 4.2,
    reviewCount: 34,
    price: { type: 'free' },
    stats: { downloads: 450, usage: 12000, users: 120 },
    tags: ['Safety', 'Moderation', 'Policy'],
    verified: false
  },
  {
    id: '5',
    type: 'api',
    name: 'OpenAI GPT-4o Connector',
    description: 'High-availability API connector for OpenAI GPT-4o with integrated rate limiting and retry logic.',
    author: { name: 'LangChain', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lang' },
    kyaTier: 3,
    trustScore: 92,
    rating: 4.8,
    reviewCount: 210,
    price: { type: 'pay-per-call', amount: 0.01, currency: 'USD', unit: '1k tokens' },
    stats: { downloads: 5000, usage: 1000000, users: 2500 },
    tags: ['LLM', 'AI', 'Connector'],
    verified: true,
    slsaLevel: 2
  }
];

export const getMarketplaceItems = async (filters?: any): Promise<MarketplaceItem[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  let items = [...SAMPLE_DATA];
  
  if (filters) {
    if (filters.search) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    if (filters.type && filters.type !== 'all') {
      items = items.filter(item => item.type === filters.type);
    }
    // Add more filter logic as needed
  }
  
  return items;
};
