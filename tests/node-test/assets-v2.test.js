/**
 * Tests for v2 branding SVG assets added in the Echo369 ecosystem PR.
 *
 * Covers: assets/aix-footer-quote-v2.svg
 *         assets/aix-stack-diagram-v2.svg
 *         assets/aix-stack-header-v2.svg
 *
 * Validates that each file:
 *  - exists and is non-empty
 *  - is well-formed XML/SVG (correct root element, xmlns, width/height/viewBox)
 *  - contains the stack layers expected by the Echo369 release
 *  - carries the spec identifier AIX/1.0 and the Echo369 codename
 *  - references the correct satellite repos (L4/L5/L6)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.resolve(__dirname, '../assets');

function readAsset(filename) {
  return fs.readFileSync(path.join(ASSETS_DIR, filename), 'utf8');
}

// ---------------------------------------------------------------------------
// Helpers

/**
 * Assert that an SVG string declares the correct root element and namespace.
 */
function assertSvgRoot(svg, filename) {
  assert.ok(
    svg.trimStart().startsWith('<svg'),
    `${filename}: must start with <svg`,
  );
  assert.ok(
    svg.includes('xmlns="http://www.w3.org/2000/svg"'),
    `${filename}: must declare the SVG namespace`,
  );
}

/**
 * Parse a numeric attribute value from an SVG opening tag.
 * e.g. extractDimension('<svg width="900" …', 'width') → 900
 */
function extractDimension(svg, attr) {
  const m = svg.match(new RegExp(`<svg[^>]*\\b${attr}="(\\d+)"`));
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Parse the viewBox attribute from an SVG.
 * Returns [minX, minY, width, height] as numbers.
 */
function extractViewBox(svg) {
  const m = svg.match(/viewBox="([^"]+)"/);
  if (!m) return null;
  return m[1].split(/\s+/).map(Number);
}

// ---------------------------------------------------------------------------
// Footer quote v2

describe('assets/aix-footer-quote-v2.svg', () => {
  let svg;

  it('file exists and is non-empty', () => {
    const p = path.join(ASSETS_DIR, 'aix-footer-quote-v2.svg');
    assert.ok(fs.existsSync(p), 'aix-footer-quote-v2.svg must exist');
    svg = fs.readFileSync(p, 'utf8');
    assert.ok(svg.length > 0, 'file must not be empty');
  });

  it('is a valid SVG root element with correct namespace', () => {
    svg = readAsset('aix-footer-quote-v2.svg');
    assertSvgRoot(svg, 'aix-footer-quote-v2.svg');
  });

  it('has width=900 and height=240', () => {
    svg = readAsset('aix-footer-quote-v2.svg');
    assert.strictEqual(extractDimension(svg, 'width'), 900);
    assert.strictEqual(extractDimension(svg, 'height'), 240);
  });

  it('has a viewBox matching the canvas dimensions (0 0 900 240)', () => {
    svg = readAsset('aix-footer-quote-v2.svg');
    const vb = extractViewBox(svg);
    assert.deepStrictEqual(vb, [0, 0, 900, 240]);
  });

  it('contains the Echo369 codename', () => {
    svg = readAsset('aix-footer-quote-v2.svg');
    assert.ok(svg.includes('ECHO369'), 'must include ECHO369 codename text');
  });

  it('contains the spec identifier AIX/1.0', () => {
    svg = readAsset('aix-footer-quote-v2.svg');
    assert.ok(svg.includes('AIX/1.0'), 'must reference spec AIX/1.0');
  });

  it('contains the canonical quote text', () => {
    svg = readAsset('aix-footer-quote-v2.svg');
    assert.ok(
      svg.includes("King isn't Born, he is Made."),
      'must include the canonical footer quote',
    );
  });

  it('lists all sovereign stack layers L0 through L3', () => {
    svg = readAsset('aix-footer-quote-v2.svg');
    assert.ok(svg.includes('L0'), 'must reference L0 root authority');
    assert.ok(svg.includes('L1'), 'must reference L1 protocol');
    assert.ok(svg.includes('L2'), 'must reference L2 runtime');
    assert.ok(svg.includes('L3'), 'must reference L3 marketplace');
  });

  it('lists all satellite layer repos', () => {
    svg = readAsset('aix-footer-quote-v2.svg');
    assert.ok(svg.toLowerCase().includes('alphaaxiom'), 'must mention AlphaAxiom (L4)');
    assert.ok(svg.toLowerCase().includes('piworker'), 'must mention PiWorker-OS (L5)');
    assert.ok(svg.toLowerCase().includes('gemclaw'), 'must mention GemClaw (L6)');
  });

  it('contains an animated pulse element (live indicator)', () => {
    svg = readAsset('aix-footer-quote-v2.svg');
    assert.ok(
      svg.includes('<animate') && svg.includes('opacity'),
      'must include an animated opacity pulse element',
    );
  });

  it('uses the brand accent colour #39FF14', () => {
    svg = readAsset('aix-footer-quote-v2.svg');
    // Colour appears in multiple fill/stroke attributes
    assert.ok(
      (svg.match(/#39FF14/gi) || []).length >= 2,
      'must use the neon-green brand colour #39FF14 in multiple places',
    );
  });

  it('defines a linearGradient for the footer accent', () => {
    svg = readAsset('aix-footer-quote-v2.svg');
    assert.ok(svg.includes('<linearGradient'), 'must define a linearGradient element');
  });
});

// ---------------------------------------------------------------------------
// Stack diagram v2

describe('assets/aix-stack-diagram-v2.svg', () => {
  let svg;

  it('file exists and is non-empty', () => {
    const p = path.join(ASSETS_DIR, 'aix-stack-diagram-v2.svg');
    assert.ok(fs.existsSync(p), 'aix-stack-diagram-v2.svg must exist');
    svg = fs.readFileSync(p, 'utf8');
    assert.ok(svg.length > 0, 'file must not be empty');
  });

  it('is a valid SVG root element with correct namespace', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assertSvgRoot(svg, 'aix-stack-diagram-v2.svg');
  });

  it('has width=1100 and height=560', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assert.strictEqual(extractDimension(svg, 'width'), 1100);
    assert.strictEqual(extractDimension(svg, 'height'), 560);
  });

  it('has a viewBox matching the canvas dimensions (0 0 1100 560)', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    const vb = extractViewBox(svg);
    assert.deepStrictEqual(vb, [0, 0, 1100, 560]);
  });

  it('contains the Echo369 codename', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assert.ok(svg.includes('ECHO369'), 'must include ECHO369 codename text');
  });

  it('contains the spec identifier AIX/1.0', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assert.ok(svg.includes('AIX/1.0'), 'must reference spec AIX/1.0');
  });

  it('labels the L0 root authority (AXIOMID-PROJECT)', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assert.ok(svg.includes('AXIOMID-PROJECT'), 'must label the L0 root authority node');
    assert.ok(svg.includes('L0'), 'must include the L0 tier label');
  });

  it('labels all three sovereign core layers L1/L2/L3', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assert.ok(svg.includes('AIX-FORMAT'), 'must label L1 as AIX-FORMAT');
    assert.ok(svg.includes('IQRA'), 'must label L2 as IQRA');
    assert.ok(svg.includes('AGENT-SKILLS'), 'must label L3 as AGENT-SKILLS');
  });

  it('labels all three satellite layers L4/L5/L6', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assert.ok(svg.includes('ALPHAAXIOM'), 'must label L4 as ALPHAAXIOM');
    assert.ok(svg.includes('PIWORKER-OS'), 'must label L5 as PIWORKER-OS');
    assert.ok(svg.includes('GEMCLAW'), 'must label L6 as GEMCLAW');
  });

  it('shows identity flow direction text', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assert.ok(
      svg.includes('identity flows down'),
      'must describe the downward identity flow from L0',
    );
  });

  it('shows money flow direction text (buys skills)', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assert.ok(
      svg.includes('buys skills'),
      'must describe the upward money flow from satellites',
    );
  });

  it('contains the topological invariants legend', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assert.ok(
      svg.includes('TOPOLOGICAL INVARIANTS'),
      'must include the topological invariants legend',
    );
  });

  it('states the genus-0 / tree-shaped topology invariant', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assert.ok(
      svg.includes('tree-shaped') || svg.includes('genus 0'),
      'must state the tree-shaped / genus-0 topology invariant',
    );
  });

  it('uses dashed lines to represent flow arrows', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assert.ok(
      svg.includes('stroke-dasharray'),
      'must use dashed lines for flow arrows',
    );
  });

  it('uses blur filters for glow effects on sovereign nodes', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assert.ok(
      svg.includes('feGaussianBlur'),
      'must define feGaussianBlur filters for glow effects',
    );
  });

  it('applies gold (#FFD700) colour to the L0 root authority node', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assert.ok(
      svg.includes('#FFD700'),
      'must use gold colour #FFD700 for the L0 root authority',
    );
  });

  it('uses lighter grey (#666666) for satellite layer borders to visually dim them', () => {
    svg = readAsset('aix-stack-diagram-v2.svg');
    assert.ok(
      svg.includes('#666666'),
      'must use grey #666666 for satellite layer borders',
    );
  });
});

// ---------------------------------------------------------------------------
// Stack header v2

describe('assets/aix-stack-header-v2.svg', () => {
  let svg;

  it('file exists and is non-empty', () => {
    const p = path.join(ASSETS_DIR, 'aix-stack-header-v2.svg');
    assert.ok(fs.existsSync(p), 'aix-stack-header-v2.svg must exist');
    svg = fs.readFileSync(p, 'utf8');
    assert.ok(svg.length > 0, 'file must not be empty');
  });

  it('is a valid SVG root element with correct namespace', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    assertSvgRoot(svg, 'aix-stack-header-v2.svg');
  });

  it('has width=1100 and height=340', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    assert.strictEqual(extractDimension(svg, 'width'), 1100);
    assert.strictEqual(extractDimension(svg, 'height'), 340);
  });

  it('has a viewBox matching the canvas dimensions (0 0 1100 340)', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    const vb = extractViewBox(svg);
    assert.deepStrictEqual(vb, [0, 0, 1100, 340]);
  });

  it('contains the Echo369 codename', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    assert.ok(svg.includes('ECHO369'), 'must include ECHO369 codename text');
  });

  it('contains the spec identifier AIX/1.0', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    assert.ok(svg.includes('AIX/1.0'), 'must reference spec AIX/1.0');
  });

  it('labels the L0 root authority block', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    assert.ok(svg.includes('ROOT AUTHORITY'), 'must label the root authority tier');
    assert.ok(svg.includes('AXIOMID-PROJECT'), 'must name the axiomid-project repo');
  });

  it('marks L1 as "YOU ARE HERE" to orient the viewer', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    assert.ok(
      svg.includes('YOU ARE HERE'),
      'must mark L1 aix-format as YOU ARE HERE',
    );
  });

  it('labels L2 runtime as IQRA', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    assert.ok(svg.includes('IQRA'), 'must label L2 as IQRA');
  });

  it('labels L3 marketplace as AGENT-SKILLS', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    assert.ok(svg.includes('AGENT-SKILLS'), 'must label L3 as AGENT-SKILLS');
  });

  it('lists the satellite layers L4/L5/L6', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    assert.ok(svg.includes('ALPHAAXIOM'), 'must list L4 ALPHAAXIOM');
    assert.ok(svg.includes('PIWORKER-OS'), 'must list L5 PIWORKER-OS');
    assert.ok(svg.includes('GEMCLAW'), 'must list L6 GEMCLAW');
  });

  it('contains a live pulse animation', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    assert.ok(
      svg.includes('<animate') && svg.includes('opacity'),
      'must include an animated pulse (live indicator)',
    );
    assert.ok(svg.includes('LIVE'), 'must include the LIVE text label');
  });

  it('uses gold (#FFD700) for the L0 identity-flow arrows', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    assert.ok(svg.includes('#FFD700'), 'must use gold for L0 flow arrows');
  });

  it('uses dashed lines for the identity-flow arrows', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    assert.ok(svg.includes('stroke-dasharray'), 'must use dashed lines for flow arrows');
  });

  it('defines a linearGradient for the top accent bar', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    assert.ok(svg.includes('<linearGradient'), 'must define a top-accent linearGradient');
  });

  it('applies the brand accent colour #39FF14 to sovereign core borders', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    // Should appear for all three L1/L2/L3 boxes
    assert.ok(
      (svg.match(/#39FF14/gi) || []).length >= 3,
      'must use neon-green #39FF14 for sovereign core borders',
    );
  });

  it('shows M2M money-flow indicators for satellite layers', () => {
    svg = readAsset('aix-stack-header-v2.svg');
    assert.ok(
      svg.includes('M2M'),
      'must show M2M money-flow indicators from satellite layers',
    );
  });
});