import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

/**
 * AIX Discovery Generator
 * Converts a core .aix manifest into a .well-known/agent.aix.json for W3C-style discovery.
 */

interface AIXManifest {
  meta: {
    name: string;
    description: string;
    version: string;
  };
  identity_layer: {
    id: string;
    kyc_tier: number;
    verified: boolean;
  };
  mcp?: {
    servers: Array<{
      name: string;
      capabilities?: string[];
      description?: string;
    }>;
  };
  skills?: Array<{
    name: string;
    description: string;
  }>;
}

function extractMCPCapabilities(manifest: AIXManifest) {
  // Logic to map internal skills/mcp to a unified capability list
  const tools = manifest.mcp?.servers.flatMap(s => s.capabilities || []) || [];
  const skills = manifest.skills?.map(s => s.name) || [];

  return {
    tools: [...new Set([...tools, ...skills])],
    resources: [], // Placeholder for future resource discovery
    prompts: []    // Placeholder for future prompt discovery
  };
}

function generateDiscoveryJSON(manifest: AIXManifest) {
  return {
    "@context": "https://www.w3.org/ns/ai-agent", // Illustrative W3C-style context
    "spec_version": "1.3.0",
    "name": manifest.meta.name,
    "description": manifest.meta.description,
    "version": manifest.meta.version,
    "identity": {
      "did": manifest.identity_layer.id,
      "kyc_tier": manifest.identity_layer.kyc_tier,
      "verified": manifest.identity_layer.verified,
      "authority": "axiomid.app"
    },
    "capabilities": {
      "mcp": extractMCPCapabilities(manifest)
    },
    "endpoints": {
      "mcp_url": "/api/mcp" // Convention for local discovery
    }
  };
}

const inputPath = process.argv[2];
const outputPath = process.argv[3] || '.well-known/agent.aix.json';

if (!inputPath) {
  console.error('Usage: ts-node scripts/generate-discovery.ts <path-to-aix>');
  process.exit(1);
}

try {
  const content = fs.readFileSync(inputPath, 'utf8');
  const manifest = yaml.load(content) as AIXManifest;

  const discovery = generateDiscoveryJSON(manifest);

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(discovery, null, 2));
  console.log(`✅ Discovery file generated at: ${outputPath}`);
} catch (err) {
  console.error(`❌ Failed to generate discovery file: ${err.message}`);
  process.exit(1);
}
