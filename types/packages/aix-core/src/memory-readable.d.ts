/**
 * Readable Memory System (v1.3.6)
 * Converts flat agent memory into human-readable Markdown/JSONL
 * and interactive WikiBrain Memory Trees.
 */
export interface MemoryNode {
    id: string;
    label: string;
    children?: MemoryNode[];
    metadata?: any;
}
export declare class ReadableMemory {
    /**
     * Generates a WikiBrain Memory Tree for an agent.
     */
    static getMemoryTree(agentId: string): Promise<MemoryNode>;
    /**
     * Archives a session into Markdown format.
     */
    static archiveToMarkdown(agentId: string, processId: string): Promise<string>;
}
