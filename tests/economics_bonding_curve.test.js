import test from 'node:test';
import assert from 'node:assert';
import { BondingCurve } from '../packages/aix-core/src/economics/BondingCurve.ts';

test('Bonding Curve Simulation', async (t) => {
  const basePrice = 1.0;
  const k = 0.5;
  const supplyTarget = 1000;

  const initialStake = 0;
  const initialPrice = BondingCurve.getCurrentPrice(basePrice, k, supplyTarget, initialStake);
  assert.strictEqual(initialPrice, basePrice, 'Initial price should equal base price when stake is 0');

  let currentPrice = initialPrice;
  for (let i = 0; i < 100; i++) {
    const newStake = i + 1;
    const newPrice = BondingCurve.getCurrentPrice(basePrice, k, supplyTarget, newStake);
    assert.ok(newPrice > currentPrice, 'Price should be monotonically increasing with stake');
    currentPrice = newPrice;
  }

  const expectedPrice100 = basePrice * (1 + k * Math.sqrt(100 / supplyTarget));
  assert.strictEqual(currentPrice, expectedPrice100, 'Price formula check at 100 stake');

  const stakeAfterUnstake = 90;
  const priceAfterUnstake = BondingCurve.getCurrentPrice(basePrice, k, supplyTarget, stakeAfterUnstake);
  assert.ok(priceAfterUnstake < currentPrice, 'Price should decrease after unstaking');
  assert.strictEqual(priceAfterUnstake, basePrice * (1 + k * Math.sqrt(90 / supplyTarget)), 'Price formula check at 90 stake');

  const simulatePrice = BondingCurve.simulatePurchase(basePrice, k, supplyTarget, stakeAfterUnstake, 10);
  assert.strictEqual(simulatePrice, currentPrice, 'simulatePurchase should equal the price before unstaking');

  const averagePrice = BondingCurve.getAveragePrice(basePrice, k, supplyTarget, stakeAfterUnstake, 10);
  assert.ok(averagePrice > priceAfterUnstake && averagePrice < currentPrice, 'Average price should be between start and end prices');
});
