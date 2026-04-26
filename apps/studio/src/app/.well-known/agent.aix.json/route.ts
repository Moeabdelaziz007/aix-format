import { NextResponse } from 'next/server';

export async function GET() {
  const aixData = {
    "schemaVersion": "aix/v0.1",
    "meta": {
      "id": "axiomid.studio",
      "name": "AIX Studio",
      "version": "0.1.0",
      "description": "AIX Format Studio — Build, validate and deploy AI agents",
      "author": "Mohamed H Abdelaziz / AMRIKYY AI Solutions",
      "tags": ["studio", "aix", "agent-builder"]
    },
    "agent": {
      "role": "studio",
      "objective": "Author and validate AIX agent packages"
    },
    "capabilities": {
      "tools": ["aix-validate", "aix-parse", "aix-deploy"],
      "permissions": { "network": "limited", "filesystem": "none" }
    },
    "trust": {
      "signature": {
        "type": "detached",
        "issuer": "axiomid",
        "kycProvider": "pi-network"
      }
    },
    "distribution": {
      "endpoint": "https://axiomid.app/.well-known/agent.aix.json"
    }
  };

  return NextResponse.json(aixData);
}
