import { NextRequest, NextResponse } from "next/server";
import { getRegistry, updateRegistryEntry, deleteRegistryEntry } from "@/lib/registry";
import { indexAgent } from '@aix-core/storage';

/**
 * GET /api/agents/[id]
 * Fetches a specific agent by its DID.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entries = await getRegistry();
    const entry = entries.find((e) => e.did === id);

    if (!entry) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Agent GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/agents/[id]
 * Updates a specific agent entry.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    if (body.did && body.did !== id) {
      return NextResponse.json(
        { error: "ID mismatch between path and body" },
        { status: 400 }
      );
    }

    const updatedEntry = {
      ...body,
      did: id
    };

    await updateRegistryEntry(updatedEntry);
    try { await indexAgent(updatedEntry); } catch(e) { console.warn('Failed to semantically index agent:', e); }
    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("Agent PUT Error:", error);
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/[id]
 * Removes an agent from the registry.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteRegistryEntry(id);
    return NextResponse.json({ message: "Agent deleted", id });

  } catch (error) {
    console.error("Agent DELETE Error:", error);
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
