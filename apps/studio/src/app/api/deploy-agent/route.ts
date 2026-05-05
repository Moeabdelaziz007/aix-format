import { NextRequest, NextResponse } from 'next/server';
import { DeployRequest, DeploymentRecord, Manifest } from '@/lib/types';
import { getRegistry, updateRegistryEntry } from '@/lib/registry';
import { AbomScanner } from '@aix-core';

export async function POST(req: NextRequest) {
  let body: DeployRequest | null = null;
  try {
    body = await req.json();
    if (!body || !body.agentId || !body.target || !body.yaml) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const registry = await getRegistry();
    const entry = registry.find(e => e.did === body!.agentId);
    if (!entry) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    // 🌀 [COGNITIVE_STEP]: Transitioning to 'deploying' state
    await updateRegistryStatus(entry, 'deploying');

    // 🌀 [COGNITIVE_STEP]: Security Hardening via ABOM
    await performAbomScan(entry, body.yaml);

    // 🌀 [COGNITIVE_STEP]: Real-World Execution
    const deployUrl = await deployToTarget(body);

    // 🌀 [COGNITIVE_STEP]: Finalization
    entry.deployment = {
      agentId: body.agentId,
      deployedAt: new Date().toISOString(),
      endpointUrl: deployUrl,
      mcpUrl: `${deployUrl}/api/mcp-discovery`,
      status: 'deployed'
    };
    await updateRegistryEntry(entry);

    return NextResponse.json({ deployUrl, status: 'deployed' });

  } catch (error: any) {
    return handleDeploymentError(body?.agentId, error);
  }
}

/**
 * 🛰️ [TOPOLOGICAL_HELPER]: performAbomScan
 * Purpose: Ensures code integrity and security before deployment.
 */
async function performAbomScan(entry: any, yaml: string) {
  const { parseYamlSafe } = await import('@/lib/utils');
  const yamlObj = parseYamlSafe(yaml) as any;
  const report = await AbomScanner.scan(yamlObj);
  
  entry.abom = {
    risk_level: report.riskScore < 40 ? 'safe' : report.riskScore < 70 ? 'moderate' : 'high',
    timestamp: new Date().toISOString(),
    bom_format: 'AIX-NATIVE',
    score: 100 - report.riskScore
  };
  
  if (!report.valid && report.riskScore > 50) {
    const errorMsg = report.errors.map(e => e.message).join('; ');
    throw new Error(`ABOM Risk too high (${report.riskScore}): ${errorMsg}`);
  }
}

/**
 * 🛰️ [TOPOLOGICAL_HELPER]: deployToTarget
 * Purpose: Orchestrates the physical deployment to providers (Vercel, etc).
 */
async function deployToTarget(body: DeployRequest): Promise<string> {
  if (body.target === 'vercel') {
    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${body.config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: body.config.projectName, files: [{ file: `${body.agentId}.yaml`, data: body.yaml }], target: 'production' })
    });
    if (!response.ok) throw new Error('Vercel API Failure');
    const data = await response.json();
    return `https://${data.url}`;
  }
  return body.config.endpointUrl || '';
}

async function updateRegistryStatus(entry: any, status: string) {
  entry.deployment = { ...entry.deployment, status };
  await updateRegistryEntry(entry);
}

function handleDeploymentError(agentId: string | undefined, error: any) {
  console.error('[Deployment:Failure]', error);
  return NextResponse.json({ error: error.message || 'Deployment failed' }, { status: 500 });
}
