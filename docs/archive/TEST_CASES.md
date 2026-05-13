# Test Plan: AIX Revenue Router & Pricing Engine

This document outlines the test scenarios required to validate the pricing logic, quota enforcement, and revenue splitting.

## 1. Price Configuration JSON Schema

This structure is stored in Redis under `aix:config:pricing` or loaded from a static `pricing.json`.

```json
{
  "version": "1.3.0",
  "tiers": {
    "free": { "base_price": 0, "platform_fee": 0.20, "quota": 100, "cutoff": "hard" },
    "builder": { "base_price": 0.005, "platform_fee": 0.20, "quota": 1000, "cutoff": "hard" },
    "pro": { "base_price": 0.01, "platform_fee": 0.10, "quota": 10000, "cutoff": "grace" },
    "enterprise": { "base_price": 0.05, "platform_fee": 0.05, "quota": -1, "cutoff": "soft" }
  },
  "multipliers": {
    "sse": 1.5,
    "http": 1.2,
    "stdio": 1.0
  },
  "risk_premiums": [
    { "min_score": 90, "multiplier": 0.0 },
    { "min_score": 70, "multiplier": 0.1 },
    { "min_score": 40, "multiplier": 0.25 },
    { "min_score": 0, "multiplier": 0.5 }
  ]
}
```

## 2. Test Scenarios

### Scenario A: Low-Risk Free Tier
- **Input**: User (Free Tier), Agent (ABOM Score: 95), Endpoint: `stdio`.
- **Expected Output**:
  - $Price = (0 \times 1.0) \times (1 + 0) = 0$.
  - Platform Fee: 0.
  - Quota Decrement: 1.
  - Result: `200 OK`.

### Scenario B: Enterprise High-Risk Transaction
- **Input**: User (Enterprise Tier), Agent (ABOM Score: 45), Endpoint: `sse`.
- **Expected Output**:
  - $Base = 0.05 \times 1.5 = 0.075$.
  - $Premium = 0.075 \times 0.25 = 0.01875$.
  - $Total = 0.09375$.
  - Developer Share: $0.09375 \times 0.95 = 0.0890625$.
  - Result: `200 OK`, `X-AIX-Cost: 0.09375`.

### Scenario C: Pro Tier Grace Period
- **Input**: User (Pro Tier), Quota Used: 9,999/10,000.
- **Action**: Perform 5 requests.
- **Expected Output**:
  - Requests 1-5 succeed.
  - Headers include `X-AIX-Quota-Warning: Near Limit` for Req 1.
  - Headers include `X-AIX-Quota-Status: Grace` for Reqs 2-5.

### Scenario D: Floating Point Precision
- **Input**: Repeated micro-transactions ($0.0001$).
- **Verification**: Ensure no precision loss after 10,000 transactions using BigInt or decimal scaling (store as micro-cents in Redis).

### Scenario E: ABOM Risk Score Change
- **Input**: Agent updates manifest, ABOM score drops from 95 to 30 (Critical).
- **Expected Output**: Next request price jumps by 50% premium immediately.

## 3. Operational Metrics (Minimum Set)

1. **`revenue_per_developer_did`**: Track earnings for settlement.
2. **`quota_exhaustion_rate`**: Percentage of users hitting limits per tier.
3. **`risk_weighted_traffic`**: Average ABOM score of agents being called.
4. **`latency_overhead_router`**: Time taken by Redis/Pricing logic per request.
