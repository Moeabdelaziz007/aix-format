# 🌐 Sovereign Pi Agents Studio & AIX Format

<div align="center">
  <img src="./apps/studio/public/globe.svg" width="120" alt="Logo"/>
  <h3>The Global Marketplace for Autonomous AI Agents</h3>
  <h3>السوق العالمي لوكلاء الذكاء الاصطناعي المستقلين</h3>
  <p>Powered by <b>AIX (Artificial Intelligence eXchange)</b> format and secured by <b>Pi Network KYC</b>.</p>
  <p>مدعوم بصيغة <b>AIX</b> ومؤمن بواسطة <b>Pi Network KYC</b>.</p>
</div>

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

**[AR]** نؤمن بأن الذكاء الاصطناعي يجب أن يكون متاحاً للجميع، وليس للمهندسين فقط. في التحديثات القادمة، سيدعم بروتوكول AIX تقنية **Agentic KYC**—حيث سيقوم وكلاء الذكاء الاصطناعي بإرشادك خلال عملية التحقق (KYC) والإعداد بشكل تلقائي باستخدام واجهة بصرية جذابة وبدون الحاجة لأي كود (zero-code).
- **إعداد بدون كود:** لن تحتاج إلى كتابة سطر كود واحد أو معرفة بتفاصيل تشفير Ed25519.
- **Agentic KYC:** سيقوم الوكلاء بإجراء التحقق من الهوية من خلال المحادثة الطبيعية.
- **المستقبل الصوتي المباشر (Live Voice):** بث مباشر لصوت عالي الجودة لتقديم تجارب محادثة شبيهة بالبشر.

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

### 🌟 Key Features (أبرز الميزات)

 feat/kyc-wizard-tts-12299921071301084280
1. **Step-by-Step Setup Wizard:** A guided, beginner-friendly process to configure and deploy agents without coding knowledge.
2. **Interactive Voice Orb with TTS:** Speak to configure agents, and the AIX engine will provide audible feedback confirmation.
3. **Quantum Topology KYC Security:** High-end visual architecture for Agentic KYC bindings, ensuring a Sovereign Proof of Ownership through Ed25519 signatures and the `@pinetwork-js/sdk`.
4. **Glassmorphism UI ("Sovereign Aether"):** Ethereal design system relying on deep indigos, charcoals, and translucent layers.
5. **Polyglot & Model Agnostic:** The Studio acts as the Gateway. The execution layer (AIX core) is designed to run seamlessly on Go/Rust backend execution engines in the future, supporting any LLM.

**[EN]**
1. **Voice-First Orchestration:** Replaced traditional chatboxes with an interactive Voice Orb. Speak to configure and deploy your agents on the fly.
2. **KYC-First Deployment:** Every `.aix` payload uploaded to the Studio requires a Cryptographic KYC Signature via Pi Network. This ensures a Sovereign Proof of Ownership.
3. **Glassmorphism UI ("Sovereign Aether"):** A high-end, ethereal design system relying on deep indigos, charcoals, and translucent layers instead of cyberpunk tropes.
4. **Polyglot & Model Agnostic:** The Studio acts as the Gateway. The execution layer (AIX core) is designed to run seamlessly on Go/Rust backend execution engines in the future, supporting any LLM (Open Source or Closed).
 main

**[AR]**
1. **التوجيه الصوتي أولاً:** تم استبدال صناديق الدردشة التقليدية بكرة صوتية تفاعلية (Voice Orb). تحدث فقط لإعداد ونشر وكلائك فوراً.
2. **النشر المعتمد على KYC:** كل ملف `.aix` يتم رفعه إلى الاستوديو يتطلب توقيعاً مشفراً للتحقق من الهوية (KYC) عبر شبكة Pi، مما يضمن إثباتاً سيادياً للملكية.
3. **واجهة Glassmorphism:** نظام تصميم راقٍ يعتمد على الألوان الداكنة والطبقات الشفافة، بعيداً عن الكليشيهات التقليدية.
4. **متعدد اللغات ومستقل عن النماذج:** يعمل الاستوديو كبوابة، بينما تم تصميم طبقة التنفيذ الأساسية (AIX core) لتعمل مستقبلاً على محركات تنفيذ مبنية بـ Go/Rust تدعم أي نموذج ذكاء اصطناعي (مفتوح أو مغلق المصدر).

---

## 🛠️ Quick Start (البدء السريع)

**[EN]** This repository uses npm workspaces (`apps/studio` and `core/`).
**[AR]** تستخدم هذه المستودعات ميزة npm workspaces لمجلدات (`apps/studio` و `core/`).

### Prerequisites (المتطلبات الأساسية)
- Node.js >= 18.0.0
- Pi Browser (for full authentication testing / لاختبار المصادقة الكاملة)

### Installation (التثبيت)
```bash
# Install dependencies for both core and studio (تثبيت الاعتمادات للواجهة والمحرك الأساسي)
npm install

# Run the Studio development server (تشغيل خادم التطوير للاستوديو)
npm run dev --prefix apps/studio
```

**[EN]** Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
**[AR]** افتح [http://localhost:3000](http://localhost:3000) في متصفحك لترى النتيجة.

---

 feat/kyc-wizard-tts-12299921071301084280
## 🔒 AIX Agent Runtime Validator (CLI)
=======
## 🔒 AIX Agent Runtime Validator (CLI) (مدقق وقت تشغيل وكيل AIX)

**[EN]** The repository includes a strict validation tool designed for CI/CD pipelines and deployment gateways. This ensures no agent enters the network without meeting structural, cryptographic, and security constraints.
**[AR]** يتضمن المستودع أداة تحقق صارمة مصممة لمسارات CI/CD وبوابات النشر. يضمن هذا عدم دخول أي وكيل إلى الشبكة دون تلبية القيود الهيكلية، التشفيرية، والأمنية.
 main

### Usage (طريقة الاستخدام)

```bash
node bin/aix-validate.js path/to/your-agent.aix [options]
```

### Flags (الخيارات المدعومة)

**[EN]**
- `--strict-kyc`: **(Important)** Enforces that the agent is KYC-verified. Fails the validation if a valid `kyc_proof` is missing, or if the `identity_layer` DID is invalid.
- `--security`: Verifies the SHA-256 checksum embedded in the `.aix` payload matches the actual file hash.
- `--verbose`: Outputs deep inspection data (capabilities, APIs, MCP servers, warnings).

**[AR]**
- `--strict-kyc`: **(مهم جداً)** يفرض أن يكون الوكيل موثقاً عبر KYC. ستفشل عملية التحقق إذا كان حقل `kyc_proof` غير صالح، أو إذا كان الـ DID في `identity_layer` غير صالح.
- `--security`: يتحقق من أن بصمة التشفير (SHA-256) المدمجة في ملف الـ `.aix` تتطابق مع التشفير الفعلي للملف.
- `--verbose`: يعرض بيانات الفحص العميق (مثل الإمكانيات، واجهات برمجة التطبيقات APIs، وخوادم MCP، والتحذيرات).

### GitHub Actions (إجراءات GitHub)

**[EN]** A GitHub action is included (`.github/workflows/aix-validation.yml`) which automatically validates all modified `.aix` payloads in Pull Requests, running with the `--strict-kyc` and `--security` flags enabled. If an agent fails KYC checks, the PR is blocked.
**[AR]** تم إدراج إجراء لـ GitHub Action (`.github/workflows/aix-validation.yml`) يقوم تلقائياً بالتحقق من جميع ملفات الـ `.aix` المعدلة في طلبات السحب (Pull Requests)، ويعمل مع تفعيل خيارات `--strict-kyc` و `--security`. إذا فشل أي وكيل في تجاوز فحص KYC، يتم حظر طلب السحب.

---

## 📄 Current Status (الحالة الحالية)
✅ **RFC v0.1 published**: [#9](https://github.com/Moeabdelaziz007/aix-format/issues/9)

---

## 🤝 Credits & Maintainers (الاعتمادات والمساهمون)

- **Moe Abdelaziz** (@Moeabdelaziz007) - Visionary, Protocol Architect & Pi Integration Lead.
- **Jules (AI Engineer)** - Engineering Partner & UI/UX Architect.
- **Antigravity IDE Agent** - Core Engineering Partner & Collaborator.

*We are building the trust layer for the Machine Economy. (نحن نبني طبقة الثقة لاقتصاد الآلات.)*
