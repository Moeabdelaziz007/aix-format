export class BondingCurve {
    // Formula: price = basePrice * (1 + k * sqrt(totalStake / supplyTarget))
    static getCurrentPrice(basePrice, k, supplyTarget, totalStake) {
        return basePrice * (1 + k * Math.sqrt(totalStake / supplyTarget));
    }
    static simulatePurchase(basePrice, k, supplyTarget, currentStake, amount) {
        return this.getCurrentPrice(basePrice, k, supplyTarget, currentStake + amount);
    }
    static getAveragePrice(basePrice, k, supplyTarget, currentStake, amount) {
        // A simplified integral approximation
        const p1 = this.getCurrentPrice(basePrice, k, supplyTarget, currentStake);
        const p2 = this.simulatePurchase(basePrice, k, supplyTarget, currentStake, amount);
        return (p1 + p2) / 2;
    }
}
