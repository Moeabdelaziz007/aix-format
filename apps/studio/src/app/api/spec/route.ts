import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * GET /api/spec
 * Serves the canonical AIX v1.3.0 JSON Schema.
 */
export async function GET(req: NextRequest) {
  try {
    const schemaPath = path.join(process.cwd(), '../../schemas/aix.schema.json');
    const schemaContent = await fs.readFile(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);

    return NextResponse.json(schema, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
        'Content-Type': 'application/schema+json'
      }
    });
  } catch (error: any) {
    console.error('Spec API Error:', error);
    return NextResponse.json({ error: 'Failed to load schema' }, { status: 500 });
  }
}
