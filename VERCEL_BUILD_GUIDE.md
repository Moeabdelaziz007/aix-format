# 🚀 دليل حل مشاكل Vercel Build

## 📋 المشاكل التي تم حلها

### ✅ 1. إزالة `@next/bundle-analyzer` من `next.config.ts`
**المشكلة:** الـ package مش موجود في dependencies
**الحل:** تم إزالة الـ import والـ wrapper

### ✅ 2. تصحيح `vercel.json`
**المشكلة:** 
- `buildCommand` كان بيعمل `cd` و `pnpm install` يدوي
- ده بيسبب مشاكل في monorepo

**الحل:**
```json
{
  "buildCommand": "pnpm --filter @aix/studio build",
  "installCommand": "pnpm install --frozen-lockfile"
}
```

### ✅ 3. إعدادات Monorepo صحيحة
- ✓ `pnpm-workspace.yaml` موجود
- ✓ `.npmrc` فيه الإعدادات الصحيحة
- ✓ `outputFileTracingRoot` في `next.config.ts`

---

## 🔧 خطوات Deploy على Vercel

### 1️⃣ **في Vercel Dashboard**

اذهب إلى Project Settings → General:

```
Framework Preset: Next.js
Root Directory: apps/studio
Build Command: pnpm --filter @aix/studio build
Install Command: pnpm install --frozen-lockfile
Output Directory: .next
```

### 2️⃣ **Environment Variables**

تأكد من إضافة المتغيرات المطلوبة:
```bash
NEXT_PUBLIC_APP_VERSION=0.369.0
# أضف باقي المتغيرات من .env.example
```

### 3️⃣ **Node.js Version**

في Project Settings → General → Node.js Version:
```
18.x أو أعلى
```

---

## 🐛 مشاكل شائعة وحلولها

### ❌ Error: Cannot find module '@next/bundle-analyzer'
**الحل:** تم إزالته من `next.config.ts` ✅

### ❌ Error: Build failed with exit code 1
**السبب المحتمل:** مشكلة في TypeScript errors
**الحل:**
```bash
cd apps/studio
pnpm run build
```
افحص الأخطاء محلياً أولاً

### ❌ Error: Module not found in monorepo
**السبب:** Vercel مش عارف يلاقي الـ packages
**الحل:** تأكد من:
1. `outputFileTracingRoot` موجود في `next.config.ts`
2. `transpilePackages` فيه كل الـ packages المطلوبة

### ❌ Error: ENOENT: no such file or directory
**السبب:** مسار خاطئ في `vercel.json`
**الحل:** استخدم `Root Directory: apps/studio` في Vercel Dashboard

---

## 📝 Checklist قبل Deploy

- [ ] `pnpm install` يشتغل محلياً بدون أخطاء
- [ ] `pnpm --filter @aix/studio build` يشتغل محلياً
- [ ] كل الـ environment variables موجودة في Vercel
- [ ] `vercel.json` محدّث بالإعدادات الصحيحة
- [ ] `next.config.ts` بدون imports مفقودة
- [ ] Root Directory في Vercel = `apps/studio`

---

## 🎯 الأوامر المفيدة

```bash
# تجربة البناء محلياً
cd apps/studio
pnpm install
pnpm build

# فحص TypeScript errors
pnpm run lint

# تشغيل محلي
pnpm dev
```

---

## 📞 إذا استمرت المشكلة

1. افحص Vercel Build Logs بالكامل
2. ابحث عن أول error يظهر
3. تأكد من أن الـ error مش متعلق بـ:
   - Missing environment variables
   - TypeScript compilation errors
   - Missing dependencies

---

Made with Moe Abdelaziz — Built with Soul 💙