import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { scanAgent } from '../packages/core/src/abom-scanner.ts';

test('E2E Sync: Schema ↔ Manifest ↔ Detective', async (t) => {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);

  // 1. Load Schema
  const schemaContent = await fs.readFile('schemas/aix.schema.json', 'utf8');
  const schema = JSON.parse(schemaContent);
  const validate = ajv.compile(schema);

  // 2. Load Golden Manifests
  const manifests = [
    'tests/golden_manifests/low-risk.aix.json',
    'tests/golden_manifests/medium-risk.aix.json',
    'tests/golden_manifests/high-risk-infra.aix.json',
    'tests/golden_manifests/saas-heavy.aix.json',
    'tests/golden_manifests/sovereign-agent.aix.json'
  ];

  for (const path of manifests) {
    await t.test(`Validating ${path}`, async () => {
      const content = await fs.readFile(path, 'utf8');
      const agent = JSON.parse(content);

      // A. Schema Validation (Structural)
      const valid = validate(agent);
      if (!valid) {
        console.error(`Schema Errors in ${path}:`, JSON.stringify(validate.errors, null, 2));
      }
      assert.ok(valid, `${path} should be structurally valid against the schema`);

      // B. Detective Validation (Business Logic)
      const report = scanAgent(agent);
      assert.ok(report.score >= 0 && report.score <= 100, `Score for ${path} should be between 0 and 100`);
      
      // Specific Invariant Checks
      if (agent.meta.type === 'infra' || agent.abom.risk_level === 'high') {
         // If it's a golden manifest for high-risk, it should have a decent grade if correct
         if (agent.abom.build_provenance) {
            if (report.grade !== 'A' && report.grade !== 'B') {
               console.log(`Report for ${path}:`, JSON.stringify(report, null, 2));
            }
            assert.ok(report.grade === 'A' || report.grade === 'B', `${path} should have a good grade with provenance`);
         }
      }
    });
  }
});

test('E2E Sync: Detecting Breaking Schema Changes', async (t) => {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);

  const content = await fs.readFile('tests/golden_manifests/low-risk.aix.json', 'utf8');
  const agent = JSON.parse(content);
  
  // Introduce a schema violation (e.g. invalid version format)
  agent.meta.version = "invalid-version";
  
  const schemaContent = await fs.readFile('schemas/aix.schema.json', 'utf8');
  const validate = ajv.compile(JSON.parse(schemaContent));
  
  assert.ok(!validate(agent), "Schema should fail on invalid version format");
});
