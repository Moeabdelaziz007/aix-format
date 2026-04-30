
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import fs from 'node:fs';
import path from 'node:path';

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const schemaPath = './schemas/aix.schema.json';
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

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
        ai_models: [{ model_id: 'gpt-4', provider: 'OpenAI' }]
    }
};

const valid = validate(manifest);
if (!valid) {
    console.log(JSON.stringify(validate.errors, null, 2));
} else {
    console.log('Manifest is valid!');
}
