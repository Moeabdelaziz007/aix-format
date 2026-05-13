# 🔍 AIX v1.3 Schema Deep Dive: The Anatomy of Trust

🇬🇧 A technical breakdown of the AIX v0.369.0 manifest structure and its impact on security scanning.
🇦🇪 تحليل تقني لهيكل بيان AIX v0.369.0 وتأثيره على المسح الأمني.

---

## 🏗️ Core Architecture

The AIX manifest is divided into 7 functional layers:

### 1. Meta (`meta`)
Defines identity and versioning.
- **Key field**: `format_version: "1.3.0"`. This triggers v1.3-specific validation rules in the Detective.
- **Agent Types**: Dictates the "Risk Ceiling". An `infra` agent is automatically audited more strictly than a `persona`.

### 2. Persona (`persona`)
The cognitive definition. Contains system prompts and behavior constraints.

### 3. Security (`security`)
The cryptographic anchor.
- **Checksum**: Mandatory SHA-256/512 of the manifest content.
- **Sandboxing**: A boolean flag that the MCP Gateway enforces before allowing local resource access.

### 4. Identity Layer (`identity_layer`)
Binds the manifest to a DID.
- **KYC Tiers**: 0 (Unverified) to 3 (Sovereign). This level directly impacts the `trustScore` in the Marketplace.

### 5. ABOM (`abom`) - *New in v1.3*
The most critical addition for supply chain security.
- **Risk Level**: Declared by the builder (`low`, `medium`, `high`, `critical`).
- **SaaS-BOM**: An array of `saas_services`. The Detective cross-references these with known provider compliance.
- **Build Provenance**: Mandatory for `high` or `critical` risk levels. Requires builder signatures.

### 6. MCP & Skills (`mcp`, `skills`)
Defines capabilities and external tool connections.

---

## 🛡️ The AIX Detective: Scoring Logic

The security scanner (AIX Detective) calculates the final `grade` based on:
1. **Structural Integrity**: Does it match the JSON Schema?
2. **Invariant Check**: Does an `infra` agent have `build_provenance`? (If no -> Grade F).
3. **SaaS Compliance**: Are any SaaS services listed as `low` compliance while the agent is `high` risk? (Penalty).
4. **Identity Verification**: Is the DID signed by a trusted authority? (Bonus).

### 📊 Grade Mapping
- **A**: Fully compliant, signed, sandboxed, high-tier KYC.
- **B**: Compliant but missing minor metadata or lower KYC tier.
- **C/D**: Missing mandatory security declarations for the stated risk level.
- **F**: Security violation (e.g., no provenance for infra agents).
