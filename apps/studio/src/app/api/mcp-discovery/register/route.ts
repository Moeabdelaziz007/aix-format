import { NextRequest, NextResponse } from "next/server";
import { getRegistry, updateRegistryEntry } from "../../../../../../../packages/aix-core/src/registry";
import { type RegistryEntry } from "@/lib/types";
import { RegistryEntry } from "@/lib/types";

/**
 * MCP Registration API
 * POST /api/mcp-discovery/register → Adds/updates an agent in the registry
 * DELETE /api/mcp-discovery/register?did={did} → Removes an agent from the registry
 */

export async function POST(req: NextRequest) {
  try {
    const entry: RegistryEntry = await req.json();

    if (!entry.did || !entry.name || !entry.role) {
      return NextResponse.json({ error: "Missing required agent fields (did, name, role)" }, { status: 400 });
    }

    const registry = await getRegistry();
    
    // Check if agent already exists
    const existingIndex = registry.findIndex(a => a.did === entry.did);
    
    if (existingIndex > -1) {
      // Update existing entry
      registry[existingIndex] = {
        ...entry,
        publishedAt: new Date().toISOString()
      };
    } else {
      // Add new entry
      registry.push({
        ...entry,
        publishedAt: new Date().toISOString()
      });
    }

    await updateRegistryEntry({
        ...entry,
        publishedAt: new Date().toISOString()
      });

    return NextResponse.json({ success: true, message: `Agent ${entry.name} registered successfully` });
  } catch (error) {
    console.error("Registration POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const did = searchParams.get("did");

    if (!did) {
      return NextResponse.json({ error: "Missing DID parameter" }, { status: 400 });
    }

    const registry = await getRegistry();
    const updatedRegistry = registry.filter(a => a.did !== did);

    if (registry.length === updatedRegistry.length) {
      return NextResponse.json({ error: "Agent not found in registry" }, { status: 404 });
    }

    await saveRegistry(updatedRegistry);

    return NextResponse.json({ success: true, message: `Agent ${did} unregistered successfully` });
  } catch (error) {
    console.error("Registration DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
