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
export declare function getRegistry(): Promise<RegistryEntry[]>;
/**
 * Upserts a single entry in the registry.
 */
export declare function updateRegistryEntry(entry: RegistryEntry): Promise<void>;
/**
 * Transfers ownership of an agent (Pet Gifting).
 * Preserves all memory, skills, and evolution state.
 */
export declare function transferOwnership(did: string, fromUserId: string, toUserId: string): Promise<void>;
