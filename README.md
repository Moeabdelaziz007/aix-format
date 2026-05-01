# 🧬 AIX Format (Sovereign Agent Standard)

AIX Format is the open standard for **Sovereign AI Agents**. It combines cryptographic identity (DIDs), Model Context Protocol (MCP) toolhooks, and native micro-payments into a single, portable `.aix` manifest.

---

### ✨ Why AIX Format?

| Problem | Existing Solutions | AIX Format |
| :--- | :--- | :--- |
| **Agent identity is unverifiable** | OpenAI GPTs, Google A2A | ✅ KYC-signed DID |
| **No built-in monetization** | Anthropic MCP, LangChain | ✅ Native π payments |
| **No provenance tracking** | Custom JSON configs | ✅ ABOM + SLSA |
| **Platform lock-in** | All major platforms | ✅ Open standard |

---

### 🧬 Core Concepts (in 60 seconds)

*   **AIX File**: A single `.aix` manifest that defines everything about your agent (persona, skills, identity).
*   **ABOM**: *Agent Bill of Materials* — tracks every dependency, tool, and capability for supply chain security.
*   **KYC Identity**: Tied to Pi Network verified identity (AxiomID), preventing Sybil attacks and enabling legal accountability.
*   **MCP Integration**: Native support for Model Context Protocol, connecting agents to 1,000+ external tools.
*   **Economics Layer**: Built-in pricing, revenue sharing, and M2M (Machine-to-Machine) micro-transactions.

---

### 🚀 Features

| Feature | Status | Docs |
| :--- | :--- | :--- |
| **Agent Builder (No-code)** | ✅ Live | [Builder Guide](https://docs.aix-format.org/builder) |
| **MCP Registry** | ✅ Live | [MCP Docs](https://docs.aix-format.org/mcp) |
| **KYC Verification** | ✅ Live | [KYC Guide](https://docs.aix-format.org/kyc) |
| **Revenue Router** | 🔄 Beta | [Economics](https://docs.aix-format.org/economics) |
| **Plugin SDK** | 📅 Q3 2026 | [Roadmap](https://docs.aix-format.org/roadmap) |
| **Multi-Chain Support** | 📅 Q4 2026 | [Roadmap](https://docs.aix-format.org/roadmap) |

---

### 🛠️ Tech Stack

*   **Frontend**: Next.js 15+, Tailwind CSS v4, Glassmorphism Design System.
*   **Backend**: Node.js, Redis (Upstash), JSON Schema 2020-12.
*   **Identity**: Pi Network SDK, Ed25519 Signatures, DIDs.
*   **Protocol**: Model Context Protocol (MCP), A2A Protocol.
*   **Deployment**: Vercel Edge Network.

---

### 📦 Installation

```bash
# Clone the repository
git clone https://github.com/axiom-foundation/aix-format.git

# Install dependencies
npm install

# Start the Studio
npm run dev
```

---

### 📄 License

AIX Format is licensed under the **Apache License 2.0**. See [LICENSE](LICENSE) for details.
