---
title: معايير الكود (Code Style)
version: 0.369
last-updated: 2026-05-04
linked-files: ["tsconfig.json", "package.json", "packages/aix-core/src/SwarmRouter.ts"]
---

## 🎯 الهدف
كتابة كود نظيف، بسيط، وآمن يسهل قراءته وصيانته دون الحاجة لتعليقات مكثفة.

## 📖 المحتوى
- ✅ TypeScript strict: إلزامي.
- ✅ Zod: على كل input خارجي.
- ✅ Functions ≤ 30 سطر.
- ✅ أسماء واضحة تشرح نفسها.
- ✅ Early return بدل nested ifs.
- ❌ console.log في production.
- ❌ circular imports.
- ❌ hardcoded secrets.
- ❌ functions بأكثر من 5 parameters.

## 🔗 في الكودبيس الحالي
- `tsconfig.json`: يفعل الـ strict mode.
- `packages/aix-core/src/SwarmRouter.ts`: يطبق معايير Zod و TypeScript بشكل ممتاز.

## ✅ مطبّق الآن
- استخدام `Zod` للتحقق من أنواع البيانات في `SwarmRouter`.
- تطبيق الـ Early return في وظائف الـ `CircuitBreaker`.
- الالتزام بتسمية المتغيرات والوظائف بشكل وصفي (مثل `recordFailure`, `isAllowed`).

## ⚠️ فجوات / TODO
- [ ] تنظيف بعض ملفات الـ legacy من الـ `console.log`.
- [ ] تقليل عدد الـ parameters في بعض الدوال المعقدة في `apps/studio`.
- [ ] إضافة `ESLint` rule للتأكد من طول الدوال (Max 30 lines).

## 💡 مثال حقيقي
في `SwarmRouter.ts` (Early return):
```typescript
public isAllowed(): boolean {
    if (this.state === 'closed') return true; // Early return

    if (this.state === 'open') {
        return this.checkAndProbe();
    }
    // ...
}
```
In `SwarmRouter.ts` (Clear Names):
`failureThreshold`, `successThreshold`, `openDurationMs` - أسماء تشرح وظيفتها بدقة.
