# AIX API Excellence: MCP Revenue Router Spec

This document defines the architectural standards for traffic routing, dynamic pricing, and revenue distribution within the AIX ecosystem.

## 1. Dynamic Pricing Model

The cost of an MCP request is calculated dynamically based on the consumer's tier, the endpoint complexity, and the producer's ABOM risk profile.

### Formula: Total Request Price ($P_t$)

$$P_t = (B_p \times M_c) \times (1 + R_p)$$

| Variable | Name | Description |
| :--- | :--- | :--- |
| $B_p$ | Base Price | Fixed cost per request based on the Consumer Tier. |
| $M_c$ | Complexity Multiplier | Factor based on endpoint type (`sse` > `http` > `stdio`). |
| $R_p$ | Risk Premium | Penalty added based on the Producer's ABOM risk score. |

### Configuration Values (Default)

| Tier | Base Price ($B_p$) | Platform Fee | Quota Limit | Overage Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Free** | $0.000 | 20% | 100 | Hard Cutoff |
| **Builder** | $0.005 | 20% | 1,000 | Hard Cutoff |
| **Pro** | $0.010 | 10% | 10,000 | Grace (10%) |
| **Enterprise**| $0.050 | 5% | Unlimited | Soft Cutoff |

## 2. Revenue Distribution

Revenue is split between the AIX Platform and the Agent Developer at the moment of request settlement.

- **Developer Share**: $P_t \times (1 - \text{PlatformFee})$
- **Platform Share**: $P_t \times \text{PlatformFee}$

## 3. ABOM Risk Integration

Pricing is sensitive to the **Agent Bill of Materials (ABOM)** score. Agents with higher risk scores (e.g., unverified dependencies, high-risk capabilities) incur higher infrastructure costs to cover auditing and insurance overhead.

| ABOM Score | Risk Level | Premium ($R_p$) |
| :--- | :--- | :--- |
| 90 - 100 | Low | 0% |
| 70 - 89 | Medium | 10% |
| 40 - 69 | High | 25% |
| < 40 | Critical | 50% |

## 4. Quota Enforcement (Grace vs Hard Cutoff)

- **Hard Cutoff**: Request fails immediately with `429 Too Many Requests` when 100% of quota is consumed.
- **Grace Period**: Request succeeds but triggers a `X-AIX-Quota-Warning` header.
- **Soft Cutoff**: Request succeeds at a 2x cost multiplier ($P_t \times 2$) for the overage portion.

## 5. Storage & Observability

All pricing state is stored in the **Unified Redis Layer** under the `aix:revenue:` namespace.

### Key Metrics
- `spend_per_tenant`: Hash mapping `tenant_id` to total spent.
- `error_rate_per_endpoint`: Counter for failed requests per agent DID.
- `abom_risk_distribution`: Histogram of risk scores across active traffic.
