import { NextRequest, NextResponse } from "next/server";
import { registry } from '@aix-core';
import { requireAuth } from '@/lib/api-helpers';

/**
 * API: Agent Instance Lifecycle
 * ENTRY: HTTP Gate for Registry (Single Instance).
 * 
 * Thin wrapper over AgentRegistry.
 * Made with Moe Abdelaziz
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await registry.getAgent(id);

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error: any) {
    console.error("[API:Registry/id] GET failed:", error.message);
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      
      const updated = await registry.updateAgent(id, body);
      return NextResponse.json(updated);
      
    } catch (error: any) {
      console.error("[API:Registry/id] PUT failed:", error.message);
      return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async () => {
    try {
      const { id } = await params;
      await registry.deleteAgent(id);
      return NextResponse.json({ success: true, message: "Agent deleted", id });
    } catch (error: any) {
      console.error("[API:Registry/id] DELETE failed:", error.message);
      return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
    }
  });
}

// Made with Moe Abdelaziz
