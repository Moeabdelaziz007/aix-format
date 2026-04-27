export function convertToAIX(agentCard) {
  if (!agentCard) {
    throw new Error('AgentCard is required');
  }

  const aix = {
    schemaVersion: "aix/v0.1",
    meta: {
      name: agentCard.name || "",
      description: agentCard.description || "",
      author: agentCard.provider?.name || "",
      version: agentCard.version || "1.0.0",
      tags: agentCard.tags || []
    },
    capabilities: {
      tools: agentCard.skills || [],
      permissions: agentCard.capabilities || {}
    },
    trust: {
      signature: agentCard.authSchemes || {}
    },
    distribution: {
      endpoint: agentCard.url || ""
    }
  };

  return aix;
}
