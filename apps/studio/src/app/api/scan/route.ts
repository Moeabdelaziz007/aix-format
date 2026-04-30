import { NextRequest, NextResponse } from 'next/server';
import yaml from 'js-yaml';
import { scanAgent } from "../../../../../../core/abom-scanner.js";

/**
 * POST /api/scan
 * Scans an AIX YAML or JSON manifest and returns a risk report.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, format = 'yaml' } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Missing content to scan' },
        { status: 400 }
      );
    }

    let agentData;
    try {
      if (format === 'json') {
        agentData = typeof content === 'string' ? JSON.parse(content) : content;
      } else {
        agentData = yaml.load(content);
      }
    } catch (e: any) {
      return NextResponse.json(
        { error: 'Failed to parse manifest: ' + e.message },
        { status: 400 }
      );
    }

    const report = scanAgent(agentData);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Scan API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
