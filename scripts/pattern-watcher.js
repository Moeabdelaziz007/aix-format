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

      // RULE 2: crypto.randomBytes over Math.random
      // Allow visual files and legacy demos
      const isVisual = path.includes('Background') || path.includes('Particle') || path.endsWith('.html') || path.includes('InteractiveDevEnvironment');
      if (content.includes('Math.random()') && !path.includes('test') && !isVisual) {
        errors.push(`❌ RULE 2 VIOLATION: Math.random() found in ${path}. Security First! Use crypto.randomBytes() or secureRandom() from @/lib/security-core.`);
      }

      // RULE 4 & 7: AgentSelfReview & CuriosityEngine enforcement
      // Only check real logic files, skip UI components
      const isLogic = path.includes('src/lib/') || path.includes('src/app/api/');
      if (isLogic && content.includes('async run(') && !content.includes('AgentSelfReview.record')) {
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
  if (globalCss.includes('backdrop-blur')) {
    cssHasPristineGlassmorphism = true;
  }
} catch (e) { }

if (cssHasPristineGlassmorphism) {
  findings.push('✅ UI/UX: Sovereign Aether Design System (Glassmorphism) patterns detected.');
} else {
  findings.push('⚠️ UI/UX Advice: Ensure backdrop-blur and deep navy/charcoal glassmorphism are consistently applied across new components.');
}

// 3. Schema validation sync check
try {
  const parserContent = readFileSync('core/parser.js', 'utf8');
  if (!parserContent.includes('validateStructure') || !parserContent.includes('validateRequirements')) {
    errors.push('⚠️ Parser Structure: validateStructure or validateRequirements missing from core/parser.js. Ensure sync with schemas.');
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
