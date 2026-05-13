# @axiom/lint

Unified lint pipeline for the Axiom stack. Replaces six scattered tools with one:

| Replaced | Source repo |
|---|---|
| husky `iqra:guard:secrets` | `iqra` |
| husky `iqra:guard:size` | `iqra` |
| husky `iqra:guard:names` | `iqra` |
| `charter.rules.txt` (regex sentinel) | `aix-agent-skills` |
| `sentinel-autofix.yml` detection half | `aix-agent-skills` |
| ad-hoc em-dash checks | all three repos |

## What it checks

- **`no-secrets`** (error): AWS keys, GitHub PATs (classic + fine-grained), Slack tokens, OpenAI keys, PEM private keys, Pi Network app/api secrets.
- **`no-em-dash`** (warning): rejects U+2014 in source and prose.
- **`no-tab-in-markdown`** (warning): tabs break MD renderers.
- **`no-todo-marker`** (info): `TODO` / `FIXME` / `XXX` / `HACK` markers must be tracked as issues.
- **`max-file-size`** (warning, default 500 KB): forces refactor on bloated files.
- **`naming-convention`** (warning, default `mixed` = disabled): enforces `kebab-case` or `snake_case` filenames.

## CLI

```bash
axiom-lint <path...>                     # text report, exits 1 on errors
axiom-lint . --json                       # JSON to stdout
axiom-lint . --fail-on warning            # treat warnings as failures
axiom-lint . --naming kebab-case          # enforce kebab-case
axiom-lint . --max-bytes 200000           # 200 KB ceiling
```

## Programmatic

```ts
import { lintFiles } from '@axiom/lint';
const report = lintFiles(['src/a.ts', 'src/b.md'], { naming: 'kebab-case' });
if (report.errorCount > 0) process.exit(1);
```

## What it does NOT do

- **No auto-fix.** Detection only. `@axiom/autofix` handles fixes behind a human approval gate.
- **No formatting opinions** beyond the rules above. Use Prettier for layout.
- **No type checking.** Use `tsc --noEmit` or `@axiom/validate`.

## Tests

```bash
cd packages/axiom-lint && pnpm test
```
