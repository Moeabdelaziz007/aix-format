# 🚀 AIX v1.3 Builder's Guide: From Idea to Sovereign Deployment

🇬🇧 This guide walks you through the lifecycle of a Sovereign Agent using the AIX v1.3 protocol.
🇦🇪 يأخذك هذا الدليل في رحلة بناء وكيل سيادي باستخدام بروتوكول AIX v1.3.

---

## 1. The AIX Journey

Building an AIX agent follows a standard "Moonshot" trajectory:

1.  **Design**: Define your agent's persona and capabilities in a `.aix.json` manifest.
2.  **Audit**: Run the **ABOM (Agent Bill of Materials)** scanner to evaluate supply chain risk.
3.  **Identity**: Anchor your agent to a Sovereign Identity (`did:axiom`) via Pi Network KYC.
4.  **Deploy**: Register your agent in the **AIX Studio** and publish to the global registry.
5.  **Monetize**: Configure the **MCP Revenue Router** for dynamic pricing and payouts.

---

## 2. Manifest Architecture (.aix.json)

Your agent is defined by its manifest. v1.3 includes critical layers for security and economics.

### Categorization:
- `persona`: Basic conversational assistant.
- `utility`: Task-oriented (e.g., data sync).
- `saas`: Built on top of external APIs (requires SaaS-BOM).
- `infra`: High-privilege system controller (requires Build Provenance).

### Key Sections:
- **`meta`**: Basic identification and versioning.
- **`persona`**: The "soul" of the agent (role, tone, instructions).
- **`security`**: ABOM details, checksums, and sandboxing status.
- **`economics`**: Pricing models (`pay_per_call`, `subscription`) and revenue routing.

> [!TIP]
> Use the [AIX Studio Builder](/builder) for real-time validation and SHA-256 integrity tracking.

---

## 3. ABOM & Security Grade

The **Agent Bill of Materials (ABOM)** is the core of AIX security. It provides transparency into the model supply chain.

### How to get an 'A' Grade:
- **Verified Models**: Use models with known integrity hashes.
- **Minimal Permissions**: Don't request high-risk capabilities unless necessary.
- **SaaS-BOM**: Declare all external SaaS services and their compliance tiers.
- **KYC Tier**: A "Verified Builder" (Pi Network Tier 3) receives a trust premium.

| Grade | Risk Level | Description |
| :--- | :--- | :--- |
| **A** | Low | Fully transparent, no high-risk capabilities, verified author. |
| **C** | Medium | Includes unverified dependencies or custom scripts. |
| **F** | High | Critical security gaps or anonymous authorship with high-risk skills. |

---

## 4. Deployment via Studio

1.  **Design**: Use the **Voice Wizard** or **Manual Builder** to craft your manifest.
2.  **Audit**: Run the **AIX Detective** scan (Live Validation).
3.  **Sign**: Sign the manifest using your **Pi Wallet** or **Axiom DID**.
4.  **Register**: Claim your agent's namespace (e.g., `did:axiom:yourname:agent-v1`).
5.  **Dashboard**: Monitor analytics and revenue via the [Studio Dashboard](/analytics).

---

## 5. Connectivity & Monetization (MCP Gateway)

Once deployed, your agent interacts via the **MCP Gateway**:
- **Tool Access**: Gateway checks ABOM risk scores before allowing high-risk calls.
- **Quotas**: Managed in Redis. Standard agents get 60 calls/min.
- **Pricing**: Signals like `cost` per call (in π) are logged for automated settlement.

---

## 📝 Checklist for a "Gold" Manifest
- [ ] `meta.format_version` is "1.3.0".
- [ ] `security.checksum` matches the actual manifest hash.
- [ ] `abom.risk_level` is accurately declared.
- [ ] All SaaS services have a `compliance_tier`.
- [ ] Manifest is cryptographically signed.

---

## Next Steps
- Read the [Voice Wizard Protocol](VOICE_WIZARD.md).
- Join the developer community on [Axiom ID](https://axiomid.app).
- Audit your first manifest using the [Studio Scanner](/api/abom-scan).
