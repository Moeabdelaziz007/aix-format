# @axiom/health

Repo health score over four independent metrics. Replaces:

| Replaced | Source |
|---|---|
| `dead-code-scan.sh` | `aix-format` |
| `health-score.ts` (Growth Engine) | `iqra` |
| `dashboard.yml` health step | `aix-agent-skills` |
| ad-hoc coverage threshold scripts | all three repos |

## Sub-scores

| Metric | What it measures | Weight |
|---|---|---|
| `dead-code` | Exported symbols with zero references in the workspace | 25 |
| `coverage` | Line coverage from a Jest / Istanbul / Go-style JSON report | 25 |
| `trust-chain` | Linkage integrity (`prev_hash` chain, monotonic index, no duplicate hashes) | 25 |
| `type-drift` | SHA-256 of a generated artifact vs a recorded manifest | 25 |

Missing inputs (no coverage report, no chain export) yield a `null` sub-score and are **excluded** from the average — a repo without coverage instrumentation reports honestly instead of scoring zero.

## CLI

```bash
axiom-health \
  --root . \
  --coverage coverage/coverage-summary.json \
  --chain .generated/agent-checkpoint.json \
  --generated types/parser.d.ts \
  --drift-manifest types/parser.d.ts.sha256.json \
  --min-coverage 70 \
  --fail-below 60
```

## Programmatic

```ts
import {
  deadCodeScore, coverageScore, trustChainScore, typeDriftScore, aggregateHealth, collectSourceFiles,
} from '@axiom/health';

const report = aggregateHealth([
  deadCodeScore('.', collectSourceFiles('.')),
  coverageScore('coverage/coverage-summary.json'),
  trustChainScore('chain.json'),
  typeDriftScore('types/parser.d.ts', 'types/parser.d.ts.sha256.json'),
]);

console.log(report.aggregate);
```

## Tests

```bash
cd packages/axiom-health && pnpm test
```
