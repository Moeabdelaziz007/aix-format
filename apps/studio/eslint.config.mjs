import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

// eslint-config-next 15 still ships its `core-web-vitals` and
// `typescript` subpaths as legacy `{ extends: [...] }` CommonJS
// configs. The previous setup did
//
//   import nextVitals from "eslint-config-next/core-web-vitals.js";
//   ...
//   defineConfig([...nextVitals, ...nextTs, ...])
//
// which broke at link time with `TypeError: nextVitals is not iterable`
// because those imports are config OBJECTS, not flat-config arrays.
// FlatCompat is Next.js's documented bridge for consuming legacy
// configs from the new flat config. `@eslint/eslintrc` is already in
// the workspace (pulled in transitively), so no new direct dep is
// required.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = defineConfig([
  // Use the conventional ESLint short names that resolve through
  // `eslint-config-next` — these match Next.js 15's official
  // flat-config example exactly.
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "warn"
    }
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
