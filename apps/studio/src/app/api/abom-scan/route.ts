import { NextRequest, NextResponse } from "next/server";
import yaml from "js-yaml";
import { scanAgent } from "../../../../../../core/abom-scanner";
import { Manifest } from "@/lib/types";
import { kv, NS, TTL } from "../../../../../../core/storage/redis";
import { sha256Hex } from "@/lib/utils";

/**
 * POST /api/abom-scan
 * Analyzes an AIX agent manifest (YAML) and generates an ABOM risk report.
 * Results are cached in Upstash Redis to improve performance for identical manifests.
 */
export async function POST(req: NextRequest) {
  try {
    const { yaml: yamlContent } = await req.json();

    if (!yamlContent) {
      return NextResponse.json(
        { error: "Missing YAML content" },
        { status: 400 }
      );
    }

    // 1. Generate Cache Key (SHA-256 of YAML content)
    // Note: We use the raw YAML string for hashing to capture any structural changes.
    const contentHash = await sha256Hex(yamlContent);
    const cacheKey = `${NS.ABOM}:${contentHash}`;

    // 2. Check Cache
    try {
      const cachedResult = await kv.get(cacheKey);
      if (cachedResult) {
        return NextResponse.json(cachedResult, {
          headers: { "X-Cache": "HIT" },
        });
      }
    } catch (cacheError) {
      // Fail-open: if cache fails, proceed with scan
      console.warn("[ABOM Scan] Cache lookup failed:", cacheError);
    }

    // 3. Parse YAML to JS object
    let agent;
    try {
      agent = yaml.load(yamlContent) as Partial<Manifest>;
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid YAML format" },
        { status: 400 }
      );
    }

    // 4. Run ABOM Risk Scoring Engine
    const report = scanAgent(agent);

    // 5. Store in Cache (24 hour TTL)
    try {
      await kv.set(cacheKey, report, { ex: TTL.ABOM_CACHE });
    } catch (cacheError) {
      console.warn("[ABOM Scan] Cache store failed:", cacheError);
    }

    return NextResponse.json(report, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("ABOM Scan Error:", error);
    return NextResponse.json(
      { error: "Internal server error during ABOM scan" },
      { status: 500 }
    );
  }
}
