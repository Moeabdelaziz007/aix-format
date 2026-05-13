/**
 * AIX Parser Test Suite
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 * 
 * Test suite for the AIX parser implementation.
 * Tests format detection, validation, and security features.
 * 
 * Usage: node --test tests/parser.test.js
 * 
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
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
          id: 'did:axiom:axiomid.app:550e8400-e29b-41d4-a716-446655440000',
          name: 'Test',
          created: '2026-01-12T10:30:00Z',
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
        },
        identity_layer: {
          id: 'did:axiom:axiomid.app:550e8400-e29b-41d4-a716-446655440000',
          authority: 'axiomid.app',
          issuedAt: '2026-01-12T10:30:00Z'
        }
      };
      parser.validateStructure(data);
      assert.strictEqual(parser.errors.length, 0);
    });
  });

  describe('Validation Helpers - isValidID', () => {
    it('should accept valid did:axiom format', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidID('did:axiom:axiomid.app:550e8400-e29b-41d4-a716-446655440000'), true);
    });

    it('should accept did:axiom with simple string id', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidID('did:axiom:axiomid.app:myagent'), true);
    });

    it('should accept valid did:web format', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidID('did:web:axiomid.app'), true);
    });

    it('should accept did:web with path segments', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidID('did:web:axiomid.app:agents:test'), true);
    });

    it('should reject plain UUID without DID prefix', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidID('550e8400-e29b-41d4-a716-446655440000'), false);
    });

    it('should reject invalid-uuid string', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidID('invalid-uuid'), false);
    });

    it('should reject empty string', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidID(''), false);
    });

    it('should reject did with unknown method', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidID('did:other:axiomid.app:test'), false);
    });

    it('should reject non-string inputs gracefully', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidID(null), false);
      assert.strictEqual(parser.isValidID(undefined), false);
    });
  });

  describe('Validation Helpers - isValidISO8601', () => {
    it('should accept UTC timestamp with Z suffix', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidISO8601('2026-01-12T10:30:00Z'), true);
    });

    it('should accept timestamp without Z suffix', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidISO8601('2026-01-12T10:30:00'), true);
    });

    it('should accept timestamp with milliseconds', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidISO8601('2026-01-12T10:30:00.000Z'), true);
    });

    it('should reject plain date string (no time component)', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidISO8601('2026-01-12'), false);
    });

    it('should reject arbitrary string', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidISO8601('invalid-date'), false);
    });

    it('should reject empty string', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidISO8601(''), false);
    });

    it('should reject date with wrong separator', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidISO8601('2026/01/12T10:30:00Z'), false);
    });

    it('should reject timestamp with timezone offset (non-Z)', () => {
      const parser = new AIXParser();
      // The regex only accepts Z or no suffix, not +00:00
      assert.strictEqual(parser.isValidISO8601('2026-01-12T10:30:00+05:00'), false);
    });
  });

  describe('Validation Helpers - isValidSemver', () => {
    it('should accept major.minor format', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidSemver('1.0'), true);
    });

    it('should accept major.minor.patch format', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidSemver('1.2.3'), true);
    });

    it('should accept pre-release suffix', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidSemver('1.0.0-beta'), true);
    });

    it('should accept build metadata suffix', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidSemver('1.0.0+build'), true);
    });

    it('should accept pre-release with build metadata', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidSemver('1.0.0-alpha.1+build.2'), true);
    });

    it('should reject non-numeric version string', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidSemver('invalid'), false);
    });

    it('should reject version with only major', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidSemver('1'), false);
    });

    it('should reject empty string', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidSemver(''), false);
    });

    it('should reject version with text prefix', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidSemver('v1.0.0'), false);
    });
  });

  describe('Validation Helpers - isValidURL', () => {
    it('should accept https URL', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidURL('https://api.example.com'), true);
    });

    it('should accept http URL', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidURL('http://api.example.com'), true);
    });

    it('should accept URL with path', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidURL('https://api.example.com/v1/endpoint'), true);
    });

    it('should accept URL with query params', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidURL('https://api.example.com?key=value'), true);
    });

    it('should reject bare string without protocol', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidURL('not-a-url'), false);
    });

    it('should reject empty string', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidURL(''), false);
    });

    it('should reject URL without host', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.isValidURL('https://'), false);
    });
  });

  describe('Security Helpers - timingSafeEqualHex', () => {
    it('should return true for identical hex strings', () => {
      const parser = new AIXParser();
      const hex = 'a'.repeat(64);
      assert.strictEqual(parser.timingSafeEqualHex(hex, hex), true);
    });

    it('should return false for different hex strings of same length', () => {
      const parser = new AIXParser();
      const a = 'a'.repeat(64);
      const b = 'b'.repeat(64);
      assert.strictEqual(parser.timingSafeEqualHex(a, b), false);
    });

    it('should return false for strings of different lengths', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.timingSafeEqualHex('a'.repeat(64), 'a'.repeat(32)), false);
    });

    it('should return false when either argument is not a string', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.timingSafeEqualHex(null, 'a'.repeat(64)), false);
      assert.strictEqual(parser.timingSafeEqualHex('a'.repeat(64), undefined), false);
    });

    it('should return false for invalid hex even when both inputs are identical', () => {
      const parser = new AIXParser();
      // Non-hex chars of same length. Buffer.from with 'hex' encoding silently
      // truncates at the first non-hex char, so without an explicit hex check
      // two identical malformed strings would each produce an empty buffer and
      // compare as 'equal'. Lock the rejection in.
      const invalid = 'zz'.repeat(32);
      assert.strictEqual(parser.timingSafeEqualHex(invalid, invalid), false);
    });

    it('should return false for hex strings of odd length', () => {
      const parser = new AIXParser();
      const odd = 'a'.repeat(63);
      assert.strictEqual(parser.timingSafeEqualHex(odd, odd), false);
    });
  });

  describe('Security Helpers - removeSecuritySection', () => {
    it('should remove security section from YAML-like content', () => {
      const parser = new AIXParser();
      const content = `meta:\n  version: "1.0"\nsecurity:\n  checksum:\n    algorithm: sha256\npersona:\n  role: test`;
      const result = parser.removeSecuritySection(content);
      assert(!result.includes('security:'));
      assert(!result.includes('checksum:'));
      assert(result.includes('meta:'));
      assert(result.includes('persona:'));
    });

    it('should return content unchanged when no security section exists', () => {
      const parser = new AIXParser();
      const content = `meta:\n  version: "1.0"\npersona:\n  role: test`;
      const result = parser.removeSecuritySection(content);
      assert(result.includes('meta:'));
      assert(result.includes('persona:'));
    });

    it('should handle empty content', () => {
      const parser = new AIXParser();
      const result = parser.removeSecuritySection('');
      assert.strictEqual(result, '');
    });

    it('should preserve content after security section', () => {
      const parser = new AIXParser();
      const content = `meta:\n  name: test\nsecurity:\n  checksum:\n    value: abc\nidentity_layer:\n  id: did:web:axiomid.app`;
      const result = parser.removeSecuritySection(content);
      assert(result.includes('identity_layer:'));
      assert(!result.includes('security:'));
    });
  });

  describe('TOML Helpers - stripInlineComment', () => {
    it('should remove # comment at end of line', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.stripInlineComment('name = "test" # a comment').trim(), 'name = "test"');
    });

    it('should preserve # inside double-quoted string', () => {
      const parser = new AIXParser();
      const input = 'url = "https://example.com/#hash"';
      assert.strictEqual(parser.stripInlineComment(input), input);
    });

    it('should preserve # inside single-quoted string', () => {
      const parser = new AIXParser();
      const input = "key = 'value#notcomment'";
      assert.strictEqual(parser.stripInlineComment(input), input);
    });

    it('should return empty string for comment-only line', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.stripInlineComment('# full comment').trim(), '');
    });

    it('should handle line with no comment', () => {
      const parser = new AIXParser();
      const input = 'name = "test"';
      assert.strictEqual(parser.stripInlineComment(input), input);
    });

    it('should handle empty string', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.stripInlineComment(''), '');
    });
  });

  describe('TOML Helpers - parseTOMLScalar', () => {
    it('should parse double-quoted string', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.parseTOMLScalar('"hello"'), 'hello');
    });

    it('should parse single-quoted string', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.parseTOMLScalar("'hello'"), 'hello');
    });

    it('should parse boolean true', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.parseTOMLScalar('true'), true);
    });

    it('should parse boolean false', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.parseTOMLScalar('false'), false);
    });

    it('should parse integer', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.parseTOMLScalar('42'), 42);
    });

    it('should parse float', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.parseTOMLScalar('3.14'), 3.14);
    });

    it('should return undefined for empty string', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.parseTOMLScalar(''), undefined);
    });

    it('should return bare string for unquoted non-numeric value', () => {
      const parser = new AIXParser();
      assert.strictEqual(parser.parseTOMLScalar('openpi'), 'openpi');
    });
  });

  describe('TOML Helpers - parseTOMLArray', () => {
    it('should parse array of quoted strings', () => {
      const parser = new AIXParser();
      const result = parser.parseTOMLArray('["item1", "item2", "item3"]');
      assert(Array.isArray(result));
      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0], 'item1');
      assert.strictEqual(result[2], 'item3');
    });

    it('should parse array of integers', () => {
      const parser = new AIXParser();
      const result = parser.parseTOMLArray('[1, 2, 3]');
      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0], 1);
      assert.strictEqual(result[2], 3);
    });

    it('should parse array of booleans', () => {
      const parser = new AIXParser();
      const result = parser.parseTOMLArray('[true, false, true]');
      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0], true);
      assert.strictEqual(result[1], false);
    });

    it('should return empty array for empty brackets', () => {
      const parser = new AIXParser();
      const result = parser.parseTOMLArray('[]');
      assert(Array.isArray(result));
      assert.strictEqual(result.length, 0);
    });

    it('should preserve comma inside quoted string', () => {
      const parser = new AIXParser();
      const result = parser.parseTOMLArray('["a,b", "c"]');
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0], 'a,b');
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
          id: 'did:axiom:axiomid.app:550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Agent',
          created: '2026-01-12T10:30:00Z',
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
        meta: { version: '1.0', id: 'did:axiom:axiomid.app:550e8400-e29b-41d4-a716-446655440000',
                name: 'Test', created: '2026-01-12T10:30:00Z', author: 'Test' },
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
        meta: { version: '1.0', id: 'did:axiom:axiomid.app:550e8400-e29b-41d4-a716-446655440000',
                name: 'Test', created: '2026-01-12T10:30:00Z', author: 'Test' },
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
        meta: { version: '1.0', id: 'did:axiom:axiomid.app:550e8400-e29b-41d4-a716-446655440000',
                name: 'Test Agent', created: '2026-01-12T10:30:00Z', author: 'Test' },
        persona: { role: 'test', instructions: 'test' },
        security: { checksum: { algorithm: 'sha256', value: 'abc123' } }
      };

      const agent = new AIXAgent(data);
      const str = agent.toString();
      assert(str.includes('Test Agent'));
      assert(str.includes('550e8400-e29b-41d4-a716-446655440000'));
    });

    describe('validateLiveVoice', () => {
      it('should reject null voice argument', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {} });
        const { errors } = agent.validateLiveVoice(null);
        assert(errors.some(e => e.code === 'INVALID_INPUT'));
      });

      it('should reject non-object voice argument', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {} });
        const { errors } = agent.validateLiveVoice('invalid');
        assert(errors.some(e => e.code === 'INVALID_INPUT'));
      });

      it('should reject missing provider field', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {} });
        const { errors } = agent.validateLiveVoice({});
        assert(errors.some(e => e.code === 'MISSING_FIELD' && e.field === 'provider'));
      });

      it('should reject unknown provider value', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {} });
        const { errors } = agent.validateLiveVoice({ provider: 'unknown-provider' });
        assert(errors.some(e => e.code === 'INVALID_VALUE' && e.field === 'provider'));
      });

      it('should accept valid provider: openai-realtime', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {} });
        const { errors } = agent.validateLiveVoice({ provider: 'openai-realtime' });
        assert(!errors.some(e => e.field === 'provider'));
      });

      it('should accept valid provider: hume', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {} });
        const { errors } = agent.validateLiveVoice({ provider: 'hume' });
        assert(!errors.some(e => e.field === 'provider'));
      });

      it('should accept valid provider: elevenlabs', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {} });
        const { errors } = agent.validateLiveVoice({ provider: 'elevenlabs' });
        assert(!errors.some(e => e.field === 'provider'));
      });

      it('should accept valid provider: generic', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {} });
        const { errors } = agent.validateLiveVoice({ provider: 'generic' });
        assert(!errors.some(e => e.field === 'provider'));
      });

      it('should reset errors on each call', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {} });
        agent.validateLiveVoice(null);
        const { errors } = agent.validateLiveVoice({ provider: 'hume' });
        assert.strictEqual(errors.length, 0);
      });
    });

    describe('validateGuardianLogic', () => {
      it('should add error when front_run_defense enabled without mempool_monitor', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {} });
        agent.validateGuardianLogic({ front_run_defense: true });
        assert(agent.errors.some(e => e.code === 'INCONSISTENT_CONFIG'));
      });

      it('should not add error when front_run_defense enabled with mempool_monitor', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {} });
        agent.validateGuardianLogic({ front_run_defense: true, mempool_monitor: true });
        assert(!agent.errors.some(e => e.code === 'INCONSISTENT_CONFIG'));
      });

      it('should not add error when front_run_defense is absent', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {} });
        agent.validateGuardianLogic({});
        assert(!agent.errors.some(e => e.code === 'INCONSISTENT_CONFIG'));
      });

      it('should not add error when front_run_defense is false', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {} });
        agent.validateGuardianLogic({ front_run_defense: false });
        assert(!agent.errors.some(e => e.code === 'INCONSISTENT_CONFIG'));
      });
    });

    describe('abomSummary', () => {
      it('should return zero counts for empty constituents', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {}, abom: { constituents: [] } });
        const summary = agent.abomSummary();
        assert.strictEqual(summary.total, 0);
        assert.strictEqual(summary.verified, 0);
        assert.strictEqual(summary.vulnerable, 0);
      });

      it('should count verified constituents', () => {
        const agent = new AIXAgent({
          meta: {}, persona: {}, security: {},
          abom: { constituents: [
            { trust_tier: 'verified', integrity_hash: 'abc:123' },
            { trust_tier: 'verified', integrity_hash: 'abc:456' }
          ] }
        });
        const summary = agent.abomSummary();
        assert.strictEqual(summary.total, 2);
        assert.strictEqual(summary.verified, 2);
      });

      it('should count vulnerable constituents', () => {
        const agent = new AIXAgent({
          meta: {}, persona: {}, security: {},
          abom: { constituents: [
            { trust_tier: 'community', security_status: 'vulnerable', integrity_hash: 'abc:123' },
            { trust_tier: 'verified', integrity_hash: 'abc:456' }
          ] }
        });
        const summary = agent.abomSummary();
        assert.strictEqual(summary.vulnerable, 1);
      });

      it('should count constituents missing integrity_hash', () => {
        const agent = new AIXAgent({
          meta: {}, persona: {}, security: {},
          abom: { constituents: [
            { trust_tier: 'verified' },
            { trust_tier: 'community', integrity_hash: 'abc:123' }
          ] }
        });
        const summary = agent.abomSummary();
        assert.strictEqual(summary.missing_hash, 1);
      });

      it('should default to unverified tier when trust_tier is absent', () => {
        const agent = new AIXAgent({
          meta: {}, persona: {}, security: {},
          abom: { constituents: [{ integrity_hash: 'abc:123' }] }
        });
        const summary = agent.abomSummary();
        assert.strictEqual(summary.unverified, 1);
      });

      it('should return zero total when abom section is absent', () => {
        const agent = new AIXAgent({ meta: {}, persona: {}, security: {} });
        const summary = agent.abomSummary();
        assert.strictEqual(summary.total, 0);
      });
    });
  });
});



