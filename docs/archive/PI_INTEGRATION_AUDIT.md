# 🔍 Pi Sovereign Shell — Integration Audit
> Truth Audit v1.0 | Built with Moe Abdelaziz

## 📊 Executive Summary

**الحالة الحالية:** الـ Pi SDK يتحمّل في الصفحة، لكن الـ domain validation (Step 8) عالقة.  
**السبب الرئيسي:** `validation-key.txt` موجود وشغّال على `axiomid.app` — المشكلة في إعدادات الـ Pi Developer Portal (الدومين المسجّل أو HTTPS redirect).

---

## 1. Domain Validation Status

| Check | Status | Details |
|-------|--------|---------|
| `validation-key.txt` exists in `public/` | ✅ | `apps/studio/public/validation-key.txt` |
| File content | ✅ | `33394e...11af` (37 bytes, redacted for security) |
| Served at `axiomid.app/validation-key.txt` | ⚠️ | Not externally verified — awaiting Moe's approval |
| `Content-Type: text/plain` header | ✅ | Set in `next.config.ts` line 65 |
| `CORS: Access-Control-Allow-Origin: *` | ✅ | Set in `next.config.ts` line 67 |
| Cache headers | ✅ | `public, max-age=86400` |
| Pi Developer Portal domain match | ⚠️ **NEEDS MANUAL CHECK** | See fix below |

### 🛡️ أسئلة أمنية (يجب الإجابة عليها قبل أي إجراء):

1. **هل المفتاح ما زال مستخدمًا؟** هل نفس الـ key اللي في الملف هو اللي في Pi Developer Portal؟
2. **هل تريد تدويره؟** لو الـ key قديم أو مكشوف، Pi Portal يسمح بتوليد واحد جديد.
3. **هل تريد نقله لـ env/secret؟** حالياً هو في `public/` (مطلوب من Pi يكون publicly accessible). لكن بعد الـ verification يمكن حذفه أو حمايته.

### 🔧 الإجراءات المطلوبة من Moe (على الموبايل):

1. **افتح [Pi Developer Portal](https://develop.pi)** → App Settings
2. **تأكد أن الدومين المسجّل هو بالضبط:** `axiomid.app` (بدون `https://` وبدون `/`)
3. **تأكد إنك مش حاطط** `www.axiomid.app` — لأن الكود عندك redirect من `www` إلى bare domain
4. **اضغط "Verify Domain"** — الـ bot بتاع Pi رح يقرأ الملف من الدومين
5. **لو فشل:** 
   - جرّب تحذف أي trailing whitespace من الـ key في الـ Portal
   - تأكد إن الـ key في الـ Portal يطابق محتوى الملف حرفياً

---

## 2. Origin & iframe Audit

| Current Origin | Expected Origin (Pi Browser) | Source File | Required Fix |
|---|---|---|---|
| `https://axiomid.app` | `https://app-cdn.minepi.com` (iframe parent) | `next.config.ts:41` | ✅ CSP already allows `frame-ancestors 'self' https://app-cdn.minepi.com` |
| N/A | Pi SDK iframe origin | `next.config.ts:68` | ✅ Same CSP on `/validation-key.txt` |
| `window.Pi.init()` | `sdk.minepi.com` script origin | `layout.tsx:83` | ✅ Script loads from CDN |
| `X-Frame-Options: SAMEORIGIN` | Should allow Pi Browser iframe | `next.config.ts:38` | ⚠️ **CONFLICT** — Pi Browser wraps your app in an iframe from `app-cdn.minepi.com`. `SAMEORIGIN` **blocks this**. |

### 🚨 Critical Fix: `X-Frame-Options` conflicts with Pi Browser

**المشكلة:** `X-Frame-Options: SAMEORIGIN` يمنع Pi Browser من تضمين التطبيق في iframe.  
Pi Browser يعرض التطبيقات داخل iframe من `https://app-cdn.minepi.com`.

**الحل:** إزالة `X-Frame-Options` والاعتماد على `Content-Security-Policy: frame-ancestors` فقط (الأحدث والأقوى):

```diff
// next.config.ts headers
- { key: "X-Frame-Options", value: "SAMEORIGIN" },
```

> `frame-ancestors` في CSP يقوم بنفس الوظيفة لكنه يدعم origins متعددة.

---

## 3. Pi SDK Init Audit

| File | Init Pattern | sandbox Logic | Issue |
|---|---|---|---|
| `hooks/usePi.ts:42` | `window.Pi.init({ version: "2.0", sandbox }, [])` | Passed from prop | ✅ Correct |
| `hooks/useAuth.ts:30` | `(window as unknown).Pi.init({ version: '2.0', sandbox: true })` | **Hardcoded `true`** | ⚠️ Always sandbox |
| `components/providers/WalletProvider.tsx:19-22` | `(window as unknown).Pi.init({ version: '2.0', sandbox: process.env.NODE_ENV !== 'production' })` | Uses NODE_ENV | ✅ Correct but duplicated |
| `app/identity/page.tsx:53` | `window.Pi.init({ version: "2.0", sandbox: process.env.NODE_ENV !== "production" })` | Uses NODE_ENV | ✅ Correct but duplicated |
| `components/layout/Navbar.tsx:58-66` | `window.Pi` check only, auth commented out | N/A | ✅ Safe (dormant) |

### 🚨 Issues Found:

1. **Pi.init() called 3-4 times** — `usePi`, `WalletProvider`, `useAuth`, `identity/page` all call `Pi.init()` independently. Pi SDK should be initialized **once**.
2. **`useAuth.ts` hardcodes `sandbox: true`** — Will never work in production.
3. **`useAuth.ts:56` has a bug:** references `err` instead of `error` (variable name mismatch).
4. **No `postMessage` usage found** — ✅ Good, Pi SDK handles this internally.

---

## 4. Recommended Sovereign Fix Order

```
Phase 1 — Pi App Shell (الأولوية القصوى)
├── Fix X-Frame-Options conflict → Remove SAMEORIGIN header
├── Verify domain in Pi Developer Portal (manual step by Moe)
└── Confirm axiomid.app loads inside Pi Browser without errors

Phase 2 — Pi Auth (بعد استقرار الـ Shell)
├── Centralize Pi.init() to WalletProvider only (single source of truth)
├── Fix useAuth.ts sandbox hardcode + err bug
├── Remove duplicate Pi.init() calls from identity/page and usePi
└── Test Pi.authenticate() flow inside Pi Browser

Phase 3 — Pi Payments (بعد نجاح Auth)
├── Enable payment flow only after auth is verified
├── Test approve → complete cycle in sandbox
└── Graduate to production environment
```

---

**AIX-AUDIT-COMPLETE: PI_SOVEREIGN_SHELL_v1.0**  
// Made with Moe Abdelaziz
