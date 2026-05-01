import { calculatePrice, isQuotaExceeded } from "../src/lib/pricing";

describe("AIX Pricing Engine", () => {
  test("Scenario 1: Low-risk Free Tier", () => {
    const breakdown = calculatePrice("free", 95, "stdio");
    expect(breakdown.totalCost).toBe(0);
  });

  test("Scenario 2: High-risk Enterprise Tier", () => {
    const breakdown = calculatePrice("enterprise", 0, "stdio");
    // base (0.05) * (1 + 0.5) = 0.075
    expect(breakdown.totalCost).toBe(0.075);
  });

  test("Scenario 3: Quota Exhausted (Pro Tier)", () => {
    expect(isQuotaExceeded(10001, "pro")).toBe(true);
    expect(isQuotaExceeded(500, "pro")).toBe(false);
  });

  test("Scenario 4: Enterprise Unlimited Quota", () => {
    expect(isQuotaExceeded(999999, "enterprise")).toBe(false);
  });
});
