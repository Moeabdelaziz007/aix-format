# Refactor Backlog: AIX Studio & Infrastructure

This document tracks technical debt and architectural improvements needed to stabilize the v0.369.0 baseline.

## Priority 1: High Impact
- **Unified Type System:** Merge `ABOM` and `KYC` interfaces into a shared package `@aix/types` to reduce duplication in `apps/studio` and `core/`.
- **Legacy KV Decommissioning:** Complete removal of `@vercel/kv` dependencies and cleanup of environment variables.
- **Pi SDK SSR Isolation:** Refactor `WalletProvider` to ensure Pi SDK is only loaded in the browser, preventing build-time warnings.

## Priority 2: Stability
- **Enhanced Health Diagnostics:** Expand `/api/health` to report individual status for Redis, Pi SDK, and ABOM Scanner.
- **Middleware Rate Limiting:** Move `TokenBucket` logic to Next.js Middleware for global API protection.
- **Sync Settings with Redis:** Move user preferences from Local Storage to Upstash Redis for cross-device consistency.

## Priority 3: Developer Experience
- **ABOM Scan Rule Engine:** Externalize ABOM scanning rules into JSON files for easier updates.
- **Automated Route Map:** Generate the route list for `postbuild` script automatically from the `app/` directory.
