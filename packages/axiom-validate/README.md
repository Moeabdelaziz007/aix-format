# @axiom/validate

Unified validation for manifests, generated types, golden fixtures, and skill markdown. Replaces five scattered tools:

| Replaced | Source |
|---|---|
| `bin/aix-validate.js` | `aix-format` |
| `scripts/schema-type-sync.ts` | `aix-format` |
| `schemas-drift-check.yml` step | `aix-format` |
| `schema_sentinel.py` | `aix-agent-skills` |
| `skill-evaluator.ts` (stub) | `aix-agent-skills` |

## CLI

```bash
# Validate a manifest against an AIX schema
axiom-validate schema schemas/aix.schema.json examples/persona-agent.aix.json

# Validate every fixture in a directory
axiom-validate goldens schemas/aix.schema.json tests/golden_manifests

# Validate a skill markdown file
axiom-validate skill skills/my-skill.md

# Type drift: regenerate types and pipe expected output via stdin
pnpm run generate:types --stdout | axiom-validate drift types/parser.d.ts
```

## Checkers

- **`schema`**: Ajv 2020-12 against the supplied JSON Schema. Reports each error with `instancePath` so you can fix the offending field directly.
- **`goldens`**: shorthand for "schema on every fixture in a directory".
- **`skill`**: enforces the skill markdown contract (frontmatter `name`/`tier`/`description`, kebab-case name, tier in 0..5, body must have `## Purpose`, refuses TODO stubs).
- **`drift`**: byte-for-byte diff against an expected generated output piped in via stdin. Points at the first differing line.

## Programmatic

```ts
import { validateAgainstSchema, validateSkillMarkdown } from '@axiom/validate';
```

## Tests

```bash
cd packages/axiom-validate && pnpm test
```
