/**
 * Redis Key Namespace Constants
 * 
 * Centralized key generation for Redis operations.
 * All keys follow the pattern: namespace:entity:identifier
 */

export const KEYS = {
  // Agent keys
  agent:        (id: string) => `agent:${id}`,
  agentList:    (userId: string) => `agents:user:${userId}`,
  
  // Session & Auth keys
  session:      (token: string) => `session:${token}`,
  piAuth:       (userId: string) => `pi:auth:${userId}`,
  
  // KYC & Identity keys
  kycStatus:    (userId: string) => `kyc:status:${userId}`,
  zkKycProof:   (userId: string) => `zkkyc:${userId}`,
  dnaProfile:   (userId: string) => `dna:${userId}`,
  
  // Analytics & Metrics keys
  analytics:    (userId: string) => `analytics:${userId}`,
  fleetStatus:  (userId: string) => `fleet:${userId}`,
  
  // Rate Limiting keys
  rateLimit:    (ip: string, route: string) => `ratelimit:${ip}:${route}`,
  
  // Scanning & Security keys
  abomScan:     (hash: string) => `abom:${hash}`,
  
  // MCP & Routing keys
  mcpQuota:     (userId: string) => `mcp:quota:${userId}`,
  mcpSpend:     (userId: string) => `mcp:spend:${userId}`,
  mcpEarnings:  (agentDid: string) => `mcp:earnings:${agentDid}`,
  
  // Registry & Discovery keys
  registry:     () => `registry:agents`,
  registryHash: () => `registry:hash`,
  
  // Space & Channels keys
  space:        (userId: string) => `space:${userId}`,
  channel:      (channelId: string) => `channel:${channelId}`,
  
  // Skills & Capabilities keys
  skills:       (agentId: string) => `skills:${agentId}`,
  skillsList:   () => `skills:list`,
} as const

// Made with Moe Abdelaziz
