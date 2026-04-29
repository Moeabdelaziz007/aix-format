/**
 * tests/abom.test.js — AI-SBOM ABOM validation unit tests
 * Tests the upgraded validateABOM logic in core/parser.js
 */

import { AIXParser } from '../core/parser.js';

// ── Minimal valid AIX manifest template ────────────────────────────────────
const BASE = {
  meta: {
    version: '1.3.0',
    id: 'did:web:axiomid.app',
    name: 'Test Agent',
    created: '2026-04-29T00:00:00Z',
    author: 'test'
  },
  persona: {
    role: 'assistant',
    instructions: 'You are a test agent.'
  },
  security: {
    checksum: { algorithm: 'sha256', value: 'a'.repeat(64) }
  },
  identity_layer: {
    id: 'did:web:axiomid.app',
    authority: 'axiomid.app',
    issuedAt: '2026-04-29T00:00:00Z'
  }
};

function makeParser() { return new AIXParser(); }

function parseWithABOM(abom) {
  const parser = makeParser();
  // Call validateABOM directly to isolate ABOM logic
  parser.errors = [];
  parser.warnings = [];
  parser.validateABOM(abom);
  return { errors: parser.errors, warnings: parser.warnings };
}

// ─── Test suite ──────────────────────────────────────────────────────────────

const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  results.total++;
  try {
    fn();
    console.log(`  ✔ ${name}`);
    results.passed++;
  } catch (err) {
    console.error(`  ✖ ${name}`);
    console.error(`    ${err.message}`);
    results.failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function hasError(errors, code) {
  return errors.some(e => e.code === code);
}

function hasWarning(warnings, code) {
  return warnings.some(w => w.code === code);
}

console.log('\n── ABOM Validation Tests (AI-SBOM compatible) ──\n');

// ── 1. Valid minimal ABOM ────────────────────────────────────────────────────
test('valid constituent with all required fields passes', () => {
  const { errors, warnings } = parseWithABOM({
    constituents: [{
      name: 'openai-gpt-4o',
      version: '2024-11',
      type: 'model',
      purl: 'pkg:openai/gpt-4o@2024-11',
      supplier: 'OpenAI',
      trust_tier: 'verified',
      integrity_hash: 'sha256:' + 'a'.repeat(64),
      security_status: 'clean',
      license: 'proprietary'
    }]
  });
  const abomErrors = errors.filter(e => e.section && e.section.startsWith('abom'));
  assert(abomErrors.length === 0, `Expected no ABOM errors, got: ${JSON.stringify(abomErrors)}`);
});

// ── 2. Missing mandatory fields ───────────────────────────────────────────────
test('constituent missing name, version, type, purl produces MISSING_FIELD errors', () => {
  const { errors } = parseWithABOM({ constituents: [{}] });
  const codes = errors.map(e => e.code);
  assert(codes.includes('MISSING_FIELD'), 'Expected MISSING_FIELD errors');
  const fields = errors.filter(e => e.code === 'MISSING_FIELD').map(e => e.field);
  assert(fields.includes('name'), 'Missing name error expected');
  assert(fields.includes('version'), 'Missing version error expected');
  assert(fields.includes('type'), 'Missing type error expected');
  assert(fields.includes('purl'), 'Missing purl error expected');
});

// ── 3. Invalid type enum ──────────────────────────────────────────────────────
test('invalid constituent type produces INVALID_VALUE error', () => {
  const { errors } = parseWithABOM({
    constituents: [{ name: 'x', version: '1.0', type: 'banana', purl: 'pkg:npm/x@1.0' }]
  });
  assert(hasError(errors, 'INVALID_VALUE'), 'Expected INVALID_VALUE for bad type');
});

// ── 4. Invalid purl format ────────────────────────────────────────────────────
test('invalid purl format produces INVALID_PURL error', () => {
  const { errors } = parseWithABOM({
    constituents: [{ name: 'x', version: '1.0', type: 'library', purl: 'not-a-purl' }]
  });
  assert(hasError(errors, 'INVALID_PURL'), 'Expected INVALID_PURL error');
});

// ── 5. Valid purl passes ──────────────────────────────────────────────────────
test('valid purl passes without INVALID_PURL error', () => {
  const { errors } = parseWithABOM({
    constituents: [{ name: 'lodash', version: '4.17.21', type: 'library', purl: 'pkg:npm/lodash@4.17.21' }]
  });
  assert(!hasError(errors, 'INVALID_PURL'), 'Should NOT produce INVALID_PURL for valid purl');
});

// ── 6. Revoked trust_tier produces hard ABOM_REVOKED error ───────────────────
test('revoked trust_tier produces ABOM_REVOKED_CONSTITUENT error', () => {
  const { errors } = parseWithABOM({
    constituents: [{
      name: 'evil-model',
      version: '1.0',
      type: 'model',
      purl: 'pkg:openai/evil-model@1.0',
      trust_tier: 'revoked'
    }]
  });
  assert(hasError(errors, 'ABOM_REVOKED_CONSTITUENT'), 'Expected ABOM_REVOKED_CONSTITUENT hard error');
});

// ── 7. Unverified trust_tier produces warning ─────────────────────────────────
test('unverified trust_tier produces ABOM_UNVERIFIED_CONSTITUENT warning', () => {
  const { errors, warnings } = parseWithABOM({
    constituents: [{
      name: 'some-model',
      version: '1.0',
      type: 'model',
      purl: 'pkg:hf/some-model@1.0',
      trust_tier: 'unverified'
    }]
  });
  assert(!hasError(errors, 'ABOM_REVOKED_CONSTITUENT'), 'Unverified should NOT be a hard error');
  assert(hasWarning(warnings, 'ABOM_UNVERIFIED_CONSTITUENT'), 'Expected ABOM_UNVERIFIED_CONSTITUENT warning');
});

// ── 8. Revoked security_status produces hard error ────────────────────────────
test('revoked security_status produces ABOM_REVOKED_CONSTITUENT error', () => {
  const { errors } = parseWithABOM({
    constituents: [{
      name: 'bad-lib',
      version: '0.1',
      type: 'library',
      purl: 'pkg:npm/bad-lib@0.1',
      security_status: 'revoked'
    }]
  });
  assert(hasError(errors, 'ABOM_REVOKED_CONSTITUENT'), 'Expected ABOM_REVOKED_CONSTITUENT for revoked security_status');
});

// ── 9. Vulnerable security_status produces warning ───────────────────────────
test('vulnerable security_status produces ABOM_VULNERABLE_CONSTITUENT warning', () => {
  const { errors, warnings } = parseWithABOM({
    constituents: [{
      name: 'old-lib',
      version: '1.0',
      type: 'library',
      purl: 'pkg:npm/old-lib@1.0',
      security_status: 'vulnerable'
    }]
  });
  assert(!hasError(errors, 'ABOM_REVOKED_CONSTITUENT'), 'Vulnerable should NOT be a hard error');
  assert(hasWarning(warnings, 'ABOM_VULNERABLE_CONSTITUENT'), 'Expected ABOM_VULNERABLE_CONSTITUENT warning');
});

// ── 10. Verified without integrity_hash produces warning ─────────────────────
test('verified trust_tier without integrity_hash produces ABOM_VERIFIED_WITHOUT_HASH warning', () => {
  const { errors, warnings } = parseWithABOM({
    constituents: [{
      name: 'gpt-4o',
      version: '2024',
      type: 'model',
      purl: 'pkg:openai/gpt-4o@2024',
      trust_tier: 'verified'
      // no integrity_hash
    }]
  });
  assert(hasWarning(warnings, 'ABOM_VERIFIED_WITHOUT_HASH'), 'Expected ABOM_VERIFIED_WITHOUT_HASH warning');
});

// ── 11. Invalid integrity_hash format ────────────────────────────────────────
test('invalid integrity_hash format produces INVALID_INTEGRITY_HASH error', () => {
  const { errors } = parseWithABOM({
    constituents: [{
      name: 'gpt-4o',
      version: '2024',
      type: 'model',
      purl: 'pkg:openai/gpt-4o@2024',
      integrity_hash: 'not-valid'
    }]
  });
  assert(hasError(errors, 'INVALID_INTEGRITY_HASH'), 'Expected INVALID_INTEGRITY_HASH error');
});

// ── 12. Valid integrity_hash format passes ────────────────────────────────────
test('valid integrity_hash format passes', () => {
  const { errors } = parseWithABOM({
    constituents: [{
      name: 'gpt-4o',
      version: '2024',
      type: 'model',
      purl: 'pkg:openai/gpt-4o@2024',
      integrity_hash: 'sha256:' + 'abc123'.repeat(10) + 'ab'
    }]
  });
  assert(!hasError(errors, 'INVALID_INTEGRITY_HASH'), 'Valid hash should not produce error');
});

// ── 13. ABOM without constituents produces warning (not error) ────────────────
test('abom without constituents produces ABOM_EMPTY warning, not error', () => {
  const { errors, warnings } = parseWithABOM({});
  assert(!hasError(errors, 'ABOM_EMPTY'), 'No constituents should be a warning, not an error');
  assert(hasWarning(warnings, 'ABOM_EMPTY'), 'Expected ABOM_EMPTY warning');
});

// ── 14. Invalid spec_version type ────────────────────────────────────────────
test('numeric spec_version produces INVALID_TYPE error', () => {
  const { errors } = parseWithABOM({ spec_version: 1, constituents: [] });
  assert(hasError(errors, 'INVALID_TYPE'), 'Expected INVALID_TYPE for numeric spec_version');
});

// ── 15. abomSummary() counts correctly ───────────────────────────────────────
test('abomSummary returns correct counts', async () => {
  const parser = makeParser();
  const agent = {
    data: {
      abom: {
        constituents: [
          { name: 'a', trust_tier: 'verified',   integrity_hash: 'sha256:' + 'a'.repeat(64), security_status: 'clean' },
          { name: 'b', trust_tier: 'unverified',  security_status: 'vulnerable' },
          { name: 'c', trust_tier: 'community',   security_status: 'clean' },
          { name: 'd', trust_tier: 'revoked',     security_status: 'revoked' }
        ]
      }
    },
    warnings: []
  };
  // Import abomSummary by instantiating AIXAgent
  const { AIXAgent } = await import('../core/parser.js');
  const inst = new AIXAgent(agent.data, []);
  const s = inst.abomSummary();
  assert(s.total === 4,       `total=${s.total} expected 4`);
  assert(s.verified === 1,    `verified=${s.verified} expected 1`);
  assert(s.unverified === 1,  `unverified=${s.unverified} expected 1`);
  assert(s.revoked === 1,     `revoked=${s.revoked} expected 1`);
  assert(s.vulnerable === 1,  `vulnerable=${s.vulnerable} expected 1`);
  assert(s.missing_hash === 3, `missing_hash=${s.missing_hash} expected 3`);
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n── Results: ${results.passed}/${results.total} passed, ${results.failed} failed ──\n`);
if (results.failed > 0) process.exit(1);
