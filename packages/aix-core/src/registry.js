import { kv } from './storage/adapter';
import { KEYS, NS } from './storage/keys';
/**
 * AIX Global Agent Registry Manager
 * Handles server-side persistence for agent manifests.
 */
const GLOBAL_INDEX_KEY = `${NS.REGISTRY}:index`;
/**
 * Retrieves all agents from the global registry.
 */
export async function getRegistry() {
    try {
        const dids = await kv.get(GLOBAL_INDEX_KEY);
        if (!dids || dids.length === 0)
            return [];
        const entryKeys = dids.map(did => KEYS.registry(did));
        const entries = await kv.mget(...entryKeys);
        return entries.filter((e) => e !== null);
    }
    catch (error) {
        return [];
    }
}
/**
 * Upserts a single entry in the registry.
 */
export async function updateRegistryEntry(entry) {
    const did = entry.did;
    await kv.set(KEYS.registry(did), entry);
    const dids = await kv.get(GLOBAL_INDEX_KEY) || [];
    if (!dids.includes(did)) {
        dids.push(did);
        await kv.set(GLOBAL_INDEX_KEY, dids);
    }
}
/**
 * Transfers ownership of an agent (Pet Gifting).
 * Preserves all memory, skills, and evolution state.
 */
export async function transferOwnership(did, fromUserId, toUserId) {
    const entry = await kv.get(KEYS.registry(did));
    if (!entry)
        throw new Error("Agent not found");
    // Update owner in registry
    entry.ownerId = toUserId;
    await kv.set(KEYS.registry(did), entry);
    // Update user-specific indices
    const fromKey = `user:${fromUserId}:agents`;
    const toKey = `user:${toUserId}:agents`;
    const fromAgents = await kv.get(fromKey) || [];
    await kv.set(fromKey, fromAgents.filter(d => d !== did));
    const toAgents = await kv.get(toKey) || [];
    if (!toAgents.includes(did)) {
        toAgents.push(did);
        await kv.set(toKey, toAgents);
    }
}
