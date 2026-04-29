const DEFAULT_SCHEMA_VERSION = 'aix/v1';

export function fromA2A(agentCardJson = {}) {
  return {
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    meta: {
      id: agentCardJson.id || '',
      name: agentCardJson.name || '',
      description: agentCardJson.description || '',
      version: agentCardJson.version || '1.0.0',
      author: agentCardJson.provider?.name || '',
      tags: Array.isArray(agentCardJson.tags) ? agentCardJson.tags : [],
      created: new Date().toISOString()
    },
    persona: {
      role: agentCardJson.description || '',
      objective: 'pending_signature'
    },
    skills: Array.isArray(agentCardJson.skills) ? agentCardJson.skills : [],
    apis: agentCardJson.capabilities || {},
    distribution: { endpoint: agentCardJson.url || '' },
    identity_layer: {
      did: agentCardJson.provider?.url || 'pending_signature',
      kyc_proof: 'pending_signature'
    },
    economics: {
      pricing_model: 'pending_signature',
      cost_per_call: 0
    },
    abom: {
      dependencies: [],
      risk_level: 'unknown'
    },
    security: {
      checksum: { algorithm: 'sha256', value: 'pending_signature' },
      signature: { algorithm: 'ed25519', value: 'pending_signature' }
    },
    lineage: {
      source_format: 'a2a/v0.2',
      imported_from: agentCardJson.id || 'unknown'
    }
  };
}

export function toA2A(aixManifest = {}) {
  return {
    specVersion: '0.2',
    id: aixManifest.meta?.id || '',
    name: aixManifest.meta?.name || '',
    description: aixManifest.meta?.description || '',
    version: aixManifest.meta?.version || '1.0.0',
    provider: {
      name: aixManifest.meta?.author || '',
      url: aixManifest.identity_layer?.did || ''
    },
    url: aixManifest.distribution?.endpoint || '',
    skills: Array.isArray(aixManifest.skills) ? aixManifest.skills : [],
    capabilities: aixManifest.apis || {},
    authSchemes: aixManifest.security?.signature || {},
    tags: Array.isArray(aixManifest.meta?.tags) ? aixManifest.meta.tags : [],
    'x-aix-metadata': {
      identity_layer: aixManifest.identity_layer || {},
      economics: aixManifest.economics || {},
      abom: aixManifest.abom || {},
      lineage: aixManifest.lineage || {},
      security: aixManifest.security || {},
      persona: aixManifest.persona || {}
    }
  };
}

export function convertToAIX(agentCard) {
  if (!agentCard) throw new Error('AgentCard is required');
  return fromA2A(agentCard);
}
