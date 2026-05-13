/**
 * AIX Frontend Evolution Strategies
 * 9 strategies for Next.js App Router, ordered by typical impact
 *
 * Each strategy:
 *   id          — unique, used as applied-set key
 *   description — human readable
 *   estimate()  — returns expected composite gain (0–1) WITHOUT touching files
 *   apply()     — performs the actual transform, returns # files changed
 */

import * as fs from 'fs';
import * as path from 'path';

const LARGE_COMPONENT_LINES = 200;

export interface FrontendScore {
  bundleKB: number;
  lighthousePerf: number;
  componentCount: number;
  renderScore: number;
  timestamp: number;
}

export interface Strategy {
  id: string;
  description: string;
  estimate(score: FrontendScore, srcDir: string): number;
  apply(srcDir: string, rootDir: string): Promise<number>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function walkFiles(dir: string, ext: RegExp): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkFiles(full, ext));
    else if (ext.test(entry.name)) results.push(full);
  }
  return results;
}

function readFile(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

function writeFile(p: string, content: string): void {
  fs.writeFileSync(p, content, 'utf8');
}

// ─── Strategy 1: Remove unused imports ────────────────────────────────────
const removeUnusedImports: Strategy = {
  id: 'remove-unused-imports',
  description: 'Remove unused import statements (reduces bundle + parse time)',

  estimate(score) {
    // High value if bundle is large
    return score.bundleKB > 200 ? 0.08 : 0.03;
  },

  async apply(srcDir) {
    let changed = 0;
    for (const file of walkFiles(srcDir, /\.(tsx|ts)$/)) {
      const original = readFile(file);
      // Remove lines that are pure named imports where nothing from them is used
      // Safe: only removes lines of pattern `import { X } from 'Y'` where X not in rest of file
      const lines = original.split('\n');
      const importLines: Array<{ line: string; idx: number; names: string[]; from: string }> = [];
      lines.forEach((line, idx) => {
        const m = line.match(/^import\s+\{([^}]+)\}\s+from\s+['"](.*)['"]/);
        if (m) importLines.push({ line, idx, names: m[1].split(',').map(n => n.trim().split(' as ').pop()!.trim()), from: m[2] });
      });

      const modified = lines.slice();
      const body = lines.join('\n');

      for (const { idx, names, from } of importLines) {
        // Skip react, next, and side-effect imports
        if (['react', 'next', 'next/'].some(p => from.startsWith(p))) continue;
        const unusedNames = names.filter(name => {
          if (!name || name === '*') return false;
          const pattern = new RegExp(`\\b${name}\\b`, 'g');
          const occurrences = (body.match(pattern) || []).length;
          return occurrences <= 1; // only the import itself
        });
        if (unusedNames.length === names.length) {
          modified[idx] = ''; // remove entire import
          changed++;
        }
      }

      const result = modified.join('\n').replace(/\n{3,}/g, '\n\n');
      if (result !== original) writeFile(file, result);
    }
    return changed;
  },
};

// ─── Strategy 2: Add 'use client' only where needed ───────────────────────
const markServerComponents: Strategy = {
  id: 'mark-server-components',
  description: 'Remove unnecessary "use client" from server-safe components (reduces client bundle)',

  estimate(score) {
    return score.bundleKB > 150 ? 0.06 : 0.02;
  },

  async apply(srcDir) {
    let changed = 0;
    for (const file of walkFiles(srcDir, /\.tsx$/)) {
      const src = readFile(file);
      if (!src.startsWith('"use client"') && !src.startsWith("'use client'")) continue;
      // If no browser-only APIs and no hooks, it's safe to be a server component
      const hasBrowserAPIs = /\b(useState|useEffect|useRef|useCallback|useMemo|useReducer|window\.|document\.|localStorage|sessionStorage)\b/.test(src);
      const hasEventHandlers = /\bon[A-Z][a-zA-Z]+\s*=/.test(src);
      if (!hasBrowserAPIs && !hasEventHandlers) {
        const updated = src.replace(/^["']use client["'];?\n/, '');
        writeFile(file, updated);
        changed++;
      }
    }
    return changed;
  },
};

// ─── Strategy 3: Lazy-load heavy routes ───────────────────────────────────
const lazyLoadRoutes: Strategy = {
  id: 'lazy-load-routes',
  description: 'Add dynamic() imports to page-level heavy components (reduces First Load JS)',

  estimate(score) {
    return score.bundleKB > 300 ? 0.12 : 0.04;
  },

  async apply(srcDir, rootDir) {
    // Targets: app/**/page.tsx files that import large client components
    const appDir = path.join(rootDir, 'app');
    let changed = 0;
    for (const file of walkFiles(appDir, /page\.tsx$/)) {
      const src = readFile(file);
      if (src.includes('next/dynamic')) continue; // already lazy

      // Find component imports that look heavy (importing from components/ or ui/)
      const heavyImportRe = /import\s+(\w+)\s+from\s+['"](.*\/(?:components|ui|features)\/[^'"]+)['"]/g;
      let match: RegExpExecArray | null;
      let modified = src;
      let addedDynamic = false;

      while ((match = heavyImportRe.exec(src)) !== null) {
        const [fullMatch, compName, importPath] = match;
        if (!modified.includes(`dynamic(() => import('${importPath}')`)) {
          // Replace static import with dynamic
          modified = modified.replace(
            fullMatch,
            `const ${compName} = dynamic(() => import('${importPath}'), { loading: () => null })`
          );
          addedDynamic = true;
          changed++;
        }
      }

      if (addedDynamic && !modified.includes("import dynamic")) {
        modified = `import dynamic from 'next/dynamic';\n` + modified;
        writeFile(file, modified);
      }
    }
    return changed;
  },
};

// ─── Strategy 4: Fix useEffect missing dependencies ───────────────────────
const fixUseEffectDeps: Strategy = {
  id: 'fix-use-effect-deps',
  description: 'Add empty dep array [] to useEffect without deps (prevents infinite re-renders)',

  estimate(score) {
    // Direct: renderScore is the count of bad useEffects
    return score.renderScore > 5 ? 0.10 : score.renderScore > 0 ? 0.05 : 0;
  },

  async apply(srcDir) {
    let changed = 0;
    for (const file of walkFiles(srcDir, /\.(tsx|ts|jsx|js)$/)) {
      const src = readFile(file);
      if (!src.includes('useEffect')) continue;

      // Pattern: useEffect(() => { ... }) without second argument
      // Add [] as second argument (safe default — run once on mount)
      // Only match single-line closings
      const fixed = src.replace(
        /(useEffect\s*\(\s*(?:async\s*)?(?:\(\s*\)\s*=>|function\s*\(\s*\))\s*\{[^}]*\}\s*)\)/g,
        (match, body) => {
          if (match.includes(', [')) return match; // already has deps
          return body + ', [])';
        }
      );

      if (fixed !== src) {
        writeFile(file, fixed);
        changed++;
      }
    }
    return changed;
  },
};

// ─── Strategy 5: Add React.memo to pure display components ────────────────
const memoPureComponents: Strategy = {
  id: 'memo-pure-components',
  description: 'Wrap pure display components in React.memo (prevents parent re-renders)',

  estimate(score) {
    return score.renderScore > 3 ? 0.07 : 0.02;
  },

  async apply(srcDir) {
    let changed = 0;
    for (const file of walkFiles(srcDir, /\.tsx$/)) {
      const src = readFile(file);
      if (src.includes('React.memo') || src.includes('memo(')) continue;
      // Target: default exported arrow components with props, no hooks
      const hasBrowserHooks = /\b(useState|useEffect|useRef|useReducer|useContext)\b/.test(src);
      if (hasBrowserHooks) continue;
      // Only wrap if it exports a default component
      const match = src.match(/export default function (\w+)/);
      if (!match) continue;
      const compName = match[1];
      // Add React.memo wrapper at end of file
      const modified = src.replace(
        `export default function ${compName}`,
        `function ${compName}`
      ) + `\nexport default React.memo(${compName});
`;
      // Make sure React is imported
      if (!modified.includes("import React") && !modified.includes("from 'react'")) continue;
      writeFile(file, modified);
      changed++;
    }
    return changed;
  },
};

// ─── Strategy 6: Replace moment.js with dayjs ─────────────────────────────
const replaceMoment: Strategy = {
  id: 'replace-moment-dayjs',
  description: 'Replace moment.js imports with dayjs (saves ~200KB bundle)',

  estimate(score, srcDir) {
    const hasMoment = walkFiles(srcDir, /\.(tsx|ts)$/).some(f =>
      readFile(f).includes("from 'moment'")
    );
    return hasMoment ? 0.15 : 0;
  },

  async apply(srcDir) {
    let changed = 0;
    for (const file of walkFiles(srcDir, /\.(tsx|ts)$/)) {
      const src = readFile(file);
      if (!src.includes("from 'moment'")) continue;
      const updated = src
        .replace(/import moment from 'moment'/g, "import dayjs from 'dayjs'")
        .replace(/\bmoment\(/g, 'dayjs(');
      writeFile(file, updated);
      changed++;
    }
    return changed;
  },
};

// ─── Strategy 7: Replace lodash with native ───────────────────────────────
const replaceLodash: Strategy = {
  id: 'replace-lodash-native',
  description: 'Replace lodash utility imports with native Array/Object methods (saves ~70KB)',

  estimate(score, srcDir) {
    const hasLodash = walkFiles(srcDir, /\.(tsx|ts)$/).some(f =>
      readFile(f).includes("from 'lodash'")
    );
    return hasLodash ? 0.08 : 0;
  },

  async apply(srcDir) {
    let changed = 0;
    const replacements: Record<string, string> = {
      '_.map(':         '.map(',
      '_.filter(':      '.filter(',
      '_.find(':        '.find(',
      '_.forEach(':     '.forEach(',
      '_.includes(':    '.includes(',
      '_.uniq(':        '[...new Set(',
      '_.flatten(':     '.flat(',
      '_.isEmpty(':     '(v => !v || (Array.isArray(v) ? v.length === 0 : Object.keys(v).length === 0))(',
      '_.cloneDeep(':   'structuredClone(',
    };
    for (const file of walkFiles(srcDir, /\.(tsx|ts)$/)) {
      const src = readFile(file);
      if (!src.includes("from 'lodash'")) continue;
      let updated = src;
      for (const [from, to] of Object.entries(replacements)) {
        updated = updated.replace(new RegExp(from.replace('(', '\\('), 'g'), to);
      }
      // Remove lodash import if no more _. usage
      if (!updated.includes('_.')) {
        updated = updated.replace(/import \* as _ from 'lodash';?\n?/g, '');
        updated = updated.replace(/import _ from 'lodash';?\n?/g, '');
      }
      if (updated !== src) { writeFile(file, updated); changed++; }
    }
    return changed;
  },
};

// ─── Strategy 8: Add Image optimization ───────────────────────────────────
const optimizeImages: Strategy = {
  id: 'optimize-next-image',
  description: 'Replace <img> tags with Next.js <Image> (LCP improvement)',

  estimate(score) {
    return score.lighthousePerf < 80 ? 0.09 : 0.02;
  },

  async apply(srcDir) {
    let changed = 0;
    for (const file of walkFiles(srcDir, /\.tsx$/)) {
      const src = readFile(file);
      if (!src.includes('<img ') || src.includes("from 'next/image'")) continue;
      const updated = src
        .replace(/<img /g, '<Image ')
        .replace(/<\/img>/g, '')
        // Add width/height if missing (required by Next Image)
        .replace(/<Image ([^>]*?)(?!width)([^>]*)>/g, (m) =>
          m.includes('width') ? m : m.replace('<Image ', '<Image width={0} height={0} ')
        );
      const withImport = "import Image from 'next/image';\n" + updated;
      writeFile(file, withImport);
      changed++;
    }
    return changed;
  },
};

// ─── Strategy 9: Add font display swap ────────────────────────────────────
const fontDisplaySwap: Strategy = {
  id: 'font-display-swap',
  description: 'Add display: swap to Next.js font configs (reduces CLS, improves Lighthouse)',

  estimate(score) {
    return score.lighthousePerf < 85 ? 0.05 : 0.01;
  },

  async apply(srcDir, rootDir) {
    let changed = 0;
    const appDir = path.join(rootDir, 'app');
    for (const file of [...walkFiles(srcDir, /layout\.tsx$/), ...walkFiles(appDir, /layout\.tsx$/)]) {
      const src = readFile(file);
      if (!src.includes('next/font') || src.includes('display:')) continue;
      const updated = src.replace(
        /(next\/font\/[a-z]+['"]);?\n([\s\S]*?)(\w+)\(\{/,
        (match, imp, between, fontFn) =>
          `${imp};\n${between}${fontFn}({\n  display: 'swap',`
      );
      if (updated !== src) { writeFile(file, updated); changed++; }
    }
    return changed;
  },
};

// ─── Export ────────────────────────────────────────────────────────────────

export const STRATEGIES: Strategy[] = [
  // High-impact first (loop picks highest estimate each round)
  replaceMoment,        // +15% if moment exists
  lazyLoadRoutes,       // +12% if bundle > 300KB
  fixUseEffectDeps,     // +10% if bad useEffects exist
  optimizeImages,       // +9%  if Lighthouse < 80
  removeUnusedImports,  // +8%  if bundle > 200KB
  replaceLodash,        // +8%  if lodash exists
  memoPureComponents,   // +7%  if render score high
  markServerComponents, // +6%  if bundle > 150KB
  fontDisplaySwap,      // +5%  if Lighthouse < 85
];

export { applyStrategy };

function applyStrategy(strategy: Strategy, srcDir: string, rootDir: string): Promise<number> {
  return strategy.apply(srcDir, rootDir);
}
