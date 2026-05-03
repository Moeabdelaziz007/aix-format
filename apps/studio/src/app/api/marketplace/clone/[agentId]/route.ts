import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { kv, KEYS } from '@/lib/redis';
import { requireAuth, successResponse, errorResponse, ERR } from '@/lib/api-helpers';
import { updateRegistryEntry } from '@/lib/registry';
import { LATEST_VERSION } from '@/constants/protocol';

/**
 * POST /api/marketplace/clone/:agentId
 * 
 * Clones a public agent from the marketplace with new ownership.
 * 
 * Features:
 * - Fetches public agent from marketplace
 * - Performs deep clone with new ownership assignment
 * - Applies custom naming and descriptions
 * - Marks clone as private
 * - Tracks clonedFrom relationship
 * - Returns newly created agent with 201 status
 * 
 * SECURITY: Requires authentication
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    // 1. Authenticate user
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const { agentId } = params;
    
    // 2. Parse request body for customization
    const body = await req.json().catch(() => ({}));
    const {
      name,
      description,
      tags,
    } = body;

    // 3. Fetch original agent from registry
    const originalAgent = await kv.get<any>(KEYS.registry(agentId));
    
    if (!originalAgent) {
      return ERR.NOT_FOUND('Agent not found in marketplace');
    }

    // 4. Verify agent is public (can be cloned)
    if (originalAgent.meta?.visibility === 'private') {
      return ERR.FORBIDDEN('Cannot clone private agents');
    }

    // 5. Create deep clone with new identity
    const cloneId = `aix_${nanoid(10)}`;
    const cloneDid = `did:aix:${nanoid(16)}`;
    
    const clonedAgent = {
      ...JSON.parse(JSON.stringify(originalAgent)), // Deep clone
      
      // Update identity
      identity_layer: {
        ...originalAgent.identity_layer,
        id: cloneDid,
        owner: session.user.id,
        clonedFrom: agentId,
        clonedAt: new Date().toISOString(),
      },
      
      // Update metadata
      meta: {
        ...originalAgent.meta,
        name: name || `${originalAgent.meta?.name || 'Agent'} (Clone)`,
        description: description || originalAgent.meta?.description,
        tags: tags || originalAgent.meta?.tags || [],
        visibility: 'private', // Clones are private by default
        format_version: originalAgent.meta?.format_version || LATEST_VERSION,
        clonedFrom: agentId,
      },
      
      // Mark as clone
      is_clone: true,
      clone_metadata: {
        originalId: agentId,
        originalDid: originalAgent.identity_layer?.id,
        clonedAt: new Date().toISOString(),
        clonedBy: session.user.id,
      },
    };

    // 6. Store cloned agent
    await kv.set(KEYS.registry(cloneDid), clonedAgent);
    
    // 7. Add to user's fleet
    const userAgentsKey = KEYS.session(`user_${session.user.id}:agents`);
    const fleet = await kv.get<string[]>(userAgentsKey) || [];
    if (!fleet.includes(cloneDid)) {
      fleet.push(cloneDid);
      await kv.set(userAgentsKey, fleet);
    }

    // 8. Update registry entry (private, so won't appear in marketplace)
    await updateRegistryEntry({
      did: cloneDid,
      name: clonedAgent.meta.name,
      role: clonedAgent.persona?.role || 'Cloned Agent',
      capabilities: clonedAgent.meta.tags || [],
      kyc_tier: 'unverified',
      specVersion: clonedAgent.meta.format_version || LATEST_VERSION,
      publishedAt: new Date().toISOString(),
      yaml: JSON.stringify(clonedAgent),
      risk_score: 0,
    } as unknown);

    // 9. Track clone relationship in Redis
    const cloneTrackingKey = `clone:${agentId}:clones`;
    const clones = await kv.get<string[]>(cloneTrackingKey) || [];
    clones.push(cloneDid);
    await kv.set(cloneTrackingKey, clones, { ex: 2592000 }); // 30 days TTL

    // 10. Return cloned agent
    return successResponse(
      {
        id: cloneId,
        did: cloneDid,
        agent: clonedAgent,
        clonedFrom: {
          id: agentId,
          did: originalAgent.identity_layer?.id,
          name: originalAgent.meta?.name,
        },
        manifestUrl: `/agents/${cloneDid}`,
      },
      201
    );

  } catch (error: unknown) {
    console.error('[marketplace/clone] Clone failed:', error);
    return ERR.INTERNAL('Failed to clone agent: ' + error.message);
  }
}

// Made with Moe Abdelaziz