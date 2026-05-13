# 🎯 AIX Format - Expert Execution Plan
**Laravel-Level Architecture | Production-Ready Implementation**

---

## 📋 Current Status
- ✅ Vercel build errors fixed (106 syntax errors removed)
- ✅ Security-core implemented (crypto.randomBytes)
- ✅ Cleanup completed (backup folders, duplicates)
- ⚠️ **CRITICAL:** TrustChain still using mock signatures
- ⚠️ Evolution data stored in Map (lost on restart)

---

## 🔥 Phase 1: TrustChain Real Signatures (1 hour)
**Priority: CRITICAL** | **Impact: Security Foundation**

### 1.1 Replace Mock Verification (30 min)
**File:** `packages/aix-core/src/trust-chain.ts`

**Current (BROKEN):**
```typescript
const isValid = signature.startsWith('valid-'); // ❌ Mock
```

**Target (REAL):**
```typescript
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

async verifySignature(
  agentId: string,
  data: any,
  signature: string,
  publicKey: string
): Promise<boolean> {
  const message = util.decodeUTF8(JSON.stringify(data));
  const sigBytes = Buffer.from(signature, 'hex');
  const pubBytes = Buffer.from(publicKey, 'hex');
  
  return nacl.sign.detached.verify(message, sigBytes, pubBytes);
}
```

**Reference:** `packages/aix-core/src/security/dna.ts:12` (already has nacl.sign.detached)

### 1.2 Update All Callers (20 min)
**Files to update:**
- `packages/aix-core/src/gateway.ts` - Add publicKey parameter
- `packages/aix-core/src/expectation-engine.ts` - Pass publicKey
- `apps/studio/src/lib/security-core.ts` - Export key generation

### 1.3 Test Signature Chain (10 min)
```bash
cd packages/aix-core
pnpm test src/trust-chain.test.ts
```

**Expected:** All tests pass with real Ed25519 verification

---

## 🗄️ Phase 2: Evolution Persistence (Redis) (1.5 hours)
**Priority: HIGH** | **Impact: Learning Retention**

### 2.1 Find Evolution Tracker (15 min)
**Search pattern:**
```bash
grep -r "new Map<string, EvolutionData>" packages/aix-core/src/
```

**Expected location:** `packages/aix-core/src/learning.ts` or `curiosity-engine.ts`

### 2.2 Add Redis KV Client (30 min)
**File:** `packages/aix-core/src/storage/redis-evolution.ts` (NEW)

```typescript
import { kv } from '@vercel/kv';

export class RedisEvolutionStore {
  private prefix = 'evolution:';

  async set(agentId: string, data: EvolutionData): Promise<void> {
    await kv.set(`${this.prefix}${agentId}`, JSON.stringify(data));
  }

  async get(agentId: string): Promise<EvolutionData | null> {
    const raw = await kv.get(`${this.prefix}${agentId}`);
    return raw ? JSON.parse(raw as string) : null;
  }

  async getAll(): Promise<Map<string, EvolutionData>> {
    const keys = await kv.keys(`${this.prefix}*`);
    const map = new Map<string, EvolutionData>();
    
    for (const key of keys) {
      const agentId = key.replace(this.prefix, '');
      const data = await this.get(agentId);
      if (data) map.set(agentId, data);
    }
    
    return map;
  }
}
```

### 2.3 Replace Map with Redis (30 min)
**File:** `packages/aix-core/src/learning.ts`

**Before:**
```typescript
const agentsEvolution = new Map<string, EvolutionData>();
```

**After:**
```typescript
import { RedisEvolutionStore } from './storage/redis-evolution';
const evolutionStore = new RedisEvolutionStore();

// Replace all .get() → await evolutionStore.get()
// Replace all .set() → await evolutionStore.set()
```

### 2.4 Test Persistence (15 min)
```bash
# Start Redis locally
docker run -d -p 6379:6379 redis:alpine

# Run test
cd packages/aix-core
pnpm test src/learning.test.ts
```

**Expected:** Evolution data survives process restart

---

## 🏗️ Phase 3: Remaining TypeScript Errors (30 min)
**Priority: MEDIUM** | **Impact: Build Stability**

### 3.1 Fix Import Errors (10 min)
**Files:**
- `apps/studio/src/lib/fold-trace/settlement.ts:12` - Fix BondingCurve import path
- `apps/studio/src/lib/payment/verifier.ts:24` - Fix z.record() signature

### 3.2 Fix Type Errors (10 min)
**Files:**
- `apps/studio/src/app/space/page.tsx:49` - Add useRef<any>(null)
- `apps/studio/src/lib/fold-trace/settlement.ts:112` - Add staker type

### 3.3 Verify Build (10 min)
```bash
cd apps/studio
npx tsc --noEmit
```

**Expected:** 0 errors

---

## 🚀 Phase 4: Vercel Deploy (30 min)
**Priority: HIGH** | **Impact: Production Readiness**

### 4.1 Local Build Test (15 min)
```bash
cd aix-format
pnpm --filter @aix/studio build
```

**Expected:** Build succeeds without SIGKILL

### 4.2 Environment Variables (5 min)
**Vercel Dashboard → Settings → Environment Variables:**
```
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
OPENAI_API_KEY=sk-...
PI_API_KEY=...
```

### 4.3 Deploy (10 min)
```bash
git push origin main
```

**Monitor:** https://vercel.com/moeabdelaziz007/aix-format/deployments

---

## 📊 Success Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| TS Errors | 15 | 0 | 🟡 In Progress |
| TrustChain Security | Mock | Real nacl | 🔴 Critical |
| Evolution Persistence | Map | Redis KV | 🔴 Critical |
| Vercel Build | SIGKILL | Success | 🟡 In Progress |
| Math.random() Usage | 20 | 0 | 🟢 2/20 Fixed |

---

## 🎯 Next 3 Hours Roadmap

### Hour 1: TrustChain (CRITICAL)
- [ ] Replace mock signatures with nacl.sign.detached.verify()
- [ ] Update all callers to pass publicKey
- [ ] Test signature chain
- [ ] Commit: `fix: implement real Ed25519 signatures in TrustChain`

### Hour 2: Evolution Persistence (HIGH)
- [ ] Create RedisEvolutionStore class
- [ ] Replace Map with Redis in learning.ts
- [ ] Test persistence across restarts
- [ ] Commit: `feat: persist evolution data in Redis KV`

### Hour 3: Deploy (HIGH)
- [ ] Fix remaining TS errors
- [ ] Test local build
- [ ] Push to main
- [ ] Monitor Vercel deployment

---

## 🔧 Commands Reference

```bash
# Check TS errors
cd apps/studio && npx tsc --noEmit

# Test TrustChain
cd packages/aix-core && pnpm test src/trust-chain.test.ts

# Local build
cd aix-format && pnpm --filter @aix/studio build

# Push to main
git add . && git commit -m "fix: ..." && git push origin main

# Monitor Vercel
open https://vercel.com/moeabdelaziz007/aix-format
```

---

## 🚨 Rollback Plan

If Vercel build fails:
```bash
git revert HEAD~1 --no-edit
git push origin main --force
```

---

**Made with Moe Abdelaziz | AIX Format v0.369.0**