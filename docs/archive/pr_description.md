Fix Studio build errors and add Pattern Watcher

## Description

This PR fixes the Next.js production build issues inside the `apps/studio` workspace and implements a global pattern watcher via GitHub Actions to ensure code compliance.

### Changes Made:

1. **Studio Build Fixes:**
   - Fixed an implicit `any` type error caused by missing `js-yaml` type definitions by installing `@types/js-yaml` as a dev dependency.
   - Fixed `LiveValidator.tsx` where TypeScript correctly flagged that `JSON.parse` and `load` return `any`/`unknown`. The result is safely cast and accessed to ensure valid structured responses.

2. **Pattern Watcher Addition:**
   - Created `scripts/pattern-watcher.js` to run on the CI level, checking:
     - The absence of Web2 authentication (Clerk/Auth0) to enforce strict Web3 Sovereign authentication.
     - Basic validations of the 'Sovereign Aether Design System' (Glassmorphism & Contrast styles).
     - Parity of parser structures between `core/parser.js` and `schemas`.
     - Valid Memory classifications (rejecting ambiguous concepts like 'persistence' for explicit Episodic/Semantic/Procedural constraints).
   - Added `.github/workflows/pattern-watcher.yml` to trigger the script automatically.

3. **Parser Tests Fixes:**
   - Addressed an `Unexpected reserved word` related to dynamic importing using `await import` dynamically placed inside synchronous blocks inside `tests/abom.test.js` where the parent was not an `async` function.

### Testing
- `npm run build --workspace=studio` completes without type or runtime errors.
- `node scripts/pattern-watcher.js` successfully triggers.
- `npm run test` finishes correctly across the board for all parser modules.
