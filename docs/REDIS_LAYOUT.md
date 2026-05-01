# 🧠 Redis Layout & Quotas (AIX Protocol v1.3)

🇬🇧 This document specifies the unified Redis storage architecture for the AIX ecosystem. All components (Core, Studio, Gateway) must adhere to these namespaces and TTL strategies.

🇦🇪 تحدد هذه الوثيقة هندسة تخزين Redis الموحدة لنظام AIX البيئي. يجب على جميع المكونات الالتزام بهذه المساحات (Namespaces) واستراتيجيات TTL.

---

### 📂 Namespaces | مساحات المفاتيح

| Namespace | Usage | TTL | Eviction Policy |
| :--- | :--- | :--- | :--- |
| `aix:sessions:*` | User auth & Studio sessions | 24h | Volatile-LRU |
| `aix:registry:*` | Agent manifest metadata | Indefinite | None (Persistent) |
| `aix:scan:*` | ABOM security scan cache | 48h | Volatile-LFU |
| `aix:mcp:quota:*` | Rate limits for Gateway | 1m | Allkeys-LRU |
| `aix:metrics:*` | Telemetry & Usage stats | 30d | Volatile-TTL |

---

### 📉 Quota Models | نماذج الحصص

🇬🇧 **Standard Tier**:
- 60 calls / minute per Agent.
- 500 MB data transfer / day.
- Verified KYC required.

🇦🇪 **الفئة القياسية**:
- 60 مكالمة / دقيقة لكل وكيل.
- 500 ميجابايت نقل بيانات / يوم.
- يتطلب توثيق KYC.

🇬🇧 **Sovereign Tier**:
- 1,000 calls / minute per Agent.
- 10 GB data transfer / day.
- Hardware-backed DID (Secure Enclave) required.

🇦🇪 **الفئة السيادية**:
- 1,000 مكالمة / دقيقة لكل وكيل.
- 10 جيجابايت نقل بيانات / يوم.
- يتطلب DID مدعوم بالأجهزة (Secure Enclave).

---

### 🩺 Operational Checklist | قائمة التشغيل

- [ ] **Monitoring**: Alert if Redis latency > 50ms (via `/api/health/redis`).
- [ ] **Scaling**: Trigger Upstash sharding if memory usage > 80%.
- [ ] **Audit**: Weekly sweep of `aix:metrics` for billing reconciliation.
- [ ] **Security**: Ensure IP-allowlist is enabled for Redis REST API.

---

### 📄 Reference
*   **Storage Adapter**: `packages/aix-core/src/index.ts`
*   **Gateway Implementation**: `packages/mcp-gateway/src/index.ts`
