# 🔑 Pi Validation Key — Truth Report
> Audit v1.0 | Made with Moe Abdelaziz
> **⚠️ Security Note:** Key value is intentionally redacted (first 6 + last 4 chars only).

---

## 1. File Identity

| Property | Value |
|----------|-------|
| **Path** | `apps/studio/public/validation-key.txt` |
| **Content** | `33394e...11af` (37 hex chars, redacted) |
| **Size** | 37 bytes (no trailing newline, no BOM) |
| **Encoding** | ASCII text, no line terminators |
| **Type** | Pi Network domain ownership verification token |

---

## 2. Git History

| Commit | Date | Message | Key Change |
|--------|------|---------|------------|
| `fa04069` (first) | 2026-04-26 | `feat: implement Sovereign Pi Agents Studio UI and Pi Network integration` | Created, 38 bytes (with `\n`) |
| `1e42fb8` | 2026-05-01 | `feat: implement agency orchestrator workflow engine...` | Touched (no content change) |
| `8684073` (latest) | 2026-05-01 | `fronetend fixes` | Trailing newline removed → 37 bytes |

**Key content has never changed.** Same value since day 1. Only cosmetic change: trailing `\n` removed.

---

## 3. Usage in Codebase

| File | Line | Context |
|------|------|---------|
| `apps/studio/next.config.ts` | 65 | Dedicated header block serving `/validation-key.txt` with `text/plain`, CORS `*`, cache `86400s` |
| `docs/AIX_MANIFEST.md` | 17 | Documents: "Domain verification token located in `apps/studio/public/validation-key.txt`" |
| `NEXT_STEPS.md` | 165 | Instruction: "Check Pi Network validation: `https://your-app.vercel.app/validation-key.txt`" |
| `docs/PI_INTEGRATION_AUDIT.md` | 15-17 | Sovereign audit references (this session) |

**No code imports or programmatically reads this file.** It is purely a **static proof-of-ownership** file served by Next.js from `public/`.

---

## 4. Official Pi Documentation Link

From Pi Developer Portal (confirmed via Moe's screenshot):

> **Step 8 — Validate Domain Ownership:**  
> "Include the following key in a .txt file named **validation-key.txt**, and place this file on your hosting domain accessible at `https://axiomid.app/validation-key.txt`"
>
> The Pi bot fetches this URL and compares the content to the key in their Portal.

**Protocol:**
- Pi generates a unique key per app.
- Developer places it at `https://{registered-domain}/validation-key.txt`.
- Pi bot HTTP-GETs the URL and compares byte-for-byte.
- **No TTL mentioned** — the file must be present at verification time.
- **After successful verification:** Pi docs do not explicitly say the file can be removed. Conservative approach = keep it.

---

## 5. Is This Key Active or Legacy?

| Check | Result |
|-------|--------|
| Pi Developer Portal shows same key? | ✅ **YES** (Moe confirmed: "yes same keys") |
| Domain status in Portal | ❌ "Domain ownership is not validated" |
| Key ever rotated? | No — same value since `fa04069` |
| Key used by any code logic? | No — purely static file |
| Key committed to git? | ⚠️ Yes — visible in git history |

**Verdict: ACTIVE — this is the current, valid key needed for Step 8 completion.**

---

## 6. Security Assessment

| Risk | Level | Notes |
|------|-------|-------|
| Key in public repo | 🟡 Medium | Key is meant to be publicly accessible at the URL anyway — Pi's design requires this. However, it's also in git history. |
| Key purpose | 🟢 Low Risk | Only proves domain ownership. Cannot be used for auth, payments, or data access. |
| Key rotation needed? | 🟢 Not urgent | Key hasn't been compromised — it proves you own `axiomid.app`, which is verifiable fact. |
| Key in docs/logs | 🟡 Fixed | Full key was previously printed in audit docs — now redacted. |

---

## 7. Recommendation (Not Executed)

### Option A: **Keep in `public/` (Recommended)**
- ✅ Required by Pi for domain verification.
- ✅ After verification succeeds, Pi may re-verify periodically.
- ✅ No security risk — designed to be public.
- ⚠️ Consider `.gitattributes` to mark it as non-diffable.

### Option B: Move to env + build-time injection
- ❌ Adds unnecessary complexity.
- ❌ Pi needs a **static file** at a known URL — env vars don't help here.
- ❌ Build-time injection adds a moving part that could break re-verification.

### Option C: Delete after verification
- ⚠️ Pi may re-verify domain ownership periodically.
- ❌ If Pi re-checks and file is gone, you lose verified status.
- Only safe if Pi docs explicitly say it's a one-time check (they don't).

### ✅ Final Suggestion: **Keep as-is. Proceed with verification. Do not move or delete.**

---

## 8. Next Action (Pending Moe's Approval)

Before claiming the domain, this checklist must be green:

- [x] Key in `public/validation-key.txt` matches Pi Developer Portal ✅ (Moe confirmed)
- [x] File is 37 bytes, ASCII, no trailing whitespace ✅ (hex dump verified)
- [x] `next.config.ts` serves `/validation-key.txt` with `Content-Type: text/plain` ✅
- [x] `X-Frame-Options: SAMEORIGIN` removed (was blocking Pi iframe) ✅
- [ ] **Changes deployed to Vercel** (commit `670e04a` must be live)
- [ ] **Moe clicks "Verify Domain" in Pi Developer Portal**

**⚠️ No deploy or external verification will happen without Moe's explicit GO.**

---

// Made with Moe Abdelaziz — الأمانة قبل الإنجاز
