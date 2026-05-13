# 🚨 Frontend Issues & Technical Debt Report

**Generated:** 2026-05-03  
**Scope:** apps/studio/src/  
**Severity Levels:** 🔴 Critical | 🟡 High | 🟢 Medium | 🔵 Low

---

## 📊 Executive Summary

The frontend has **significant architectural issues** that need immediate attention:

1. **30+ TODO/FIXME comments** indicating incomplete implementations
2. **Missing components** causing import errors
3. **Experimental features** (pets, wikibrain, canvas) without clear purpose
4. **Mock implementations** in production code
5. **Inconsistent architecture** between pages

---

## 🔴 CRITICAL ISSUES

### 1. Missing Core Components

**Impact:** Build failures, runtime errors

```
❌ src/components/marketplace/RatingStars.tsx - MISSING
❌ src/components/marketplace/TrustScore.tsx - MISSING
```

**Referenced in:**
- `src/components/marketplace/AgentDetailModal.tsx:21`
- `src/components/marketplace/SkillCard.tsx:7`
- `src/components/agents/AgentCard/sub/` (expected location)

**Fix Required:** Create these components or remove references

---

### 2. Mock Implementations in Production Code

**Impact:** Security vulnerabilities, data loss, payment failures

#### Authentication (src/lib/auth.ts)
```typescript
// Line 28: TODO: Implement actual JWT verification
// Line 142: TODO: Implement actual JWT generation  
// Line 161: TODO: Implement actual password hashing
// Line 180: TODO: Implement actual password verification
```

**Risk:** Anyone can forge authentication tokens

#### Payment System (src/middleware/payment-gate.ts)
```typescript
// Line 216: TODO: Implement proper payment address generation
// Line 232: TODO: Implement free tier logic
// Line 254: TODO: Implement analytics recording
```

**Risk:** Payment fraud, revenue loss

#### Revenue Settlement (src/lib/fold-trace/settlement.ts)
```typescript
// Line 79: TODO: Implement database storage
// Line 110: TODO: Fetch agent metadata from database
// Line 243: TODO: Implement actual fund transfer
// Line 301: TODO: Implement database update
```

**Risk:** Revenue not distributed, agents not paid

---

### 3. In-Memory Caches (Not Production-Ready)

**Impact:** Data loss on restart, memory leaks

```typescript
// src/lib/rate-limit.ts:34
// TODO: Implement Redis-based rate limiting
// For now, use in-memory cache (not production-ready)

// src/lib/payment/verifier.ts:264
// TODO: Implement database check
// For now, use in-memory cache (not production-ready)
```

**Fix Required:** Implement Redis/Upstash storage

---

## 🟡 HIGH PRIORITY ISSUES

### 4. Experimental Features Without Clear Purpose

**Impact:** Code bloat, maintenance burden, user confusion

#### Pet System (`src/app/workspace/[agentId]/pet/`)
- **Purpose:** Unclear - gamification? engagement?
- **Status:** Has error.tsx, loading.tsx, page.tsx
- **Integration:** Partial - referenced in AgentCard
- **Decision Needed:** Keep or remove?

#### WikiBrain (`src/app/workspace/[agentId]/wikibrain/`)
- **Purpose:** Knowledge management? RAG?
- **Status:** Has error/loading/page files
- **Integration:** Unknown
- **Decision Needed:** Keep or remove?

#### Canvas/Whiteboard Features
- **Location:** Unknown (referenced in task description)
- **Status:** Possibly removed or never implemented
- **Decision Needed:** Document or implement

---

### 5. Incomplete Payment Integration

**Files Affected:**
- `src/middleware/payment-gate.ts`
- `src/lib/payment/verifier.ts`
- `src/app/api/stripe/webhook/route.ts`

**Missing:**
- Email notifications (lines 120, 202 in webhook)
- On-chain verification (line 236 in verifier)
- Database persistence (line 294 in verifier)

---

### 6. Pricing Engine Incomplete

**File:** `src/lib/pricing/engine.ts`

```typescript
// Line 47: TODO: Fetch agent metadata to calculate complexity
// Line 50: TODO: Estimate resource usage  
// Line 53: TODO: Get demand multiplier from bonding curve
```

**Impact:** Incorrect pricing, revenue loss

---

## 🟢 MEDIUM PRIORITY ISSUES

### 7. Admin Features Without Auth

**File:** `src/app/api/zkkyc/prune/route.ts`

```typescript
// Line 19: TODO: Add admin role check here
// if (session.user.role !== 'admin') return ERR.FORBIDDEN('Admin access required');
```

**Risk:** Unauthorized access to admin endpoints

---

### 8. Missing Database Queries

**Files:**
- `src/lib/fold-trace/settlement.ts` (lines 151, 326, 348)
- `src/lib/pricing/engine.ts` (line 47)

**Impact:** Features don't work, data not persisted

---

### 9. Marketplace Features Incomplete

**File:** `src/app/marketplace/page.tsx`

```typescript
// Line 26: TODO: Calculate from stats
// Line 27: TODO: Get from stats
```

**Impact:** Incorrect agent ratings/reviews displayed

---

## 🔵 LOW PRIORITY / CLEANUP

### 10. Console.log Statements in Production

**Files:**
- `src/middleware/payment-gate.ts:255`
- Multiple API routes

**Fix:** Replace with proper logging (Sentry, Winston)

---

## 📋 RECOMMENDED ACTION PLAN

### Phase 1: Critical Fixes (Week 1)
1. ✅ **DONE:** Resolve `app/` vs `src/app/` conflict
2. ✅ **DONE:** Standardize on pnpm
3. ⏳ **TODO:** Create missing components (RatingStars, TrustScore)
4. ⏳ **TODO:** Implement real authentication (JWT with proper secrets)
5. ⏳ **TODO:** Replace in-memory caches with Redis

### Phase 2: Payment & Revenue (Week 2)
1. Implement database storage for fold-trace
2. Complete payment verification (on-chain + database)
3. Implement revenue distribution
4. Add email notifications for payment events

### Phase 3: Feature Cleanup (Week 3)
1. **Decision:** Keep or remove Pet system?
2. **Decision:** Keep or remove WikiBrain?
3. Document purpose of each experimental feature
4. Remove unused code

### Phase 4: Production Hardening (Week 4)
1. Replace all TODO implementations
2. Add proper error handling
3. Implement rate limiting with Redis
4. Add comprehensive logging
5. Security audit

---

## 🎯 IMMEDIATE NEXT STEPS

1. **Create missing components:**
   ```bash
   touch apps/studio/src/components/marketplace/RatingStars.tsx
   touch apps/studio/src/components/marketplace/TrustScore.tsx
   ```

2. **Document experimental features:**
   - Create `docs/EXPERIMENTAL_FEATURES.md`
   - List purpose, status, and decision for each

3. **Prioritize TODOs:**
   - Tag each TODO with severity (CRITICAL/HIGH/MEDIUM/LOW)
   - Create GitHub issues for each CRITICAL TODO

4. **Set up proper logging:**
   - Replace console.log with structured logging
   - Integrate Sentry for error tracking

---

## 📈 Metrics

- **Total TODOs:** 30+
- **Missing Components:** 2
- **Mock Implementations:** 8+
- **Experimental Features:** 3+ (pets, wikibrain, canvas)
- **Security Issues:** 5+ (auth, payments, admin)

---

## 🤝 Ownership

**Assigned To:** Development Team  
**Review By:** Mohamed Abdelaziz  
**Target Completion:** 4 weeks

---

*This document should be updated as issues are resolved.*