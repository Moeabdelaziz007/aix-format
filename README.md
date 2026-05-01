# 🧬 AIX Format (Sovereign Agent Standard) v1.3.0

🇬🇧 **AIX Format** is the industry-first open standard for **Sovereign AI Agents**. It converges Cryptographic Identity (DIDs), the Model Context Protocol (MCP), and native micro-payments into a single, immutable `.aix` manifest. This protocol is designed for the 10x Moonshot era of autonomous, self-governing machine ecosystems.

🇦🇪 **تنسيق AIX** هو أول معيار مفتوح في الصناعة لـ **الوكلاء الذكيين السياديين**. يقوم بدمج الهوية التشفيرية (DIDs)، بروتوكول سياق النموذج (MCP)، والمدفوعات الدقيقة الأصلية في بيان `.aix` واحد غير قابل للتغيير. تم تصميم هذا البروتوكول لعصر "Moonshot" للأنظمة الآلية ذاتية الحكم.

---

### ✨ Why AIX Format? | لماذا AIX؟

| Problem | المشكلة | AIX Format | Solution | الحل |
| :--- | :--- | :--- | :--- | :--- |
| **Identity** | **الهوية** | ✅ KYC-signed DID | **Verifiable** | **قابلة للتحقق** |
| **Monetization** | **التحقيق المالي** | ✅ Native π payments | **Built-in** | **مدمج** |
| **Provenance** | **الأصل والتتبع** | ✅ ABOM + SLSA L3 | **Tamper-proof** | **ضد التلاعب** |
| **Portability** | **القابلية للنقل** | ✅ Open Standard | **No Lock-in** | **بدون تبعية** |
| **Audit** | **التدقيق** | ✅ SaaS-BOM Audit | **Automated** | **مؤتمت** |

---

### 🏛️ System Architecture | بنية النظام

🇬🇧 The AIX Protocol operates on a three-tier sovereign stack:
1. **Identity Layer (did:axiom)**: Uses Ed25519 signatures anchored to the Pi Network. Every agent has a verified human (KYC) or institutional backer.
2. **Operational Layer (MCP)**: Implements the *Model Context Protocol* to provide agents with a standardized way to call tools through a secure Gateway.
3. **Economic Layer (M2M)**: Native micro-settlement for machine-to-machine interactions using π (Pi).

🇦🇪 يعمل بروتوكول AIX على هيكلية سيادية من ثلاث طبقات:
1. **طبقة الهوية (did:axiom)**: تستخدم تواقيع Ed25519 المثبتة على شبكة Pi. كل وكيل لديه داعم بشري موثق (KYC) أو مؤسسي.
2. **الطبقة التشغيلية (MCP)**: تنفذ "بروتوكول سياق النموذج" لتزويد الوكلاء بطريقة معيارية لاستدعاء الأدوات عبر بوابة آمنة.
3. **الطبقة الاقتصادية (M2M)**: تسوية دقيقة أصلية للتفاعلات بين الآلات باستخدام π (Pi).

---

### 🧬 Core Concepts | المفاهيم الأساسية

🇬🇧 **Technical Deep Dive**:
*   **AIX Manifest**: A JSON-LD document containing the agent's DNA (Persona, Abilities, Identity).
*   **ABOM (Agent Bill of Materials)**: Tracks training datasets, base models, and plugins for compliance.
*   **SaaS-BOM**: Audits 3rd-party SaaS dependencies (OpenAI, Pinecone, etc.).
*   **MCP Gateway**: Secure rate-limited proxy that sanitizes tool inputs.

🇦🇪 **تعمق تقني**:
*   **بيان AIX**: مستند JSON-LD يحتوي على الحمض النووي للوكيل (الشخصية، القدرات، الهوية).
*   **ABOM (بيان مواد الوكيل)**: يتتبع مجموعات بيانات التدريب، النماذج الأساسية، والإضافات للامتثال.
*   **SaaS-BOM**: يدقق في تبعيات SaaS الخارجية (OpenAI، Pinecone، إلخ).
*   **بوابة MCP**: بروكسي آمن ومحدد المعدل يقوم بتنقية مدخلات الأدوات.

---

### 🚀 Roadmap | خارطة الطريق

| Feature | الميزة | Status | الحالة | Docs |
| :--- | :--- | :--- | :--- | :--- |
| **Agent Builder** | **باني الوكلاء** | ✅ Live | **مباشر** | [Guide](docs/BUILDER_GUIDE.md) |
| **MCP Registry** | **سجل MCP** | ✅ Live | **مباشر** | [Registry](docs/MCP_GATEWAY.md) |
| **ABOM Scanner** | **فاحص ABOM** | ✅ Live | **مباشر** | [Security](docs/ABOM_SAAS_BOM.md) |
| **KYC Identity** | **هوية KYC** | ✅ Live | **مباشر** | [Spec](docs/SPEC_V1_3.md) |
| **Revenue Router** | **راوتر الأرباح** | 🔄 Beta | **تجريبي** | [Spec](docs/SPEC_V1_3.md#economics) |

---

### 🛡️ Security & Governance | الأمان والحوكمة

🇬🇧 **Transparency by Default**:
- **Decision Logs**: Tamper-proof logs (SHA-256) for auditability.
- **Trust Scores**: Progressive disclosure based on KYC, ABOM, and success rate.
- **Undo by Design**: 30-second window for critical actions.

🇦🇪 **الشفافية افتراضياً**:
- **سجلات القرار**: سجلات ضد التلاعب (SHA-256) للتدقيق.
- **نقاط الثقة**: إفصاح تدريجي بناءً على KYC و ABOM ومعدل النجاح.
- **التصميم مع التراجع**: نافذة لمدة 30 ثانية للإجراءات الحرجة.

---

### 🛠️ Tech Stack | التكنولوجيا المستخدمة

🇬🇧 **Frontend**: Next.js 15+, Tailwind CSS v4, Framer Motion.
🇬🇧 **Backend**: Node.js 20+, Upstash Redis (Metrics/Quotas).
🇬🇧 **Identity**: Ed25519, Pi Network SDK, AxiomID DIDs.

🇦🇪 **الواجهة الأمامية**: Next.js 15+، Tailwind CSS v4، Framer Motion.
🇦🇪 **الواجهة الخلفية**: Node.js 20+، Upstash Redis.
🇦🇪 **الهوية**: Ed25519، Pi Network SDK، AxiomID DIDs.

---

### 🤝 Credits & Maintainers | الاعتمادات والمساهمون

🇬🇧 We welcome contributions! | 🇦🇪 نرحب بمساهماتكم!

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

<img src="https://img.shields.io/badge/Built%20with-Sovereign%20Intelligence-6366f1?style=for-the-badge" alt="Built with Sovereign Intelligence"/>
&nbsp;
<img src="https://img.shields.io/badge/Research-Claude_4.6_x_Antigravity-8b5cf6?style=for-the-badge" alt="Research"/>
</div>

---

### 📄 Protocol Governance | حوكمة البروتوكول

🇬🇧 AIX Format is licensed under the **Apache License 2.0**.
🇦🇪 يتم ترخيص تنسيق AIX بموجب **رخصة Apache 2.0**.
