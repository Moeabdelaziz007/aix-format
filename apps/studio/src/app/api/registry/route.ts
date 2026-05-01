import { NextRequest, NextResponse } from "next/server";
import { getRegistry, updateRegistryEntry, type RegistryEntry } from "@aix-core/storage";

/**
 * GET /api/registry
 * Returns all registered agent entries.
 */
export async function GET() {
  try {
    const entries = await getRegistry();
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Registry GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registry" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/registry
 * Validates and saves a new or existing agent entry.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Basic validation
    if (!body.did || !body.name || !body.role || !body.yaml) {
      return NextResponse.json(
        { error: "Missing required fields (did, name, role, yaml)" },
        { status: 400 }
      );
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
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Registry POST Error:", error);
    return NextResponse.json(
      { error: "Failed to save registry entry" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/registry
 * Removes an agent entry by its DID (id).
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    let did = id;
    if (!did) {
      const body = await req.json().catch(() => ({}));
      did = body.id;
    }

    if (!did) {
      return NextResponse.json(
        { error: "Missing agent ID (id)" },
        { status: 400 }
      );
    }

    await deleteRegistryEntry(did);
    return NextResponse.json({ message: "Agent removed from registry", id: did });
  } catch (error) {
    console.error("Registry DELETE Error:", error);
    return NextResponse.json(
      { error: "Failed to delete registry entry" },
      { status: 500 }
    );
  }
}
