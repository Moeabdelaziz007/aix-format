/**
 * AIX Schema Integrity Tests
 * Validates the canonical structure combining ABOM, SLSA Provenance, and Unified BOM.
 */

describe('AIX Schema Integrity Validation', () => {
    // Mocking a schema validator function for the tests
    // In production, this would use Ajv against aix.schema.json
    const validateManifest = (manifest) => {
        const errors = [];

        if (!manifest.name) errors.push('Missing name');
        if (!manifest.version) errors.push('Missing version');

        if (manifest.abom) {
            if (manifest.abom.risk_score !== undefined) {
                if (manifest.abom.risk_score < 0 || manifest.abom.risk_score > 100) {
                    errors.push('risk_score out of bounds');
                }
            }
            if (manifest.abom.saas_services) {
                manifest.abom.saas_services.forEach((saas, idx) => {
                    if (!saas.name) errors.push(`saas_service[${idx}] missing name`);
                });
            }
        }

        if (manifest.build_provenance) {
            if (!manifest.build_provenance.builder_id) {
                errors.push('build_provenance missing builder_id');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    };

    it('1. يجب أن يمر manifest بحد أدنى (name + version فقط)', () => {
        const manifest = { name: 'Minimal Agent', version: '1.0.0' };
        const result = validateManifest(manifest);
        expect(result.valid).toBe(true);
    });

    it('2. يجب أن يمر manifest كامل (ABOM + SaaS-BOM + provenance)', () => {
        const manifest = {
            name: 'Full Agent',
            version: '1.0.0',
            abom: {
                risk_score: 45,
                unified_bom: { ai_models: [{ model_id: 'gpt-4', provider: 'openai' }] },
                saas_services: [{ name: 'Stripe', provider: 'Stripe Inc', compliance_tier: 'enterprise' }]
            },
            build_provenance: {
                builder_id: 'https://github.com/actions/runner',
                build_type: 'https://slsa.dev/provenance/v1',
                invocation: { config_source: { uri: 'git+https://...', digest: { sha256: 'abc' } } },
                materials: []
            }
        };
        const result = validateManifest(manifest);
        expect(result.valid).toBe(true);
    });

    it('3. يجب أن يفشل saas_service بدون name', () => {
        const manifest = {
            name: 'Agent', version: '1.0',
            abom: { saas_services: [{ provider: 'AWS', compliance_tier: 'basic' }] } // Missing name
        };
        const result = validateManifest(manifest);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('saas_service[0] missing name');
    });

    it('4. يجب أن يفشل build_provenance بدون builder_id', () => {
        const manifest = {
            name: 'Agent', version: '1.0',
            build_provenance: { build_type: 'https://slsa.dev/provenance/v1' } // Missing builder_id
        };
        const result = validateManifest(manifest);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('build_provenance missing builder_id');
    });

    it('5. يجب أن يفشل risk_score خارج 0-100', () => {
        const manifest = {
            name: 'Agent', version: '1.0',
            abom: { risk_score: 150 }
        };
        const result = validateManifest(manifest);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('risk_score out of bounds');
    });

    it('6. يجب أن يمر unified_bom فارغ (optional)', () => {
        const manifest = {
            name: 'Agent', version: '1.0',
            abom: { unified_bom: {} }
        };
        const result = validateManifest(manifest);
        expect(result.valid).toBe(true);
    });
}); {
    "aix_version": "1.3.0",
        "name": "OmniTrader Agent",
            "version": "2.1.0",
                "description": "Autonomous trading agent with KYC and full BOM transparency.",
                    "capabilities": ["trading", "analysis"],
                        "abom": {
        "risk_score": 12,
            "saas_services": [
                {
                    "name": "Upstash Redis",
                    "provider": "Upstash",
                    "compliance_tier": "enterprise",
                    "endpoint": "https://redis.upstash.io"
                }
            ],
                "unified_bom": {
            "ai_models": [
                {
                    "model_id": "claude-3-5-sonnet",
                    "provider": "Anthropic"
                }
            ],
                "infrastructure": [
                    {
                        "provider": "Vercel",
                        "region": "iad1"
                    }
                ]
        },
        "compliance_notes": "All inputs are sanitized before hitting LLMs."
    },
    "build_provenance": {
        "builder_id": "https://github.com/actions/runner",
            "build_type": "https://slsa.dev/provenance/v1",
                "invocation": {
            "config_source": {
                "uri": "git+https://github.com/Moeabdelaziz007/aix-format",
                    "digest": { "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }
            }
        },
        "materials": []
    },
    "monetization": {
        "tier": "pro",
            "pricing": {
            "base_price": 0.01,
                "currency": "PI"
        }
    }
}
