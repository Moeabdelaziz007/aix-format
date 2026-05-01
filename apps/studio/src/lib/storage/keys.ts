/**
 * AIX Storage Key Strategy & TTL Configuration
 * Unified source of truth for all Redis namespaces.
 */

export const NS = {
  SESSIONS: 'aix:sessions',
  REGISTRY: 'aix:registry',
  ABOM: 'aix:abom',
  MCP: 'aix:mcp:quota',
  METRICS: 'aix:metrics',
  SCAN: 'aix:scan',
  AGENTS: 'agent' // Root for full manifests
} as const;

export const TTL = {
  SESSIONS: 60 * 60 * 24 * 7,  // 7 Days
  REGISTRY: 0,                // Permanent
  ABOM: 60 * 60 * 24 * 30,    // 30 Days (Cache)
  MCP: 60,                    // 60 Seconds (Rate limiting window)
  METRICS: 60 * 60 * 24 * 90, // 90 Days
  SCAN: 60 * 60 * 24 * 7      // 7 Days
} as const;

/**
 * Utility to generate namespaced keys
 */
export function k(namespace: keyof typeof NS, id: string): string {
  return `${NS[namespace]}:${id}`;
}
