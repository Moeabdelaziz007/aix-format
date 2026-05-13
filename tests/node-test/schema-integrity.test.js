/**
 * AIX Schema Integrity Tests
 * Validates the canonical structure against the v1.3 Sovereign Protocol schema.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('AIX Schema Integrity Validation', () => {
    let ajv;
    let validate;

    before(() => {
        try {
            ajv = new Ajv2020({ allErrors: true, strict: false });
            addFormats(ajv);
            
            const schemaPath = path.resolve(__dirname, '../schemas/aix.schema.json');
            const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
            validate = ajv.compile(schema);
        } catch (e) {
            console.error('AJV COMPILE ERROR:', e);
            throw e;
        }
    });

    const validateManifest = (manifest) => {
        const valid = validate(manifest);
        return {
            valid,
            errors: validate.errors ? validate.errors.map(err => `${err.instancePath} ${err.message}`) : []
        };
    };

    it('1. يجب أن يفشل manifest فارغ (Missing required blocks)', () => {
        const manifest = {};
        const result = validateManifest(manifest);
        assert.strictEqual(result.valid, false);
        assert.ok(result.errors.some(e => e.includes("must have required property 'meta'")));
    });

    it('2. يجب أن يمر manifest بحد أدنى من v1.3 (meta, persona, security, identity_layer)', () => {
        const manifest = {
            meta: {
                version: '1.3.0',
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Minimal v1.3 Agent',
                created: '2026-04-30T10:00:00Z',
                author: 'Test Author'
            },
            persona: {
                role: 'Assistant',
                instructions: 'Be helpful.'
            },
            security: {
                checksum: {
                    algorithm: 'sha256',
                    value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
                }
            },
            identity_layer: {
                id: 'did:axiom:axiomid.app:test-agent',
                authority: 'axiomid.app',
                issuedAt: '2026-04-30T10:00:00Z'
            }
        };
        const result = validateManifest(manifest);
        if (!result.valid) {
            console.error('Validation Errors:', result.errors);
        }
        assert.strictEqual(result.valid, true);
    });

    it('3. يجب أن يفشل عند استخدام enum غير صالح (security.checksum.algorithm)', () => {
        const manifest = {
            meta: {
                version: '1.3.0',
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Invalid Enum Agent',
                created: '2026-04-30T10:00:00Z',
                author: 'Test Author'
            },
            persona: {
                role: 'Assistant',
                instructions: 'Be helpful.'
            },
            security: {
                checksum: {
                    algorithm: 'md5', // Invalid enum
                    value: 'abc'
                }
            },
            identity_layer: {
                id: 'did:axiom:axiomid.app:test-agent',
                authority: 'axiomid.app',
                issuedAt: '2026-04-30T10:00:00Z'
            }
        };
        const result = validateManifest(manifest);
        assert.strictEqual(result.valid, false);
        assert.ok(result.errors.some(e => e.includes('must be equal to one of the allowed values')));
    });

    it('4. يجب أن يفشل عند نقص حقول إجبارية داخل meta', () => {
        const manifest = {
            meta: {
                version: '1.3.0'
                // Missing id, name, created, author
            },
            persona: { role: 'A', instructions: 'B' },
            security: { checksum: { algorithm: 'sha256', value: 'abc' } },
            identity_layer: { id: 'did:x', authority: 'axiomid.app', issuedAt: '2026-04-30T10:00:00Z' }
        };
        const result = validateManifest(manifest);
        assert.strictEqual(result.valid, false);
        assert.ok(result.errors.length > 0);
    });

    it('5. يجب أن يفشل identity_layer إذا كانت الـ authority ليست axiomid.app', () => {
        const manifest = {
            meta: {
                version: '1.3.0',
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Invalid Authority Agent',
                created: '2026-04-30T10:00:00Z',
                author: 'Test Author'
            },
            persona: { role: 'A', instructions: 'B' },
            security: { checksum: { algorithm: 'sha256', value: 'abc' } },
            identity_layer: {
                id: 'did:axiom:other.app:test-agent',
                authority: 'other.app', // Invalid const
                issuedAt: '2026-04-30T10:00:00Z'
            }
        };
        const result = validateManifest(manifest);
        assert.strictEqual(result.valid, false);
        assert.ok(result.errors.some(e => e.includes('must be equal to constant')));
    });

    it('6. يجب أن يمر manifest يحتوي على saas_services (SaaS-BOM)', () => {
        const manifest = {
            meta: {
                version: '1.3.0',
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'SaaS-BOM Agent',
                created: '2026-04-30T10:00:00Z',
                author: 'Test Author'
            },
            persona: { role: 'A', instructions: 'B' },
            security: { checksum: { algorithm: 'sha256', value: 'abc' } },
            identity_layer: { id: 'did:axiom:axiomid.app:test', authority: 'axiomid.app', issuedAt: '2026-04-30T10:00:00Z' },
            saas_services: [
                {
                    name: 'Stripe API',
                    provider: 'Stripe',
                    description: 'Payments processing',
                    compliance_tier: 'PCI-DSS'
                }
            ]
        };
        const result = validateManifest(manifest);
        if (!result.valid) console.error(result.errors);
        assert.strictEqual(result.valid, true);
    });

    it('7. يجب أن يمر manifest يحتوي على unified_bom', () => {
        const manifest = {
            meta: {
                version: '1.3.0',
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Unified-BOM Agent',
                created: '2026-04-30T10:00:00Z',
                author: 'Test Author'
            },
            persona: { role: 'A', instructions: 'B' },
            security: { checksum: { algorithm: 'sha256', value: 'abc' } },
            identity_layer: { id: 'did:axiom:axiomid.app:test', authority: 'axiomid.app', issuedAt: '2026-04-30T10:00:00Z' },
            unified_bom: {
                agents: [{ did: 'did:axiom:axiomid.app:other', name: 'Other', version: '1.0.0' }],
                saas: [{ name: 'Auth0', provider: 'Okta' }],
                ai_models: [{ name: 'GPT-4', provider: 'OpenAI', version: 'v1' }]
            }
        };
        const result = validateManifest(manifest);
        if (!result.valid) console.error(result.errors);
        assert.strictEqual(result.valid, true);
    });
});

