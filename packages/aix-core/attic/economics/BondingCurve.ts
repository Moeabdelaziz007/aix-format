export class BondingCurve {
  // Formula: price = basePrice * (1 + k * sqrt(totalStake / supplyTarget))
  static getCurrentPrice(basePrice: number, k: number, supplyTarget: number, totalStake: number): number {
    return basePrice * (1 + k * Math.sqrt(totalStake / supplyTarget));
  }

  static simulatePurchase(basePrice: number, k: number, supplyTarget: number, currentStake: number, amount: number): number {
    return this.getCurrentPrice(basePrice, k, supplyTarget, currentStake + amount);
  }

  static getAveragePrice(basePrice: number, k: number, supplyTarget: number, currentStake: number, amount: number): number {
    // A simplified integral approximation
    const p1 = this.getCurrentPrice(basePrice, k, supplyTarget, currentStake);
    const p2 = this.simulatePurchase(basePrice, k, supplyTarget, currentStake, amount);
    return (p1 + p2) / 2;
  }
}
