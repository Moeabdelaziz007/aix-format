import { describe, it, expect } from 'vitest';
import { AIXParser } from '../../core/parser.js';
import * as fs from 'fs';
import * as path from 'path';

describe('AIX Parser Integration Tests', () => {
  const examplesDir = path.resolve(__dirname, '../../examples');
  const parser = new AIXParser();

  // Get all .aix files in examples directory
  const exampleFiles = fs.readdirSync(examplesDir).filter(file => file.endsWith('.aix'));

  exampleFiles.forEach(file => {
    it(`should successfully parse example file: ${file}`, () => {
      const filePath = path.join(examplesDir, file);
      const agent = parser.parseFile(filePath);

      expect(agent).toBeDefined();
      expect(agent.data.meta).toBeDefined();
      expect(agent.data.meta.id).toBeDefined();
      expect(agent.data.persona).toBeDefined();
    });
  });
});

describe('AIX Parser - PR Changes: sync API and new/modified example files', () => {
  const examplesDir = path.resolve(__dirname, '../../examples');
  const exampleFiles = fs.readdirSync(examplesDir).filter(file => file.endsWith('.aix'));

  it('parseFile is async and returns a Promise', () => {
    const parser = new AIXParser();
    const filePath = path.join(examplesDir, 'pi-agent.aix');
    const result = parser.parseFile(filePath);
    // parseFile is declared async in parser.js; calling without await yields a Promise
    expect(result).toBeInstanceOf(Promise);
  });

  it('test-agent.aix exists in examples directory', () => {
    const filePath = path.join(examplesDir, 'test-agent.aix');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('test-agent.aix fails validation due to missing required sections (persona, security)', async () => {
    const parser = new AIXParser();
    const filePath = path.join(examplesDir, 'test-agent.aix');
    // test-agent.aix has no persona or security section which are required by the parser
    await expect(parser.parseFile(filePath)).rejects.toThrow();
  });

  it('test-agent.aix raw YAML contains identity_layer with id, kyc_tier, and verified fields', () => {
    const filePath = path.join(examplesDir, 'test-agent.aix');
    const content = fs.readFileSync(filePath, 'utf-8');
    const parser = new AIXParser();
    // Parse raw YAML without validation via parseYAML
    const data = parser.parseYAML(content);
    expect(data.identity_layer).toBeDefined();
    expect(data.identity_layer.id).toBe('did:axiom:test123');
    expect(data.identity_layer.kyc_tier).toBe(2);
    expect(data.identity_layer.verified).toBe(true);
  });

  it('test-agent.aix raw YAML contains skills, economics, status, color, successRate, tasksCompleted', () => {
    const filePath = path.join(examplesDir, 'test-agent.aix');
    const content = fs.readFileSync(filePath, 'utf-8');
    const parser = new AIXParser();
    const data = parser.parseYAML(content);
    expect(data.skills).toBeDefined();
    expect(Array.isArray(data.skills)).toBe(true);
    expect(data.skills[0].name).toBe('test-scan');
    expect(data.economics).toBeDefined();
    expect(data.economics.pricing_model).toBe('free');
    expect(data.economics.currency).toBe('PI');
    expect(data.status).toBe('online');
    expect(data.color).toBe('#ff3366');
    expect(data.successRate).toBe(95);
    expect(data.tasksCompleted).toBe(100);
  });

  describe('enhanced-agent.aix changes', () => {
    it('version is "1.0" (not "1.0.0")', () => {
      const filePath = path.join(examplesDir, 'enhanced-agent.aix');
      const content = fs.readFileSync(filePath, 'utf-8');
      const parser = new AIXParser();
      const data = parser.parseYAML(content);
      expect(data.meta.version).toBe('1.0');
    });

    it('no top-level identity_layer block (removed in PR)', () => {
      const filePath = path.join(examplesDir, 'enhanced-agent.aix');
      const content = fs.readFileSync(filePath, 'utf-8');
      const parser = new AIXParser();
      const data = parser.parseYAML(content);
      expect(data.identity_layer).toBeUndefined();
    });

    it('memory.persistence section is present with correct fields', () => {
      const filePath = path.join(examplesDir, 'enhanced-agent.aix');
      const content = fs.readFileSync(filePath, 'utf-8');
      const parser = new AIXParser();
      const data = parser.parseYAML(content);
      expect(data.memory).toBeDefined();
      expect(data.memory.persistence).toBeDefined();
      expect(data.memory.persistence.enabled).toBe(true);
      expect(data.memory.persistence.backend).toBe('file');
      expect(data.memory.persistence.config).toBeDefined();
      expect(data.memory.persistence.config.directory).toBe('./web_scraper_memory');
      expect(data.memory.persistence.config.format).toBe('json');
      expect(data.memory.persistence.config.compress).toBe(true);
    });

    it('pre-existing memory sections (episodic, semantic, procedural) are intact', () => {
      const filePath = path.join(examplesDir, 'enhanced-agent.aix');
      const content = fs.readFileSync(filePath, 'utf-8');
      const parser = new AIXParser();
      const data = parser.parseYAML(content);
      expect(data.memory.episodic).toBeDefined();
      expect(data.memory.semantic).toBeDefined();
      expect(data.memory.procedural).toBeDefined();
    });
  });

  describe('pi-agent.aix changes', () => {
    it('abom constituents do not have type or purl fields (removed in PR)', () => {
      const filePath = path.join(examplesDir, 'pi-agent.aix');
      const content = fs.readFileSync(filePath, 'utf-8');
      const parser = new AIXParser();
      const data = parser.parseYAML(content);
      const constituents = data.abom?.constituents ?? [];
      expect(constituents.length).toBeGreaterThan(0);
      for (const constituent of constituents) {
        expect(constituent.type).toBeUndefined();
        expect(constituent.purl).toBeUndefined();
      }
    });

    it('abom constituents retain name, version, and uri fields', () => {
      const filePath = path.join(examplesDir, 'pi-agent.aix');
      const content = fs.readFileSync(filePath, 'utf-8');
      const parser = new AIXParser();
      const data = parser.parseYAML(content);
      const constituents = data.abom?.constituents ?? [];
      expect(constituents.length).toBe(2);
      const piSdk = constituents.find((c: { name: string }) => c.name === 'Pi SDK');
      expect(piSdk).toBeDefined();
      expect(piSdk.version).toBe('2.1.0');
      expect(piSdk.uri).toBe('https://sdk.minepi.com');
      const axiomCore = constituents.find((c: { name: string }) => c.name === 'Axiom Core');
      expect(axiomCore).toBeDefined();
      expect(axiomCore.version).toBe('1.2.0');
      expect(axiomCore.uri).toBe('https://axiom.ai/core');
    });

    it('exampleFiles array includes test-agent.aix after it was added to examples/', () => {
      expect(exampleFiles).toContain('test-agent.aix');
    });
  });
});
