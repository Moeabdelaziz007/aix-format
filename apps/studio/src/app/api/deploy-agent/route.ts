import { NextRequest, NextResponse } from 'next/server';
import { DeployRequest, DeployResponse, DeploymentRecord } from '@/lib/types';
import { getRegistry, updateRegistryEntry } from '@/lib/registry';

export async function POST(req: NextRequest) {
  let body: DeployRequest | null = null;
  try {
    body = await req.json();

    // Validation
    if (!body || !body.agentId || !body.target || !body.yaml) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch existing entry to ensure we preserve other fields (like abom)
    const registry = await getRegistry();
    const entry = registry.find(e => e.did === body!.agentId);

    if (!entry) {
      return NextResponse.json(
        { error: 'Agent not found in registry. Please save first.' },
        { status: 404 }
      );
    }

    // 1. Mark as deploying
    entry.deployment = {
      agentId: body.agentId,
      deployedAt: new Date().toISOString(),
      endpointUrl: '',
      mcpUrl: '',
      status: 'deploying'
    };
    await updateRegistryEntry(entry);

    if (body.target === 'vercel') {
      if (!body.config.token || !body.config.projectName) {
        entry.deployment.status = 'failed';
        await updateRegistryEntry(entry);
        return NextResponse.json(
          { error: 'Vercel deployment requires token and project name' },
          { status: 400 }
        );
      }
    } else if (body.target === 'custom') {
      if (!body.config.endpointUrl) {
        entry.deployment.status = 'failed';
        await updateRegistryEntry(entry);
        return NextResponse.json(
          { error: 'Custom deployment requires an endpoint URL' },
          { status: 400 }
        );
      }
    }

    // TODO: Implement real Vercel API integration here
    // For now, we simulate the hardened flow with persistence
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    const projectName = body.config.projectName || `agent-${body.agentId.split(':').pop()?.slice(0, 8)}`;
    const deployUrl = body.target === 'vercel' 
      ? `https://${projectName}.vercel.app`
      : body.config.endpointUrl!;

    // 2. Mark as deployed
    const deployment: DeploymentRecord = {
      agentId: body.agentId,
      deployedAt: new Date().toISOString(),
      endpointUrl: deployUrl,
      mcpUrl: `${deployUrl}/api/mcp-discovery`,
      status: 'deployed'
    };

    entry.deployment = deployment;
    await updateRegistryEntry(entry);

    const response: DeployResponse = {
      deployUrl,
      status: 'deployed'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Deployment error:', error);
    
    // Attempt to mark as failed if we have the agentId
    if (body?.agentId) {
      const registry = await getRegistry();
      const entry = registry.find(e => e.did === body!.agentId);
      if (entry) {
        entry.deployment = {
          ...(entry.deployment || { agentId: body.agentId, deployedAt: new Date().toISOString(), endpointUrl: '', mcpUrl: '' }),
          status: 'failed'
        };
        await updateRegistryEntry(entry);
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error during deployment' },
      { status: 500 }
    );
  }
}
