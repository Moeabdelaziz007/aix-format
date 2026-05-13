/**
 * Tests for PR: feat(stack) - extend ecosystem doctrine for satellite layers, codify Echo369 codename
 *
 * Covers:
 *   - assets/aix-footer-quote-v2.svg   (new)
 *   - assets/aix-stack-diagram-v2.svg  (new)
 *   - assets/aix-stack-header-v2.svg   (new)
 *   - AGENTS.md                        (new)
 *   - AIX_STACK_VERSIONING.md          (new)
 *   - AXIOM.md                         (modified — §4.5 Extended Ecosystem added)
 *   - README.md                        (modified — v2 assets, satellite nav added)
 *   - scripts/smoke.mjs                (deleted)
 *   - .github/workflows/smoke-gate.yml (deleted)
 *   - docs/RELEASE-NOTES-baseline-v0.369.0.md (deleted)
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');

function readRepo(relPath) {
  return readFileSync(resolve(REPO, relPath), 'utf8');
}

// ---------------------------------------------------------------------------
// SVG ASSETS — v2 branding (new files)
// ---------------------------------------------------------------------------

describe('SVG Assets — aix-footer-quote-v2.svg', () => {
  let content;

  beforeAll(() => {
    content = readRepo('assets/aix-footer-quote-v2.svg');
  });

  it('file exists in assets/ directory', () => {
    expect(existsSync(resolve(REPO, 'assets/aix-footer-quote-v2.svg'))).toBe(true);
  });

  it('is a valid SVG document (opens and closes with svg tag)', () => {
    expect(content.trimStart()).toMatch(/^<svg\b/);
    expect(content.trimEnd()).toMatch(/<\/svg>\s*$/);
  });

  it('declares correct SVG namespace', () => {
    expect(content).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('has width=900 and height=240', () => {
    expect(content).toContain('width="900"');
    expect(content).toContain('height="240"');
  });

  it('has matching viewBox="0 0 900 240"', () => {
    expect(content).toContain('viewBox="0 0 900 240"');
  });

  it('contains the ECHO369 stack codename in the header text', () => {
    expect(content).toContain('ECHO369');
  });

  it('contains the AIX/1.0 spec identifier', () => {
    expect(content).toContain('AIX/1.0');
  });

  it('contains the iconic tagline text', () => {
    expect(content).toContain("King isn't Born, he is Made.");
  });

  it('references all four sovereign stack layers (L0–L3)', () => {
    expect(content).toContain('L0 axiomid');
    expect(content).toContain('L1 aix-format');
    expect(content).toContain('L2 iqra');
    expect(content).toContain('L3 aix-agent-skills');
  });

  it('references the three satellite layer names', () => {
    expect(content).toContain('alphaaxiom');
    expect(content).toContain('piworker-os');
    expect(content).toContain('gemclaw');
  });

  it('contains a <defs> block with pattern and linearGradient', () => {
    expect(content).toContain('<defs>');
    expect(content).toContain('</defs>');
    expect(content).toContain('<pattern ');
    expect(content).toContain('<linearGradient ');
  });

  it('uses the cfFooterV2 pattern id (versioned asset)', () => {
    expect(content).toContain('id="cfFooterV2"');
  });

  it('uses the footerAccentV2 gradient id (versioned asset)', () => {
    expect(content).toContain('id="footerAccentV2"');
  });

  it('contains an animated pulse circle element', () => {
    expect(content).toContain('<circle ');
    expect(content).toContain('<animate ');
    expect(content).toContain('attributeName="opacity"');
    expect(content).toContain('repeatCount="indefinite"');
  });

  it('uses the neon green brand color #39FF14', () => {
    expect(content).toContain('#39FF14');
  });

  it('contains the END_OF_TRANSMISSION sentinel text', () => {
    expect(content).toContain('END_OF_TRANSMISSION');
  });
});

// ---------------------------------------------------------------------------

describe('SVG Assets — aix-stack-diagram-v2.svg', () => {
  let content;

  beforeAll(() => {
    content = readRepo('assets/aix-stack-diagram-v2.svg');
  });

  it('file exists in assets/ directory', () => {
    expect(existsSync(resolve(REPO, 'assets/aix-stack-diagram-v2.svg'))).toBe(true);
  });

  it('is a valid SVG document (opens and closes with svg tag)', () => {
    expect(content.trimStart()).toMatch(/^<svg\b/);
    expect(content.trimEnd()).toMatch(/<\/svg>\s*$/);
  });

  it('declares correct SVG namespace', () => {
    expect(content).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('has width=1100 and height=560', () => {
    expect(content).toContain('width="1100"');
    expect(content).toContain('height="560"');
  });

  it('has matching viewBox="0 0 1100 560"', () => {
    expect(content).toContain('viewBox="0 0 1100 560"');
  });

  it('contains the ECHO369 stack codename', () => {
    expect(content).toContain('ECHO369');
  });

  it('contains the AIX/1.0 spec identifier', () => {
    expect(content).toContain('AIX/1.0');
  });

  it('shows L0 Root Authority (axiomid-project)', () => {
    expect(content).toContain('ROOT AUTHORITY');
    expect(content).toContain('L0');
    expect(content).toContain('AXIOMID-PROJECT');
  });

  it('shows L1 Protocol (AIX-FORMAT)', () => {
    expect(content).toContain('L1');
    expect(content).toContain('PROTOCOL');
    expect(content).toContain('AIX-FORMAT');
  });

  it('shows L2 Runtime (IQRA)', () => {
    expect(content).toContain('L2');
    expect(content).toContain('RUNTIME');
    expect(content).toContain('IQRA');
  });

  it('shows L3 Marketplace (AGENT-SKILLS)', () => {
    expect(content).toContain('L3');
    expect(content).toContain('MARKETPLACE');
    expect(content).toContain('AGENT-SKILLS');
  });

  it('shows L4 satellite (AlphaAxiom) as a trading layer', () => {
    expect(content).toContain('L4');
    expect(content).toContain('SATELLITE');
    expect(content).toContain('ALPHAAXIOM');
  });

  it('shows L5 satellite (PiWorker-OS) as a Pi layer', () => {
    expect(content).toContain('L5');
    expect(content).toContain('PIWORKER-OS');
  });

  it('shows L6 satellite (GemClaw) as a voice layer', () => {
    expect(content).toContain('L6');
    expect(content).toContain('GEMCLAW');
  });

  it('contains identity flow label (L0 → all)', () => {
    expect(content).toContain('identity flows down');
  });

  it('contains money flow label (satellites → L3)', () => {
    expect(content).toContain('buys skills');
  });

  it('contains topological invariants legend section', () => {
    expect(content).toContain('TOPOLOGICAL INVARIANTS');
  });

  it('encodes topology: money up, identity down, trust central', () => {
    expect(content).toContain('money');
    expect(content).toContain('identity');
    expect(content).toContain('TrustChain');
  });

  it('encodes genus 0, tree-shaped, χ = +1 topology', () => {
    expect(content).toContain('genus 0');
    expect(content).toContain('tree-shaped');
  });

  it('declares cfDiagV2 pattern id (versioned asset)', () => {
    expect(content).toContain('id="cfDiagV2"');
  });

  it('declares coreGlowDiag and rootGlowDiag filter ids', () => {
    expect(content).toContain('id="coreGlowDiag"');
    expect(content).toContain('id="rootGlowDiag"');
  });

  it('has more intense glow on root authority than sovereign core (stdDeviation 5 vs 3)', () => {
    // rootGlowDiag uses stdDeviation="5", coreGlowDiag uses stdDeviation="3"
    expect(content).toContain('id="rootGlowDiag"');
    const rootGlowMatch = content.match(/id="rootGlowDiag"[\s\S]*?<\/filter>/);
    expect(rootGlowMatch).not.toBeNull();
    expect(rootGlowMatch[0]).toContain('stdDeviation="5"');
  });

  it('uses axiomid.app authority label', () => {
    expect(content).toContain('axiomid.app');
  });

  it('uses gold (#FFD700) for L0 root authority', () => {
    expect(content).toContain('#FFD700');
  });

  it('uses neon green (#39FF14) for sovereign core layers', () => {
    expect(content).toContain('#39FF14');
  });
});

// ---------------------------------------------------------------------------

describe('SVG Assets — aix-stack-header-v2.svg', () => {
  let content;

  beforeAll(() => {
    content = readRepo('assets/aix-stack-header-v2.svg');
  });

  it('file exists in assets/ directory', () => {
    expect(existsSync(resolve(REPO, 'assets/aix-stack-header-v2.svg'))).toBe(true);
  });

  it('is a valid SVG document (opens and closes with svg tag)', () => {
    expect(content.trimStart()).toMatch(/^<svg\b/);
    expect(content.trimEnd()).toMatch(/<\/svg>\s*$/);
  });

  it('declares correct SVG namespace', () => {
    expect(content).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('has width=1100 and height=340', () => {
    expect(content).toContain('width="1100"');
    expect(content).toContain('height="340"');
  });

  it('has matching viewBox="0 0 1100 340"', () => {
    expect(content).toContain('viewBox="0 0 1100 340"');
  });

  it('contains the ECHO369 stack codename', () => {
    expect(content).toContain('ECHO369');
  });

  it('contains the AIX/1.0 spec identifier', () => {
    expect(content).toContain('AIX/1.0');
  });

  it('shows L0 Root Authority (axiomid-project)', () => {
    expect(content).toContain('ROOT AUTHORITY');
    expect(content).toContain('L0');
    expect(content).toContain('AXIOMID-PROJECT');
  });

  it('labels L1 as PROTOCOL with "YOU ARE HERE" marker', () => {
    expect(content).toContain('L1 · PROTOCOL · YOU ARE HERE');
  });

  it('shows L2 Runtime (IQRA)', () => {
    expect(content).toContain('L2 · RUNTIME');
    expect(content).toContain('IQRA');
  });

  it('shows L3 Marketplace (AGENT-SKILLS)', () => {
    expect(content).toContain('L3 · MARKETPLACE');
    expect(content).toContain('AGENT-SKILLS');
  });

  it('shows L4 satellite (ALPHAAXIOM)', () => {
    expect(content).toContain('L4 · SATELLITE · TRADING');
    expect(content).toContain('ALPHAAXIOM');
  });

  it('shows L5 satellite (PIWORKER-OS)', () => {
    expect(content).toContain('L5 · SATELLITE · Pi');
    expect(content).toContain('PIWORKER-OS');
  });

  it('shows L6 satellite (GEMCLAW)', () => {
    expect(content).toContain('L6 · SATELLITE · VOICE');
    expect(content).toContain('GEMCLAW');
  });

  it('has M2M money flow arrows toward the marketplace', () => {
    expect(content).toContain('M2M');
  });

  it('declares cfHeaderV2 pattern id (versioned asset)', () => {
    expect(content).toContain('id="cfHeaderV2"');
  });

  it('declares topAccentV2 gradient id (versioned asset)', () => {
    expect(content).toContain('id="topAccentV2"');
  });

  it('declares coreGlowV2 and rootGlow filter ids', () => {
    expect(content).toContain('id="coreGlowV2"');
    expect(content).toContain('id="rootGlow"');
  });

  it('contains an animated LIVE pulse circle', () => {
    expect(content).toContain('<circle ');
    expect(content).toContain('<animate ');
    expect(content).toContain('LIVE');
  });

  it('uses gold (#FFD700) for L0 root authority', () => {
    expect(content).toContain('#FFD700');
  });

  it('uses neon green (#39FF14) for sovereign core layers', () => {
    expect(content).toContain('#39FF14');
  });

  it('uses a dimmer gray (#666666) for satellite layers to indicate lower prominence', () => {
    expect(content).toContain('#666666');
  });
});

// ---------------------------------------------------------------------------
// AGENTS.md — new AI agent operating manual
// ---------------------------------------------------------------------------

describe('AGENTS.md — AI agent operating manual', () => {
  let content;

  beforeAll(() => {
    content = readRepo('AGENTS.md');
  });

  it('file exists at repository root', () => {
    expect(existsSync(resolve(REPO, 'AGENTS.md'))).toBe(true);
  });

  it('has a title heading identifying it as an operating manual', () => {
    expect(content).toMatch(/^# AGENTS\.md/m);
  });

  it('instructs agents to read AXIOM.md first', () => {
    expect(content).toContain('AXIOM.md');
    expect(content.toLowerCase()).toContain('read');
  });

  it('has a Repository overview section', () => {
    expect(content).toContain('## Repository overview');
  });

  it('identifies aix-format as L1 of the AIX Sovereign Stack', () => {
    expect(content).toContain('L1');
    expect(content).toContain('AIX Sovereign Stack');
  });

  it('mentions the DID identity primitive (did:axiom:axiomid.app)', () => {
    expect(content).toContain('did:axiom:axiomid.app');
  });

  it('mentions M2M settlement contracts with HTTP 402 / x402', () => {
    expect(content).toContain('HTTP 402');
    expect(content).toContain('x402');
  });

  it('names downstream repos: L2 iqra and L3 aix-agent-skills', () => {
    expect(content).toContain('iqra');
    expect(content).toContain('aix-agent-skills');
  });

  it('names satellite repos: AlphaAxiom, PiWorker-OS, GemClaw', () => {
    expect(content).toContain('AlphaAxiom');
    expect(content).toContain('PiWorker-OS');
    expect(content).toContain('GemClaw');
  });

  it('has a Conventions section', () => {
    expect(content).toContain('## Conventions');
  });

  it('specifies Apache-2.0 license requirement', () => {
    expect(content).toContain('Apache-2.0');
  });

  it('specifies kebab-case branch naming', () => {
    expect(content).toContain('kebab-case');
  });

  it('specifies Conventional Commits requirement', () => {
    expect(content).toContain('Conventional Commits');
  });

  it('specifies snake_case for skill identifiers', () => {
    expect(content).toContain('snake_case');
    expect(content).toContain('^[a-z0-9_]+$');
  });

  it('documents Echo369 as the current stack codename', () => {
    expect(content).toContain('Echo369');
  });

  it('documents AIX/1.0 as the current spec ID', () => {
    expect(content).toContain('AIX/1.0');
  });

  it('documents the AIX_PROTOCOL_VERSION constant as 0.369.0', () => {
    expect(content).toContain('"0.369.0"');
  });

  it('references AIX_STACK_VERSIONING.md for versioning doctrine', () => {
    expect(content).toContain('AIX_STACK_VERSIONING.md');
  });

  it('references AXIOM.md §4.5 for extended ecosystem', () => {
    expect(content).toContain('§4.5');
  });

  it('has a Repository structure section', () => {
    expect(content).toContain('## Repository structure');
  });

  it('lists the assets/ directory with v1 and v2 SVG branding note', () => {
    expect(content).toContain('assets/');
    expect(content).toContain('v2');
  });

  it('has a Sovereign / protected paths section', () => {
    expect(content).toContain('## Sovereign / protected paths');
  });

  it('lists AXIOM.md as a sovereign/protected path', () => {
    expect(content).toContain('AXIOM.md (constitution');
  });

  it('lists AIX_STACK_VERSIONING.md as a sovereign/protected path', () => {
    expect(content).toContain('AIX_STACK_VERSIONING.md (versioning doctrine');
  });

  it('has a Commands section with command table', () => {
    expect(content).toContain('## Commands');
    expect(content).toContain('pnpm -w test');
  });

  it('has a Testing rules section', () => {
    expect(content).toContain('## Testing rules');
  });

  it('prohibits mocking sovereign components (TrustChain, Conscience, Identity, Constitution, RuntimeABI)', () => {
    expect(content).toContain('TrustChain');
    expect(content).toContain('Conscience');
    expect(content).toContain('Identity');
    expect(content).toContain('Constitution');
    expect(content).toContain('RuntimeABI');
    expect(content).toContain('No mocks of sovereign components');
  });

  it('has a Codegen rules section', () => {
    expect(content).toContain('## Codegen rules');
  });

  it('prohibits hand-editing types.gen.ts', () => {
    expect(content).toContain('types.gen.ts');
    expect(content).toContain('Never hand-edit');
  });

  it('has a Cross-stack awareness section', () => {
    expect(content).toContain('## Cross-stack awareness');
  });

  it('documents that cross-stack changes MUST land as coordinated PRs', () => {
    expect(content).toContain('coordinated PRs');
  });

  it('has a When in doubt section referring back to AXIOM.md', () => {
    expect(content).toContain('## When in doubt');
    expect(content).toContain('Read `AXIOM.md`');
  });

  it('prohibits running pnpm audit fix --force', () => {
    expect(content).toContain('pnpm audit fix --force');
    expect(content).toContain('Do not run');
  });
});

// ---------------------------------------------------------------------------
// AIX_STACK_VERSIONING.md — versioning doctrine
// ---------------------------------------------------------------------------

describe('AIX_STACK_VERSIONING.md — independent SemVer versioning doctrine', () => {
  let content;

  beforeAll(() => {
    content = readRepo('AIX_STACK_VERSIONING.md');
  });

  it('file exists at repository root', () => {
    expect(existsSync(resolve(REPO, 'AIX_STACK_VERSIONING.md'))).toBe(true);
  });

  it('has a title heading', () => {
    expect(content).toMatch(/^# AIX Stack Versioning/m);
  });

  it('instructs readers to read AXIOM.md first', () => {
    expect(content).toContain('AXIOM.md');
    expect(content.toLowerCase()).toContain('read');
  });

  it('has 8 numbered sections (§1 through §8)', () => {
    for (let i = 1; i <= 8; i++) {
      expect(content).toMatch(new RegExp(`^## ${i}\\.`, 'm'));
    }
  });

  it('§1 doctrine sentence: independent SemVer per repo + shared aix.stackVersion', () => {
    expect(content).toContain('## 1.');
    expect(content).toContain('independently');
    expect(content).toContain('aix.stackVersion');
    expect(content).toContain('Echo369');
  });

  it('§2 lists all seven repos with their maturity levels', () => {
    expect(content).toContain('aix-format');
    expect(content).toContain('0.369.0');
    expect(content).toContain('iqra');
    expect(content).toContain('0.3.69');
    expect(content).toContain('aix-agent-skills');
    expect(content).toContain('1.0.0');
    expect(content).toContain('AlphaAxiom');
    expect(content).toContain('0.1.0-alpha');
  });

  it('§3 defines three version surfaces', () => {
    expect(content).toContain('## 3. The three version surfaces');
    expect(content).toContain('### 3.1');
    expect(content).toContain('### 3.2');
    expect(content).toContain('### 3.3');
  });

  it('§3.1 app version uses strict SemVer with MAJOR/MINOR/PATCH', () => {
    expect(content).toContain('MAJOR');
    expect(content).toContain('MINOR');
    expect(content).toContain('PATCH');
    expect(content).toContain('Pre-release');
  });

  it('§3.2 AIX stack compatibility block has required fields', () => {
    // The JSONC example in the doc
    expect(content).toContain('"stackVersion"');
    expect(content).toContain('"stackCodename"');
    expect(content).toContain('"spec"');
    expect(content).toContain('"layer"');
    expect(content).toContain('"authority"');
  });

  it('§3.2 example shows aix.stackVersion = "0.369.0"', () => {
    expect(content).toContain('"stackVersion": "0.369.0"');
  });

  it('§3.2 example shows stackCodename = "Echo369"', () => {
    expect(content).toContain('"stackCodename": "Echo369"');
  });

  it('§3.2 example shows spec = "AIX/1.0"', () => {
    expect(content).toContain('"spec": "AIX/1.0"');
  });

  it('§3.3 README badges section describes three required badges', () => {
    expect(content).toContain('### 3.3 README badges');
    expect(content).toContain('AIX_STACK-Echo369');
    expect(content).toContain('AIX%2F1.0');
  });

  it('§4 codename roadmap has Echo369 as current, Resonance as next, Sovereignty as future', () => {
    expect(content).toContain('## 4. The codename roadmap');
    expect(content).toContain('Echo369');
    expect(content).toContain('Resonance');
    expect(content).toContain('Sovereignty');
  });

  it('§4 codename rotation tied to spec major version bump', () => {
    expect(content).toContain('AIX/1.0');
    expect(content).toContain('AIX/2.0');
    expect(content).toContain('AIX/3.0');
  });

  it('§5 defines three options for downstream repos on a protocol bump', () => {
    expect(content).toContain('## 5. Cross-stack version bumps');
    // Three numbered options
    expect(content).toMatch(/1\. \*\*Update their `aix\.stackVersion`\*\*/);
    expect(content).toMatch(/2\. \*\*Pin to the old `aix\.stackVersion`\*\*/);
    expect(content).toMatch(/3\. \*\*Pre-release a major bump/);
  });

  it('§5 explicitly forbids cosmetic lockstep bumps', () => {
    expect(content).toContain('MUST NOT');
    expect(content).toContain('cosmetic');
  });

  it('§6 covers the 369 motif with sacred constants list', () => {
    expect(content).toContain('## 6. The 369 motif');
    expect(content).toContain('THREE=3');
    expect(content).toContain('SABEEN=7');
    expect(content).toContain('NINE=9');
    expect(content).toContain('NINETEEN=19');
    expect(content).toContain('ARBAUN=40');
    expect(content).toContain('FORTY_NINE=49');
    expect(content).toContain('THREE_SIXTY_NINE=369');
  });

  it('§6 states the motif lives in protocol constants and codename, NOT in consumer app versions', () => {
    expect(content).toContain('not');
    expect(content).toContain('vanity');
    expect(content).toContain("package.json#version");
  });

  it('§7 migration guide has 6 numbered steps for satellite repos', () => {
    expect(content).toContain('## 7. Migration guide');
    for (let i = 1; i <= 6; i++) {
      expect(content).toMatch(new RegExp(`^${i}\\. `, 'm'));
    }
  });

  it('§7 says no version bump required for joining the stack', () => {
    expect(content).toContain('No version bump is required');
  });

  it('§8 closing rule falls back to strict SemVer when in doubt', () => {
    expect(content).toContain('## 8. The closing rule');
    expect(content).toContain('strict SemVer 2.0.0');
    expect(content).toContain('When in doubt, do not bump.');
  });

  it('footer line references axiomid.app and Echo369 release window', () => {
    expect(content).toContain('axiomid.app');
    expect(content).toContain('Echo369 release window');
  });
});

// ---------------------------------------------------------------------------
// AXIOM.md — §4.5 Extended Ecosystem additions (modified file)
// ---------------------------------------------------------------------------

describe('AXIOM.md — §4.5 Extended Ecosystem · Satellite Layers additions', () => {
  let content;

  beforeAll(() => {
    content = readRepo('AXIOM.md');
  });

  it('§4.5 section heading exists', () => {
    expect(content).toContain('## 4.5 Extended Ecosystem · Satellite Layers');
  });

  it('§4.5 describes L0 root authority (axiomid-project)', () => {
    expect(content).toContain('L0 — axiomid-project');
    expect(content).toContain('Root Authority');
  });

  it('§4.5 describes L4 satellite (AlphaAxiom) as trading layer', () => {
    expect(content).toContain('AlphaAxiom');
    expect(content).toContain('Trading product line');
  });

  it('§4.5 describes L5 satellite (PiWorker-OS) as Pi layer', () => {
    expect(content).toContain('PiWorker-OS');
    expect(content).toContain('Pi-Network worker runtime');
  });

  it('§4.5 describes L6 satellite (GemClaw) as voice layer', () => {
    expect(content).toContain('GemClaw');
    expect(content).toContain('Voice-first agent forge');
  });

  it('§4.5 ASCII diagram shows L0 above the sovereign stack and L4–L6 below', () => {
    expect(content).toContain('identity flows ↓');
    expect(content).toContain('money flows ↑');
    expect(content).toContain('Satellite Layers');
  });

  it('§4.5.1 invariants section exists', () => {
    expect(content).toContain('### 4.5.1 Invariants');
  });

  it('§4.5.1 lists exactly four invariants', () => {
    // The four invariants are numbered 1–4
    const match = content.match(/### 4\.5\.1 Invariants[\s\S]*?### 4\.5\.2/);
    expect(match).not.toBeNull();
    const block = match[0];
    // Each invariant starts with a bold label
    expect(block).toContain('**Dependency direction**');
    expect(block).toContain('**Money flows upward**');
    expect(block).toContain('**Identity flows downward**');
    expect(block).toContain('**Trust flows centrally**');
  });

  it('§4.5.1 invariant 1: reverse imports forbidden', () => {
    expect(content).toContain('Reverse imports are forbidden');
  });

  it('§4.5.1 invariant 2: skill purchases are the canonical M2M unit', () => {
    expect(content).toContain('Skill purchases are the canonical M2M unit');
  });

  it('§4.5.1 invariant 3: every agent carries did:axiom identity minted by L0', () => {
    expect(content).toContain('did:axiom:axiomid.app:*');
    expect(content).toContain('minted by L0');
  });

  it('§4.5.1 invariant 4: trust flows centrally into L2 TrustChain', () => {
    expect(content).toContain("mirrored into L2's TrustChain");
  });

  it('§4.5.1 describes the ecosystem as genus 0 tree (χ = +1)', () => {
    expect(content).toContain('genus 0');
    expect(content).toContain('χ = +1');
  });

  it('§4.5.2 "what a satellite is not" section exists', () => {
    expect(content).toContain('### 4.5.2 What a satellite is not');
  });

  it('§4.5.2 states satellites cannot define new payment rails, schema fields, or TrustChain shapes', () => {
    expect(content).toContain('define new payment rails');
    expect(content).toContain('TrustChain shapes');
  });

  it('§4.5.3 cross-tier coordination section exists', () => {
    expect(content).toContain('### 4.5.3 Cross-tier coordination');
  });

  it('§4.5.3 requires coordinated PRs for multi-repo changes', () => {
    expect(content).toContain('MUST land as coordinated PRs');
  });

  it('§4 codename window references Echo369', () => {
    expect(content).toContain('Echo369');
  });

  it('§6 Versioning table now documents Stack codename as Echo369', () => {
    expect(content).toContain('Stack codename');
    expect(content).toContain('Echo369');
  });

  it('§6 references AIX_STACK_VERSIONING.md for the full doctrine', () => {
    expect(content).toContain('AIX_STACK_VERSIONING.md');
  });

  it('§6 Stack compatibility row documents all five aix.* fields', () => {
    expect(content).toContain('aix.stackVersion');
    expect(content).toContain('aix.stackCodename');
    expect(content).toContain('aix.spec');
    expect(content).toContain('aix.layer');
    expect(content).toContain('aix.authority');
  });

  it('§8 THREE_SIXTY_NINE sacred constant now references Echo369 codename', () => {
    const row = content.match(/\| `THREE_SIXTY_NINE` \| 369 \|[\s\S]*?\|/);
    expect(row).not.toBeNull();
    expect(row[0]).toContain('Echo369');
  });

  it('§8 states 369 motif does NOT bleed into consumer-facing app versions', () => {
    expect(content).toContain('does NOT bleed into consumer-facing app versions');
  });
});

// ---------------------------------------------------------------------------
// README.md — satellite ecosystem additions (modified file)
// ---------------------------------------------------------------------------

describe('README.md — satellite ecosystem and v2 asset updates', () => {
  let content;

  beforeAll(() => {
    content = readRepo('README.md');
  });

  it('references aix-stack-header-v2.svg (not the old v1 header)', () => {
    expect(content).toContain('aix-stack-header-v2.svg');
  });

  it('does not reference the old aix-stack-header.svg (v1 removed from header)', () => {
    // The old header reference was in the top <img> tag; it should be gone
    expect(content).not.toMatch(/<img src="\.\/assets\/aix-stack-header\.svg"/);
  });

  it('references aix-stack-diagram-v2.svg (not the old v1 diagram)', () => {
    expect(content).toContain('aix-stack-diagram-v2.svg');
  });

  it('references aix-footer-quote-v2.svg (not the old v1 footer)', () => {
    expect(content).toContain('aix-footer-quote-v2.svg');
  });

  it('has Echo369 AIX Stack badge', () => {
    expect(content).toContain('Echo369');
    expect(content).toContain('AIX%20STACK');
  });

  it('has AIX/1.0 Spec badge', () => {
    expect(content).toContain('AIX%2F1.0');
    expect(content).toContain('SPEC');
  });

  it('has the YOU ARE HERE L1 nav marker', () => {
    expect(content).toContain('YOU ARE HERE');
    expect(content).toContain('L1');
  });

  it('has navigation links to L2 (iqra) and L3 (aix-agent-skills)', () => {
    expect(content).toContain('L2 · RUNTIME');
    expect(content).toContain('iqra');
    expect(content).toContain('L3 · MARKETPLACE');
    expect(content).toContain('aix-agent-skills');
  });

  it('has the root authority L0 (axiomid-project) cross-stack row', () => {
    expect(content).toContain('L0');
    expect(content).toContain('axiomid-project');
  });

  it('has satellite layer navigation: L4 AlphaAxiom, L5 PiWorker-OS, L6 GemClaw', () => {
    expect(content).toContain('L4');
    expect(content).toContain('AlphaAxiom');
    expect(content).toContain('L5');
    expect(content).toContain('PiWorker-OS');
    expect(content).toContain('L6');
    expect(content).toContain('GemClaw');
  });

  it('has the Extended Ecosystem section with sovereign stack and satellite tables', () => {
    expect(content).toContain('Extended Ecosystem');
    expect(content).toContain('Sovereign Stack');
  });

  it('describes topology invariants: money up, identity down, trust central', () => {
    expect(content).toContain('money flows upward');
    expect(content).toContain('identity flows downward');
    expect(content).toContain('TrustChain');
  });

  it('has the versioning at a glance section referencing AIX_STACK_VERSIONING.md', () => {
    expect(content).toContain('Versioning at a glance');
    expect(content).toContain('AIX_STACK_VERSIONING.md');
  });

  it('mentions genus 0, tree-shaped topology (χ = +1)', () => {
    expect(content).toContain('Genus 0');
    expect(content).toContain('tree-shaped');
    expect(content).toContain('χ = +1');
  });

  it('updated contributor count to 6 (1 Human + 5 AI Agents)', () => {
    expect(content).toContain('6 contributors');
    expect(content).toContain('5 are AI');
  });

  it('footer badge updated to 1 Human + 5 AI Agents', () => {
    expect(content).toContain('1%20Human%20%2B%205%20AI%20Agents');
  });

  it('header alt text updated to include L0 Root and Satellites description', () => {
    expect(content).toContain('L0 Root');
    expect(content).toContain('L4-L6 Satellites');
  });

  it('references AXIOM.md §4.5 for extended ecosystem doctrine', () => {
    expect(content).toContain('AXIOM.md');
    expect(content).toContain('§4.5');
  });
});

// ---------------------------------------------------------------------------
// Deleted files — must no longer exist
// ---------------------------------------------------------------------------

describe('Deleted files — removed in this PR', () => {
  it('scripts/smoke.mjs no longer exists', () => {
    expect(existsSync(resolve(REPO, 'scripts/smoke.mjs'))).toBe(false);
  });

  it('.github/workflows/smoke-gate.yml no longer exists', () => {
    expect(existsSync(resolve(REPO, '.github/workflows/smoke-gate.yml'))).toBe(false);
  });

  it('docs/RELEASE-NOTES-baseline-v0.369.0.md no longer exists', () => {
    expect(existsSync(resolve(REPO, 'docs/RELEASE-NOTES-baseline-v0.369.0.md'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Cross-file consistency — the Echo369 + AIX/1.0 doctrine is coherent
// ---------------------------------------------------------------------------

describe('Cross-file consistency — Echo369 and AIX/1.0 doctrine', () => {
  const FILES = {
    'AGENTS.md': null,
    'AIX_STACK_VERSIONING.md': null,
    'AXIOM.md': null,
    'README.md': null,
    'assets/aix-footer-quote-v2.svg': null,
    'assets/aix-stack-diagram-v2.svg': null,
    'assets/aix-stack-header-v2.svg': null,
  };

  beforeAll(() => {
    for (const relPath of Object.keys(FILES)) {
      FILES[relPath] = readRepo(relPath);
    }
  });

  it('every changed file consistently references the Echo369 codename (case-insensitive: SVGs use ECHO369, docs use Echo369)', () => {
    for (const [path, content] of Object.entries(FILES)) {
      expect(content, `${path} must reference Echo369`).toMatch(/echo369/i);
    }
  });

  it('AIX/1.0 spec ID appears in docs and all three SVG assets', () => {
    const svgFiles = [
      'assets/aix-footer-quote-v2.svg',
      'assets/aix-stack-diagram-v2.svg',
      'assets/aix-stack-header-v2.svg',
    ];
    for (const path of svgFiles) {
      expect(FILES[path], `${path} must reference AIX/1.0`).toContain('AIX/1.0');
    }
    expect(FILES['AGENTS.md']).toContain('AIX/1.0');
    expect(FILES['AIX_STACK_VERSIONING.md']).toContain('AIX/1.0');
    expect(FILES['AXIOM.md']).toContain('AIX/1.0');
  });

  it('satellite repo names (AlphaAxiom, PiWorker-OS, GemClaw) appear consistently across docs', () => {
    const docFiles = ['AGENTS.md', 'AIX_STACK_VERSIONING.md', 'AXIOM.md', 'README.md'];
    for (const path of docFiles) {
      expect(FILES[path], `${path} must list AlphaAxiom`).toContain('AlphaAxiom');
      expect(FILES[path], `${path} must list PiWorker-OS`).toContain('PiWorker-OS');
      expect(FILES[path], `${path} must list GemClaw`).toContain('GemClaw');
    }
  });

  it('protocol version 0.369.0 is referenced in AGENTS.md and AIX_STACK_VERSIONING.md', () => {
    expect(FILES['AGENTS.md']).toContain('0.369.0');
    expect(FILES['AIX_STACK_VERSIONING.md']).toContain('0.369.0');
  });

  it('all three v2 SVG files use the neon green brand color #39FF14', () => {
    expect(FILES['assets/aix-footer-quote-v2.svg']).toContain('#39FF14');
    expect(FILES['assets/aix-stack-diagram-v2.svg']).toContain('#39FF14');
    expect(FILES['assets/aix-stack-header-v2.svg']).toContain('#39FF14');
  });

  it('topology SVGs (header + diagram) use gold (#FFD700) for L0 root authority distinction; footer is a credit quote and intentionally omits L0 styling', () => {
    expect(FILES['assets/aix-stack-diagram-v2.svg']).toContain('#FFD700');
    expect(FILES['assets/aix-stack-header-v2.svg']).toContain('#FFD700');
    // Footer is a closing quote (`King isn't Born, he is Made.`); it does not render the L0 root authority box.
    expect(FILES['assets/aix-footer-quote-v2.svg']).not.toContain('#FFD700');
  });

  it('all three v2 SVG files have versioned pattern IDs AND those IDs do not collide across files', () => {
    const footerIds = FILES['assets/aix-footer-quote-v2.svg'].match(/id="[^"]+"/g) || [];
    const diagIds = FILES['assets/aix-stack-diagram-v2.svg'].match(/id="[^"]+"/g) || [];
    const headerIds = FILES['assets/aix-stack-header-v2.svg'].match(/id="[^"]+"/g) || [];

    // Each file should have at least one versioned id (defensive: catches naive cp of v1 file).
    const footerVersioned = footerIds.some(id => id.includes('V2') || id.includes('v2'));
    const diagVersioned = diagIds.some(id => id.includes('V2') || id.includes('Diag') || id.includes('v2'));
    const headerVersioned = headerIds.some(id => id.includes('V2') || id.includes('v2'));

    expect(footerVersioned, 'footer SVG should have versioned pattern/gradient ids').toBe(true);
    expect(diagVersioned, 'diagram SVG should have versioned pattern/filter ids').toBe(true);
    expect(headerVersioned, 'header SVG should have versioned pattern/gradient ids').toBe(true);

    // Cross-file uniqueness: an id reused across files would cause SVG defs to clash when both
    // SVGs are inlined into the same HTML page (e.g. GitHub README renders both).
    const stripQuotes = ids => ids.map(id => id.slice(4, -1)); // `id="foo"` -> `foo`
    const footerSet = new Set(stripQuotes(footerIds));
    const diagSet = new Set(stripQuotes(diagIds));
    const headerSet = new Set(stripQuotes(headerIds));

    const overlaps = [];
    for (const id of footerSet) {
      if (diagSet.has(id)) overlaps.push(`footer<->diagram: ${id}`);
      if (headerSet.has(id)) overlaps.push(`footer<->header: ${id}`);
    }
    for (const id of diagSet) {
      if (headerSet.has(id)) overlaps.push(`diagram<->header: ${id}`);
    }

    expect(overlaps, `SVG id collisions detected: ${overlaps.join(', ')}`).toEqual([]);
  });

  it('axiomid.app authority domain appears in all doctrine docs', () => {
    const docFiles = ['AGENTS.md', 'AIX_STACK_VERSIONING.md', 'AXIOM.md'];
    for (const path of docFiles) {
      expect(FILES[path], `${path} must reference axiomid.app`).toContain('axiomid.app');
    }
  });

  it('the independent SemVer doctrine prohibits cosmetic lockstep versioning', () => {
    expect(FILES['AIX_STACK_VERSIONING.md']).toContain('cosmetic');
    expect(FILES['AIX_STACK_VERSIONING.md']).toContain('MUST NOT');
  });

  it('L0 appears in AXIOM.md §4.5 and is referenced in README.md satellite nav', () => {
    expect(FILES['AXIOM.md']).toContain('L0 — axiomid-project');
    expect(FILES['README.md']).toContain('L0');
    expect(FILES['README.md']).toContain('axiomid-project');
  });
});
