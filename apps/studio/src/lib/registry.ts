import { RegistryEntry } from "./types";

/**
 * AIX Global Agent Registry (Client Wrapper)
 * Uses the /api/registry endpoint to interact with the sovereign index.
 */

/**
 * Retrieves all agents from the global registry via API.
 */
export async function getRegistry(): Promise<RegistryEntry[]> {
  try {
    const res = await fetch('/api/registry');
    if (!res.ok) throw new Error("Failed to fetch registry");
    return await res.json();
  } catch (error) {
    console.warn("[Registry] Client fetch failed:", error);
    return [];
  }
}

/**
 * Upserts a single entry in the registry via API.
 */
export async function updateRegistryEntry(entry: RegistryEntry): Promise<void> {
  try {
    const res = await fetch('/api/registry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Registry update failure");
    }
  } catch (error) {
    console.error(`[Registry] Client update failed for ${entry.did}:`, error);
    throw error;
  }
}

/**
 * Removes an entry from the registry by DID via API.
 */
export async function deleteRegistryEntry(did: string): Promise<void> {
  try {
    const res = await fetch(`/api/registry?id=${did}`, {
      method: 'DELETE',
    });
    
    if (!res.ok) throw new Error("Registry delete failure");
  } catch (error) {
    console.error(`[Registry] Client delete failed for ${did}:`, error);
    throw error;
  }
}
