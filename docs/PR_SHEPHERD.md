# PR Shepherd Guidelines

## Risk Evaluation Matrix

| Risk Level | Impact | Strategy |
| :--- | :--- | :--- |
| **Low** | UI/Documentation only | Merge after standard review. |
| **Medium** | Builder/Logic changes | Requires manual QA in Staging. |
| **High** | Core Specs / Revenue / Infra | Requires Lead Architect approval + full test suite. |

## PR Checklist: Critical PRs

### #58: Unified BOM Spec (High Risk)
- [ ] Schema backward compatibility verified.
- [ ] TS Scanner rules updated to match spec.
- [ ] Integrity hash logic covers new SaaS-BOM fields.

### #57: MCP Revenue Router (High Risk)
- [ ] Pi Network auth verification enforced.
- [ ] TokenBucket rate limiting active.
- [ ] Transaction audit logs implemented.

### #54: Micro-SaaS Ecosystem (High Risk)
- [ ] Agent data isolation in Redis verified.
- [ ] KYC Risk Adapter blocking high-risk deployments.
- [ ] Manual QA: Deploy test agent via Smart Builder.

## Review Questions for Human Lead
1. "Does this change impact the ABOM integrity hash calculation?"
2. "Are we maintaining session state consistency in Upstash Redis?"
3. "Is there any risk of PII leakage in the new Pi KYC hooks?"
