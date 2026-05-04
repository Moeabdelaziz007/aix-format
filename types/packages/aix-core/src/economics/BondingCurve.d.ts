export declare class BondingCurve {
    static getCurrentPrice(basePrice: number, k: number, supplyTarget: number, totalStake: number): number;
    static simulatePurchase(basePrice: number, k: number, supplyTarget: number, currentStake: number, amount: number): number;
    static getAveragePrice(basePrice: number, k: number, supplyTarget: number, currentStake: number, amount: number): number;
}
