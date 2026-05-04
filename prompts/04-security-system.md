---
title: الحارس الثابت (Security System)
version: 0.369
last-updated: 2026-05-04
linked-files: ["packages/aix-core/src/security.ts", "packages/aix-core/src/SwarmRouter.ts", "packages/aix-core/src/validator.ts"]
---

## 🎯 الهدف
ضمان أمان النظام ضد أي تهديدات خارجية أو داخلية من خلال ممر أمان صارم لكل مدخل وعملية.

## 📖 المحتوى
القواعد الثابتة (0-7):
0. الأمان يُفحص قبل أي شيء آخر.
1. كل input -> Zod validation إلزامي.
2. أي قيمة عشوائية -> `crypto.randomBytes()` فقط.
3. كل mutation مهم -> `TrustChain.append()`.
4. التجارب في sandbox معزول.
5. `safetyScore < 7.0` -> توقّف فوري (ABORT).
6. لا secrets داخل الكود مطلقاً.
7. أي input مشبوه -> abort بلا تردد.

## 🔗 في الكودبيس الحالي
- `packages/aix-core/src/security.ts`: يطبق القاعدة 2 (randomBytes) والقاعدة 0 (Sovereign Shield).
- `packages/aix-core/src/SwarmRouter.ts`: يستخدم Zod للتحقق من المهام (القاعدة 1).
- `packages/aix-core/src/validator.ts`: الممر الرئيسي للتحقق من صحة البيانات.

## ✅ مطبّق الآن
- استخدام `randomBytes(16)` لتوليد رموز الجلسة في `GatewaySecurity`.
- فحص الـ Origin في اتصالات الـ Gateway.
- استخدام JCS (RFC 8785) لضمان سلامة المحتوى (Integrity).

## ⚠️ فجوات / TODO
- [ ] إنشاء `packages/aix-core/src/trust-chain.ts` وتفعيل `TrustChain.append()`.
- [ ] دمج نظام الـ `safetyScore` في الـ SwarmRouter.
- [ ] تفعيل الـ Sandbox Execution للمهام البرمجية.

## 💡 مثال حقيقي
في `security.ts` (القاعدة 2):
```typescript
static generateSessionToken(agentId: string): string {
  const salt = randomBytes(16).toString('hex'); // استخدام crypto.randomBytes
  return createHash('sha256')
    .update(`${agentId}:${salt}:${Date.now()}`)
    .digest('hex');
}
```
In `SwarmRouter.ts` (Rule 1):
```typescript
import { z } from 'zod';
export const TaskDescriptorSchema = z.object({ ... });
```
