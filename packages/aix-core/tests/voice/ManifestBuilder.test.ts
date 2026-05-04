/**
 * AIX Voice Wizard - Manifest Builder Tests
 * Comprehensive test suite for voice-to-manifest conversion
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ManifestBuilder, 
  buildManifestFromVoice, 
  VoiceWizardData,
  AIXManifest 
} from '../../src/voice/ManifestBuilder';

describe('ManifestBuilder', () => {
  let baseData: VoiceWizardData;

  beforeEach(() => {
    baseData = {
      agentName: 'Customer Support Bot',
      role: 'customer service representative',
      capabilities: ['answer questions', 'troubleshoot issues', 'process returns'],
      identityPreference: 'pi_network',
      monetizationTier: 'basic',
      tone: 'friendly',
      description: 'AI agent for customer support',
      author: 'Test Author',
      language: 'en'
    };
  });

  describe('Manifest Generation', () => {
    it('should generate a valid AIX v0.369.0 manifest', () => {
      const builder = new ManifestBuilder(baseData);
      const manifest = builder.build();

      expect(manifest).toBeDefined();
      expect(manifest.meta.format_version).toBe('1.3.0');
      expect(manifest.meta.name).toBe('customer-support-bot');
      expect(manifest.meta.version).toBe('1.0.0');
    });

    it('should include all required fields', () => {
      const builder = new ManifestBuilder(baseData);
      const manifest = builder.build();

      // Meta fields
      expect(manifest.meta.id).toBeDefined();
      expect(manifest.meta.name).toBeDefined();
      expect(manifest.meta.created).toBeDefined();
      expect(manifest.meta.author).toBe('Test Author');

      // Persona fields
      expect(manifest.persona.role).toBe('customer service representative');
      expect(manifest.persona.instructions).toBeDefined();
      expect(manifest.persona.tone).toBe('friendly');

      // Security fields
      expect(manifest.security.checksum.algorithm).toBe('sha256');
      expect(manifest.security.checksum.value).toBeDefined();
      expect(manifest.security.checksum.value).not.toBe('pending');
      expect(manifest.security.sandboxed).toBe(true);

      // Identity layer
      expect(manifest.identity_layer.id).toBeDefined();
      expect(manifest.identity_layer.id).toMatch(/^did:axiom:axiomid\.app:/);
    });

    it('should generate unique agent IDs', () => {
      const builder1 = new ManifestBuilder(baseData);
      const builder2 = new ManifestBuilder(baseData);

      const manifest1 = builder1.build();
      const manifest2 = builder2.build();

      expect(manifest1.meta.id).not.toBe(manifest2.meta.id);
      expect(manifest1.identity_layer.id).not.toBe(manifest2.identity_layer.id);
    });

    it('should compute valid checksums', () => {
      const builder = new ManifestBuilder(baseData);
      const manifest = builder.build();

      expect(manifest.security.checksum.value).toMatch(/^[a-f0-9]{64}$/);
      expect(manifest.security.checksum.value).not.toBe('pending');
    });
  });

  describe('Name Sanitization', () => {
    it('should sanitize agent names correctly', () => {
      const testCases = [
        { input: 'My Agent!', expected: 'my-agent' },
        { input: 'Agent@123', expected: 'agent123' },
        { input: 'Test   Spaces', expected: 'test-spaces' },
        { input: 'UPPERCASE', expected: 'uppercase' }
      ];

      testCases.forEach(({ input, expected }) => {
        const data = { ...baseData, agentName: input };
        const builder = new ManifestBuilder(data);
        const manifest = builder.build();
        expect(manifest.meta.name).toBe(expected);
      });
    });

    it('should truncate long names', () => {
      const longName = 'a'.repeat(100);
      const data = { ...baseData, agentName: longName };
      const builder = new ManifestBuilder(data);
      const manifest = builder.build();

      expect(manifest.meta.name.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Skills Generation', () => {
    it('should convert capabilities to skills', () => {
      const builder = new ManifestBuilder(baseData);
      const manifest = builder.build();

      expect(manifest.skills).toHaveLength(3);
      expect(manifest.skills[0].name).toBe('answer_questions');
      expect(manifest.skills[1].name).toBe('troubleshoot_issues');
      expect(manifest.skills[2].name).toBe('process_returns');
    });

    it('should set correct skill properties', () => {
      const builder = new ManifestBuilder(baseData);
      const manifest = builder.build();

      manifest.skills.forEach(skill => {
        expect(skill.enabled).toBe(true);
        expect(skill.priority).toBeGreaterThanOrEqual(5);
        expect(skill.timeout).toBe(30);
        expect(skill.description).toContain('Capability:');
      });
    });

    it('should handle empty capabilities', () => {
      const data = { ...baseData, capabilities: [] };
      const builder = new ManifestBuilder(data);
      const manifest = builder.build();

      expect(manifest.skills).toHaveLength(0);
    });
  });

  describe('Identity Layer', () => {
    it('should configure Pi Network identity', () => {
      const data = { ...baseData, identityPreference: 'pi_network' as const };
      const builder = new ManifestBuilder(data);
      const manifest = builder.build();

      expect(manifest.identity_layer.provider).toBeDefined();
      expect(manifest.identity_layer.provider?.type).toBe('pi_network');
      expect(manifest.identity_layer.provider?.name).toBe('Pi Network');
    });

    it('should configure Web DID identity', () => {
      const data = { ...baseData, identityPreference: 'web' as const };
      const builder = new ManifestBuilder(data);
      const manifest = builder.build();

      expect(manifest.identity_layer.provider).toBeDefined();
      expect(manifest.identity_layer.provider?.type).toBe('did_web');
    });

    it('should configure key-based identity', () => {
      const data = { ...baseData, identityPreference: 'key' as const };
      const builder = new ManifestBuilder(data);
      const manifest = builder.build();

      expect(manifest.identity_layer.publicKey).toBeDefined();
      expect(manifest.identity_layer.publicKey?.algorithm).toBe('Ed25519');
    });

    it('should handle no identity preference', () => {
      const data = { ...baseData, identityPreference: 'none' as const };
      const builder = new ManifestBuilder(data);
      const manifest = builder.build();

      expect(manifest.identity_layer.provider).toBeUndefined();
      expect(manifest.identity_layer.publicKey).toBeUndefined();
    });
  });

  describe('Security Configuration', () => {
    it('should set security level based on tier', () => {
      const tiers = [
        { tier: 'free' as const, level: 'basic' },
        { tier: 'basic' as const, level: 'standard' },
        { tier: 'premium' as const, level: 'enhanced' },
        { tier: 'enterprise' as const, level: 'maximum' }
      ];

      tiers.forEach(({ tier, level }) => {
        const data = { ...baseData, monetizationTier: tier };
        const builder = new ManifestBuilder(data);
        const manifest = builder.build();
        expect(manifest.security.level).toBe(level);
      });
    });

    it('should configure API rate limits by tier', () => {
      const tiers = [
        { tier: 'free' as const, limit: 10 },
        { tier: 'basic' as const, limit: 60 },
        { tier: 'premium' as const, limit: 300 },
        { tier: 'enterprise' as const, limit: 1000 }
      ];

      tiers.forEach(({ tier, limit }) => {
        const data = { ...baseData, monetizationTier: tier };
        const builder = new ManifestBuilder(data);
        const manifest = builder.build();
        expect(manifest.security.capabilities?.max_api_calls_per_minute).toBe(limit);
      });
    });

    it('should configure memory limits by tier', () => {
      const tiers = [
        { tier: 'free' as const, memory: 128 },
        { tier: 'basic' as const, memory: 256 },
        { tier: 'premium' as const, memory: 512 },
        { tier: 'enterprise' as const, memory: 1024 }
      ];

      tiers.forEach(({ tier, memory }) => {
        const data = { ...baseData, monetizationTier: tier };
        const builder = new ManifestBuilder(data);
        const manifest = builder.build();
        expect(manifest.security.capabilities?.max_memory_mb).toBe(memory);
      });
    });

    it('should grant additional operations for premium tiers', () => {
      const premiumData = { ...baseData, monetizationTier: 'premium' as const };
      const builder = new ManifestBuilder(premiumData);
      const manifest = builder.build();

      const operations = manifest.security.capabilities?.allowed_operations || [];
      expect(operations).toContain('write_data');
      expect(operations).toContain('external_api_calls');
    });

    it('should grant admin operations for enterprise tier', () => {
      const enterpriseData = { ...baseData, monetizationTier: 'enterprise' as const };
      const builder = new ManifestBuilder(enterpriseData);
      const manifest = builder.build();

      const operations = manifest.security.capabilities?.allowed_operations || [];
      expect(operations).toContain('admin_operations');
      expect(operations).toContain('custom_integrations');
    });
  });

  describe('Economics Configuration', () => {
    it('should not include economics for free tier', () => {
      const data = { ...baseData, monetizationTier: 'free' as const };
      const builder = new ManifestBuilder(data);
      const manifest = builder.build();

      expect(manifest.economics).toBeUndefined();
    });

    it('should include economics for paid tiers', () => {
      const paidTiers: Array<'basic' | 'premium' | 'enterprise'> = ['basic', 'premium', 'enterprise'];

      paidTiers.forEach(tier => {
        const data = { ...baseData, monetizationTier: tier };
        const builder = new ManifestBuilder(data);
        const manifest = builder.build();

        expect(manifest.economics).toBeDefined();
        expect(manifest.economics?.tier).toBe(tier);
        expect(manifest.economics?.revenue_share).toBeGreaterThan(0);
      });
    });

    it('should set correct revenue share by tier', () => {
      const tiers = [
        { tier: 'basic' as const, share: 0.7 },
        { tier: 'premium' as const, share: 0.8 },
        { tier: 'enterprise' as const, share: 0.9 }
      ];

      tiers.forEach(({ tier, share }) => {
        const data = { ...baseData, monetizationTier: tier };
        const builder = new ManifestBuilder(data);
        const manifest = builder.build();
        expect(manifest.economics?.revenue_share).toBe(share);
      });
    });
  });

  describe('Instructions Generation', () => {
    it('should generate comprehensive instructions', () => {
      const builder = new ManifestBuilder(baseData);
      const manifest = builder.build();

      const instructions = manifest.persona.instructions;
      expect(instructions).toContain(baseData.role);
      expect(instructions).toContain('answer questions');
      expect(instructions).toContain('troubleshoot issues');
      expect(instructions).toContain('process returns');
    });

    it('should include all capabilities in instructions', () => {
      const builder = new ManifestBuilder(baseData);
      const manifest = builder.build();

      baseData.capabilities.forEach(capability => {
        expect(manifest.persona.instructions).toContain(capability);
      });
    });
  });

  describe('Tags Generation', () => {
    it('should generate relevant tags', () => {
      const builder = new ManifestBuilder(baseData);
      const manifest = builder.build();

      expect(manifest.meta.tags).toContain('voice-wizard');
      expect(manifest.meta.tags).toContain('customer-service-representative');
    });

    it('should deduplicate tags', () => {
      const data = {
        ...baseData,
        capabilities: ['support', 'support', 'help']
      };
      const builder = new ManifestBuilder(data);
      const manifest = builder.build();

      const supportTags = manifest.meta.tags.filter(tag => tag === 'support');
      expect(supportTags.length).toBe(1);
    });

    it('should limit number of tags', () => {
      const data = {
        ...baseData,
        capabilities: Array(20).fill('capability').map((c, i) => `${c}${i}`)
      };
      const builder = new ManifestBuilder(data);
      const manifest = builder.build();

      expect(manifest.meta.tags.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Build Provenance', () => {
    it('should include build provenance', () => {
      const builder = new ManifestBuilder(baseData);
      const manifest = builder.build();

      expect(manifest.build_provenance.builder).toBe('voice-wizard');
      expect(manifest.build_provenance.builder_version).toBe('1.3.0');
      expect(manifest.build_provenance.build_timestamp).toBeDefined();
    });

    it('should use ISO timestamp format', () => {
      const builder = new ManifestBuilder(baseData);
      const manifest = builder.build();

      const timestamp = manifest.build_provenance.build_timestamp;
      expect(() => new Date(timestamp)).not.toThrow();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Validation', () => {
    it('should validate a complete manifest', () => {
      const builder = new ManifestBuilder(baseData);
      const manifest = builder.build();
      const validation = builder.validate(manifest);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const builder = new ManifestBuilder(baseData);
      const manifest = builder.build();

      // Remove required field
      delete (manifest.meta as any).name;

      const validation = builder.validate(manifest);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('meta.name is required');
    });

    it('should detect invalid DID format', () => {
      const builder = new ManifestBuilder(baseData);
      const manifest = builder.build();

      // Set invalid DID
      manifest.identity_layer.id = 'invalid-did';

      const validation = builder.validate(manifest);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('DID'))).toBe(true);
    });

    it('should detect pending checksum', () => {
      const builder = new ManifestBuilder(baseData);
      const manifest = builder.build();

      // Set checksum to pending
      manifest.security.checksum.value = 'pending';

      const validation = builder.validate(manifest);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('checksum'))).toBe(true);
    });
  });

  describe('buildManifestFromVoice Helper', () => {
    it('should build and validate in one call', () => {
      const result = buildManifestFromVoice(baseData);

      expect(result.manifest).toBeDefined();
      expect(result.validation).toBeDefined();
      expect(result.validation.valid).toBe(true);
    });

    it('should return validation errors if present', () => {
      const invalidData = { ...baseData, agentName: '' };
      const builder = new ManifestBuilder(invalidData);
      const manifest = builder.build();
      
      // Manually break the manifest
      delete (manifest.meta as any).name;
      
      const validation = builder.validate(manifest);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimal data', () => {
      const minimalData: VoiceWizardData = {
        agentName: 'Bot',
        role: 'assistant',
        capabilities: ['help'],
        identityPreference: 'none',
        monetizationTier: 'free'
      };

      const builder = new ManifestBuilder(minimalData);
      const manifest = builder.build();

      expect(manifest).toBeDefined();
      expect(manifest.meta.name).toBe('bot');
    });

    it('should handle special characters in capabilities', () => {
      const data = {
        ...baseData,
        capabilities: ['answer Q&A', 'process $$$', 'handle @mentions']
      };

      const builder = new ManifestBuilder(data);
      const manifest = builder.build();

      expect(manifest.skills).toHaveLength(3);
      manifest.skills.forEach(skill => {
        expect(skill.name).toMatch(/^[a-z0-9_]+$/);
      });
    });

    it('should handle very long capability names', () => {
      const longCapability = 'a'.repeat(100);
      const data = {
        ...baseData,
        capabilities: [longCapability]
      };

      const builder = new ManifestBuilder(data);
      const manifest = builder.build();

      expect(manifest.skills[0].name.length).toBeLessThanOrEqual(30);
    });
  });
});

// Made with Moe Abdelaziz
