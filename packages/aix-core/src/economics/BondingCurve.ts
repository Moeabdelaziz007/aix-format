/**
 * Defines a mathematical relationship between token supply (stake) and price.
 * Formula: price = basePrice * (1 + k * sqrt(totalStake / supplyTarget))
 * @example
 * const price = BondingCurve.getCurrentPrice(10, 0.5, 1000, 500);
 */
export class BondingCurve {
  // Formula: price = basePrice * (1 + k * sqrt(totalStake / supplyTarget))
  /**
   * Calculates the current price on the bonding curve based on total stake.
   * @param {number} basePrice - The starting price.
   * @param {number} k - The steepness parameter.
   * @param {number} supplyTarget - The target supply to normalize against.
   * @param {number} totalStake - The current total stake.
   * @returns {number} The current spot price.
   * @example
   * const price = BondingCurve.getCurrentPrice(10, 0.5, 1000, 500);
   */
  static getCurrentPrice(basePrice: number, k: number, supplyTarget: number, totalStake: number): number {
    return basePrice * (1 + k * Math.sqrt(totalStake / supplyTarget));
  }

  /**
   * Simulates what the price will be after a purchase.
   * @param {number} basePrice - The starting price.
   * @param {number} k - The steepness parameter.
   * @param {number} supplyTarget - The target supply.
   * @param {number} currentStake - The current total stake.
   * @param {number} amount - The amount to be purchased.
   * @returns {number} The simulated future spot price.
   * @example
   * const newPrice = BondingCurve.simulatePurchase(10, 0.5, 1000, 500, 100);
   */
  static simulatePurchase(basePrice: number, k: number, supplyTarget: number, currentStake: number, amount: number): number {
    return this.getCurrentPrice(basePrice, k, supplyTarget, currentStake + amount);
  }

  /**
   * Calculates the average price paid for a block purchase.
   * @param {number} basePrice - The starting price.
   * @param {number} k - The steepness parameter.
   * @param {number} supplyTarget - The target supply.
   * @param {number} currentStake - The current total stake.
   * @param {number} amount - The amount being purchased.
   * @returns {number} The average price per unit.
   * @example
   * const avgPrice = BondingCurve.getAveragePrice(10, 0.5, 1000, 500, 100);
   */
  static getAveragePrice(basePrice: number, k: number, supplyTarget: number, currentStake: number, amount: number): number {
    // A simplified integral approximation
    const p1 = this.getCurrentPrice(basePrice, k, supplyTarget, currentStake);
    const p2 = this.simulatePurchase(basePrice, k, supplyTarget, currentStake, amount);
    return (p1 + p2) / 2;
  }
}
