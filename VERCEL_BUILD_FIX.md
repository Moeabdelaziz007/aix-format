# Vercel Build Fix - Node.js & pnpm Version Compatibility

## Problem Summary
Vercel builds were failing due to:
- **pnpm v10** incompatibility with Node.js 22 (ERR_INVALID_THIS / URLSearchParams bug)
- Lockfile generated with incompatible pnpm version
- Mixed usage of npm and pnpm in CI workflows

## Changes Applied

### 1. Root `package.json`
```json
{
  "engines": {
    "node": ">=20.0.0 <23.0.0",
    "pnpm": ">=9.0.0 <11.0.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

### 2. Vercel Configuration Files

#### `vercel.json` (root)
```json
{
  "build": {
    "env": {
      "NODE_VERSION": "20"
    }
  }
}
```

#### `apps/studio/vercel.json`
```json
{
  "build": {
    "env": {
      "NODE_VERSION": "20"
    }
  }
}
```

### 3. GitHub Workflows Updated

#### `.github/workflows/ci.yml`
- Changed Node.js version: `22` → `20`
- Added pnpm setup with version `9`
- Replaced all `npm` commands with `pnpm`

#### `.github/workflows/studio-ci.yml`
- Changed Node.js version: `22` → `20`
- Added pnpm setup with version `9`
- Replaced all `npm` commands with `pnpm`

## Required Manual Steps

### ⚠️ CRITICAL: Regenerate Lockfile

You **MUST** regenerate the lockfile locally before pushing:

```bash
# 1. Ensure you have pnpm v9 installed
pnpm --version  # Should show 9.x.x

# If not, install it:
npm install -g pnpm@9

# 2. Ensure you're using Node.js 20
node --version  # Should show v20.x.x

# If not, use nvm:
nvm install 20
nvm use 20

# 3. Delete old lockfile
rm pnpm-lock.yaml

# 4. Regenerate lockfile
pnpm install

# 5. Commit the new lockfile
git add pnpm-lock.yaml
git commit -m "fix: regenerate pnpm-lock.yaml with pnpm v9 + Node 20"
```

## Verification Checklist

After pushing changes, verify:

- [ ] GitHub Actions CI passes without lockfile warnings
- [ ] Vercel build completes successfully
- [ ] No `ERR_INVALID_THIS` errors in build logs
- [ ] No URLSearchParams-related errors
- [ ] Application deploys and runs correctly

## Technical Details

### Why Node 20?
- Stable LTS version
- Full compatibility with pnpm v9
- Avoids Node 22 edge cases with pnpm v10

### Why pnpm v9?
- Proven stability with Node 20
- No known URLSearchParams bugs
- Better lockfile format compatibility

### Why Not pnpm v10?
- Known issues with Node.js 22
- `ERR_INVALID_THIS` errors in URLSearchParams
- Lockfile format changes causing CI failures

## Rollback Plan

If issues persist, you can rollback by:

```bash
git revert HEAD~1  # Revert lockfile regeneration
git revert HEAD~2  # Revert configuration changes
```

Then investigate specific error messages in Vercel build logs.

## Support

If build still fails after these changes:
1. Check Vercel build logs for specific error messages
2. Verify environment variables are set correctly
3. Ensure all secrets (VERCEL_TOKEN, etc.) are configured
4. Check for any custom build scripts that might override Node version

---

**Last Updated:** 2026-05-04  
**Applied By:** AIX Evolution Mode  
**Status:** ✅ Configuration changes complete, awaiting lockfile regeneration