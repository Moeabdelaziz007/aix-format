import { Redis } from "@upstash/redis";
import { RegistryEntry } from "./types";

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const KV_KEY = "aix_registry";

/**
 * Retrieves all agents from the global registry.
 */
export async function getRegistry(): Promise<RegistryEntry[]> {
  try {
    const entries = await kv.get<RegistryEntry[]>(KV_KEY);
    return entries || [];
  } catch (error) {
    console.warn("KV Registry not available, falling back to empty list", error);
    return [];
  }
}

/**
 * Persists the entire registry to KV storage.
 */
export async function saveRegistry(entries: RegistryEntry[]): Promise<void> {
  try {
    await kv.set(KV_KEY, entries);
  } catch (error) {
    console.error("Failed to save to KV registry:", error);
    throw new Error("Registry persistence failure");
  }
}

/**
 * Upserts a single entry in the registry.
 * Uses entry.did as the unique identifier.
 */
export async function updateRegistryEntry(entry: RegistryEntry): Promise<void> {
  const entries = await getRegistry();
  const index = entries.findIndex(e => e.did === entry.did);
  
  if (index !== -1) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  
  await saveRegistry(entries);
}

/**
 * Removes an entry from the registry by DID.
 */
export async function deleteRegistryEntry(did: string): Promise<void> {
  const entries = await getRegistry();
  const filtered = entries.filter(e => e.did !== did);
  await saveRegistry(filtered);
}
