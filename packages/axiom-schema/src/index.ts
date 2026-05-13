/**
 * 🧬 @axiom/schema — Canonical AIX manifest schema and TypeScript types.
 *
 * The default export surface is the hand-authored rich types in
 * `./types`, which include template-literal DID types and runtime
 * guards. The raw codegen mirror is available at
 * `@axiom/schema/generated` for callers that want the unenriched
 * shapes the JSON schema produces verbatim.
 *
 * The JSON Schema itself ships at `@axiom/schema/schema.json` as a
 * sub-export so AJV-style validators can consume it directly without
 * pulling the TS surface.
 *
 * Constitutional alignment (RFC-001):
 *   - Single source of truth. Schema lives here; consumers stop mirroring.
 *   - No mocks. Types track real schema constraints; guards use the
 *     same regex the schema enforces.
 *   - No hallucinations. Optional fields stay optional; required stay required.
 */

export * from './types.js';
export * from './version.js';
