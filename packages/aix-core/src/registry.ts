import { kv } from './storage/adapter';
import { KEYS, NS } from './storage/keys';

/**
 * AIX Global Agent Registry Manager
 * Handles server-side persistence for agent manifests.
 */

const GLOBAL_INDEX_KEY = `${NS.REGISTRY}:index`;

export interface RegistryEntry {
  did: string;
  name: string;
  role: string;
  capabilities: string[];
  kyc_tier: string;
  specVersion: string;
  publishedAt: string;
  yaml: string;
}

/**
 * Retrieves all agents from the global registry.
 */
export async function getRegistry(): Promise<RegistryEntry[]> {
  try {
    const dids = await kv.get<string[]>(GLOBAL_INDEX_KEY);
    if (!dids || dids.length === 0) return [];

    const entryKeys = dids.map(did => KEYS.registry(did));
    const entries = await kv.mget<RegistryEntry>(...entryKeys);

    return entries.filter((e): e is RegistryEntry => e !== null);
  } catch (error) {
    return [];
  }
}

/**
 * Upserts a single entry in the registry.
 */
export async function updateRegistryEntry(entry: RegistryEntry): Promise<void> {
  const did = entry.did;
  await kv.set(KEYS.registry(did), entry);

  const dids = await kv.get<string[]>(GLOBAL_INDEX_KEY) || [];
  if (!dids.includes(did)) {
    dids.push(did);
    await kv.set(GLOBAL_INDEX_KEY, dids);
  }
}

/**
 * Transfers ownership of an agent (Pet Gifting).
 * Preserves all memory, skills, and evolution state.
 */
export async function transferOwnership(did: string, fromUserId: string, toUserId: string): Promise<void> {
  const entry = await kv.get<RegistryEntry & { ownerId?: string }>(KEYS.registry(did));
  if (!entry) throw new Error("Agent not found");

  // Update owner in registry
  entry.ownerId = toUserId;
  await kv.set(KEYS.registry(did), entry);

  // Update user-specific indices
  const fromKey = `user:${fromUserId}:agents`;
  const toKey = `user:${toUserId}:agents`;

  const fromAgents = await kv.get<string[]>(fromKey) || [];
  await kv.set(fromKey, fromAgents.filter(d => d !== did));

  const toAgents = await kv.get<string[]>(toKey) || [];
  if (!toAgents.includes(did)) {
    toAgents.push(did);
    await kv.set(toKey, toAgents);
  }

}

