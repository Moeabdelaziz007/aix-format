/**
 * AIX Parser Test Suite
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2025
 * 
 * Test suite for the AIX parser implementation.
 * Tests format detection, validation, and security features.
 * 
 * Usage: node --test tests/parser.test.js
 * 
 * Copyright © 2025 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under MIT License - See LICENSE.md
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AIXParser, AIXAgent } from '../core/parser.js';

describe('AIXParser', () => {
  describe('Format Detection', () => {
    it('should detect JSON format from content', () => {
      const parser = new AIXParser();
      const content = '{ "meta": { "version": "1.0" } }';
      const format = parser.detectFormat(content, 'test.json');
      assert.strictEqual(format, 'json');
    });

    it('should detect YAML format from content', () => {
      const parser = new AIXParser();
      const content = 'meta:\n  version: "1.0"';
      const format = parser.detectFormat(content, 'test.yaml');
      assert.strictEqual(format, 'yaml');
    });

    it('should detect TOML format from content', () => {
      const parser = new AIXParser();
      const content = '[meta]\nversion = "1.0"';
      const format = parser.detectFormat(content, 'test.toml');
      assert.strictEqual(format, 'toml');
    });

    it('should detect format from file extension', () => {
      const parser = new AIXParser();
      const content = 'anything';
      assert.strictEqual(parser.detectFormat(content, 'test.json'), 'json');
      assert.strictEqual(parser.detectFormat(content, 'test.yaml'), 'yaml');
      assert.strictEqual(parser.detectFormat(content, 'test.yml'), 'yaml');
      assert.strictEqual(parser.detectFormat(content, 'test.toml'), 'toml');
    });
  });

  describe('JSON Parsing', () => {
    it('should parse valid JSON content', () => {
      const parser = new AIXParser();
      const content = '{"meta": {"version": "1.0"}, "test": true}';
      const data = parser.parseJSON(content);
      assert.strictEqual(data.meta.version, '1.0');
      assert.strictEqual(data.test, true);
    });

    it('should throw on invalid JSON', () => {
      const parser = new AIXParser();
      const content = '{invalid json}';
      assert.throws(() => parser.parseJSON(content));
    });
  });

  describe('YAML Parsing', () => {
    it('should parse simple YAML key-value pairs', () => {
      const parser = new AIXParser();
      const content = 'name: test\nvalue: 123\nenabled: true';
      const data = parser.parseYAML(content);
      assert.strictEqual(data.name, 'test');
      assert.strictEqual(data.value, 123);
      assert.strictEqual(data.enabled, true);
    });

    it('should parse nested YAML objects', () => {
      const parser = new AIXParser();
      const content = 'meta:\n  version: "1.0"\n  name: "test"';
      const data = parser.parseYAML(content);
      assert.strictEqual(data.meta.version, '1.0');
      assert.strictEqual(data.meta.name, 'test');
    });

    it('should parse YAML arrays', () => {
      const parser = new AIXParser();
      const content = 'items:\n  - item1\n  - item2\n  - item3';
      const data = parser.parseYAML(content);
      assert(Array.isArray(data.items));
      assert.strictEqual(data.items.length, 3);
      assert.strictEqual(data.items[0], 'item1');
    });

    it('should skip comments', () => {
      const parser = new AIXParser();
      const content = '# Comment\nname: test\n# Another comment';
      const data = parser.parseYAML(content);
      assert.strictEqual(data.name, 'test');
    });
  });

  describe('TOML Parsing', () => {
    it('should parse simple TOML key-value pairs', () => {
      const parser = new AIXParser();
      const content = 'name = "test"\nvalue = 123\nenabled = true';
      const data = parser.parseTOML(content);
      assert.strictEqual(data.name, 'test');
      assert.strictEqual(data.value, 123);
      assert.strictEqual(data.enabled, true);
    });

    it('should parse TOML sections', () => {
      const parser = new AIXParser();
      const content = '[meta]\nversion = "1.0"\nname = "test"';
      const data = parser.parseTOML(content);
      assert.strictEqual(data.meta.version, '1.0');
      assert.strictEqual(data.meta.name, 'test');
    });
  });

  describe('Validation - Structure', () => {
    it('should reject missing required sections', () => {
      const parser = new AIXParser();
      const data = { meta: { version: '1.0' } };
      parser.validateStructure(data);
      assert(parser.errors.some(e => e.code === 'MISSING_SECTION' && e.section === 'persona'));
      assert(parser.errors.some(e => e.code === 'MISSING_SECTION' && e.section === 'security'));
    });

    it('should accept all required sections', () => {
      const parser = new AIXParser();
      const data = {
        meta: {
          version: '1.0',
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test',
          created: '2025-01-12T10:30:00Z',
          author: 'Test Author'
        },
        persona: {
          role: 'test',
          instructions: 'test instructions'
        },
        security: {
          checksum: {
            algorithm: 'sha256',
            value: 'abc123'
          }
        }
      };
      parser.validateStructure(data);
      assert.strictEqual(parser.errors.length, 0);
    });
  });

  describe('Validation - Meta Section', () => {
    it('should reject invalid UUID', () => {
      const parser = new AIXParser();
      const meta = {
        version: '1.0',
        id: 'invalid-uuid',
        name: 'Test',
        created: '2025-01-12T10:30:00Z',
        author: 'Test'
      };
      parser.validateMeta(meta);
      assert(parser.errors.some(e => e.code === 'INVALID_UUID'));
    });

    it('should accept valid UUID v4', () => {
      const parser = new AIXParser();
      const meta = {
        version: '1.0',
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
        created: '2025-01-12T10:30:00Z',
        author: 'Test'
      };
      parser.validateMeta(meta);
      assert(!parser.errors.some(e => e.code === 'INVALID_UUID'));
    });

    it('should reject invalid ISO 8601 timestamp', () => {
      const parser = new AIXParser();
      const meta = {
        version: '1.0',
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
        created: 'invalid-date',
        author: 'Test'
      };
      parser.validateMeta(meta);
      assert(parser.errors.some(e => e.code === 'INVALID_TIMESTAMP'));
    });

    it('should accept valid ISO 8601 timestamp', () => {
      const parser = new AIXParser();
      const meta = {
        version: '1.0',
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
        created: '2025-01-12T10:30:00Z',
        author: 'Test'
      };
      parser.validateMeta(meta);
      assert(!parser.errors.some(e => e.code === 'INVALID_TIMESTAMP'));
    });

    it('should reject invalid semver', () => {
      const parser = new AIXParser();
      const meta = {
        version: 'invalid',
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
        created: '2025-01-12T10:30:00Z',
        author: 'Test'
      };
      parser.validateMeta(meta);
      assert(parser.errors.some(e => e.code === 'INVALID_VERSION'));
    });

    it('should accept valid semver versions', () => {
      const parser = new AIXParser();
      const validVersions = ['1.0', '1.0.0', '1.2.3', '1.0.0-beta', '1.0.0+build'];
      
      for (const version of validVersions) {
        const meta = {
          version,
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test',
          created: '2025-01-12T10:30:00Z',
          author: 'Test'
        };
        parser.errors = [];
        parser.validateMeta(meta);
        assert(!parser.errors.some(e => e.code === 'INVALID_VERSION'), 
          `Version ${version} should be valid`);
      }
    });
  });

  describe('Validation - Persona Section', () => {
    it('should reject missing required fields', () => {
      const parser = new AIXParser();
      const persona = { role: 'test' };
      parser.validatePersona(persona);
      assert(parser.errors.some(e => 
        e.code === 'MISSING_FIELD' && e.field === 'instructions'
      ));
    });

    it('should reject invalid temperature range', () => {
      const parser = new AIXParser();
      const persona = {
        role: 'test',
        instructions: 'test',
        temperature: 3.0
      };
      parser.validatePersona(persona);
      assert(parser.errors.some(e => e.code === 'INVALID_RANGE'));
    });

    it('should accept valid temperature values', () => {
      const parser = new AIXParser();
      const persona = {
        role: 'test',
        instructions: 'test',
        temperature: 0.7
      };
      parser.validatePersona(persona);
      assert(!parser.errors.some(e => e.code === 'INVALID_RANGE'));
    });
  });

  describe('Validation - Skills Section', () => {
    it('should reject duplicate skill names', () => {
      const parser = new AIXParser();
      const skills = [
        { name: 'test_skill', description: 'Test 1' },
        { name: 'test_skill', description: 'Test 2' }
      ];
      parser.validateSkills(skills);
      assert(parser.errors.some(e => e.code === 'DUPLICATE_NAME'));
    });

    it('should reject missing required fields', () => {
      const parser = new AIXParser();
      const skills = [
        { name: 'test_skill' }
      ];
      parser.validateSkills(skills);
      assert(parser.errors.some(e => 
        e.code === 'MISSING_FIELD' && e.field === 'description'
      ));
    });
  });

  describe('Validation - APIs Section', () => {
    it('should reject missing base_url', () => {
      const parser = new AIXParser();
      const apis = [
        { name: 'test_api' }
      ];
      parser.validateAPIs(apis);
      assert(parser.errors.some(e => 
        e.code === 'MISSING_FIELD' && e.field === 'base_url'
      ));
    });

    it('should reject invalid URL', () => {
      const parser = new AIXParser();
      const apis = [
        { name: 'test_api', base_url: 'not-a-url' }
      ];
      parser.validateAPIs(apis);
      assert(parser.errors.some(e => e.code === 'INVALID_URL'));
    });

    it('should accept valid API configuration', () => {
      const parser = new AIXParser();
      const apis = [
        { name: 'test_api', base_url: 'https://api.example.com' }
      ];
      parser.validateAPIs(apis);
      assert(!parser.errors.some(e => e.code === 'INVALID_URL'));
    });
  });

  describe('Checksum Calculation', () => {
    it('should calculate consistent checksums', () => {
      const parser = new AIXParser();
      const content = 'test content';
      const checksum1 = parser.calculateChecksum(content, 'sha256');
      const checksum2 = parser.calculateChecksum(content, 'sha256');
      assert.strictEqual(checksum1, checksum2);
    });

    it('should normalize line endings', () => {
      const parser = new AIXParser();
      const content1 = 'line1\nline2\nline3';
      const content2 = 'line1\r\nline2\r\nline3';
      const checksum1 = parser.calculateChecksum(content1, 'sha256');
      const checksum2 = parser.calculateChecksum(content2, 'sha256');
      assert.strictEqual(checksum1, checksum2);
    });
  });

  describe('AIXAgent', () => {
    it('should create agent from valid data', () => {
      const data = {
        meta: {
          version: '1.0',
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Agent',
          created: '2025-01-12T10:30:00Z',
          author: 'Test'
        },
        persona: {
          role: 'test',
          instructions: 'test'
        },
        skills: [
          { name: 'skill1', description: 'Skill 1', enabled: true }
        ],
        security: {
          checksum: {
            algorithm: 'sha256',
            value: 'abc123'
          }
        }
      };
      
      const agent = new AIXAgent(data);
      assert.strictEqual(agent.meta.name, 'Test Agent');
      assert.strictEqual(agent.persona.role, 'test');
      assert.strictEqual(agent.skills.length, 1);
    });

    it('should get agent capabilities', () => {
      const data = {
        meta: { version: '1.0', id: '550e8400-e29b-41d4-a716-446655440000', 
                name: 'Test', created: '2025-01-12T10:30:00Z', author: 'Test' },
        persona: { role: 'test', instructions: 'test' },
        skills: [
          { name: 'skill1', description: 'Skill 1', enabled: true },
          { name: 'skill2', description: 'Skill 2', enabled: false }
        ],
        apis: [
          { name: 'api1', base_url: 'https://api.example.com' }
        ],
        security: { checksum: { algorithm: 'sha256', value: 'abc123' } }
      };
      
      const agent = new AIXAgent(data);
      const capabilities = agent.getCapabilities();
      
      assert(capabilities.includes('skill1'));
      assert(!capabilities.includes('skill2')); // disabled
      assert(capabilities.includes('api_integration'));
    });

    it('should check authorization', () => {
      const data = {
        meta: { version: '1.0', id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Test', created: '2025-01-12T10:30:00Z', author: 'Test' },
        persona: { role: 'test', instructions: 'test' },
        security: {
          checksum: { algorithm: 'sha256', value: 'abc123' },
          capabilities: {
            allowed_operations: ['read_files', 'call_apis']
          }
        }
      };
      
      const agent = new AIXAgent(data);
      assert.strictEqual(agent.isAuthorized('read_files'), true);
      assert.strictEqual(agent.isAuthorized('delete_files'), false);
    });

    it('should return formatted string', () => {
      const data = {
        meta: { version: '1.0', id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Test Agent', created: '2025-01-12T10:30:00Z', author: 'Test' },
        persona: { role: 'test', instructions: 'test' },
        security: { checksum: { algorithm: 'sha256', value: 'abc123' } }
      };
      
      const agent = new AIXAgent(data);
      const str = agent.toString();
      assert(str.includes('Test Agent'));
      assert(str.includes('550e8400-e29b-41d4-a716-446655440000'));
    });
  });
});

console.log('\n✅ All tests defined. Run with: node --test tests/parser.test.js\n');

