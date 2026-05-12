import { NextRequest } from "next/server";
import { getRegistry, updateRegistryEntry, deleteRegistryEntry, type RegistryEntry } from "@aix-core";
import { successResponse, requireAuth, ERR, parseBody } from '@/lib/api-helpers';

/**
 * GET /api/registry
 * Returns all registered agent entries.
 *
 * PUBLIC: No auth required - registry is publicly readable
 */
export async function GET() {
  try {
    const entries = await getRegistry();
    return successResponse(entries);
  } catch (error: unknown) {
    console.error("[registry] GET failed:", error.message);
    return ERR.INTERNAL('Failed to fetch registry');
  }
}

/**
 * POST /api/registry
 * Validates and saves a new or existing agent entry.
 *
 * PROTECTED: Requires authentication
 */
export async function POST(req: NextRequest) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const { body, error } = await parseBody<Partial<RegistryEntry>>(req);
    if (error) return error;
    
    // Validate required fields
    if (!body.did || !body.name || !body.role || !body.yaml) {
      return ERR.VALIDATION('Missing required fields: did, name, role, yaml');
    }

    const entry: RegistryEntry = {
      did: body.did,
      name: body.name,
      role: body.role,
      capabilities: body.capabilities || [],
      kyc_tier: body.kyc_tier || "unverified",
      specVersion: body.specVersion || "1.3.0",
      publishedAt: body.publishedAt || new Date().toISOString(),
      yaml: body.yaml,
    };

    await updateRegistryEntry(entry);
    return successResponse(entry, 201);
    
  } catch (error: unknown) {
    console.error("[registry] POST failed:", error.message);
    return ERR.INTERNAL('Failed to save registry entry');
  }
}

/**
 * DELETE /api/registry
 * Removes an agent entry by its DID (id).
 *
 * PROTECTED: Requires authentication
 */
export async function DELETE(req: NextRequest) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    let did = id;
    if (!did) {
      const body = await req.json().catch(() => ({}));
      did = body.id;
    }

    if (!did) {
      return ERR.VALIDATION('Missing agent ID (id)');
    }

    await deleteRegistryEntry(did);
    return successResponse({ message: "Agent removed from registry", id: did });
    
  } catch (error: unknown) {
    console.error("[registry] DELETE failed:", error.message);
    return ERR.INTERNAL('Failed to delete registry entry');
  }
}
