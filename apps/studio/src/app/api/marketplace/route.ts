import { NextRequest, NextResponse } from "next/server";
import { getRegistry } from "@/lib/registry";
import { MarketplaceItem } from "@/lib/marketplace-api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all";

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
      kyaTier: (() => {
        if (typeof entry.kyc_tier === 'number') return entry.kyc_tier;
        if (entry.kyc_tier === "sovereign") return 3;
        if (entry.kyc_tier === "full" || entry.kyc_tier === "verified") return 2;
        if (entry.kyc_tier === "basic") return 1;
        return 0;
      })() as any,
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
