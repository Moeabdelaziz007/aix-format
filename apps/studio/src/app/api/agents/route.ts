import { NextResponse, NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { kv, NS, KEYS } from '@/lib/redis';
import { updateRegistryEntry } from '@/lib/registry';
import { validateSovereignManifest } from '@/lib/protocol-validator';
import { indexAgent } from '@aix-core/storage';

import { LATEST_VERSION } from '@/constants/protocol';

/**
 * POST /api/agents
 * Registers a new agent manifest with Runtime Enforcement.
 */
export async function POST(req: Request) {
  try {
    const manifest = await req.json();

    // 1. Runtime Protocol Enforcement (Sovereign Pattern 1)
    const validation = validateSovereignManifest(manifest);
    if (!validation.valid) {
      try { await indexAgent(manifest); } catch(e) { console.warn('Failed to semantically index agent:', e); }

    return NextResponse.json({
        success: false, 
        error: 'Sovereign Protocol Violation',
        details: validation.errors 
      }, { status: 400 });
    }

    const agentId = `aix_${nanoid(10)}`;
    const did = manifest.identity_layer.id;
    const userAgentsKey = KEYS.session('user_default:agents');

    // 2. Store manifest using standardized registry key
    await kv.set(KEYS.registry(did), manifest);
    
    // 3. Add to user's fleet list
    const fleet = await kv.get<string[]>(userAgentsKey) || [];
    if (!fleet.includes(did)) {
      fleet.push(did);
      await kv.set(userAgentsKey, fleet);
    }

    // 4. Update global registry for marketplace (Skip if DNA Shadow Clone)
    if (!manifest.is_shadow_clone) {
      await updateRegistryEntry({
        did: did,
        name: manifest.meta.name,
        role: manifest.persona?.role || 'Sovereign Agent',
        capabilities: manifest.meta.tags || [],
        kyc_tier: manifest.identity_layer.verification?.status || 'unverified',
        specVersion: manifest.meta.format_version || LATEST_VERSION,
        publishedAt: new Date().toISOString(),
        yaml: JSON.stringify(manifest),
        risk_score: validation.risk_score
      } as any);
    }

    return NextResponse.json({
      success: true,
      agentId,
      did,
      risk_score: validation.risk_score,
      is_shadow: !!manifest.is_shadow_clone,
      warnings: validation.warnings,
      manifestUrl: `/agents/${did}`
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
      const manifest = await kv.get(KEYS.registry(id));
      if (!manifest) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      return NextResponse.json(manifest);
    }

    // List all
    const userAgentsKey = KEYS.session('user_default:agents');
    const agentIds = await kv.get<string[]>(userAgentsKey) || [];
    
    const manifests = await Promise.all(
      agentIds.map(async (aid) => {
        const m = await kv.get<any>(KEYS.registry(aid));
        return m ? { id: aid, ...m } : null;
      })
    );

    return NextResponse.json(manifests.filter(Boolean));
  } catch (error: any) {
    console.error('Agents List API Error:', error);
    return NextResponse.json({ error: 'Failed to list agents' }, { status: 500 });
  }
}
