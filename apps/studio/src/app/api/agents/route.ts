import { NextResponse, NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { kv, NS } from '@/lib/storage/redis';

import { updateRegistryEntry } from '@/lib/registry';

/**
 * POST /api/agents
 * Registers a new agent manifest.
 */
export async function POST(req: Request) {
  try {
    const manifest = await req.json();

    if (!manifest.meta?.name) {
      return NextResponse.json({ success: false, error: 'Manifest validation failed: Agent name is required' }, { status: 400 });
    }

    const agentId = `aix_${nanoid(10)}`;
    const userAgentsKey = `${NS.REGISTRY}:user_default:agents`; // Mocking user ID as 'user_default'

    // Store manifest
    await kv.set(`agent:${agentId}`, manifest);
    
    // Add to user's fleet list
    const fleet = await kv.get<string[]>(userAgentsKey) || [];
    fleet.push(agentId);
    await kv.set(userAgentsKey, fleet);

    // Update global registry for marketplace
    await updateRegistryEntry({
      did: manifest.identity_layer?.id || agentId,
      name: manifest.meta.name,
      role: manifest.persona?.role || 'Sovereign Agent',
      capabilities: manifest.meta.tags || [],
      kyc_tier: manifest.identity_layer?.kyc_tier || 'unverified',
      specVersion: manifest.meta.format_version || '1.3.0',
      publishedAt: new Date().toISOString(),
      yaml: JSON.stringify(manifest)
    } as any);

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

/**
 * GET /api/agents
 * Lists all agents for the current user or fetches a specific one.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const manifest = await kv.get(`agent:${id}`);
      if (!manifest) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      return NextResponse.json(manifest);
    }

    // List all
    const userAgentsKey = `${NS.REGISTRY}:user_default:agents`;
    const agentIds = await kv.get<string[]>(userAgentsKey) || [];
    
    // Fetch manifests for each ID (batch)
    const manifests = await Promise.all(
      agentIds.map(async (aid) => {
        const m = await kv.get<any>(`agent:${aid}`);
        return m ? { id: aid, ...m } : null;
      })
    );

    return NextResponse.json(manifests.filter(Boolean));
  } catch (error: any) {
    console.error('Agents List API Error:', error);
    return NextResponse.json({ error: 'Failed to list agents' }, { status: 500 });
  }
}
