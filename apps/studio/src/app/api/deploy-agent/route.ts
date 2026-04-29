import { NextRequest, NextResponse } from 'next/server';
import { AgentRecord, DeploymentRecord } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const agent: AgentRecord = await req.json();
    
    if (!agent.id || !agent.did) {
      return NextResponse.json(
        { error: 'Missing agent.id or agent.did' }, 
        { status: 400 }
      );
    }

    // Simulate deployment (replace with real registry write later)
    const deployment: DeploymentRecord = {
      agentId: agent.id,
      deployedAt: new Date().toISOString(),
      endpointUrl: `https://axiomid.app/agents/${agent.id}`,
      mcpUrl: `https://axiomid.app/api/mcp-discovery`,
      status: 'deployed',
    };

    // TODO: Write to MCP registry / database here
    // For now, return deployment record
    return NextResponse.json({ 
      success: true, 
      deployment,
      message: `Agent "${agent.name}" deployed to AIX network`
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Deploy failed', details: String(err) }, 
      { status: 500 }
    );
  }
}
