import { NextRequest, NextResponse } from 'next/server';
import { DeployRequest, DeployResponse, DeploymentRecord, RegistryEntry } from '@/lib/types';
import { getRegistry, updateRegistryEntry } from '@/lib/registry';
import { scanAgent } from '../../../../../../core/abom-scanner';

export async function POST(req: NextRequest) {
  let body: DeployRequest | null = null;
  try {
    body = await req.json();

    // 1. Validation
    if (!body || !body.agentId || !body.target || !body.yaml) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 2. Fetch existing entry
    const registry = await getRegistry();
    const entry = registry.find(e => e.did === body!.agentId);

    if (!entry) {
      return NextResponse.json(
        { error: 'Agent not found in registry. Please save first.' },
        { status: 404 }
      );
    }

    // 3. Mark as deploying in registry
    entry.deployment = {
      agentId: body.agentId,
      deployedAt: new Date().toISOString(),
      endpointUrl: '',
      mcpUrl: '',
      status: 'deploying'
    };
    await updateRegistryEntry(entry);

    // 4. Harden: Run ABOM Scan before deployment
    try {
      const yamlObj = (await import('js-yaml')).default.load(body.yaml);
      const report = scanAgent(yamlObj);
      entry.abom = {
        ...entry.abom,
        risk_level: report.grade === 'A' ? 'low' : report.grade === 'B' ? 'medium' : 'high',
        timestamp: report.timestamp,
        integrity_hash: entry.abom?.integrity_hash || 'pending',
        bom_format: 'AIX-NATIVE',
        spec_version: '1.0',
        capabilities: report.risks.map(r => r.message),
        dependencies: [],
        generated_by: 'AIX-Studio-Scanner'
      };
      
      if (report.score < 50) {
        throw new Error(`Security Risk: ABOM Score too low (${report.score}). Deployment blocked.`);
      }
    } catch (scanError: any) {
       entry.deployment.status = 'failed';
       await updateRegistryEntry(entry);
       return NextResponse.json({ error: scanError.message }, { status: 403 });
    }

    let deployUrl = '';

    if (body.target === 'vercel') {
      if (!body.config.token || !body.config.projectName) {
        entry.deployment.status = 'failed';
        await updateRegistryEntry(entry);
        return NextResponse.json(
          { error: 'Vercel deployment requires token and project name' },
          { status: 400 }
        );
      }

      // NEW-001: REAL VERCEL DEPLOYMENT API
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
      deployUrl = `https://${data.url}`;

    } else {
      // Custom Target
      if (!body.config.endpointUrl) {
         entry.deployment.status = 'failed';
         await updateRegistryEntry(entry);
         return NextResponse.json({ error: 'Custom target requires endpointUrl' }, { status: 400 });
      }
      deployUrl = body.config.endpointUrl;
    }

    // 5. Finalize deployment record
    const deployment: DeploymentRecord = {
      agentId: body.agentId,
      deployedAt: new Date().toISOString(),
      endpointUrl: deployUrl,
      mcpUrl: `${deployUrl}/api/mcp-discovery`,
      status: 'deployed'
    };

    entry.deployment = deployment;
    await updateRegistryEntry(entry);

    return NextResponse.json({
      deployUrl,
      status: 'deployed'
    });

  } catch (error: any) {
    console.error('Deployment failure:', error);
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
      { error: error.message || 'Internal server error during deployment' },
      { status: 500 }
    );
  }
}
