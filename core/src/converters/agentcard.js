const DEFAULT_SCHEMA_VERSION = 'aix/v1';

export function generateDID(name, url) {
  const slug = (name || 'agent').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `did:axiom:axiomid.app:${slug}`;
}

export function fromA2A(agentCardJson = {}) {
  const capabilities = agentCardJson.capabilities || {};
  const auth = agentCardJson.authentication || agentCardJson.authenticationSchemes || [];
  
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
    capabilities: {
      streaming: capabilities.streaming ?? false,
      push_notifications: capabilities.pushNotifications ?? false,
      state_history: capabilities.stateTransitionHistory ?? false,
      voice_interaction: capabilities.voiceInteraction ?? false
    },
    distribution: { endpoint: agentCardJson.url || '' },
    identity_layer: {
      id: generateDID(agentCardJson.name, agentCardJson.url),
      authority: 'axiomid.app',
      publicKey: {
        algorithm: 'Ed25519',
        value: 'pending_keygen'
      },
      issuedAt: new Date().toISOString(),
      kyc_proof: 'pending_kyc'
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
      authentication: auth,
      checksum: { algorithm: 'sha256', value: 'pending_signature' },
      signature: { algorithm: 'ed25519', value: 'pending_signature' }
    },
    lineage: {
      source_format: 'a2a/v1.0',
      imported_from: agentCardJson.id || 'unknown'
    }
  };
}

export function toA2A(aixManifest = {}) {
  return {
    specVersion: '1.0',
    id: aixManifest.meta?.id || '',
    name: aixManifest.meta?.name || '',
    description: aixManifest.meta?.description || '',
    version: aixManifest.meta?.version || '1.0.0',
    provider: {
      name: aixManifest.meta?.author || '',
      url: aixManifest.identity_layer?.id || aixManifest.identity_layer?.did || ''
    },
    url: aixManifest.distribution?.endpoint || '',
    skills: Array.isArray(aixManifest.skills) ? aixManifest.skills : [],
    capabilities: {
      streaming: aixManifest.apis?.streaming ?? false,
      pushNotifications: aixManifest.apis?.push_notifications ?? false,
      stateTransitionHistory: aixManifest.apis?.state_history ?? false,
      ...aixManifest.apis?.raw_capabilities
    },
    authenticationSchemes: aixManifest.security?.authentication?.length > 0 
      ? aixManifest.security.authentication 
      : [{
          scheme: 'bearer',
          description: 'Ed25519 signed JWT'
        }],
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
