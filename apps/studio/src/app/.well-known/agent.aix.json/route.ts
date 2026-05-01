import { NextResponse } from 'next/server';
// @ts-ignore
import packageJson from '../../../../package.json';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimitKey = `well-known:${ip}`;
  
  // Max 10 requests/minute per IP
  const allowed = await checkRateLimit(rateLimitKey, 10, 60);
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  }

  const version = packageJson.version;
  const payload = {
    schemaVersion: "aix/v0.1",
    meta: {
      id: "axiomid.studio",
      name: "AIX Studio",
      version: version,
      description: "AIX Format Studio — Build, validate and deploy AI agents",
      author: "Mohamed H Abdelaziz / AMRIKYY AI Solutions",
      tags: ["studio", "aix", "agent-builder"]
    },
    agent: {
      role: "studio",
      objective: "Author and validate AIX agent packages"
    },
    capabilities: {
      tools: ["aix-validate", "aix-parse", "aix-deploy"]
    },
    permissions: {
      network: "limited",
      filesystem: "none"
    },
    trust: {
      signature: {
        type: "detached",
        issuer: "axiomid",
        kycProvider: "pi-network"
      }
    },
    distribution: {
      endpoint: "https://axiomid.app/.well-known/agent.aix.json"
    },
    _meta: {
      generatedAt: new Date().toISOString(),
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? "local"
    }
  };

  return NextResponse.json(payload, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      'X-AIX-Version': version
    }
  });
}
