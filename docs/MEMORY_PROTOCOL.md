# 📡 AIX MEMORY PROTOCOL (v1.0)
## "The Universal Language of Sovereign Events | اللغة العالمية للأحداث السيادية"

### ⚖️ OBJECTIVE | الهدف
Establish a unified event schema for cross-language memory sharing (Go + TS + Rust) via Redis.
تأسيس مخطط أحداث موحد لمشاركة الذاكرة عبر اللغات الثلاث عبر Redis.

---

### 🧬 AIXMemoryEvent Schema

#### 🛠️ Mandatory Fields | الحقول الإلزامية
| Field | Type | Description |
| :--- | :--- | :--- |
| `ring` | `number` | 0 (Genesis), 1 (Soul), 2 (Mind), 3 (Body). |
| `lang` | `string` | `go` \| `ts` \| `rust`. |
| `agentId` | `string` | Unique identifier of the source agent. |
| `eventType` | `string` | `QUANTUM_BURST`, `STATE_UPDATE`, `SECURITY_ALERT`, etc. |
| `payload` | `object` | The actual data content. |
| `timestamp` | `number` | Unix timestamp in milliseconds. |

#### ✨ Optional Fields | الحقول الاختيارية
- `embedding`: `number[]` - Vector representation for semantic search.
- `signature`: `string` - Sovereign signature (`sig:aix_dna`).
- `accessPolicy`: `string` - Privacy/Access constraints.

---

### 📡 CHANNEL STRUCTURE | هيكل القنوات
`aix:ring:<ring_id>:<event_type>`
Example: `aix:ring:2:quantum-burst`

---
**Verified by AIX Memory-Architect**
// Made with Moe Abdelaziz
