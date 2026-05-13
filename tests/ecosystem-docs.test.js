/**
 * Ecosystem Documentation Tests
 *
 * Validates the files added/modified/deleted in the Echo369 satellite-layer PR:
 *   - AGENTS.md (new)
 *   - AIX_STACK_VERSIONING.md (new)
 *   - assets/aix-footer-quote-v2.svg (new)
 *   - assets/aix-stack-diagram-v2.svg (new)
 *   - assets/aix-stack-header-v2.svg (new)
 *   - AXIOM.md §4.5 (modified - satellite-layer doctrine added)
 *   - README.md (modified - v2 assets, Echo369 badges, L0-L6 nav)
 *   - scripts/smoke.mjs (deleted)
 *   - .github/workflows/smoke-gate.yml (deleted)
 *   - docs/RELEASE-NOTES-baseline-v0.369.0.md (deleted)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Helpers

function repoPath(...parts) {
  return resolve(REPO, ...parts);
}

function readText(relPath) {
  return readFileSync(repoPath(relPath), 'utf8');
}

function fileExists(relPath) {
  return existsSync(repoPath(relPath));
}

// ---------------------------------------------------------------------------

describe('PR Changes: File Existence', () => {
  describe('New files must exist', () => {
    it('AGENTS.md is present', () => {
      expect(fileExists('AGENTS.md')).toBe(true);
    });

    it('AIX_STACK_VERSIONING.md is present', () => {
      expect(fileExists('AIX_STACK_VERSIONING.md')).toBe(true);
    });

    it('assets/aix-footer-quote-v2.svg is present', () => {
      expect(fileExists('assets/aix-footer-quote-v2.svg')).toBe(true);
    });

    it('assets/aix-stack-diagram-v2.svg is present', () => {
      expect(fileExists('assets/aix-stack-diagram-v2.svg')).toBe(true);
    });

    it('assets/aix-stack-header-v2.svg is present', () => {
      expect(fileExists('assets/aix-stack-header-v2.svg')).toBe(true);
    });
  });

  describe('Deleted files must not exist', () => {
    it('scripts/smoke.mjs has been removed', () => {
      expect(fileExists('scripts/smoke.mjs')).toBe(false);
    });

    it('.github/workflows/smoke-gate.yml has been removed', () => {
      expect(fileExists('.github/workflows/smoke-gate.yml')).toBe(false);
    });

    it('docs/RELEASE-NOTES-baseline-v0.369.0.md has been removed', () => {
      expect(fileExists('docs/RELEASE-NOTES-baseline-v0.369.0.md')).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------

describe('AGENTS.md: content validation', () => {
  let content;

  beforeAll(() => {
    content = readText('AGENTS.md');
  });

  it('declares aix-format as L1 of the AIX Sovereign Stack', () => {
    expect(content).toContain('aix-format');
    expect(content).toContain('L1');
  });

  it('names the current stack codename as Echo369', () => {
    expect(content).toContain('Echo369');
  });

  it('names the current spec ID as AIX/1.0', () => {
    expect(content).toContain('AIX/1.0');
  });

  it('states AIX_PROTOCOL_VERSION = "0.369.0"', () => {
    expect(content).toContain('0.369.0');
    expect(content).toContain('AIX_PROTOCOL_VERSION');
  });

  it('has a Repository overview section', () => {
    expect(content).toMatch(/## Repository overview/);
  });

  it('has a Conventions section', () => {
    expect(content).toMatch(/## Conventions/);
  });

  it('has a Sovereign / protected paths section', () => {
    expect(content).toMatch(/## Sovereign \/ protected paths/);
  });

  it('has a Commands section', () => {
    expect(content).toMatch(/## Commands/);
  });

  it('has a Testing rules section', () => {
    expect(content).toMatch(/## Testing rules/);
  });

  it('has a Codegen rules section', () => {
    expect(content).toMatch(/## Codegen rules/);
  });

  it('has a Cross-stack awareness section', () => {
    expect(content).toMatch(/## Cross-stack awareness/);
  });

  it('references AXIOM.md as the stack-wide constitution', () => {
    expect(content).toContain('AXIOM.md');
  });

  it('references AIX_STACK_VERSIONING.md', () => {
    expect(content).toContain('AIX_STACK_VERSIONING.md');
  });

  it('lists all three Sovereign Stack layers (L1, L2, L3)', () => {
    expect(content).toContain('L2');
    expect(content).toContain('L3');
    expect(content).toContain('iqra');
    expect(content).toContain('aix-agent-skills');
  });

  it('references §4.5 (Extended Ecosystem · Satellite Layers)', () => {
    expect(content).toContain('§4.5');
  });

  it('lists the three satellite repos', () => {
    expect(content).toContain('AlphaAxiom');
    expect(content).toContain('PiWorker-OS');
    expect(content).toContain('GemClaw');
  });

  it('lists Apache-2.0 as the required license', () => {
    expect(content).toContain('Apache-2.0');
  });

  it('enforces kebab-case branch convention', () => {
    expect(content).toContain('kebab-case');
  });

  it('enforces Conventional Commits', () => {
    expect(content).toMatch(/Conventional Commits/i);
  });

  it('mentions the AIX_FORMAT_VERSION constant location', () => {
    expect(content).toContain('AIX_FORMAT_VERSION');
    expect(content).toContain('@axiom/schema/version');
  });

  it('lists protected paths including AXIOM.md and AIX_STACK_VERSIONING.md', () => {
    // Both must appear in the protected paths section
    const protectedSection = content.split('## Sovereign / protected paths')[1];
    expect(protectedSection).toContain('AXIOM.md');
    expect(protectedSection).toContain('AIX_STACK_VERSIONING.md');
  });

  it('prohibits running pnpm audit fix --force', () => {
    expect(content).toContain('pnpm audit fix --force');
    // Must appear in a prohibition context (do not / never)
    expect(content).toMatch(/Do not run.*pnpm audit fix --force/i);
  });

  it('prohibits hand-editing types.gen.ts', () => {
    expect(content).toContain('types.gen.ts');
    expect(content).toMatch(/Never hand-edit.*types\.gen\.ts/);
  });

  it('requires satellite repos to declare aix.stackVersion', () => {
    expect(content).toContain('aix.stackVersion');
  });
});

// ---------------------------------------------------------------------------

describe('AIX_STACK_VERSIONING.md: content validation', () => {
  let content;

  beforeAll(() => {
    content = readText('AIX_STACK_VERSIONING.md');
  });

  it('has a title declaring independent SemVer and Echo369 codenames', () => {
    expect(content).toContain('Independent SemVer');
    expect(content).toContain('Echo369');
  });

  it('has all 8 numbered sections', () => {
    for (let i = 1; i <= 8; i++) {
      expect(content).toMatch(new RegExp(`^## ${i}\\.`, 'm'));
    }
  });

  it('states the core doctrine: independent SemVer per repo', () => {
    expect(content).toMatch(/strict SemVer 2\.0\.0/);
  });

  it('names the current codename as Echo369 and spec as AIX/1.0', () => {
    expect(content).toContain('Echo369');
    expect(content).toContain('AIX/1.0');
  });

  it('states the AIX_PROTOCOL_VERSION anchor is "0.369.0"', () => {
    expect(content).toMatch(/AIX_PROTOCOL_VERSION\s*=\s*["']0\.369\.0["']/);
  });

  it('defines the three version surfaces (§3)', () => {
    expect(content).toMatch(/##\s*3\.\s*The three version surfaces/);
    expect(content).toContain('3.1');
    expect(content).toContain('3.2');
    expect(content).toContain('3.3');
  });

  it('defines the aix metadata block with all required fields', () => {
    expect(content).toContain('stackVersion');
    expect(content).toContain('stackCodename');
    expect(content).toContain('"spec"');
    expect(content).toContain('"layer"');
    expect(content).toContain('"authority"');
  });

  it('shows axiomid.app as the authority in the example metadata block', () => {
    expect(content).toContain('"authority": "axiomid.app"');
  });

  it('defines the codename roadmap table (§4)', () => {
    expect(content).toMatch(/##\s*4\.\s*The codename roadmap/);
    expect(content).toContain('Echo369');
    expect(content).toContain('Resonance');
    expect(content).toContain('Sovereignty');
  });

  it('maps Echo369 to AIX/1.0 in the codename roadmap', () => {
    // Should have a table row linking Echo369 to AIX/1.0
    const roadmapSection = content.split('## 4.')[1].split('## 5.')[0];
    expect(roadmapSection).toContain('Echo369');
    expect(roadmapSection).toContain('AIX/1.0');
  });

  it('maps Resonance to AIX/2.0 in the codename roadmap', () => {
    const roadmapSection = content.split('## 4.')[1].split('## 5.')[0];
    expect(roadmapSection).toContain('Resonance');
    expect(roadmapSection).toContain('AIX/2.0');
  });

  it('maps Sovereignty to AIX/3.0 in the codename roadmap', () => {
    const roadmapSection = content.split('## 4.')[1].split('## 5.')[0];
    expect(roadmapSection).toContain('Sovereignty');
    expect(roadmapSection).toContain('AIX/3.0');
  });

  it('lists all seven sacred constants in §6', () => {
    const section6 = content.split('## 6.')[1];
    expect(section6).toContain('THREE=3');
    expect(section6).toContain('SABEEN=7');
    expect(section6).toContain('NINE=9');
    expect(section6).toContain('NINETEEN=19');
    expect(section6).toContain('ARBAUN=40');
    expect(section6).toContain('FORTY_NINE=49');
    expect(section6).toContain('THREE_SIXTY_NINE=369');
  });

  it('states the 369 motif is NOT encoded in per-repo package.json version (§6)', () => {
    const section6 = content.split('## 6.')[1];
    expect(section6).toMatch(/not.*encoded.*every repo.*package\.json|not.*bleed.*version/is);
  });

  it('provides a migration guide for satellite repos (§7)', () => {
    expect(content).toMatch(/##\s*7\.\s*Migration guide for satellite repos/);
    const section7 = content.split('## 7.')[1];
    // Must list all three satellite repos as examples
    expect(section7).toContain('AlphaAxiom');
    expect(section7).toContain('PiWorker-OS');
    expect(section7).toContain('GemClaw');
  });

  it('migration guide requires adding the aix metadata block (§7)', () => {
    const section7 = content.split('## 7.')[1];
    expect(section7).toContain('stackVersion');
    expect(section7).toContain('stackCodename');
  });

  it('closing rule falls back to strict SemVer 2.0.0 (§8)', () => {
    expect(content).toMatch(/##\s*8\.\s*The closing rule/);
    const section8 = content.split('## 8.')[1];
    expect(section8).toMatch(/strict SemVer 2\.0\.0/);
  });

  it('closing footer cites axiomid.app as L1 protocol in Echo369 window', () => {
    expect(content).toContain('axiomid.app');
    expect(content).toContain('L1 protocol');
    expect(content).toContain('Echo369 release window');
  });

  it('rejects lockstep SemVer bumps for cosmetic reasons (§5)', () => {
    const section5 = content.split('## 5.')[1].split('## 6.')[0];
    expect(section5).toMatch(/MUST NOT.*(?:bump.*lockstep|cosmetic)/i);
  });
});

// ---------------------------------------------------------------------------

describe('AXIOM.md §4.5: Extended Ecosystem · Satellite Layers (new section)', () => {
  let content;

  beforeAll(() => {
    content = readText('AXIOM.md');
  });

  it('contains the new §4.5 section heading', () => {
    expect(content).toContain('## 4.5 Extended Ecosystem · Satellite Layers');
  });

  it('defines L0 as axiomid-project Root Authority', () => {
    const section45 = content.split('## 4.5')[1];
    expect(section45).toContain('L0');
    expect(section45).toContain('axiomid-project');
    expect(section45).toMatch(/Root [Aa]uthority/);
  });

  it('defines L4 as AlphaAxiom (trading satellite)', () => {
    const section45 = content.split('## 4.5')[1].split('## 5.')[0];
    expect(section45).toContain('L4');
    expect(section45).toContain('AlphaAxiom');
  });

  it('defines L5 as PiWorker-OS (Pi-Network satellite)', () => {
    const section45 = content.split('## 4.5')[1].split('## 5.')[0];
    expect(section45).toContain('L5');
    expect(section45).toContain('PiWorker-OS');
  });

  it('defines L6 as GemClaw (voice satellite)', () => {
    const section45 = content.split('## 4.5')[1].split('## 5.')[0];
    expect(section45).toContain('L6');
    expect(section45).toContain('GemClaw');
  });

  it('has a §4.5.1 Invariants sub-section with exactly 4 invariants', () => {
    expect(content).toContain('### 4.5.1 Invariants');
    const invariantsSection = content
      .split('### 4.5.1 Invariants')[1]
      .split('### 4.5.2')[0];
    // Four numbered invariants
    expect(invariantsSection).toContain('1. **Dependency direction**');
    expect(invariantsSection).toContain('2. **Money flows upward**');
    expect(invariantsSection).toContain('3. **Identity flows downward**');
    expect(invariantsSection).toContain('4. **Trust flows centrally**');
  });

  it('invariant 1 prohibits reverse imports (stack → satellite)', () => {
    const inv = content.split('### 4.5.1 Invariants')[1].split('### 4.5.2')[0];
    expect(inv).toContain('Reverse imports are forbidden');
  });

  it('invariant 2 specifies money flows from L4/L5/L6 upward into L3', () => {
    const inv = content.split('### 4.5.1 Invariants')[1].split('### 4.5.2')[0];
    expect(inv).toContain('L4/L5/L6');
    expect(inv).toContain('L3');
  });

  it('invariant 3 specifies identity flows downward from L0', () => {
    const inv = content.split('### 4.5.1 Invariants')[1].split('### 4.5.2')[0];
    expect(inv).toContain('L0');
    expect(inv).toContain('did:axiom:axiomid.app:*');
  });

  it('invariant 4 specifies trust mirrors into L2 TrustChain', () => {
    const inv = content.split('### 4.5.1 Invariants')[1].split('### 4.5.2')[0];
    expect(inv).toContain('TrustChain');
    expect(inv).toContain('L2');
  });

  it('has a §4.5.2 What a satellite is not sub-section', () => {
    expect(content).toContain('### 4.5.2 What a satellite is not');
  });

  it('§4.5.2 prohibits satellites from defining new payment rails unilaterally', () => {
    const section = content.split('### 4.5.2')[1].split('### 4.5.3')[0];
    expect(section).toContain('payment rails');
    expect(section).toContain('coordinated PR upstream into L1');
  });

  it('has a §4.5.3 Cross-tier coordination sub-section', () => {
    expect(content).toContain('### 4.5.3 Cross-tier coordination');
  });

  it('§4.5.3 requires coordinated PRs for cross-tier changes', () => {
    const section = content.split('### 4.5.3')[1].split('---')[0];
    expect(section).toContain('coordinated PRs');
  });

  it('§8 THREE_SIXTY_NINE entry now references Echo369 codename', () => {
    // The updated row should mention both "0.369.0" and "Echo369"
    const sacredSection = content.split('## 8.')[1];
    const threeRow = sacredSection
      .split('\n')
      .find(line => line.includes('THREE_SIXTY_NINE'));
    expect(threeRow).toBeTruthy();
    expect(threeRow).toContain('Echo369');
    expect(threeRow).toContain('0.369.0');
  });

  it('§8 closing paragraph notes 369 motif does NOT bleed into consumer-facing versions', () => {
    const sacredSection = content.split('## 8.')[1].split('## 9.')[0];
    expect(sacredSection).toMatch(/does NOT bleed into consumer-facing app versions/i);
    expect(sacredSection).toContain('AIX_STACK_VERSIONING.md');
  });

  it('§6 versioning table now has an Echo369 stack codename row', () => {
    const section6 = content.split('## 6.')[1].split('## 7.')[0];
    expect(section6).toContain('Stack codename');
    expect(section6).toContain('Echo369');
  });

  it('§6 versioning table now has a Stack compatibility row', () => {
    const section6 = content.split('## 6.')[1].split('## 7.')[0];
    expect(section6).toContain('Stack compatibility');
    expect(section6).toContain('aix.stackVersion');
    expect(section6).toContain('aix.stackCodename');
  });

  it('§4 states three Sovereign Stack repos share one codename window (Echo369)', () => {
    const section4 = content.split('## 4. The Stack Layers')[1].split('## 4.5')[0];
    expect(section4).toContain('Echo369');
  });
});

// ---------------------------------------------------------------------------

describe('README.md: content validation', () => {
  let content;

  beforeAll(() => {
    content = readText('README.md');
  });

  it('references the v2 header SVG (not v1)', () => {
    expect(content).toContain('aix-stack-header-v2.svg');
    expect(content).not.toContain('aix-stack-header.svg"');
  });

  it('references the v2 stack diagram SVG (not v1)', () => {
    expect(content).toContain('aix-stack-diagram-v2.svg');
    expect(content).not.toContain('aix-stack-diagram.svg"');
  });

  it('references the v2 footer quote SVG (not v1)', () => {
    expect(content).toContain('aix-footer-quote-v2.svg');
    expect(content).not.toContain('aix-footer-quote.svg"');
  });

  it('has an AIX Stack badge for Echo369', () => {
    expect(content).toContain('Echo369');
    // Badge should appear in the shield badge format
    expect(content).toMatch(/img\.shields\.io\/badge.*Echo369/);
  });

  it('has a Spec badge for AIX/1.0', () => {
    expect(content).toMatch(/img\.shields\.io\/badge.*AIX/);
    expect(content).toContain('AIX%2F1.0');
  });

  it('has a Version badge for v0.369.0', () => {
    expect(content).toContain('v0.369.0');
    expect(content).toMatch(/img\.shields\.io\/badge.*version.*v0\.369\.0/);
  });

  it('has a L0 root authority navigation link to axiomid-project', () => {
    expect(content).toContain('axiomid-project');
    expect(content).toContain('L0');
  });

  it('has L4 satellite navigation link to AlphaAxiom', () => {
    expect(content).toContain('AlphaAxiom');
    expect(content).toContain('L4');
  });

  it('has L5 satellite navigation link to PiWorker-OS', () => {
    expect(content).toContain('PiWorker-OS');
    expect(content).toContain('L5');
  });

  it('has L6 satellite navigation link to GemClaw', () => {
    expect(content).toContain('GemClaw');
    expect(content).toContain('L6');
  });

  it('credits section states 5 AI agents (not 9)', () => {
    // Updated from "9 AI Agents" to "5 AI Agents"
    expect(content).toMatch(/5 AI Agents/);
    expect(content).not.toMatch(/9 AI Agents/);
  });

  it('has the cross-stack YOU ARE HERE nav row for L1', () => {
    expect(content).toContain('YOU ARE HERE');
    expect(content).toContain('L1');
  });

  it('describes extended ecosystem with root authority and satellite layers', () => {
    expect(content).toContain('root authority');
    expect(content).toContain('satellite layers');
  });

  it('references AIX_STACK_VERSIONING.md for the versioning doctrine', () => {
    expect(content).toContain('AIX_STACK_VERSIONING.md');
  });

  it('references AXIOM.md §4.5 for satellite layer doctrine', () => {
    expect(content).toContain('AXIOM.md');
    expect(content).toContain('§4.5');
  });

  it('topology section mentions genus 0 tree invariant', () => {
    expect(content).toContain('Genus 0');
  });

  it('versioning at a glance section names current window as Echo369', () => {
    const versionSection = content.split('Versioning at a glance')[1]?.split('---')[0];
    expect(versionSection).toContain('Echo369');
    expect(versionSection).toContain('AIX/1.0');
  });

  it('Extended Ecosystem table includes all four tiers (L0, L4, L5, L6)', () => {
    const ecoSection = content.split('Extended Ecosystem')[1]?.split('---')[0];
    expect(ecoSection).toContain('L0');
    expect(ecoSection).toContain('L4');
    expect(ecoSection).toContain('L5');
    expect(ecoSection).toContain('L6');
  });
});

// ---------------------------------------------------------------------------

describe('SVG Assets: structural validation', () => {
  describe('aix-footer-quote-v2.svg', () => {
    let content;

    beforeAll(() => {
      content = readText('assets/aix-footer-quote-v2.svg');
    });

    it('is a well-formed SVG element with correct dimensions (900×240)', () => {
      expect(content).toMatch(/<svg\s[^>]*width="900"/);
      expect(content).toMatch(/<svg\s[^>]*height="240"/);
    });

    it('declares the SVG namespace', () => {
      expect(content).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('has a pattern element with id cfFooterV2', () => {
      expect(content).toContain('id="cfFooterV2"');
    });

    it('has a linearGradient element with id footerAccentV2', () => {
      expect(content).toContain('id="footerAccentV2"');
    });

    it('references the ECHO369 codename in visible text', () => {
      expect(content).toContain('ECHO369');
    });

    it('references the AIX/1.0 spec', () => {
      expect(content).toContain('AIX/1.0');
    });

    it('lists all four stack tiers in the layer legend (L0-L3)', () => {
      expect(content).toContain('L0 axiomid');
      expect(content).toContain('L1 aix-format');
      expect(content).toContain('L2 iqra');
      expect(content).toContain('L3 aix-agent-skills');
    });

    it('mentions satellite repos in the footer legend', () => {
      expect(content).toContain('alphaaxiom');
      expect(content).toContain('piworker-os');
      expect(content).toContain('gemclaw');
    });

    it('uses neon green (#39FF14) as the brand accent colour', () => {
      expect(content).toContain('#39FF14');
    });

    it('has an animated pulse circle', () => {
      expect(content).toContain('<animate');
      expect(content).toContain('attributeName="opacity"');
    });

    it('has a <defs> block containing the pattern and gradient', () => {
      expect(content).toContain('<defs>');
    });

    it('closes the SVG element', () => {
      expect(content.trimEnd()).toMatch(/<\/svg>$/);
    });
  });

  describe('aix-stack-header-v2.svg', () => {
    let content;

    beforeAll(() => {
      content = readText('assets/aix-stack-header-v2.svg');
    });

    it('is a well-formed SVG element with correct dimensions (1100×340)', () => {
      expect(content).toMatch(/<svg\s[^>]*width="1100"/);
      expect(content).toMatch(/<svg\s[^>]*height="340"/);
    });

    it('declares the SVG namespace', () => {
      expect(content).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('has a pattern element with id cfHeaderV2', () => {
      expect(content).toContain('id="cfHeaderV2"');
    });

    it('has a linearGradient element with id topAccentV2', () => {
      expect(content).toContain('id="topAccentV2"');
    });

    it('references the ECHO369 codename in visible text', () => {
      expect(content).toContain('ECHO369');
    });

    it('references the AIX/1.0 spec', () => {
      expect(content).toContain('AIX/1.0');
    });

    it('shows the L0 Root Authority (AXIOMID-PROJECT)', () => {
      expect(content).toContain('ROOT AUTHORITY');
      expect(content).toContain('L0');
      expect(content).toContain('AXIOMID-PROJECT');
    });

    it('shows all three Sovereign Core layers (L1, L2, L3)', () => {
      expect(content).toContain('L1');
      expect(content).toContain('AIX-FORMAT');
      expect(content).toContain('L2');
      expect(content).toContain('IQRA');
      expect(content).toContain('L3');
      expect(content).toContain('AGENT-SKILLS');
    });

    it('shows all three Satellite layers (L4, L5, L6)', () => {
      expect(content).toContain('L4');
      expect(content).toContain('ALPHAAXIOM');
      expect(content).toContain('L5');
      expect(content).toContain('PIWORKER-OS');
      expect(content).toContain('L6');
      expect(content).toContain('GEMCLAW');
    });

    it('uses neon green (#39FF14) as brand accent', () => {
      expect(content).toContain('#39FF14');
    });

    it('uses gold (#FFD700) for the root authority highlight', () => {
      expect(content).toContain('#FFD700');
    });

    it('has a live pulse animation', () => {
      expect(content).toContain('<animate');
      expect(content).toContain('LIVE');
    });

    it('closes the SVG element', () => {
      expect(content.trimEnd()).toMatch(/<\/svg>$/);
    });
  });

  describe('aix-stack-diagram-v2.svg', () => {
    let content;

    beforeAll(() => {
      content = readText('assets/aix-stack-diagram-v2.svg');
    });

    it('is a well-formed SVG element with correct dimensions (1100×560)', () => {
      expect(content).toMatch(/<svg\s[^>]*width="1100"/);
      expect(content).toMatch(/<svg\s[^>]*height="560"/);
    });

    it('declares the SVG namespace', () => {
      expect(content).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('has a pattern element with id cfDiagV2', () => {
      expect(content).toContain('id="cfDiagV2"');
    });

    it('references the ECHO369 codename in visible text', () => {
      expect(content).toContain('ECHO369');
    });

    it('references the AIX/1.0 spec', () => {
      expect(content).toContain('AIX/1.0');
    });

    it('names the authority as axiomid.app', () => {
      expect(content).toContain('axiomid.app');
    });

    it('shows the L0 Root Authority (AXIOMID-PROJECT)', () => {
      expect(content).toContain('ROOT AUTHORITY');
      expect(content).toContain('L0');
      expect(content).toContain('AXIOMID-PROJECT');
    });

    it('shows all three Sovereign Core layers (L1, L2, L3)', () => {
      expect(content).toContain('L1 · PROTOCOL');
      expect(content).toContain('AIX-FORMAT');
      expect(content).toContain('L2 · RUNTIME');
      expect(content).toContain('IQRA');
      expect(content).toContain('L3 · MARKETPLACE');
      expect(content).toContain('AGENT-SKILLS');
    });

    it('shows all three Satellite layers (L4, L5, L6)', () => {
      expect(content).toContain('L4 · SATELLITE');
      expect(content).toContain('ALPHAAXIOM');
      expect(content).toContain('L5 · SATELLITE');
      expect(content).toContain('PIWORKER-OS');
      expect(content).toContain('L6 · SATELLITE');
      expect(content).toContain('GEMCLAW');
    });

    it('has identity flow arrows from L0 downward', () => {
      expect(content).toContain('identity flows down');
    });

    it('has money flow arrows from satellites upward', () => {
      expect(content).toContain('buys skills');
    });

    it('includes the topology invariants legend', () => {
      expect(content).toContain('TOPOLOGICAL INVARIANTS');
      expect(content).toContain('money');
      expect(content).toContain('identity');
      expect(content).toContain('trust');
    });

    it('states the tree topology constraint (genus 0, χ = +1)', () => {
      expect(content).toContain('genus 0');
      expect(content).toContain('tree-shaped');
      expect(content).toContain('χ = +1');
    });

    it('uses gold (#FFD700) for the root authority', () => {
      expect(content).toContain('#FFD700');
    });

    it('uses neon green (#39FF14) for the sovereign core layers', () => {
      expect(content).toContain('#39FF14');
    });

    it('closes the SVG element', () => {
      expect(content.trimEnd()).toMatch(/<\/svg>$/);
    });
  });
});

// ---------------------------------------------------------------------------

describe('Cross-file consistency: Echo369 and AIX/1.0 doctrine', () => {
  let agents, versioning, axiom, readme, footerSvg, headerSvg, diagramSvg;

  beforeAll(() => {
    agents = readText('AGENTS.md');
    versioning = readText('AIX_STACK_VERSIONING.md');
    axiom = readText('AXIOM.md');
    readme = readText('README.md');
    footerSvg = readText('assets/aix-footer-quote-v2.svg');
    headerSvg = readText('assets/aix-stack-header-v2.svg');
    diagramSvg = readText('assets/aix-stack-diagram-v2.svg');
  });

  it('Echo369 codename appears in all new/modified documentation files', () => {
    expect(agents).toContain('Echo369');
    expect(versioning).toContain('Echo369');
    expect(axiom).toContain('Echo369');
    expect(readme).toContain('Echo369');
  });

  it('Echo369 codename appears in all three new SVG assets', () => {
    // SVGs use uppercase ECHO369 in their text elements
    expect(footerSvg).toContain('ECHO369');
    expect(headerSvg).toContain('ECHO369');
    expect(diagramSvg).toContain('ECHO369');
  });

  it('AIX/1.0 spec ID appears in all new/modified documentation files', () => {
    expect(agents).toContain('AIX/1.0');
    expect(versioning).toContain('AIX/1.0');
    expect(axiom).toContain('AIX/1.0');
  });

  it('AIX/1.0 spec ID appears in all three new SVG assets', () => {
    expect(footerSvg).toContain('AIX/1.0');
    expect(headerSvg).toContain('AIX/1.0');
    expect(diagramSvg).toContain('AIX/1.0');
  });

  it('protocol version 0.369.0 is consistent across AGENTS.md and AIX_STACK_VERSIONING.md', () => {
    expect(agents).toContain('0.369.0');
    expect(versioning).toContain('0.369.0');
  });

  it('axiomid.app authority is consistent across AGENTS.md, AIX_STACK_VERSIONING.md, AXIOM.md, and the diagram SVG', () => {
    expect(agents).toContain('axiomid.app');
    expect(versioning).toContain('axiomid.app');
    expect(axiom).toContain('axiomid.app');
    expect(diagramSvg).toContain('axiomid.app');
  });

  it('all four satellite/root-tier repos (axiomid-project, AlphaAxiom, PiWorker-OS, GemClaw) appear in AXIOM.md §4.5', () => {
    const section45 = axiom.split('## 4.5')[1].split('## 5.')[0];
    expect(section45).toContain('axiomid-project');
    expect(section45).toContain('AlphaAxiom');
    expect(section45).toContain('PiWorker-OS');
    expect(section45).toContain('GemClaw');
  });

  it('all satellite repos appear in the README Extended Ecosystem table', () => {
    expect(readme).toContain('axiomid-project');
    expect(readme).toContain('AlphaAxiom');
    expect(readme).toContain('PiWorker-OS');
    expect(readme).toContain('GemClaw');
  });

  it('the layer numbering (L0-L6) is consistent across AXIOM.md, README.md, and SVGs', () => {
    // L0 through L6 must appear in each document that talks about the extended ecosystem
    for (const doc of [axiom, readme]) {
      expect(doc).toContain('L0');
      expect(doc).toContain('L4');
      expect(doc).toContain('L5');
      expect(doc).toContain('L6');
    }
    for (const svg of [headerSvg, diagramSvg]) {
      expect(svg).toContain('L0');
      expect(svg).toContain('L4');
      expect(svg).toContain('L5');
      expect(svg).toContain('L6');
    }
  });

  it('the neon green brand colour #39FF14 is used consistently across all three SVGs', () => {
    expect(footerSvg).toContain('#39FF14');
    expect(headerSvg).toContain('#39FF14');
    expect(diagramSvg).toContain('#39FF14');
  });

  it('AGENTS.md references AIX_STACK_VERSIONING.md and AIX_STACK_VERSIONING.md references AXIOM.md (bidirectional cross-refs intact)', () => {
    expect(agents).toContain('AIX_STACK_VERSIONING.md');
    expect(versioning).toContain('AXIOM.md');
  });

  it('Apache-2.0 license requirement is stated in AGENTS.md and AXIOM.md', () => {
    expect(agents).toContain('Apache-2.0');
    expect(axiom).toContain('Apache-2.0');
  });
});

// ---------------------------------------------------------------------------

describe('Deleted smoke infrastructure: regression guard', () => {
  it('scripts/smoke.mjs was intentionally removed and must not be recreated without review', () => {
    // This test documents the intentional removal.
    // If smoke.mjs is accidentally re-added, this test will fail,
    // alerting the team to revisit the decision.
    expect(fileExists('scripts/smoke.mjs')).toBe(false);
  });

  it('.github/workflows/smoke-gate.yml was intentionally removed and must not be recreated without review', () => {
    expect(fileExists('.github/workflows/smoke-gate.yml')).toBe(false);
  });

  it('docs/RELEASE-NOTES-baseline-v0.369.0.md was intentionally archived and must not be recreated without review', () => {
    expect(fileExists('docs/RELEASE-NOTES-baseline-v0.369.0.md')).toBe(false);
  });

  it('smoke-gate.yml is not present in the .github/workflows directory', () => {
    const workflowsDir = repoPath('.github/workflows');
    if (!existsSync(workflowsDir)) return; // no workflows dir at all is also fine
    const workflows = readdirSync(workflowsDir);
    expect(workflows).not.toContain('smoke-gate.yml');
  });
});
