# AIX Scripts

Operational scripts that live alongside the protocol source. The Studio
app and its Vercel deployment pipeline used to live in this repo and
several scripts here targeted `apps/studio/`. The Studio code has since
moved out, so this directory is now scoped to protocol-side tooling only.

## Active scripts

The full list lives in this directory; this README only documents the
non-obvious ones. Most scripts are self-describing via their filename
and the comment block at the top.

- `agent-sign.js` / `agent-verify.js` — Ed25519 sign/verify for AIX
  manifests. Used by the `tests/e2e/sign-verify.test.js` and
  `tests/e2e/full-lifecycle.test.js` suites.
- `health-score.ts` / `health-trend.js` — repo health scoring used
  by the `health:check` npm script.
- `dead-code-scan.sh` — wrapped by the `dead-code:scan` npm script.
- `schema-type-sync.ts` — drift detection between
  `schemas/aix.schema.json` and `packages/aix-types/index.d.ts`.
  See AGENTS.md for the codegen ratchet rules.
- `validate-env.ts` — environment validation, wrapped by
  `validate:env` and `env:check`.

## Removed (no longer in this repo)

- `vercel-auto-fix.sh` — the Vercel auto-fix loop targeted
  `apps/studio/src/` which is no longer part of this repository.
  Removed alongside the rest of the Vercel deploy setup.
- `webpack-fix.sh` — same: targeted `apps/studio/` webpack errors.
- `meta-loop-cleaner.sh` — previously documented but the file was
  never committed.

If you maintain the Studio repo and need any of these back, recover
them from `git log -- scripts/<file>` in this repo's history.
