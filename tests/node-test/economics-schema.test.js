import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

/**
 * AIX Economics Module Validation Test
 */

test('Economics Schema Validation', async (t) => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const schemaContent = await fs.readFile('schemas/modules/economics.schema.json', 'utf8');
  const schema = JSON.parse(schemaContent);
  const validate = ajv.compile(schema);

  await t.test('Valid Economics: Free Tier', () => {
    const data = {
      settlement: {
        layer: "mcp_internal",
        network: "local"
      },
      pricing_model: "free"
    };
    const valid = validate(data);
    assert.strictEqual(valid, true, JSON.stringify(validate.errors));
  });

  await t.test('Valid Economics: Pay-per-call with Revenue Routing', () => {
    const data = {
      settlement: {
        layer: "pi_network",
        network: "mainnet",
        address: "GDY...XYZ",
        currency: "PI"
      },
      pricing_model: "pay_per_call",
      revenue_routing: {
        base_price: 1000,
        risk_multiplier_enabled: true,
        quota_limit: 5000,
        platform_fee_percent: 5
      }
    };
    const valid = validate(data);
    assert.strictEqual(valid, true, JSON.stringify(validate.errors));
  });

  await t.test('Invalid Economics: Unsupported Settlement Layer', () => {
    const data = {
      settlement: {
        layer: "invalid_layer",
        network: "testnet"
      },
      pricing_model: "free"
    };
    const valid = validate(data);
    assert.strictEqual(valid, false, "Should fail with unsupported settlement layer.");
  });

  await t.test('Invalid Economics: Missing Settlement Block', () => {
    const data = {
      pricing_model: "pro"
    };
    const valid = validate(data);
    assert.strictEqual(valid, false, "Should fail when settlement block is missing.");
  });
});
