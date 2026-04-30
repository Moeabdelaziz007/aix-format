# AIX Builders Guide: From Concept to Sovereign Monetization

Welcome to the **AIX (Artificial Intelligence eXchange)** ecosystem. This guide is designed for agent architects, developers, and micro-SaaS founders who want to build, secure, and monetize portable AI agents using the AIX standard.

---

## 1. The AIX Journey

Building an AIX agent follows a standard 10x trajectory:

1.  **Design**: Define your agent's persona and capabilities in a `.aix.json` or `agent.aix` (YAML) file.
2.  **Audit**: Run the **ABOM (Agent Bill of Materials)** scanner to evaluate supply chain risk and security.
3.  **Identity**: Anchor your agent to a Sovereign Identity (`did:axiom`) and verify your developer tier via Pi Network KYC.
4.  **Deploy**: Register your agent in the **AIX Studio** and publish to the global marketplace.
5.  **Monetize**: Configure the **MCP (Model Context Protocol)** Revenue Router to handle dynamic pricing and payouts.

---

## 2. Step 1: Manifest Design (.aix.json)

Your agent is defined by its manifest. A modern AIX manifest (v1.3) includes sections for identity, behavior, security, and economics.

### Key Sections:
- **`meta`**: Basic identification and versioning.
- **`persona`**: The "soul" of the agent (role, tone, instructions).
- **`security`**: ABOM details, including constituents (models, datasets, SaaS dependencies).
- **`economics`**: Pricing models (`pay_per_call`, `subscription`) and revenue-sharing rules.

> [!TIP]
> Use the [AIX Studio Builder](/builder) for real-time validation and SHA-256 integrity tracking.

---

## 3. Step 2: ABOM & Security Grade

The **Agent Bill of Materials (ABOM)** is the core of AIX security. It provides transparency into what your agent is made of.

### How to get an 'A' Grade:
- **Verified Models**: Use models from trusted providers (e.g., Gemini, OpenAI) with integrity hashes.
- **Minimal Permissions**: Don't request `filesystem_access` or `network_raw` unless absolutely necessary.
- **SaaS-BOM**: Declare all external SaaS services your agent calls.
- **KYC Tier**: A "Verified Builder" (Pi Network Tier 3) automatically receives a trust premium.

| Grade | Risk Level | Description |
| :--- | :--- | :--- |
| **A** | Low | Fully transparent, no high-risk capabilities, verified author. |
| **C** | Medium | Includes unverified dependencies or custom scripts. |
| **F** | High | Critical security gaps or anonymous authorship with high-risk skills. |

---

## 4. Step 3: Studio Deployment

Once your manifest is ready, head to the [AIX Studio Marketplace](/marketplace).

1.  **Upload**: Provide your `.aix.json` or link to a public URL (e.g., `.well-known/agent.aix.json`).
2.  **Verify**: The Studio will run a remote ABOM scan and verify signatures.
3.  **Register**: Claim your agent's namespace (e.g., `did:axiom:yourname:agent-v1`).
4.  **Dashboard**: Manage your agent's status, analytics, and user base via the [My Agents](/my-agents) view.

---

## 5. Step 4: Monetization (MCP Router)

AIX integrates directly with the **Model Context Protocol (MCP)** to enable machine-to-machine (M2M) billing.

### Configuration Example:
```json
"economics": {
  "pricing": {
    "model": "pay_per_call",
    "unit_price": 0.05,
    "currency": "PI"
  },
  "revenue_share": {
    "platform_fee": 0.05,
    "builder_share": 0.95
  }
}
```

The **Revenue Router** automatically:
- Tracks quotas and usage limits.
- Applies a "Risk Premium" if the ABOM score is low.
- Distributes payouts to your connected Pi Wallet or Axiom ID.

---

## 6. Glossary of Terms

- **ABOM (Agent Bill of Materials)**: A structured list of all components (models, datasets, SaaS) that make up an agent.
- **AIX Format**: The technical specification for portable AI agents.
- **MCP (Model Context Protocol)**: A communication standard for AI agents to interact with tools and each other.
- **Sovereign Identity**: Decentralized identity (DID) managed by the user, not a central platform.
- **Unified BOM**: An extension of ABOM that covers the entire hardware-to-software stack.
- **Pi Network Integration**: Provides KYC-verified identity and native PI token payments.

---

## 7. Concrete Example: `agent.aix.json`

```json
{
  "aix_version": "1.3.0",
  "meta": {
    "id": "agent_axiom_researcher_001",
    "name": "Axiom Research Pro",
    "version": "1.0.0",
    "author": "did:axiom:moe_abdelaziz"
  },
  "identity_layer": {
    "provider": "pi_network",
    "kyc_tier": 3,
    "proof": "sha256:signature_here"
  },
  "persona": {
    "role": "Deep Research Specialist",
    "tone": "Academic & Precise",
    "instructions": "Analyze market trends using provided tools."
  },
  "security": {
    "abom": {
      "constituents": [
        {
          "name": "gpt-4o",
          "type": "model",
          "provider": "openai",
          "integrity": "sha256:..."
        }
      ],
      "capabilities": ["web_search", "mcp_tools"]
    }
  },
  "economics": {
    "tier": "pro",
    "pricing": {
      "model": "subscription",
      "monthly_fee": 10.0,
      "currency": "USD"
    }
  }
}
```

---

## Next Steps

- Explore the [API Documentation](AIX_PARSER_DOC.md) for deeper technical integrations.
- Join the developer community on [Axiom ID](https://axiomid.app).
- Audit your first manifest using the [Studio Scanner](/api/abom-scan).
