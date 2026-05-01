import { kv, NS, KEYS } from '@/lib/storage/redis';
import { RegistryEntry } from "./types";

/**
 * AIX Global Agent Registry (Hardened)
 * Standardizes storage patterns for sovereign agents using per-agent keys.
 */

const GLOBAL_INDEX_KEY = `${NS.REGISTRY}:index`;

/**
 * Retrieves all agents from the global registry.
 * Fetches the index first, then resolves individual entries in parallel.
 */
export async function getRegistry(): Promise<RegistryEntry[]> {
  try {
    const dids = await kv.get<string[]>(GLOBAL_INDEX_KEY);
    if (!dids || dids.length === 0) return [];

    const entries = await Promise.all(
      dids.map(did => kv.get<RegistryEntry>(KEYS.registry(did)))
    );

    return entries.filter((e): e is RegistryEntry => e !== null);
  } catch (error) {
    console.warn("[Registry] Failed to fetch global registry:", error);
    return [];
  }
}

/**
 * Upserts a single entry in the registry.
 */
export async function updateRegistryEntry(entry: RegistryEntry): Promise<void> {
  try {
    const did = entry.did;
    
    // 1. Store individual entry
    await kv.set(KEYS.registry(did), entry);

    // 2. Update global index (using a set-like array for now to maintain compatibility with Upstash adapter)
    const dids = await kv.get<string[]>(GLOBAL_INDEX_KEY) || [];
    if (!dids.includes(did)) {
      dids.push(did);
      await kv.set(GLOBAL_INDEX_KEY, dids);
    }
    
    console.log(`[Registry] Updated entry for: ${did}`);
  } catch (error) {
    console.error(`[Registry] Update failed for ${entry.did}:`, error);
    throw new Error("Registry update failure");
  }
}

/**
 * Removes an entry from the registry by DID.
 */
export async function deleteRegistryEntry(did: string): Promise<void> {
  try {
    // 1. Delete individual entry
    await kv.del(KEYS.registry(did));

    // 2. Remove from global index
    const dids = await kv.get<string[]>(GLOBAL_INDEX_KEY) || [];
    const filtered = dids.filter(d => d !== did);
    await kv.set(GLOBAL_INDEX_KEY, filtered);
    
    console.log(`[Registry] Deleted entry for: ${did}`);
  } catch (error) {
    console.error(`[Registry] Delete failed for ${did}:`, error);
  }
}
