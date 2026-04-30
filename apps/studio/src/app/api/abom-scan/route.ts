import { NextRequest, NextResponse } from "next/server";
import yaml from "js-yaml";
import { scanAgent } from "../../../../../../core/abom-scanner";

/**
 * POST /api/abom-scan
 * Analyzes an AIX agent manifest (YAML) and generates an ABOM risk report.
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

    // 1. Parse YAML to JS object
    let agent;
    try {
      agent = yaml.load(yamlContent);
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid YAML format" },
        { status: 400 }
      );
    }

    // 2. Run ABOM Risk Scoring Engine
    const report = scanAgent(agent);

    return NextResponse.json(report);
  } catch (error) {
    console.error("ABOM Scan Error:", error);
    return NextResponse.json(
      { error: "Internal server error during ABOM scan" },
      { status: 500 }
    );
  }
}
