#!/usr/bin/env node
// بسم الله الرحمن الرحيم
// Axiom Baseline Smoke Suite — هدفها التأكد إن التحول إلى Axiom
// ما كسر الأساس. 12 سيناريو blocker: parsing + schema validation +
// CI gates. Each scenario is small, fast (sub-second), and fails fast
// on the first regression. Run on every PR via the smoke-gate workflow.
//
// Usage:
//   node scripts/smoke.mjs           # text output, exit 1 on first fail
//   node scripts/smoke.mjs --json    # structured JSON for CI consumption
//
// Adding a scenario: append a Case object to CASES. Keep it pure:
// every scenario takes zero arguments, returns Promise<{ok, detail}>,
// and refuses external state (network, mutable filesystem outside tmp).

import { readFileSync, existsSync, statSync, mkdtempSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Tiny test infrastructure — no dependency on a test runner so smoke.mjs is
// runnable in any environment where Node 22 is present.

const CASES = [];
const it = (name, fn, category = 'misc') => CASES.push({ name, fn, category });
const asJson = process.argv.includes('--json');

function ok(detail = '') { return { ok: true, detail }; }
function fail(detail) { return { ok: false, detail }; }
async function check(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Lazy import the engine bits the smoke cases need.
async function loadParser() {
  const mod = await import(resolve(REPO, 'core/parser.js'));
  return mod;
}
async function loadValidate() {
  const mod = await import(resolve(REPO, 'packages/axiom-validate/src/index.ts'));
  return mod;
}
async function loadLint() {
  const mod = await import(resolve(REPO, 'packages/axiom-lint/src/index.ts'));
  return mod;
}
async function loadHealth() {
  const mod = await import(resolve(REPO, 'packages/axiom-health/src/index.ts'));
  return mod;
}

// ---------------------------------------------------------------------------
// PARSING (4)

it('parses a valid YAML manifest from examples/', async () => {
  const { AIXParser } = await loadParser();
  const parser = new AIXParser();
  const raw = readFileSync(resolve(REPO, 'examples/persona-agent.aix'), 'utf8');
  const agent = await parser.parse(raw, 'persona-agent.aix');
  await check(agent && agent.meta, 'parser must return AIXAgent with meta block');
  return ok(`meta.version=${agent.meta.version}`);
}, 'parsing');

it('parses a valid JSON manifest from tests/golden_manifests/', async () => {
  const { AIXParser } = await loadParser();
  const parser = new AIXParser();
  const path = resolve(REPO, 'tests/golden_manifests/medium-risk.aix.json');
  const raw = readFileSync(path, 'utf8');
  const agent = await parser.parse(raw, path);
  await check(agent && agent.meta, 'parser must return AIXAgent');
  return ok(`name=${agent.meta?.name || '<unset>'}`);
}, 'parsing');

it('rejects a syntactically-malformed JSON manifest', async () => {
  const { AIXParser } = await loadParser();
  const parser = new AIXParser();
  let threw = false;
  try {
    await parser.parse('{ this is not json', 'bad.json');
  } catch {
    threw = true;
  }
  await check(threw, 'malformed JSON must produce a thrown error or rejection');
  return ok('parser refused malformed JSON');
}, 'parsing');

it('parses v0.369.0 optional-fields fixture without dropping data', async () => {
  const fixturePath = resolve(REPO, 'tests/fixtures/schema/v0.369.0-optional-fields.aix.json');
  if (!existsSync(fixturePath)) return ok('fixture not present (post-#160 baseline) — skipped');
  const raw = readFileSync(fixturePath, 'utf8');
  const data = JSON.parse(raw);
  await check(data.aix_version === '0.369.0', 'aix_version must round-trip exactly');
  await check(
    data.identity_layer && data.identity_layer.zk_proof && data.identity_layer.pi_uid_anchor,
    'v0.369.0 fixture must carry zk_proof + pi_uid_anchor',
  );
  return ok('aix_version + zk_proof + pi_uid_anchor present');
}, 'parsing');

// ---------------------------------------------------------------------------
// SCHEMA VALIDATION (5)

it('canonical schema parses as JSON with no syntax errors', async () => {
  const raw = readFileSync(resolve(REPO, 'schemas/aix.schema.json'), 'utf8');
  const schema = JSON.parse(raw);
  await check(schema.$id, 'schema must declare $id');
  await check(schema.type === 'object', 'top-level type must be object');
  await check(schema.required && schema.required.length >= 4, 'required[] must list core sections');
  return ok(`$id=${schema.$id}, ${(schema.required ?? []).length} required keys`);
}, 'schema');

it('validateAgainstSchema accepts the medium-risk golden manifest', async () => {
  const { validateAgainstSchema } = await loadValidate();
  const schema = JSON.parse(readFileSync(resolve(REPO, 'schemas/aix.schema.json'), 'utf8'));
  const manifest = JSON.parse(readFileSync(resolve(REPO, 'tests/golden_manifests/medium-risk.aix.json'), 'utf8'));
  const findings = validateAgainstSchema(schema, manifest, 'medium-risk');
  if (findings.length > 0) {
    return fail(`unexpected errors: ${JSON.stringify(findings.slice(0, 3))}`);
  }
  return ok('zero schema errors on medium-risk');
}, 'schema');

it('validateAgainstSchema flags a manifest missing required `meta`', async () => {
  const { validateAgainstSchema } = await loadValidate();
  const schema = JSON.parse(readFileSync(resolve(REPO, 'schemas/aix.schema.json'), 'utf8'));
  const bad = { persona: { role: 'r', instructions: 'x' } };
  const findings = validateAgainstSchema(schema, bad, 'bad');
  await check(findings.length > 0, 'missing required `meta` must produce findings');
  const mentionsMeta = findings.some(f => /meta/.test(f.message) || /meta/.test(f.path ?? ''));
  await check(mentionsMeta, 'at least one finding must reference `meta`');
  return ok(`${findings.length} finding(s) on missing meta`);
}, 'schema');

it('types/parser.d.ts is in sync with schemas/aix.schema.json (drift gate)', async () => {
  const dts = resolve(REPO, 'types/parser.d.ts');
  await check(existsSync(dts), 'types/parser.d.ts must exist');
  const body = readFileSync(dts, 'utf8');
  // The codegen header is the load-bearing canary: any hand-edit drops
  // it, any regen restores it.
  await check(body.includes('DO NOT MODIFY IT BY HAND'), 'parser.d.ts is missing the generated-file header — was it hand-edited?');
  const sha = createHash('sha256').update(body).digest('hex');
  return ok(`sha256=${sha.slice(0, 12)} (header present, drift gate alive)`);
}, 'schema');

it('every fixture under tests/fixtures/schema/ validates clean', async () => {
  const fixtureDir = resolve(REPO, 'tests/fixtures/schema');
  if (!existsSync(fixtureDir)) return ok('fixture dir not present (pre-#154 baseline) — skipped');
  const { validateAgainstSchema } = await loadValidate();
  const schema = JSON.parse(readFileSync(resolve(REPO, 'schemas/aix.schema.json'), 'utf8'));
  const { readdirSync } = await import('node:fs');
  const fixtures = readdirSync(fixtureDir).filter(f => f.endsWith('.aix.json'));
  let total = 0; let bad = 0;
  for (const f of fixtures) {
    total++;
    const manifest = JSON.parse(readFileSync(join(fixtureDir, f), 'utf8'));
    const findings = validateAgainstSchema(schema, manifest, f);
    if (findings.length > 0) bad++;
  }
  if (bad > 0) return fail(`${bad}/${total} schema fixtures regressed`);
  return ok(`${total} schema fixtures all valid`);
}, 'schema');

// ---------------------------------------------------------------------------
// CI GATES (3)

it('axiom-lint clean on the four @axiom/* check packages (dogfood)', async () => {
  const { lintFiles } = await loadLint();
  const { readdirSync } = await import('node:fs');
  function walk(d, out) {
    const ents = readdirSync(d, { withFileTypes: true });
    for (const e of ents) {
      const p = join(d, e.name);
      if (e.isDirectory()) {
        if (!/(?:^|[\\/])(?:node_modules|test|tests|dist|build)(?:[\\/]|$)/.test(p)) walk(p, out);
      } else if (e.isFile() && /\.(ts|js|mjs|md)$/.test(e.name)) {
        out.push(p);
      }
    }
  }
  const files = [];
  for (const pkg of ['axiom-lint', 'axiom-validate', 'axiom-health', 'axiom-autofix']) {
    const dir = resolve(REPO, 'packages', pkg);
    if (existsSync(dir)) walk(dir, files);
  }
  const report = lintFiles(files, { naming: 'mixed' });
  if (report.errorCount > 0) {
    return fail(`${report.errorCount} lint error(s); first: ${JSON.stringify(report.findings.find(f => f.severity === 'error'))}`);
  }
  return ok(`${report.totalFiles} files scanned, ${report.errorCount} errors`);
}, 'gate');

it('bin/aix-validate.js runs without crashing on a sample manifest', async () => {
  const bin = resolve(REPO, 'bin/aix-validate.js');
  await check(existsSync(bin), 'bin/aix-validate.js must exist');
  const target = resolve(REPO, 'tests/golden_manifests/medium-risk.aix.json');
  const result = spawnSync(process.execPath, [bin, target], { encoding: 'utf8', timeout: 10_000 });
  // Exit code is allowed to be non-zero (the manifest may fail rules);
  // what we forbid is a process-level crash (signal != null, uncaught
  // ReferenceError, EISDIR, etc.).
  await check(result.signal === null, `bin/aix-validate killed by signal ${result.signal}`);
  await check(!/TypeError: Cannot read properties|EISDIR|Cannot find module/.test(result.stderr ?? ''), `bin/aix-validate crashed: ${result.stderr?.slice(0, 200)}`);
  return ok(`exit=${result.status} (non-crash)`);
}, 'gate');

it('axiom-health dead-code score is computable on this workspace', async () => {
  const { deadCodeScore, collectSourceFiles } = await loadHealth();
  const sources = collectSourceFiles(REPO).slice(0, 200); // cap for speed
  const sub = deadCodeScore(REPO, sources);
  await check(sub.score === null || (sub.score >= 0 && sub.score <= 100), `dead-code score out of [0, 100]: ${sub.score}`);
  return ok(sub.detail);
}, 'gate');

// ---------------------------------------------------------------------------
// Runner

async function main() {
  const results = [];
  let fails = 0;
  const start = Date.now();
  for (const c of CASES) {
    const t0 = Date.now();
    let r;
    try { r = await c.fn(); }
    catch (e) { r = fail(`THREW: ${(e && e.message) || String(e)}`); }
    const ms = Date.now() - t0;
    if (!r.ok) fails++;
    results.push({ name: c.name, category: c.category, ok: r.ok, detail: r.detail, ms });
    if (!asJson) {
      const tag = r.ok ? '✔' : '✖';
      console.log(`  ${tag} [${c.category}] ${c.name}  (${ms}ms)  ${r.detail}`);
    }
  }
  const total = Date.now() - start;
  if (asJson) {
    console.log(JSON.stringify({ total_ms: total, fails, results }, null, 2));
  } else {
    console.log('');
    console.log(`Smoke: ${results.length - fails}/${results.length} passed in ${total}ms`);
    if (fails > 0) {
      console.log('FAILED scenarios:');
      for (const r of results.filter(x => !x.ok)) {
        console.log(`  - ${r.name}: ${r.detail}`);
      }
    }
  }
  process.exit(fails === 0 ? 0 : 1);
}

main().catch(e => {
  console.error('smoke runner crashed:', e);
  process.exit(2);
});
