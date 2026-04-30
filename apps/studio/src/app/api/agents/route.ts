import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// In-memory mock storage for dev environment if KV is missing
const mockKv = new Map<string, string>();

export async function POST(req: Request) {
  try {
    const manifest = await req.json();

    // Basic validation
    if (!manifest.meta?.name) {
      return NextResponse.json({ success: false, error: 'Manifest validation failed: Agent name is required' }, { status: 400 });
    }

    const agentId = `aix_${nanoid(10)}`;

    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(`agent:${agentId}`, JSON.stringify(manifest));
    } catch (kvError) {
      console.warn('Vercel KV not configured, using mock storage');
      mockKv.set(`agent:${agentId}`, JSON.stringify(manifest));
    }

    return NextResponse.json({
      success: true,
      agentId,
      manifestUrl: `/agents/${agentId}`
    });
  } catch (error: any) {
    console.error('Deploy API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
