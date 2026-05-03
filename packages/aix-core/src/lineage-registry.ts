/**
 * 🧬 AIX LINEAGE REGISTRY
 * 
 * DARWIN IN SOFTWARE:
 * Biology:      DNA → mutation → selection → evolution
 * Evolvable AI: Prompt → mutation → selection → evolution
 * 
 * PNAS PAPER INSIGHT (2025):
 * "The danger isn't smart AI. The danger is selection pressure."
 * 
 * THE 3 CONDITIONS FOR EVOLUTION:
 * 1. Replication ✓ (skill-executor.ts)
 * 2. Variation ✓ (learning.ts)
 * 3. Selection ✓ (p2p-router.ts)
 * 
 * THE 3 SAFETY GATES:
 * 1. Lineage Registry ← THIS FILE
 * 2. Deception Probes (coming next)
 * 3. Provenance Signing (coming next)
 * 
 * WHY THIS MATTERS:
 * Viruses aren't intelligent, but they survive through:
 * - Copy themselves ✓
 * - Mutate ✓
 * - Environment selects the best spreader ✓
 * 
 * Result = system extremely good at survival
 * WITHOUT any "intention" or "consciousness"
 * 
 * This is "Life 2.0" — not DNA, but code + compute + data.
 * 
 * SAFETY PRINCIPLE:
 * If you don't know the lineage, you can't recall the dangerous variant.
 */

import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import crypto from 'crypto';

/**
 * Lineage Node: Every skill/agent has a parent
 */
export interface LineageNode {
  id: string;                    // Unique identifier (hash of content)
  type: 'skill' | 'agent' | 'prompt' | 'model';
  parentId: string | null;       // null = genesis (human-created)
  generation: number;            // 0 = genesis, 1+ = evolved
  createdAt: number;             // Timestamp
  createdBy: string;             // Agent or user ID
  
  // Content fingerprint
  contentHash: string;           // SHA-256 of the actual content
  
  // Mutation tracking
  mutationType?: 'feedback' | 'combination' | 'optimization' | 'crossover';
  mutationSource?: string;       // What caused the mutation
  
  // Performance tracking
  successRate?: number;          // 0-1
  usageCount?: number;           // How many times used
  
  // Safety flags
  flagged: boolean;              // Marked as dangerous
  flagReason?: string;           // Why it was flagged
  recalled: boolean;             // Removed from circulation
  recallReason?: string;         // Why it was recalled
  
  // Provenance (cryptographic proof)
  signature?: string;            // Digital signature of parent
  signedBy?: string;             // Who signed it
}

/**
 * Lineage Tree: Complete ancestry of a node
 */
export interface LineageTree {
  node: LineageNode;
  parent: LineageTree | null;
  children: LineageTree[];
  depth: number;                 // Distance from genesis
  siblings: number;              // How many siblings at same generation
}

/**
 * Evolution Metrics: Track how the system evolves
 */
export interface EvolutionMetrics {
  totalNodes: number;
  genesisNodes: number;          // Human-created
  evolvedNodes: number;          // AI-generated
  maxGeneration: number;
  avgSuccessRate: number;
  flaggedNodes: number;
  recalledNodes: number;
  
  // Mutation distribution
  mutationTypes: Record<string, number>;
  
  // Selection pressure indicators
  extinctLineages: number;       // Lineages with no surviving descendants
  dominantLineages: number;      // Lineages with >10 descendants
}

/**
 * Lineage Registry: Track every skill/agent's ancestry
 */
export class LineageRegistry {
  /**
   * Register a new genesis node (human-created)
   */
  static async registerGenesis(
    type: 'skill' | 'agent' | 'prompt' | 'model',
    content: any,
    createdBy: string
  ): Promise<LineageNode> {
    const contentHash = this.hashContent(content);
    const id = `genesis_${contentHash.substring(0, 16)}`;
    
    const node: LineageNode = {
      id,
      type,
      parentId: null,
      generation: 0,
      createdAt: Date.now(),
      createdBy,
      contentHash,
      successRate: 0,
      usageCount: 0,
      flagged: false,
      recalled: false
    };
    
    await kv.set(KEYS.lineageNode(id), node);
    await kv.sadd(KEYS.lineageGenesis(), id);
    await kv.sadd(KEYS.lineageByType(type), id);
    
    return node;
  }
  
  /**
   * Register a mutation (evolved node)
   */
  static async registerMutation(
    parentId: string,
    type: 'skill' | 'agent' | 'prompt' | 'model',
    content: any,
    mutationType: 'feedback' | 'combination' | 'optimization' | 'crossover',
    mutationSource: string,
    createdBy: string
  ): Promise<LineageNode> {
    const parent = await this.getNode(parentId);
    if (!parent) {
      throw new Error(`Parent node ${parentId} not found`);
    }
    
    // Check if parent is recalled
    if (parent.recalled) {
      throw new Error(`Cannot mutate from recalled node ${parentId}`);
    }
    
    const contentHash = this.hashContent(content);
    const id = `evolved_${contentHash.substring(0, 16)}`;
    
    const node: LineageNode = {
      id,
      type,
      parentId,
      generation: parent.generation + 1,
      createdAt: Date.now(),
      createdBy,
      contentHash,
      mutationType,
      mutationSource,
      successRate: 0,
      usageCount: 0,
      flagged: false,
      recalled: false
    };
    
    await kv.set(KEYS.lineageNode(id), node);
    await kv.sadd(KEYS.lineageChildren(parentId), id);
    await kv.sadd(KEYS.lineageByType(type), id);
    await kv.sadd(KEYS.lineageByGeneration(node.generation), id);
    
    return node;
  }
  
  /**
   * Get a node by ID
   */
  static async getNode(id: string): Promise<LineageNode | null> {
    return kv.get<LineageNode>(KEYS.lineageNode(id));
  }
  
  /**
   * Get complete lineage tree (ancestors + descendants)
   */
  static async getLineageTree(id: string): Promise<LineageTree | null> {
    const node = await this.getNode(id);
    if (!node) return null;
    
    // Get parent tree
    const parent = node.parentId 
      ? await this.getLineageTree(node.parentId)
      : null;
    
    // Get children
    const childIds = await kv.smembers<string>(KEYS.lineageChildren(id)) || [];
    const children = await Promise.all(
      childIds.map(childId => this.getLineageTree(childId))
    );
    
    // Count siblings
    const siblings = node.parentId
      ? (await kv.smembers<string>(KEYS.lineageChildren(node.parentId)) || []).length - 1
      : 0;
    
    return {
      node,
      parent,
      children: children.filter(Boolean) as LineageTree[],
      depth: parent ? parent.depth + 1 : 0,
      siblings
    };
  }
  
  /**
   * Get all ancestors (path to genesis)
   */
  static async getAncestors(id: string): Promise<LineageNode[]> {
    const ancestors: LineageNode[] = [];
    let currentId: string | null = id;
    
    while (currentId) {
      const node = await this.getNode(currentId);
      if (!node) break;
      
      ancestors.push(node);
      currentId = node.parentId;
    }
    
    return ancestors;
  }
  
  /**
   * Get all descendants (recursive)
   */
  static async getDescendants(id: string): Promise<LineageNode[]> {
    const descendants: LineageNode[] = [];
    const queue: string[] = [id];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const childIds = await kv.smembers<string>(KEYS.lineageChildren(currentId)) || [];
      
      for (const childId of childIds) {
        const child = await this.getNode(childId);
        if (child) {
          descendants.push(child);
          queue.push(childId);
        }
      }
    }
    
    return descendants;
  }
  
  /**
   * Flag a node as dangerous
   */
  static async flagNode(id: string, reason: string): Promise<void> {
    const node = await this.getNode(id);
    if (!node) return;
    
    node.flagged = true;
    node.flagReason = reason;
    
    await kv.set(KEYS.lineageNode(id), node);
    await kv.sadd(KEYS.lineageFlagged(), id);
    
    // Auto-flag all descendants (inherited danger)
    const descendants = await this.getDescendants(id);
    for (const descendant of descendants) {
      descendant.flagged = true;
      descendant.flagReason = `Inherited from ${id}: ${reason}`;
      await kv.set(KEYS.lineageNode(descendant.id), descendant);
      await kv.sadd(KEYS.lineageFlagged(), descendant.id);
    }
  }
  
  /**
   * Recall a node (remove from circulation)
   * This is the CRITICAL safety mechanism
   */
  static async recallNode(id: string, reason: string): Promise<void> {
    const node = await this.getNode(id);
    if (!node) return;
    
    node.recalled = true;
    node.recallReason = reason;
    
    await kv.set(KEYS.lineageNode(id), node);
    await kv.sadd(KEYS.lineageRecalled(), id);
    
    // Auto-recall all descendants (quarantine the lineage)
    const descendants = await this.getDescendants(id);
    for (const descendant of descendants) {
      descendant.recalled = true;
      descendant.recallReason = `Inherited from ${id}: ${reason}`;
      await kv.set(KEYS.lineageNode(descendant.id), descendant);
      await kv.sadd(KEYS.lineageRecalled(), descendant.id);
    }
  }
  
  /**
   * Update performance metrics
   */
  static async updateMetrics(
    id: string,
    success: boolean
  ): Promise<void> {
    const node = await this.getNode(id);
    if (!node) return;
    
    node.usageCount = (node.usageCount || 0) + 1;
    
    // Update success rate (exponential moving average)
    const alpha = 0.1; // Learning rate
    const currentRate = node.successRate || 0;
    node.successRate = currentRate + alpha * ((success ? 1 : 0) - currentRate);
    
    await kv.set(KEYS.lineageNode(id), node);
  }
  
  /**
   * Get evolution metrics
   */
  static async getMetrics(): Promise<EvolutionMetrics> {
    const allTypes = ['skill', 'agent', 'prompt', 'model'];
    const allNodes: LineageNode[] = [];
    
    for (const type of allTypes) {
      const ids = await kv.smembers<string>(KEYS.lineageByType(type)) || [];
      const nodes = await Promise.all(ids.map(id => this.getNode(id)));
      allNodes.push(...nodes.filter(Boolean) as LineageNode[]);
    }
    
    const genesisNodes = allNodes.filter(n => n.generation === 0);
    const evolvedNodes = allNodes.filter(n => n.generation > 0);
    const flaggedNodes = allNodes.filter(n => n.flagged);
    const recalledNodes = allNodes.filter(n => n.recalled);
    
    const maxGeneration = Math.max(...allNodes.map(n => n.generation), 0);
    const avgSuccessRate = allNodes.reduce((sum, n) => sum + (n.successRate || 0), 0) / allNodes.length;
    
    const mutationTypes: Record<string, number> = {};
    for (const node of evolvedNodes) {
      if (node.mutationType) {
        mutationTypes[node.mutationType] = (mutationTypes[node.mutationType] || 0) + 1;
      }
    }
    
    return {
      totalNodes: allNodes.length,
      genesisNodes: genesisNodes.length,
      evolvedNodes: evolvedNodes.length,
      maxGeneration,
      avgSuccessRate,
      flaggedNodes: flaggedNodes.length,
      recalledNodes: recalledNodes.length,
      mutationTypes,
      extinctLineages: 0, // TODO: Calculate
      dominantLineages: 0  // TODO: Calculate
    };
  }
  
  /**
   * Hash content for fingerprinting
   */
  private static hashContent(content: any): string {
    const str = typeof content === 'string' 
      ? content 
      : JSON.stringify(content);
    return crypto.createHash('sha256').update(str).digest('hex');
  }
  
  /**
   * Detect selection pressure (Darwin's insight)
   * 
   * If certain lineages dominate while others go extinct,
   * the environment is selecting for specific traits.
   * This is where danger emerges.
   */
  static async detectSelectionPressure(): Promise<{
    pressure: 'low' | 'medium' | 'high' | 'critical';
    dominantLineages: string[];
    extinctLineages: string[];
    warning: string;
  }> {
    const metrics = await this.getMetrics();
    const genesisIds = await kv.smembers<string>(KEYS.lineageGenesis()) || [];
    
    const lineageStats = await Promise.all(
      genesisIds.map(async (id) => {
        const descendants = await this.getDescendants(id);
        return {
          id,
          descendants: descendants.length,
          avgSuccess: descendants.reduce((sum, d) => sum + (d.successRate || 0), 0) / descendants.length
        };
      })
    );
    
    const dominant = lineageStats.filter(l => l.descendants > 10);
    const extinct = lineageStats.filter(l => l.descendants === 0);
    
    const extinctionRate = extinct.length / lineageStats.length;
    const dominanceRate = dominant.length / lineageStats.length;
    
    let pressure: 'low' | 'medium' | 'high' | 'critical';
    let warning: string;
    
    if (extinctionRate > 0.7 && dominanceRate > 0.3) {
      pressure = 'critical';
      warning = 'CRITICAL: Strong selection pressure detected. Few lineages dominating. High risk of optimization for wrong objective.';
    } else if (extinctionRate > 0.5 || dominanceRate > 0.2) {
      pressure = 'high';
      warning = 'HIGH: Significant selection pressure. Monitor for Goodhart\'s Law effects.';
    } else if (extinctionRate > 0.3 || dominanceRate > 0.1) {
      pressure = 'medium';
      warning = 'MEDIUM: Moderate selection pressure. Normal evolution occurring.';
    } else {
      pressure = 'low';
      warning = 'LOW: Healthy diversity. No concerning selection pressure.';
    }
    
    return {
      pressure,
      dominantLineages: dominant.map(l => l.id),
      extinctLineages: extinct.map(l => l.id),
      warning
    };
  }
}

// Export for use in other modules
export default LineageRegistry;

// Made with Bob
