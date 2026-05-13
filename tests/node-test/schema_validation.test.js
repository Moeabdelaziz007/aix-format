import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

/**
 * AIX v0.369.0 Official Schema Validation Test
 * Ensures that any .aix.json manifest complies with the frozen protocol spec.
 */

test('Official Schema Validation: AIX v0.369.0', async (t) => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  // Load modules first so Ajv can resolve references
  const securitySchema = JSON.parse(await fs.readFile('schemas/modules/security.schema.json', 'utf8'));
  const identitySchema = JSON.parse(await fs.readFile('schemas/modules/identity.schema.json', 'utf8'));
  const economicsSchema = JSON.parse(await fs.readFile('schemas/modules/economics.schema.json', 'utf8'));
  
  ajv.addSchema(securitySchema);
  ajv.addSchema(identitySchema);
  ajv.addSchema(economicsSchema);

  // Load the frozen schema
  const schemaContent = await fs.readFile('schemas/core/aix.schema.json', 'utf8');
  const schema = JSON.parse(schemaContent);
  const validate = ajv.compile(schema);

  // Test cases (Golden manifests)
  const samples = [
    'tests/golden_manifests/low-risk.aix.json',
    'tests/golden_manifests/sovereign-agent.aix.json'
  ];

  for (const sample of samples) {
    await t.test(`Validating Sample: ${sample}`, async () => {
      const content = await fs.readFile(sample, 'utf8');
      const manifest = JSON.parse(content);
      
      const valid = validate(manifest);
      if (!valid) {
        console.error(`Validation Failed for ${sample}:`, JSON.stringify(validate.errors, null, 2));
      }
      
      assert.strictEqual(valid, true, `Manifest ${sample} must be valid according to the AIX v0.369.0 schema.`);
    });
  }

  // Negative test case
  await t.test('Validation should fail for invalid version', async () => {
    const content = await fs.readFile('tests/golden_manifests/low-risk.aix.json', 'utf8');
    const manifest = JSON.parse(content);
    manifest.meta.format_version = "invalid-version";
    
    const valid = validate(manifest);
    assert.strictEqual(valid, false, "Manifest with invalid format_version should be rejected.");
  });
});
