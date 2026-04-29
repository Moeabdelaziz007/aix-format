import { NextRequest, NextResponse } from "next/server";
import { generateAIXDiscovery } from "@/lib/mcp-generator";

/**
 * AIX Discovery Endpoint
 * GET /api/mcp-discovery?manifestUrl=...
 * POST /api/mcp-discovery (body: aix manifest)
 */

export async function POST(req: NextRequest) {
  try {
    const manifest = await req.json();
    
    if (!manifest || !manifest.meta) {
      return NextResponse.json({ error: "Invalid AIX manifest" }, { status: 400 });
    }

    // Determine server URI from request headers or use a default
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const serverUri = `${protocol}://${host}`;

    const discovery = generateAIXDiscovery(manifest, serverUri);

    return NextResponse.json(discovery);
  } catch (error) {
    console.error("Discovery API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: "AIX Discovery API. Send a POST request with your manifest to generate discovery JSON.",
    docs: "https://github.com/Moeabdelaziz007/aix-format/blob/main/docs/AIX_SPEC.md#discovery-layer"
  });
}
