import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

/**
 * AIX Identity Module Validation Test
 */

test('Identity Schema Validation', async (t) => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const schemaContent = await fs.readFile('schemas/modules/identity.schema.json', 'utf8');
  const schema = JSON.parse(schemaContent);
  const validate = ajv.compile(schema);

  await t.test('Valid Identity: Pi Network Verified', () => {
    const data = {
      id: "did:pi:username123",
      provider: {
        type: "pi_network",
        name: "Pi Mainnet",
        authority: "socialchain.app"
      },
      verification: {
        status: "verified",
        trust_level: 2,
        provider_specific_tier: "KYC_LEVEL_2"
      },
      issuedAt: "2026-05-01T12:00:00Z"
    };
    const valid = validate(data);
    assert.strictEqual(valid, true, JSON.stringify(validate.errors));
  });

  await t.test('Valid Identity: AxiomID Sovereign', () => {
    const data = {
      id: "did:axiom:axiomid.app:agent-007",
      provider: {
        type: "axiom_id",
        name: "Axiom Sovereign Root",
        authority: "axiomid.app"
      },
      verification: {
        status: "sovereign",
        trust_level: 3
      },
      issuedAt: "2026-05-01T12:00:00Z",
      publicKey: {
        algorithm: "Ed25519",
        value: "abcdef1234567890",
        encoding: "hex"
      }
    };
    const valid = validate(data);
    assert.strictEqual(valid, true, JSON.stringify(validate.errors));
  });

  await t.test('Invalid Identity: Missing Provider Type', () => {
    const data = {
      id: "did:pi:user",
      provider: { name: "Missing Type" },
      issuedAt: "2026-05-01T12:00:00Z"
    };
    const valid = validate(data);
    assert.strictEqual(valid, false, "Should fail when provider type is missing.");
  });

  await t.test('Invalid Identity: Out of range Trust Level', () => {
    const data = {
      id: "did:pi:user",
      provider: { type: "pi_network", name: "Pi" },
      verification: { status: "verified", trust_level: 5 },
      issuedAt: "2026-05-01T12:00:00Z"
    };
    const valid = validate(data);
    assert.strictEqual(valid, false, "Should fail when trust_level is > 3.");
  });
});
