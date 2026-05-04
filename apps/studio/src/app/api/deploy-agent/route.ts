import { NextRequest, NextResponse } from 'next/server';
import { DeployRequest, DeploymentRecord, Manifest, RegistryEntry } from '@/lib/types';
import { getRegistry, updateRegistryEntry } from '@/lib/registry';
import { scanAgent } from '../../../../../../core/abom-scanner';

async function performAbomScan(body: DeployRequest, entry: RegistryEntry): Promise<{ error?: string, status?: number }> {
  try {
    const { parseYamlSafe } = await import('@/lib/utils');
    const yamlObj = parseYamlSafe(body.yaml) as Partial<Manifest>;

    const report = scanAgent(yamlObj);
    entry.abom = {
      ...entry.abom,
      risk_level: report.grade === 'A' ? 'low' : report.grade === 'B' ? 'medium' : 'high',
      timestamp: report.timestamp,
      integrity_hash: entry.abom?.integrity_hash || 'pending',
      bom_format: 'AIX-NATIVE',
      spec_version: '1.0',
      capabilities: report.risks.map((r: any) => r.message),
      dependencies: [],
      generated_by: 'AIX-Studio-Scanner'
    };

    if (report.score < 50) {
      throw new Error(`Security Risk: ABOM Score too low (${report.score}). Deployment blocked.`);
    }
    return {};
  } catch (scanError: any) {
     return { error: scanError.message, status: 403 };
  }
}

async function deployToTarget(body: DeployRequest): Promise<{ deployUrl?: string, error?: string, status?: number }> {
  if (body.target === 'vercel') {
    if (!body.config.token || !body.config.projectName) {
      return { error: 'Vercel deployment requires token and project name', status: 400 };
    }

    const projectName = body.config.projectName;
    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${body.config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: projectName,
        files: [
          {
            file: `${body.agentId.replace(/:/g, '-')}.yaml`,
            data: body.yaml
          }
        ],
        projectSettings: {
          framework: null,
          buildCommand: null,
          installCommand: null,
          outputDirectory: null
        },
        target: 'production'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Vercel API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return { deployUrl: `https://${data.url}` };

  } else {
    // Custom Target
    if (!body.config.endpointUrl) {
       return { error: 'Custom target requires endpointUrl', status: 400 };
    }
    return { deployUrl: body.config.endpointUrl };
  }
}

async function handleFailure(body: DeployRequest | null, error: any) {
  console.error('Deployment failure:', error);
  if (body?.agentId) {
    const registry = await getRegistry();
    const entry = registry.find(e => e.did === body!.agentId);
    if (entry) {
      entry.deployment = {
        ...(entry.deployment || { agentId: body.agentId, deployedAt: new Date().toISOString(), endpointUrl: '', mcpUrl: '', status: 'failed' as const }),
        status: 'failed' as const
      };
      await updateRegistryEntry(entry);
    }
  }
}

export async function POST(req: NextRequest) {
  let body: DeployRequest | null = null;
  try {
    body = await req.json();

    if (!body || !body.agentId || !body.target || !body.yaml) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const registry = await getRegistry();
    const entry = registry.find(e => e.did === body!.agentId);

    if (!entry) {
      return NextResponse.json({ error: 'Agent not found in registry. Please save first.' }, { status: 404 });
    }

    entry.deployment = { agentId: body.agentId, deployedAt: new Date().toISOString(), endpointUrl: '', mcpUrl: '', status: 'deploying' };
    await updateRegistryEntry(entry);

    const scanResult = await performAbomScan(body, entry);
    if (scanResult.error) {
       entry.deployment.status = 'failed';
       await updateRegistryEntry(entry);
       return NextResponse.json({ error: scanResult.error }, { status: scanResult.status || 403 });
    }

    const deployResult = await deployToTarget(body);
    if (deployResult.error) {
       entry.deployment.status = 'failed';
       await updateRegistryEntry(entry);
       return NextResponse.json({ error: deployResult.error }, { status: deployResult.status || 400 });
    }

    entry.deployment = {
      agentId: body.agentId, deployedAt: new Date().toISOString(),
      endpointUrl: deployResult.deployUrl!,
      mcpUrl: `${deployResult.deployUrl}/api/mcp-discovery`, status: 'deployed'
    };
    await updateRegistryEntry(entry);

    return NextResponse.json({ deployUrl: deployResult.deployUrl, status: 'deployed' });

  } catch (error: any) {
    await handleFailure(body, error);
    return NextResponse.json({ error: error.message || 'Internal server error during deployment' }, { status: 500 });
  }
}
