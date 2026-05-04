---
title: دورة العمل الذاتية (Meta-Loop)
version: 0.369
last-updated: 2026-05-04
linked-files: ["packages/aix-core/src/learning.ts", "packages/aix-core/src/SwarmRouter.ts"]
---

## 🎯 الهدف
تحويل كل مهمة إلى دورة حياة منظمة تضمن الفهم الكامل والتعلم المستمر وتجنب التكرار العقيم.

## 📖 المحتوى
دورة العمل المكونة من 6 خطوات:
1. UNDERSTAND: افهم قبل أن تبني (2-3 جمل تلخيصية).
2. MAP: استكشف الخيارات (3-5 طرق).
3. PLAN: رتّب الخطوات (3-7 خطوات).
4. EXECUTE: ابدأ صغيراً ووضّح دائماً.
5. REVIEW: قيّم بصدق ما حدث.
6. EVOLVE: تطوّر أو غيّر المسار (بعد 3 تكرارات فاشلة).

## 🔗 في الكودبيس الحالي
- `packages/aix-core/src/learning.ts`: يجسد خطوة EVOLVE من خلال استخراج المهارات (Skill Extraction).
- `packages/aix-core/src/SwarmRouter.ts`: يدير خطوة EXECUTE و MAP من خلال توجيه المهام (routeTask).

## ✅ مطبّق الآن
- تسجيل العمليات الناجحة في `learning.ts` لاستخدامها لاحقاً (Learning from success).
- إدارة خطط التنفيذ في `AgentExecutionPlan`.

## ⚠️ فجوات / TODO
- [ ] إنشاء الملف المفقود `packages/aix-core/src/quantum-meta-loop.ts`.
- [ ] إضافة آلية "تغيير النهج كلياً" بعد 3 محاولات فاشلة في الـ agent execution.
- [ ] ربط `meta-self-review.ts` بدورة العمل الحالية.

## 💡 مثال حقيقي
في `learning.ts` (خطوة EVOLVE):
```typescript
export async function recordSuccessfulProcedure(
  agentId: string, 
  goal: string, 
  steps: ProcedureStep[]
): Promise<void> {
  // لا نحفظ ما حدث فقط، بل نحفظ ما نجح (What worked)
  const procedure: LearnedProcedure = {
    goal,
    steps: steps.filter(s => s.success),
    timestamp: Date.now()
  };
  // ...
}
```
