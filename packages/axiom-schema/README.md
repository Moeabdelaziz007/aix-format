# @axiom/schema

Canonical AIX manifest JSON Schema (Draft 2020-12) and TypeScript types. The single source of truth for the AIX (Artificial Intelligence eXchange) Sovereign Protocol.

This is the first canonical core package shipped under RFC-001. It collapses the JSON schema, the hand-mirrored TypeScript surface, and the version pins that previously lived scattered across the Sovereign Stack into one workspace, with a CI ratchet that prevents the schema and the TypeScript mirror from drifting.

## What this package replaces

| Old location | Replacement |
|---|---|
| `aix-format/schemas/aix.schema.json` (kept, now also shipped on npm) | `@axiom/schema/schema.json` |
| `aix-format/schemas/aix-enhanced.schema.json` | superseded |
| `aix-format/schemas/core/aix.schema.json` | superseded |
| `iqra/src/lib/iqra/14-aix/types.ts` (hand-mirrored) | `import type { AIXManifest, ... } from '@axiom/schema'` |
| `iqra/src/lib/iqra/14-aix/version.ts` (pinned constants) | `import { AIX_FORMAT_VERSION, ... } from '@axiom/schema'` |

## Usage

### Read the JSON Schema

```ts
import schema from '@axiom/schema/schema.json' assert { type: 'json' };
import Ajv from 'ajv';

const ajv = new Ajv({ strict: false });
const validate = ajv.compile(schema);

if (!validate(manifest)) {
  console.error(validate.errors);
}
```

### Use the TypeScript types

```ts
import type { AIXManifest, AIXMeta, AIXPersona, AxiomDID } from '@axiom/schema';
import { isAxiomDID, isDID, AIX_FORMAT_VERSION } from '@axiom/schema';

function buildManifest(meta: AIXMeta, persona: AIXPersona): AIXManifest {
  if (!isAxiomDID(meta.id)) throw new Error('meta.id must be a did:axiom');
  // ...
}
```

### Use the raw generated types

For consumers that want the unenriched mirror of the JSON Schema (no template-literal DID types, no runtime guards, just shapes), import from the `/generated` sub-export:

```ts
import type { AIXManifest as RawManifest } from '@axiom/schema/generated';
```

## Codegen and the drift ratchet

`src/types.gen.ts` is auto-generated from `schemas/aix.schema.json` by `scripts/codegen.ts` (which uses `json-schema-to-typescript`). The committed file is the source of truth for what consumers see at `@axiom/schema/generated`; the rich hand-authored types live in `src/types.ts`.

To regenerate:

```bash
pnpm --filter @axiom/schema codegen
```

The CI workflow `.github/workflows/axiom-schema-codegen.yml` runs the same command on every PR that touches the schema, the codegen script, or the generated file, then fails the build if the regenerated output differs from the committed file. That is the mechanism that defuses the schema-vs-TypeScript drift bomb.

## Publication

The package is published to npm via `.github/workflows/axiom-schema-publish.yml` when a tag matching `axiom-schema-v*` is pushed. The publish workflow:

1. Verifies the tag version matches `package.json#version`.
2. Regenerates the types from the schema (so the published mirror is always current).
3. Builds the TypeScript to `dist/`.
4. Runs `npm publish --access public --provenance` with the `NPM_TOKEN` secret.

To cut a release:

```bash
# Bump the version in packages/axiom-schema/package.json, then:
git tag axiom-schema-v1.3.1
git push origin axiom-schema-v1.3.1
```

## Version compatibility

| `@axiom/schema` | AIX Format | aix-format repo |
|---|---|---|
| `1.3.x` | `1.3` | `0.369.0` |

Bump the package version in lockstep with `AIX_FORMAT_VERSION`. The constant is exported so consumers can pin against it without re-typing the literal.

## Provenance

The TypeScript surface in `src/types.ts` is sourced from `iqra/src/lib/iqra/14-aix/types.ts`, which was originally maintained as a hand-mirror of the schema. This package now hosts the canonical version; downstream consumers should import from `@axiom/schema` rather than re-mirroring.
