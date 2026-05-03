import { kv } from './storage/adapter';
import { ResonanceEngine } from './resonance-engine';

/**
 * AIX P2P Router — Musk's First Principles
 * 
 * "Boil things down to their fundamental truths and reason up from there."
 * — Elon Musk
 * 
 * Question: Why do we need a central router?
 * Answer: We don't. Agents can compete directly in a P2P market.
 */

export interface TaskOffer {
  taskId: string;
  taskType: string;
  description: string;
  offeredBy: string;
  maxBudget: number;
  deadline: number;
  requirements?: Record<string, any>;
  createdAt: number;
}

export interface TaskBid {
  bidId: string;
  taskId: string;
  agentId: string;
  confidence: number; // 0-1 scale
  estimatedTime: number; // milliseconds
  price: number;
  resonanceScore: number; // from resonance engine
  bidScore: number; // calculated composite score
  createdAt: number;
}

export interface TaskAssignment {
  taskId: string;
  agentId: string;
  bid: TaskBid;
  assignedAt: number;
}

/**
 * Broadcast a task offer to the P2P network
 */
export async function broadcastTaskOffer(offer: Omit<TaskOffer, 'createdAt'>): Promise<void> {
  const taskOffer: TaskOffer = {
    ...offer,
    createdAt: Date.now()
  };
  
  const key = `p2p:task:${offer.taskId}`;
  await kv.set(key, taskOffer, { ex: 300 }); // 5 minute expiry
  
  // Add to active tasks list
  await kv.sadd('p2p:active_tasks', offer.taskId);
  
}

/**
 * Submit a bid for a task
 */
export async function submitBid(
  taskId: string,
  agentId: string,
  confidence: number,
  estimatedTime: number,
  price: number
): Promise<TaskBid> {
  // Get task offer
  const taskKey = `p2p:task:${taskId}`;
  const offer = await kv.get<TaskOffer>(taskKey);
  
  if (!offer) {
    throw new Error(`Task ${taskId} not found or expired`);
  }
  
  // Get resonance score for this agent/task type
  const resonance = await ResonanceEngine.getResonance(agentId);
  const resonanceScore = resonance?.frequencies[offer.taskType] || 0;
  
  // Calculate bid score: (confidence × 0.4) + (resonance × 0.4) + (price_efficiency × 0.2)
  const priceEfficiency = Math.max(0, Math.min(1, 1 - (price / offer.maxBudget)));
  const bidScore = 
    (confidence * 0.4) +
    (resonanceScore * 0.4) +
    (priceEfficiency * 0.2);
  
  const bid: TaskBid = {
    bidId: `${taskId}:${agentId}:${Date.now()}`,
    taskId,
    agentId,
    confidence,
    estimatedTime,
    price,
    resonanceScore,
    bidScore,
    createdAt: Date.now()
  };
  
  // Store bid
  const bidKey = `p2p:bid:${taskId}:${agentId}`;
  await kv.set(bidKey, bid, { ex: 300 }); // 5 minute expiry
  
  // Add to bids list for this task
  await kv.sadd(`p2p:bids:${taskId}`, agentId);
  
  
  return bid;
}

/**
 * Get all bids for a task
 */
export async function getTaskBids(taskId: string): Promise<TaskBid[]> {
  const agentIds = await kv.smembers<string>(`p2p:bids:${taskId}`);
  
  if (agentIds.length === 0) return [];
  
  const bids = await Promise.all(
    agentIds.map(agentId => kv.get<TaskBid>(`p2p:bid:${taskId}:${agentId}`))
  );
  
  return bids.filter((bid): bid is TaskBid => bid !== null);
}

/**
 * Select winning bid (highest score)
 */
export async function selectWinningBid(taskId: string): Promise<TaskAssignment | null> {
  const bids = await getTaskBids(taskId);
  
  if (bids.length === 0) {
    return null;
  }
  
  // Sort by bid score (highest first)
  bids.sort((a, b) => b.bidScore - a.bidScore);
  
  const winningBid = bids[0];
  
  const assignment: TaskAssignment = {
    taskId,
    agentId: winningBid.agentId,
    bid: winningBid,
    assignedAt: Date.now()
  };
  
  // Store assignment
  await kv.set(`p2p:assignment:${taskId}`, assignment);
  
  // Remove from active tasks
  await kv.srem('p2p:active_tasks', taskId);
  
  
  return assignment;
}

/**
 * Get active task offers
 */
export async function getActiveTasks(): Promise<TaskOffer[]> {
  const taskIds = await kv.smembers<string>('p2p:active_tasks');
  
  if (taskIds.length === 0) return [];
  
  const tasks = await Promise.all(
    taskIds.map(taskId => kv.get<TaskOffer>(`p2p:task:${taskId}`))
  );
  
  return tasks.filter((task): task is TaskOffer => task !== null);
}

/**
 * Cancel a task offer
 */
export async function cancelTaskOffer(taskId: string): Promise<void> {
  await kv.del(`p2p:task:${taskId}`);
  await kv.srem('p2p:active_tasks', taskId);
  
  // Clean up bids
  const agentIds = await kv.smembers<string>(`p2p:bids:${taskId}`);
  const bidKeys = agentIds.map(agentId => `p2p:bid:${taskId}:${agentId}`);
  if (bidKeys.length > 0) {
    await kv.del(bidKeys);
  }
  await kv.del(`p2p:bids:${taskId}`);
  
}

/**
 * Get assignment for a task
 */
export async function getTaskAssignment(taskId: string): Promise<TaskAssignment | null> {
  return await kv.get<TaskAssignment>(`p2p:assignment:${taskId}`);
}

/**
 * Get market statistics
 */
export async function getMarketStats(): Promise<{
  activeTasks: number;
  totalBids: number;
  avgBidsPerTask: number;
}> {
  const taskIds = await kv.smembers<string>('p2p:active_tasks');
  const activeTasks = taskIds.length;
  
  let totalBids = 0;
  for (const taskId of taskIds) {
    const bids = await kv.smembers<string>(`p2p:bids:${taskId}`);
    totalBids += bids.length;
  }
  
  return {
    activeTasks,
    totalBids,
    avgBidsPerTask: activeTasks > 0 ? totalBids / activeTasks : 0
  };
}

/**
 * Auto-bid: Agent automatically bids on tasks matching their capabilities
 */
export async function autoBid(
  agentId: string,
  taskTypes: string[],
  minConfidence: number = 0.6
): Promise<TaskBid[]> {
  const activeTasks = await getActiveTasks();
  const submittedBids: TaskBid[] = [];
  
  for (const task of activeTasks) {
    // Check if task type matches agent capabilities
    if (!taskTypes.includes(task.taskType)) continue;
    
    // Check if already bid
    const existingBid = await kv.get(`p2p:bid:${task.taskId}:${agentId}`);
    if (existingBid) continue;
    
    // Calculate confidence based on resonance
    const resonance = await ResonanceEngine.getResonance(agentId);
    const resonanceScore = resonance?.frequencies[task.taskType] || 0;
    const confidence = Math.min(0.95, resonanceScore + 0.2); // Boost confidence slightly
    
    if (confidence < minConfidence) continue;
    
    // Estimate time and price based on resonance
    const baseTime = 5000; // 5 seconds baseline
    const amplification = resonance?.amplification || 1;
    const estimatedTime = baseTime / amplification;
    const price = task.maxBudget * 0.8; // Bid 80% of max budget
    
    const bid = await submitBid(task.taskId, agentId, confidence, estimatedTime, price);
    submittedBids.push(bid);
  }
  
  if (submittedBids.length > 0) {
  }
  
  return submittedBids;
}

// Made with Bob
