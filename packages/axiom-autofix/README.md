# @axiom/autofix

The ONE auto-fix tool in the Axiom stack, behind a single-use human-approval gate. Replaces every auto-PR antipattern in the org:

| Replaced | Source |
|---|---|
| `TawbahLoop` (auto-fix-and-PR daemon) | `iqra` |
| `sentinel-autofix.yml` (auto-PR workflow) | `aix-agent-skills` |
| ad-hoc `--fix` scripts in three repos | all |

## The contract (deliberately conservative)

1. **Every transform is deterministic and idempotent.** Re-running yields no further change.
2. **The runner refuses to write files without `--approve <token>`.** Without a token, the tool prints what *would* change and exits 0.
3. **No git operations.** No commit, no push, no PR creation. The operator drives git.

These three rules are the whole point — they prevent bots from rewriting history while a human is asleep.

## Usage

```bash
# 1) Mint a single-use token. Print the SHA into the recorded-token file.
axiom-autofix mint-token
#   SHA: 84a1b2...
#   TOKEN: axfx-c0ffee...

echo "84a1b2..." > .axiom-autofix.token.sha

# 2) See what would change (no writes).
axiom-autofix diff README.md docs/

# 3) Apply with the token. The recorded SHA is consumed on success.
axiom-autofix apply README.md docs/ --approve axfx-c0ffee...

# 4) A second apply needs a fresh mint-token.
```

## Built-in fixes

| Id | What it does |
|---|---|
| `no-em-dash` | `foo \u2014 bar` → `foo - bar` |
| `no-tab-in-markdown` | Leading tabs in `.md` → two-space indents |
| `no-trailing-whitespace` | Strip end-of-line spaces |
| `final-newline` | Collapse multiple trailing newlines to one |

## Programmatic

```ts
import { applyFixesToFile } from '@axiom/autofix';
const results = applyFixesToFile('a.md', { approved: process.env.APPROVED === '1' });
for (const r of results) {
  console.log(r.fix, r.applied ? 'wrote' : 'gated');
}
```

## Tests

```bash
cd packages/axiom-autofix && pnpm test
```
