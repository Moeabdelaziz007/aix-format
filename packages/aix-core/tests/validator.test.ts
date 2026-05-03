/**
 * AIX Validator - Comprehensive Test Suite
 * Tests for schema validation, error handling, and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AIXValidator, ValidationResult } from '../src/validator';
import * as path from 'path';

describe('AIXValidator', () => {
  let validator: AIXValidator;
  const schemaPath = path.join(__dirname, '../../../schemas/aix.schema.json');

  beforeEach(() => {
    validator = new AIXValidator(schemaPath);
  });

  describe('Constructor', () => {
    it('should initialize with valid schema path', () => {
      expect(() => new AIXValidator(schemaPath)).not.toThrow();
    });

    it('should throw error with invalid schema path', () => {
      expect(() => new AIXValidator('/invalid/path.json')).toThrow();
    });

    it('should throw error with malformed schema', () => {
      const invalidPath = path.join(__dirname, '../../../package.json');
      expect(() => new AIXValidator(invalidPath)).toThrow();
    });
  });

  describe('Valid Manifests', () => {
    it('should validate minimal valid manifest', () => {
      const manifest = {
        meta: {
          format_version: '1.3.0',
          id: 'agent_123',
          name: 'test-agent',
          version: '1.0.0',
          created: new Date().toISOString(),
          author: 'Test Author'
        },
        persona: {
          role: 'assistant',
          instructions: 'Help users',
          tone: 'friendly'
        },
        security: {
          checksum: {
            algorithm: 'sha256',
            value: 'a'.repeat(64)
          },
          sandboxed: true,
          level: 'standard'
        },
        identity_layer: {
          id: 'did:axiom:test123'
        }
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.status).toBe(200);
      expect(result.errors).toBeUndefined();
    });

    it('should validate manifest with all optional fields', () => {
      const manifest = {
        meta: {
          format_version: '1.3.0',
          id: 'agent_456',
          name: 'full-agent',
          version: '2.0.0',
          created: new Date().toISOString(),
          author: 'Full Author',
          description: 'Complete agent',
          tags: ['test', 'full'],
          license: 'MIT'
        },
        persona: {
          role: 'expert',
          instructions: 'Provide expert advice',
          tone: 'professional',
          personality_traits: ['helpful', 'accurate']
        },
        security: {
          checksum: {
            algorithm: 'sha256',
            value: 'b'.repeat(64)
          },
          sandboxed: true,
          level: 'enhanced',
          capabilities: {
            max_api_calls_per_minute: 100,
            max_memory_mb: 512,
            allowed_operations: ['read_data', 'write_data']
          }
        },
        identity_layer: {
          id: 'did:axiom:full456',
          provider: {
            type: 'pi_network',
            name: 'Pi Network'
          }
        },
        skills: [
          {
            name: 'test_skill',
            enabled: true,
            priority: 5,
            timeout: 30,
            description: 'Test skill'
          }
        ],
        economics: {
          tier: 'premium',
          revenue_share: 0.8
        }
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.status).toBe(200);
    });
  });

  describe('Invalid Manifests - Missing Required Fields', () => {
    it('should reject manifest without meta', () => {
      const manifest = {
        persona: { role: 'assistant', instructions: 'Help', tone: 'friendly' },
        security: { checksum: { algorithm: 'sha256', value: 'a'.repeat(64) }, sandboxed: true },
        identity_layer: { id: 'did:axiom:test' }
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.status).toBe(422);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.path.includes('meta'))).toBe(true);
    });

    it('should reject manifest without meta.name', () => {
      const manifest = {
        meta: {
          format_version: '1.3.0',
          id: 'agent_123',
          version: '1.0.0',
          created: new Date().toISOString(),
          author: 'Test'
        },
        persona: { role: 'assistant', instructions: 'Help', tone: 'friendly' },
        security: { checksum: { algorithm: 'sha256', value: 'a'.repeat(64) }, sandboxed: true },
        identity_layer: { id: 'did:axiom:test' }
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('name'))).toBe(true);
    });

    it('should reject manifest without persona', () => {
      const manifest = {
        meta: {
          format_version: '1.3.0',
          id: 'agent_123',
          name: 'test',
          version: '1.0.0',
          created: new Date().toISOString(),
          author: 'Test'
        },
        security: { checksum: { algorithm: 'sha256', value: 'a'.repeat(64) }, sandboxed: true },
        identity_layer: { id: 'did:axiom:test' }
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.path.includes('persona'))).toBe(true);
    });

    it('should reject manifest without security', () => {
      const manifest = {
        meta: {
          format_version: '1.3.0',
          id: 'agent_123',
          name: 'test',
          version: '1.0.0',
          created: new Date().toISOString(),
          author: 'Test'
        },
        persona: { role: 'assistant', instructions: 'Help', tone: 'friendly' },
        identity_layer: { id: 'did:axiom:test' }
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.path.includes('security'))).toBe(true);
    });

    it('should reject manifest without identity_layer', () => {
      const manifest = {
        meta: {
          format_version: '1.3.0',
          id: 'agent_123',
          name: 'test',
          version: '1.0.0',
          created: new Date().toISOString(),
          author: 'Test'
        },
        persona: { role: 'assistant', instructions: 'Help', tone: 'friendly' },
        security: { checksum: { algorithm: 'sha256', value: 'a'.repeat(64) }, sandboxed: true }
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.path.includes('identity'))).toBe(true);
    });
  });

  describe('Invalid Manifests - Wrong Types', () => {
    it('should reject manifest with wrong format_version type', () => {
      const manifest = {
        meta: {
          format_version: 1.3,
          id: 'agent_123',
          name: 'test',
          version: '1.0.0',
          created: new Date().toISOString(),
          author: 'Test'
        },
        persona: { role: 'assistant', instructions: 'Help', tone: 'friendly' },
        security: { checksum: { algorithm: 'sha256', value: 'a'.repeat(64) }, sandboxed: true },
        identity_layer: { id: 'did:axiom:test' }
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
    });

    it('should reject manifest with wrong sandboxed type', () => {
      const manifest = {
        meta: {
          format_version: '1.3.0',
          id: 'agent_123',
          name: 'test',
          version: '1.0.0',
          created: new Date().toISOString(),
          author: 'Test'
        },
        persona: { role: 'assistant', instructions: 'Help', tone: 'friendly' },
        security: { checksum: { algorithm: 'sha256', value: 'a'.repeat(64) }, sandboxed: 'yes' },
        identity_layer: { id: 'did:axiom:test' }
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
    });

    it('should reject manifest with invalid checksum length', () => {
      const manifest = {
        meta: {
          format_version: '1.3.0',
          id: 'agent_123',
          name: 'test',
          version: '1.0.0',
          created: new Date().toISOString(),
          author: 'Test'
        },
        persona: { role: 'assistant', instructions: 'Help', tone: 'friendly' },
        security: { checksum: { algorithm: 'sha256', value: 'short' }, sandboxed: true },
        identity_layer: { id: 'did:axiom:test' }
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
    });
  });

  describe('Error Formatting', () => {
    it('should format errors with path and message', () => {
      const manifest = {
        meta: {
          format_version: '1.3.0',
          id: 'agent_123'
          // missing required fields
        }
      };

      const result = validator.validate(manifest);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      
      result.errors!.forEach(error => {
        expect(error).toHaveProperty('path');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('code');
      });
    });

    it('should include keyword in error code', () => {
      const manifest = {};

      const result = validator.validate(manifest);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.code === 'required')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty object', () => {
      const result = validator.validate({});
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle null', () => {
      const result = validator.validate(null);
      expect(result.valid).toBe(false);
    });

    it('should handle undefined', () => {
      const result = validator.validate(undefined);
      expect(result.valid).toBe(false);
    });

    it('should handle array instead of object', () => {
      const result = validator.validate([]);
      expect(result.valid).toBe(false);
    });

    it('should handle string instead of object', () => {
      const result = validator.validate('not an object');
      expect(result.valid).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should validate quickly (< 10ms)', () => {
      const manifest = {
        meta: {
          format_version: '1.3.0',
          id: 'agent_perf',
          name: 'perf-test',
          version: '1.0.0',
          created: new Date().toISOString(),
          author: 'Perf'
        },
        persona: { role: 'assistant', instructions: 'Fast', tone: 'quick' },
        security: { checksum: { algorithm: 'sha256', value: 'c'.repeat(64) }, sandboxed: true },
        identity_layer: { id: 'did:axiom:perf' }
      };

      const start = Date.now();
      validator.validate(manifest);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10);
    });

    it('should handle multiple validations efficiently', () => {
      const manifest = {
        meta: {
          format_version: '1.3.0',
          id: 'agent_multi',
          name: 'multi-test',
          version: '1.0.0',
          created: new Date().toISOString(),
          author: 'Multi'
        },
        persona: { role: 'assistant', instructions: 'Multiple', tone: 'efficient' },
        security: { checksum: { algorithm: 'sha256', value: 'd'.repeat(64) }, sandboxed: true },
        identity_layer: { id: 'did:axiom:multi' }
      };

      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        validator.validate(manifest);
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // 100 validations in < 100ms
    });
  });
});

// Made with Moe Abdelaziz
