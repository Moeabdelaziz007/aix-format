# 🧬 AIX TOPOLOGY SCHEMA (v1.0)
## "The Universal Language of our Sovereign House"

> ⚖️ **MANDATORY**: All services (Go, TS, Rust) MUST adhere to these schemas.

---

### 📡 BUS EVENT PULSE (JSON)
Used for real-time communication between the Engine (Go) and Brain (TS).
```json
{
  "id": "string (hex)",
  "timestamp": "number (ms)",
  "ring": "number (0-3)",
  "type": "string (CONSTANT)",
  "agentId": "string",
  "agentName": "string",
  "message": "string",
  "metadata": "object (optional)"
}
```

### 🔐 SIGNED PAYLOAD (String)
Format for Cross-Language Memory Integrity.
`sig:<SHA256_HMAC_HEX>:<DATA_OR_TURBOQUANT>`

### ⚡ TURBOQUANT (Binary/Base64)
Prefix: `⚡`
Algorithm: Gzip (Level 6)

---

### 🔑 SECRET MANAGEMENT
All layers MUST use `AIX_DNA_SECRET` for HMAC operations.

---
**Verified by AIX Stability Protocol**
// Made with Moe Abdelaziz
