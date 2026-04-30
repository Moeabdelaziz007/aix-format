import { NextRequest, NextResponse } from "next/server";
import { getRegistry } from "@/lib/registry";
import { generateAIXDiscovery } from "@/lib/mcp-generator";
import { McpDiscoveryResponse } from "@/lib/types";

/**
 * AIX Discovery Endpoint
 * GET /api/mcp-discovery → Returns all registered agents
 * POST /api/mcp-discovery → Takes a manifest, generates discovery JSON (Ad-hoc)
 */

export async function GET(req: NextRequest) {
  try {
    const agents = await getRegistry();

    const response: McpDiscoveryResponse = {
      mcpVersion: "1.0.0",
      generated: new Date().toISOString(),
      totalAgents: agents.length,
      agents: agents.map(({ publishedAt, yaml, ...rest }) => rest)
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    console.error("Discovery Registry Error:", error);
    return NextResponse.json({ error: "Failed to load registry" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const manifest = await req.json();

    if (!manifest || !manifest.meta) {
      return NextResponse.json({ error: "Invalid AIX manifest" }, { status: 400 });
    }

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
