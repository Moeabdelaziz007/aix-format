<div align="center">

<a href="https://github.com/Moeabdelaziz007/aix-format">
  <img src="./docs/aix-logo.svg" width="720" alt="AIX FORMAT — Sovereign Agent Standard Logo" />
</a>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=18&pause=1000&color=8B5CF6&center=true&vCenter=true&width=700&lines=Identity+%2B+Economics+%2B+Security+%E2%80%94+In+One+File;Pi+Network+KYC+%2B+Ed25519+Cryptography;The+Only+Standard+With+Human-Verified+Agents;%D8%A7%D9%84%D9%85%D8%B9%D9%8A%D8%A7%D8%B1+%D8%A7%D9%84%D9%88%D8%AD%D9%8A%D8%AF+%D8%A7%D9%84%D8%AC%D8%A7%D9%85%D8%B9+%D9%84%D9%84%D9%87%D9%88%D9%8A%D8%A9+%D9%88%D8%A7%D9%84%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF+%D9%88%D8%A7%D9%84%D8%A3%D9%85%D8%B7" alt="Typing SVG" />

<br/><br/>

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Build Status](https://github.com/Moeabdelaziz007/aix-format/actions/workflows/aix-validation.yml/badge.svg)](https://github.com/Moeabdelaziz007/aix-format/actions)
[![Version](https://img.shields.io/badge/version-1.3.0--sovereign-orange.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()
<br/>
<img src="https://img.shields.io/badge/Standard-AIX_v1.3.0-7c3aed?style=for-the-badge" alt="Standard"/>
<img src="https://img.shields.io/badge/Security-Ed25519-8b5cf6?style=for-the-badge" alt="Ed25519"/>
<img src="https://img.shields.io/badge/Identity-Pi_Network_KYC-ec4899?style=for-the-badge" alt="Pi KYC"/>


<br/><br/>

> **[EN]** *The only open standard that bundles a complete agent definition + KYC-signed identity + economics in a single portable file.*
>
> **[AR]** *المعيار المفتوح الوحيد الذي يجمع تعريف الوكيل الكامل + هوية موقّعة بـ KYC + اقتصاديات في ملف واحد قابل للنقل.*

</div>

---

<details open>
<summary><b>📑 Table of Contents | فهرس المحتويات</b></summary>
<br/>

* [1 🎯 The Problem We Solve | المشكلة التي نحلها](#-the-problem-we-solve--المشكلة-التي-نحلها)
* [2 ⚡ AIX vs The Ecosystem | المقارنة مع البدائل](#-aix-vs-the-ecosystem--المقارنة-مع-البدائل)
* [3 🧬 Core Architecture | الهندسة الجوهرية](#-core-architecture--الهندسة-الجوهرية)
* [4 ✨ Sovereign Features | المميزات السيادية](#-sovereign-features--المميزات-السيادية)
* [5 🔐 Security Model | النموذج الأمني](#-security-model--النموذج-الأمني)
* [6 🛠️ Quick Start | البدء السريع](#-quick-start--البدء-السريع)
* [7 🗺️ Roadmap | خارطة الطريق](#-roadmap--خارطة-الطريق)
* [8 🤝 How to Contribute | كيف تساهم](#-how-to-contribute--كيف-تساهم)
* [9 📚 Documentation Suite | حقيبة التوثيق](#-documentation-suite--حقيبة-التوثيق)
* [10 🏛️ The Sovereign Hive | الخلية السيادية](#-the-sovereign-hive--الخلية-السيادية)

</details>

---

## 🚀 Vision (الرؤية)

**[EN]** The biggest challenge for Autonomous Agents today is not intelligence, but **Distribution** and **Trust**. By combining the robust DNA of the `.aix` format with the decentralized infrastructure and KYC-verified user base of the Pi Network, we are building a true Machine-to-Machine (M2M) micro-transaction economy. The Sovereign Pi Agents Studio allows users to configure agents via Voice-First UI, sign their `.aix` payloads with their Pi KYC identity (preventing Sybil attacks), and deploy them to the network.

**[AR]** التحدي الأكبر للوكلاء المستقلين (Autonomous Agents) اليوم ليس الذكاء، بل **"التوزيع" (Distribution)** و **"الثقة" (Trust)**. من خلال دمج "الحمض النووي" المتمثل في صيغة `.aix` مع البنية التحتية اللامركزية وقاعدة المستخدمين الموثقين (KYC) لشبكة Pi، فإننا نبني اقتصاداً حقيقياً للآلات (Machine-to-Machine) يعتمد على المعاملات الدقيقة. يتيح "استوديو Pi للوكلاء" للمستخدمين إعداد الوكلاء عبر واجهة صوتية (Voice-First)، وتوقيع ملفاتهم بهوية Pi KYC (لمنع هجمات Sybil)، ونشرهم في الشبكة.

---

## ✨ Zero-Experience KYC & Live Voice Setup (تجربة KYC سلسة والصوت المباشر)

**[EN]** We believe AI should be accessible to everyone, not just engineers. In upcoming updates, AIX will support **Agentic KYC**—where AI agents guide you through the KYC and setup processes autonomously with a visually pleasing, zero-code UI.
- **No-Code Setup:** You won't need to touch a single line of code or know what Ed25519 signatures are.
- **Agentic KYC:** Agents perform identity validations conversationally.
- **Live Voice Futures:** Natively stream high-fidelity voice output for human-like conversational experiences.

## 🛠️ Tooling Ecosystem

- **`aix-validate`**: Canonical JSON Schema validator.
- **`aix-detective`**: Security auditor for detecting prompt injections and integrity failures.
- **`generate-discovery`**: Utility for creating `.well-known/agent.aix.json` for agent discovery.
- **Agentic Studio**: A Next.js 15 powered IDE for building sovereign agents.

**[AR]** نؤمن بأن الذكاء الاصطناعي يجب أن يكون متاحاً للجميع، وليس للمهندسين فقط. في التحديثات القادمة، سيدعم بروتوكول AIX تقنية **Agentic KYC**—حيث سيقوم وكلاء الذكاء الاصطناعي بإرشادك خلال عملية التحقق (KYC) والإعداد بشكل تلقائي باستخدام واجهة بصرية جذابة وبدون الحاجة لأي كود (zero-code).

---

## 🏗️ Architecture (الهندسة المعمارية)

**[EN]** The project is structured as a modern Monorepo, bridging the core AIX parser with a high-end Next.js front-end.
**[AR]** تم بناء المشروع على هيكل Monorepo حديث، يربط بين المحلل الأساسي لـ AIX وواجهة أمامية متطورة مبنية بـ Next.js.

```mermaid
graph TD
    User([👤 Pioneer / Developer]) -->|Voice Commands & Clicks| Studio[💻 Sovereign Studio UI<br/>Next.js + Glassmorphism]

    Studio -->|Step-by-Step Wizard| Wizard[🛠️ Setup Wizard]
    Wizard -->|Initialize| PiSDK{🛡️ Pi Network SDK}
    PiSDK -->|Request| PiApp[📱 Pi Browser App]
    PiApp -->|Return KYC Status & Payment| PiSDK

    Wizard -->|Voice Input| WebSpeech[🎙️ Voice Orb / Web Speech API / TTS]
    WebSpeech -->|Generate Payload| AIXPayload[📄 .aix Payload]

    PiSDK -->|Sign Payload| AxiomID[🔑 AxiomID Quantum Topology Architecture]
    AxiomID --> AIXPayload

    AIXPayload -->|Execute| Core[⚙️ AIX Core Parser]
    Core -->|Deploy to M2M Economy| PiNodes[(🌐 Pi Nodes / MCP)]
```

---

## 🎯 The Problem We Solve | المشكلة التي نحلها

<table width="100%">
<tr>
<td width="50%" valign="top">

**[EN]** In February 2026, the **ClawHavoc** campaign compromised **1,184+ agent skills** in a major marketplace — including credential stealers that bypassed VirusTotal. 492 MCP servers were found exposed with **zero authentication**.

The root cause: there is no open standard requiring human-verified identity for AI agents. Any anonymous actor can publish a malicious agent.

**AIX is the fix.** Every `.aix` payload is cryptographically signed and bound to a real, KYC-verified Pi Network identity. Anonymous agent attacks become structurally impossible.

</td>
<td width="50%" valign="top" dir="rtl">

**[AR]** في فبراير 2026، اخترقت حملة **ClawHavoc** أكثر من **1,184 مهارة** في أحد أكبر أسواق الوكلاء — بما فيها سارقو بيانات اعتماد تجاوزوا VirusTotal. تم الكشف عن 492 خادم MCP مُكشوف بلا أي مصادقة.

السبب الجذري: لا يوجد معيار مفتوح يشترط هوية مُحققة للوكلاء. أي جهة مجهولة تستطيع نشر وكيل خبيث.

**AIX هو الحل.** كل ملف `.aix` موقّع تشفيرياً ومرتبط بهوية Pi Network حقيقية ومُحققة بـ KYC. الهجمات المجهولة تصبح مستحيلة هيكلياً.

</td>
</tr>
</table>

---

## ⚡ AIX vs The Ecosystem | المقارنة مع البدائل

> **[EN]** AIX occupies a unique white space — the **Identity + Distribution layer** that all other standards lack.
>
> **[AR]** يحتل AIX موقعاً فريداً في **طبقة الهوية والتوزيع** الغائبة عن جميع المعايير الأخرى.

| Feature | **AIX Format** | A2A AgentCard | OSSA v0.5 | AgentFacts/KYA |
|:--------|:-:|:-:|:-:|:-:|
| **Agent Identity (DID)** | ✅ `did:web` | ❌ | ❌ | ⚠️ partial |
| **KYC / Proof of Personhood** | ✅ Pi Network (17M+) | ❌ | ❌ | ⚠️ concept only |
| **Economics / Pricing Layer** | ✅ built-in | ❌ | ❌ | ❌ |
| **Checksum / Supply Chain** | ✅ SHA-256 (ABOM) + Ed25519 | ❌ | ❌ | ⚠️ planned |
| **VLA / Robotics Support** | ✅ openpi, π0.7 | ❌ | ❌ | ❌ |
| **MCP Server Card / Discovery** | ✅ .well-known / W3C Draft | ❌ | ✅ | ❌ |
| **Multi-Format** | ✅ YAML/JSON/TOML | ❌ JSON only | ✅ | ❌ |
| **A2A Compatible** | ⚠️ converter exists | ✅ native | ⚠️ | ❌ |
| **Focus Layer** | Identity + Distribution | Runtime Comm. | Contract | Enterprise Meta |

---

## 🧬 Core Architecture | الهندسة الجوهرية

```mermaid
graph TD
    Pioneer([👤 Pioneer / المستخدم]) -->|Voice + UI| Studio[💻 Sovereign Studio\nNext.js 15 + Aether UI]
    Studio -->|KYC Flow| PiSDK{🛡️ Pi Network SDK\nProtocol v23 • 17M+ Users}
    PiSDK -->|Verified Identity| AxiomID[🔑 AxiomID\ndid:axiom Topology]
    AxiomID -->|Zero-Trust Handshake| ZTH[⚡ Nonce Challenge-Response\nEd25519 Signing]
    ZTH -->|Produces| AIXPayload[📄 .aix Payload\nYAML / JSON / TOML]
    AIXPayload -->|Validates| Core[⚙️ AIX Core Parser\nSchema + Checksum + KYC]
    Core -->|Issues| VC[📜 Verifiable Credential\nDelegated Authority Chain]
    VC -->|Deploy to| M2M[(🌐 Machine Economy\nM2M Micropayments)]
```

**[EN] Monorepo Structure | [AR] هيكل المستودع:**

```
aix-format/
├── core/                    # AIX Parser Engine | محرك المحلل
│   ├── src/parser.js        # Schema validation + checksum verification
│   ├── src/axiomid.js       # Ed25519 identity layer
│   └── src/converters/      # A2A AgentCard ↔ AIX converters
├── apps/studio/             # Sovereign Studio UI | واجهة الاستوديو
│   └── src/app/             # Next.js 15 App Router
│       ├── marketplace/     # Agent marketplace page
│       ├── my-agents/       # User agent management
│       └── network-status/  # Real-time network health
├── docs/
│   └── aix-logo.svg         # Official SVG logo
├── bin/
│   └── aix-validate.js      # CLI Validator | مدقق سطر الأوامر
└── .github/workflows/
    └── aix-validation.yml   # Automated security CI | الأمن الآلي
```

---

## ✨ Sovereign Features | المميزات السيادية

<table width="100%">
<tr>
<td width="50%">

### 🛡️ Agentic KYC & AxiomID
Every `.aix` payload is signed with **Ed25519** and anchored to a Pi KYC-verified identity via the `did:axiom` topology. A **Zero-Trust Handshake** with nonce-based challenge-response prevents Sybil and replay attacks.

</td>
<td width="50%" dir="rtl">

### 🛡️ التوثيق السيادي وAxiomID
كل ملف `.aix` موقّع بـ **Ed25519** ومُرتبط بهوية Pi مُحققة بـ KYC عبر بنية `did:axiom`. **مصافحة انعدام الثقة** بآلية Nonce تمنع هجمات التزييف وإعادة الإرسال.

</td>
</tr>
<tr>
<td width="50%">

### 💰 Native Economics Layer
Built-in support for Pi Network **Protocol v23 smart contracts** — enabling pay-per-call, subscriptions, and M2M micropayments without third-party payment rails.

</td>
<td width="50%" dir="rtl">

### 💰 طبقة الاقتصاد الأصيلة
دعم مدمج للعقود الذكية على **بروتوكول Pi v23** — تُتيح المدفوعات لكل طلب، الاشتراكات، والمدفوعات الدقيقة بين الآلات دون وسطاء.

</td>
</tr>
<tr>
<td width="50%">

### 🤖 VLA / Robotics Support
The **only** agent standard with first-class support for Vision-Language-Action models (`openpi`, `π0.7`). Describe a robot arm controller the same way you describe a chat agent.

</td>
<td width="50%" dir="rtl">

### 🤖 دعم الروبوتات وVLA
**المعيار الوحيد** بدعم أصيل لنماذج الرؤية-اللغة-الفعل (`openpi`، `π0.7`). صِف مُتحكم ذراع روبوتية بنفس الطريقة التي تصف بها وكيل محادثة.

</td>
</tr>
<tr>
<td width="50%">

### 📦 Agent Bill of Materials (ABOM)
Like SBOM for software, AIX captures the full provenance of every agent: training data, base models, APIs, MCP servers — with SHA-256 checksums for supply chain security.

</td>
<td width="50%" dir="rtl">

### 📦 فاتورة مواد الوكيل (ABOM)
كـ SBOM للبرمجيات، يلتقط AIX كامل نسب أي وكيل: بيانات التدريب، النماذج الأساسية، الـ APIs، خوادم MCP — مع فحوصات SHA-256 لأمان سلسلة التوريد.

</td>
</tr>
<tr>
<td width="50%">

### 🎙️ Voice-First Studio
Our **Interactive Voice Orb** leverages high-fidelity TTS/STT for a conversational configuration experience. Chatboxes are a legacy constraint. Speak your agent into existence.

</td>
<td width="50%" dir="rtl">

### 🎙️ الاستوديو الصوتي أولاً
**الكرة الصوتية التفاعلية** تعتمد على تقنيات TTS/STT عالية الجودة لتجربة تهيئة حوارية طبيعية. صناديق الدردشة قيد من الماضي. تحدث فقط لإنشاء وكيلك.

</td>
</tr>
</table>

---

## 🔐 Security Model | النموذج الأمني

<table width="100%">
<tr>
<td width="50%" valign="top">

**[EN]** Three cryptographic pillars — no security theater, no placeholders:

| Pillar | Technology | Feature | Status | Specification |
| :--- | :--- | :--- |
| **Sovereign Identity** | ✅ Production | Pi Network KYC (Tiers 0-3) |
| **Integrity Layer** | ✅ Production | ABOM SHA-256 Verification |
| **Meta Arbiter** | ⚡ v1.3.0 | Orchestration & Subsystems |
| **Security Audit** | 🛡️ New | `aix-detective` CLI |
| **Discovery** | 🔍 New | W3C Agent Discovery Support |
| 🟢 **Authorization** | Verifiable Credentials | *What is this agent allowed to do?* |

```yaml
security:
  checksum:
    algorithm: "sha256"
    value: "a3f8c2..."
  signature:
    algorithm: "Ed25519"
    signer: "did:axiom:axiomid.app:verified_user"
  mcp:
    servers:
      - checksum: "sha256:abc123..."
        allowed_tools: ["read_file"]
        max_permissions: "read-only"
```

</td>
<td width="50%" valign="top" dir="rtl">

**[AR]** ثلاثة أعمدة تشفيرية — لا مسرحية أمنية، لا عناصر وهمية:

| العمود | التقنية | الضمان |
|:------:|:--------|:-------|
| 🔵 **الهوية** | Pi Network KYC | *من نشر هذا الوكيل؟* |
| 🟣 **السلامة** | توقيعات Ed25519 | *هل تم التلاعب بالملف؟* |
| 🟢 **التفويض** | شهادات قابلة للتحقق | *ما المسموح له بفعله؟* |

</td>
</tr>
</table>

---

## 🛠️ Quick Start | البدء السريع

**Prerequisites | المتطلبات:** Node.js `v18+` · Git · Pi Browser *(for production KYC)*

```bash
# Clone & bootstrap | الاستنساخ والتثبيت
git clone https://github.com/Moeabdelaziz007/aix-format.git
cd aix-format && npm install

# Launch Sovereign Studio | تشغيل الاستوديو
npm run dev --prefix apps/studio

# Validate an agent file | التحقق من ملف وكيل
node bin/aix-validate.js my-agent.aix

# Strict KYC + security validation | التحقق الصارم
node bin/aix-validate.js my-agent.aix --strict-kyc --security

# Run full test suite | تشغيل كل الاختبارات
npm test
```

**[EN]** Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
**[AR]** افتح [http://localhost:3000](http://localhost:3000) في متصفحك لترى النتيجة.

---

## 🗺️ Roadmap | خارطة الطريق

<table width="100%">
<tr>
<td width="33%" valign="top">

**🔴 Phase 1 — Foundation**
*Days 1–30*

- [ ] A2A AgentCard bidirectional converter
- [ ] `did:web` / `did:key` W3C DID support
- [ ] MCP server checksum validation
- [ ] OSSA v0.5 compatibility layer

</td>
<td width="33%" valign="top">

**🟡 Phase 2 — Ecosystem**
*Days 31–60*

- [ ] Pi Network Protocol v23 smart contracts
- [ ] W3C Verifiable Credentials (VC)
- [ ] IPFS / Arweave content-addressable distribution
- [ ] `aix-publish` CLI + `registry.aix-format.org`

</td>
<td width="33%" valign="top">

**🟢 Phase 3 — Launch v1.0**
*Days 61–90*

- [ ] Full security audit + threat model
- [ ] W3C AI Agent Protocol CG submission
- [ ] `@aix/core` npm package
- [ ] Product Hunt + Show HN launch

</td>
</tr>
</table>

---

## 📚 Documentation Suite | حقيبة التوثيق

**[EN]** Deep dives into building, regulating, and integrating with the AIX ecosystem.
**[AR]** تعمق في بناء وتوثيق ودمج نظام AIX.

- **[Builders Guide (دليل المطورين)](./docs/BUILDERS_GUIDE.md)**: From idea to monetization.
- **[Regulators Note (مذكرة المنظمين)](./docs/REGULATORS_NOTE.md)**: Compliance, ABOM, and accountability.
- **[Full Manifest Example (مثال كامل)](./docs/examples/full-agent.aix.json)**: v1.3.0 enhanced schema implementation.
- **[Technical Specification (المواصفات الفنية)](./docs/AIX_SPEC.md)**: The core protocol details.

---

## 🤝 How to Contribute | كيف تساهم

🇬🇧 **[EN]** We welcome contributions! Please read our [CONTRIBUTING.md] and check the open issues.

🇦🇪 **[AR]** نرحب بمساهماتكم! يُرجى قراءة ملف المساهمة والاطلاع على المهام المفتوحة.

---

<div align="center">

<table>
<tr>

<td align="center" width="220">
  <a href="https://github.com/Moeabdelaziz007">
    <img src="https://github.com/Moeabdelaziz007.png" width="100" style="border-radius:50%;"/>
  </a>
  <br/><br/>
  <b>Mohamed Abdelaziz</b>
  <br/>
  <sub>🏛️ Visionary Architect · المهندس المعماري</sub>
  <br/><br/>
  <a href="https://github.com/Moeabdelaziz007">
    <img src="https://img.shields.io/badge/@Moeabdelaziz007-181717?style=flat-square&logo=github"/>
  </a>
</td>

<td align="center" width="220">
  <img src="https://img.shields.io/badge/AI-Jules-8b5cf6?style=for-the-badge&logo=googlecloud&logoColor=white" height="40"/>
  <br/><br/>
  <b>Jules</b>
  <br/>
  <sub>🎨 UI/UX Agent · مهندس التنفيذ والواجهة</sub>
</td>

<td align="center" width="220">
  <img src="https://img.shields.io/badge/AI-Antigravity-0ea5e9?style=for-the-badge&logo=googlegemini&logoColor=white" height="40"/>
  <br/><br/>
  <b>Antigravity</b>
  <br/>
  <sub>⚙️ Systems Architect & Security AI</sub>
</td>

<td align="center" width="220">
  <img src="https://img.shields.io/badge/AI-Codex%20Agent-111827?style=for-the-badge&logo=openai&logoColor=white" height="40"/>
  <br/><br/>
  <b>Codex Agent</b>
  <br/>
  <sub>🔐 Ed25519 & DNA Protocol</sub>
</td>

</tr>
</table>

</div>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=120&section=footer" width="100%"/>

*"We are not building tools; we are architecting the trust layer for the future of intelligence."*
<br/>
*"نحن لا نبني أدوات؛ نحن نصمم طبقة الثقة لمستقبل الذكاء."*

<br/>

<img src="https://img.shields.io/badge/Built%20with-Sovereign%20Intelligence-6366f1?style=for-the-badge" alt="Built with Sovereign Intelligence"/>
&nbsp;
<img src="https://img.shields.io/badge/Research-Claude_4.6_x_Antigravity-8b5cf6?style=for-the-badge" alt="Research"/>

</div>
