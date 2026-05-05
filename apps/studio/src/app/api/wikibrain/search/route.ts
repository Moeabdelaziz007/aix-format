import { NextRequest, NextResponse } from "next/server";
import { search } from "@aix-core";

/**
 * POST /api/wikibrain/search
 * Semantic search for agents, skills, and MCP tools
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, topK = 5, filter } = body;

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const searchResults = await search(query, topK, filter);

    return NextResponse.json(searchResults);
  } catch (error: any) {
    console.error("[WikiBrain Search API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
