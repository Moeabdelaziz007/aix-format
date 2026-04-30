/**
 * AIX Schema Integrity Tests
 * Validates the canonical structure against the v1.3 Sovereign Protocol schema.
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

describe('AIX Schema Integrity Validation', () => {
    let ajv;
    let validate;

    beforeAll(() => {
        ajv = new Ajv({ allErrors: true, strict: false });
        addFormats(ajv);
        
        const schemaPath = path.resolve(__dirname, '../schemas/aix.schema.json');
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        validate = ajv.compile(schema);
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
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes("must have required property 'meta'"))).toBe(true);
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
        expect(result.valid).toBe(true);
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
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('must be equal to one of the allowed values'))).toBe(true);
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
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
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
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('must be equal to constant'))).toBe(true);
    });
});
