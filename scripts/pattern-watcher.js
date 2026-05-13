/**
 * AIX Pattern Watcher
 * Analyzes the codebase for architectural patterns, compliance with
 * strict guidelines, and suggests improvements.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('🔍 Starting AIX Pattern Watcher...\n');

const findings = [];
const errors = [];

function walkDir(dir, callback) {
  const files = readdirSync(dir);
  for (const file of files) {
    const path = join(dir, file);
    if (statSync(path).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        walkDir(path, callback);
      }
    } else {
      callback(path);
    }
  }
}

// 1. Check for Prohibited Auth Patterns
let foundProhibitedAuth = false;
if (statSync('apps/studio').isDirectory()) {
  walkDir('apps/studio', (path) => {
    if (path.endsWith('.js') || path.endsWith('.ts') || path.endsWith('.tsx')) {
      const content = readFileSync(path, 'utf8');
      if (content.includes('@clerk/nextjs') || content.includes('auth0')) {
        errors.push(`❌ CRITICAL: Prohibited Web2 Auth found in ${path}. AIX is a Web3 Sovereign Protocol. Use Pi KYC Web3 Modals and Ed25519 Signatures.`);
        foundProhibitedAuth = true;
      }

      // RULE 2: crypto.randomBytes/randomUUID over Math.random in
      // security-sensitive paths. The previous rule flagged every
      // Math.random() call in the entire studio tree, which caught 22
      // legitimate UI-animation and mock-data uses (particle bg,
      // KYC-modal visual particles, CLI pet entropy, dashboard mock
      // events, RL training simulation, etc.) and drowned the real
      // signal in noise. Use Math.random freely for UI; mandate crypto
      // only where the value lands in an identifier, signature, hash,
      // session token, or other security primitive.
      const SECURITY_SENSITIVE = [
        /\/lib\/payment\//,
        /\/lib\/security/,
        /\/lib\/identity/,
        /\/lib\/auth/,
        /\/app\/api\/agents\/deploy\//,
        /\/app\/api\/agents\/payment\//,
        /\/app\/api\/kyc\//,
        /\/app\/api\/zkkyc\//,
        /\/components\/studio\/AgentInteraction\./,
        /\/app\/identity\//,
      ];
      const isSecuritySensitive = SECURITY_SENSITIVE.some((re) => re.test(path));
      if (isSecuritySensitive && !path.includes('test')) {
        // Match Math.random( as a real call, not the literal string
        // inside a // comment or a * JSDoc line. content.includes()
        // would otherwise flag a file that just documents RULE 2.
        const lines = content.split('\n');
        const offendingLine = lines.find((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('*')) return false;
          return /Math\.random\s*\(/.test(line);
        });
        if (offendingLine) {
          errors.push(
            `❌ RULE 2 VIOLATION: Math.random() found in security-sensitive ${path}. Use crypto.randomBytes()/randomUUID()/getRandomValues() — see apps/studio/src/lib/security-core.ts for helpers.`
          );
        }
      }

      // RULE 4 & 7: AgentSelfReview & CuriosityEngine enforcement
      if (content.includes('async run(') && !content.includes('AgentSelfReview.record')) {
        findings.push(`⚠️ RULE 4 WARNING: run() method found without AgentSelfReview.record() in ${path}. CuriosityEngine is starving!`);
      }
    }
  });
}

if (!foundProhibitedAuth) {
  findings.push('✅ Auth Pattern: Strict Web3 Sovereign Protocol compliance verified.');
}

// 2. Check for UI/UX Guidelines (Glassmorphism & Contrast)
let cssHasPristineGlassmorphism = false;
try {
  const globalCss = readFileSync('apps/studio/src/app/globals.css', 'utf8');
  if (globalCss.includes('backdrop-blur') && globalCss.includes('rgba(12, 16, 28')) {
    cssHasPristineGlassmorphism = true;
  }
} catch (e) {
  // Ignored
}

if (cssHasPristineGlassmorphism) {
  findings.push('✅ UI/UX: Sovereign Aether Design System (Glassmorphism) patterns detected.');
} else {
  findings.push('⚠️ UI/UX Advice: Ensure backdrop-blur and deep navy/charcoal glassmorphism are consistently applied across new components.');
}

// 3. Schema validation sync check
// Historically this rule looked for two methods directly on AIXParser
// (`validateStructure` and `validateRequirements`). The latter was
// refactored away when requirements validation moved into the
// pluggable rule engine (core/rules/requirements-rules.js — every
// rule there registers via core/validation-engine.js and is invoked
// by validateStructure under the hood). Keep the check honest:
// require the entry point method on the parser AND require the
// requirements rule module to exist.
try {
  const parserContent = readFileSync('core/parser.js', 'utf8');
  const hasEntryPoint = parserContent.includes('validateStructure');
  let hasRequirementsRules = false;
  try {
    const reqRules = readFileSync('core/rules/requirements-rules.js', 'utf8');
    hasRequirementsRules = /export\s+const\s+requirementsRules/.test(reqRules);
  } catch {
    hasRequirementsRules = false;
  }
  if (!hasEntryPoint || !hasRequirementsRules) {
    errors.push('⚠️ Parser Structure: validateStructure missing from core/parser.js or requirementsRules missing from core/rules/requirements-rules.js. Ensure sync with schemas.');
  } else {
    findings.push('✅ Architecture: Parser core methods for schema validation are present.');
  }
} catch (e) {
  errors.push(`Error reading parser: ${e.message}`);
}

// 4. Memory classification check
try {
  const parserContent = readFileSync('core/parser.js', 'utf8');
  if (parserContent.includes('persistence') && parserContent.includes('validateMemory')) {
    findings.push('⚠️ Memory Classification Advice: The term "persistence" was found near memory validation. Remember that AIX agent memory strictly permits only Episodic, Semantic, and Procedural types.');
  } else {
    findings.push('✅ Architecture: Memory classification follows strict Episodic, Semantic, Procedural constraints.');
  }
} catch (e) { }

// Output Results
console.log('--- PATTERN ANALYSIS REPORT ---\n');

findings.forEach(f => console.log(f));
console.log('');

if (errors.length > 0) {
  console.log('--- CRITICAL VIOLATIONS ---\n');
  errors.forEach(e => console.error(e));
  process.exit(1);
} else {
  console.log('No critical pattern violations found.');
  process.exit(0);
}
