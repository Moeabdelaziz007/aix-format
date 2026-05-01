# Skill: AIX Manifest Schema

## Canonical Location
- **schemas/core/aix.schema.json** (single source of truth)
- **schemas/modules/identity.schema.json**
- **schemas/modules/economics.schema.json**
- **schemas/modules/security.schema.json**

## Required Fields (every valid manifest MUST have)
- `aix_version`: "1.3.0"
- `agent.name`: string (3-50 chars)
- `agent.description`: string (10-200 chars)
- `identity.provider`: "pi-network" | "ethereum" | "solana" | "custom"
- `abom.risk_score`: number (0-100)
- `build_provenance.builder`: string

## Optional but Recommended
- `economics.pricing.tier`: "free" | "builder" | "pro" | "enterprise"
- `abom.saas_services[]`: array
- `skills[]`: array of skill IDs

## Validation Pattern (ALWAYS use in API routes)
```typescript
import { validateManifest } from '@/lib/schema-validator';

const result = validateManifest(manifest);
if (!result.valid) {
  return Response.json({ errors: result.errors }, { status: 400 });
}
```

## Golden Manifests (reference these in tests)
- `tests/golden_manifests/low-risk.aix.json`
- `tests/golden_manifests/sovereign-agent.aix.json`
