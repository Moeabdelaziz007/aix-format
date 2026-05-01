import test from 'node:test';
import assert from 'node:assert';
import { calculatePrice, isQuotaExceeded } from '../apps/studio/src/lib/pricing.ts';

/**
 * AIX Pricing Engine Unit Tests
 */

test('Pricing Engine: Core Logic', async (t) => {
  
  await t.test('Scenario 1: Low-risk Free Tier', () => {
    // Free tier, high risk score (low risk)
    const breakdown = calculatePrice('free', 95, 'stdio');
    assert.strictEqual(breakdown.totalCost, 0, "Free tier should always cost 0.");
  });

  await t.test('Scenario 2: High-risk Enterprise Tier', () => {
    // Enterprise tier (0.05 base), 0 risk score (high premium +0.5)
    const breakdown = calculatePrice('enterprise', 0, 'stdio');
    // base (0.05) * (1 + 0.5) = 0.075
    assert.strictEqual(breakdown.totalCost, 0.075, "Enterprise high-risk should include 50% premium.");
  });

  await t.test('Scenario 3: Quota Exhausted (Pro Tier)', () => {
    // Pro tier has quota: 10000
    const exceeded = isQuotaExceeded(10001, 'pro');
    const safe = isQuotaExceeded(500, 'pro');
    
    assert.strictEqual(exceeded, true, "10001 should exceed 10000 quota.");
    assert.strictEqual(safe, false, "500 should not exceed 10000 quota.");
  });

  await t.test('Scenario 4: Enterprise Unlimited Quota', () => {
    // Enterprise has -1 (unlimited)
    const result = isQuotaExceeded(999999, 'enterprise');
    assert.strictEqual(result, false, "Enterprise should have unlimited quota.");
  });
});
