import { NextRequest, NextResponse } from "next/server";
import { getRegistry } from "@/lib/registry";
import { KYATier, MarketplaceItem } from "@/lib/marketplace-api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || "";
    const typeParam = searchParams.get("type") || "all";
    const type = normalizeMarketplaceType(typeParam);

    const entries = await getRegistry();
    
    // Map RegistryEntry to MarketplaceItem
    let items: MarketplaceItem[] = entries.map((entry) => ({
      id: entry.did,
      type: "agent", // Registry entries are primarily agents
      name: entry.name,
      description: entry.role, // Use role as description if empty
      author: {
        name: "Sovereign Pioneer",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.did}`,
      },
      kyaTier: mapKycTier(entry.kyc_tier),
      trustScore: 90,
      rating: 4.5,
      reviewCount: 0,
      price: { type: "free" }, // Default to free for now
      stats: { downloads: 0, usage: 0, users: 0 },
      tags: entry.capabilities || [],
      verified: true,
      slsaLevel: 2,
    }));

    // Filter
    if (search) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (type !== "all") {
      items = items.filter((item) => item.type === type);
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error("Marketplace API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace items" },
      { status: 500 }
    );
  }
}

function normalizeMarketplaceType(value: string): MarketplaceItem['type'] | "all" {
  const allowed = new Set<MarketplaceItem['type']>(['agent', 'skill', 'mcp', 'plugin', 'api']);
  return allowed.has(value as MarketplaceItem['type']) ? (value as MarketplaceItem['type']) : "all";
}

function mapKycTier(value: unknown): KYATier {
  if (typeof value === 'number') {
    if (value >= 4) return 4;
    if (value <= 0) return 0;
    return Math.floor(value) as KYATier;
  }

  if (value === 'sovereign') return 3;
  if (value === 'full' || value === 'verified') return 2;
  if (value === 'basic') return 1;
  return 0;
}
