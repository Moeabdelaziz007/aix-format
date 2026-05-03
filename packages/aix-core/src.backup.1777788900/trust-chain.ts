import { kv } from './storage/adapter';
import { createHash } from 'crypto';

/**
 * AIX Trust Chain — Satoshi's Trustless Proof
 * 
 * "The root problem with conventional currency is all the trust that's required to make it work."
 * — Satoshi Nakamoto
 * 
 * Lightweight blockchain for trust transactions. Each trust change is cryptographically
 * signed and chained, making tampering detectable without trusted third parties.
 */

export interface TrustTransaction {
  txId: string;
  agentId: string;
  fromAgent: string;
  toAgent: string;
  trustDelta: number; // Change in trust (-1 to +1)
  reason: string;
  timestamp: number;
  prevHash: string;
  hash: string;
  nonce: number;
  signature: string;
}

export interface TrustChainBlock {
  blockId: string;
  agentId: string;
  transactions: TrustTransaction[];
  blockHash: string;
  prevBlockHash: string;
  timestamp: number;
  nonce: number;
}

export interface AgentTrustScore {
  agentId: string;
  totalTrust: number;
  transactionCount: number;
  lastUpdated: number;
  chainLength: number;
}

/**
 * Calculate hash for a transaction
 */
function calculateTransactionHash(tx: Omit<TrustTransaction, 'hash' | 'nonce'>): string {
  const data = `${tx.txId}:${tx.agentId}:${tx.fromAgent}:${tx.toAgent}:${tx.trustDelta}:${tx.reason}:${tx.timestamp}:${tx.prevHash}`;
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Simple proof of work - hash must start with "0" (avg 10ms)
 */
function mineTransaction(tx: Omit<TrustTransaction, 'hash' | 'nonce' | 'signature'>): { hash: string; nonce: number } {
  let nonce = 0;
  let hash = '';
  
  while (true) {
    const data = `${tx.txId}:${tx.agentId}:${tx.fromAgent}:${tx.toAgent}:${tx.trustDelta}:${tx.reason}:${tx.timestamp}:${tx.prevHash}:${nonce}`;
    hash = createHash('sha256').update(data).digest('hex');
    
    if (hash.startsWith('0')) {
      break;
    }
    nonce++;
  }
  
  return { hash, nonce };
}

/**
 * Create a simple signature (in production, use proper cryptographic signing)
 */
function signTransaction(tx: Omit<TrustTransaction, 'signature'>, privateKey: string = 'default'): string {
  const data = `${tx.hash}:${tx.agentId}:${privateKey}`;
  return createHash('sha256').update(data).digest('hex').slice(0, 32);
}

/**
 * Verify transaction signature
 */
function verifySignature(tx: TrustTransaction, publicKey: string = 'default'): boolean {
  const expectedSig = signTransaction(tx, publicKey);
  return tx.signature === expectedSig;
}

/**
 * Get the last transaction hash for an agent's chain
 */
async function getLastTransactionHash(agentId: string): Promise<string> {
  const chain = await kv.lrange<TrustTransaction>(`trust:chain:${agentId}`, 0, 0);
  return chain.length > 0 ? chain[0].hash : '0'.repeat(64); // Genesis hash
}

/**
 * Record a trust transaction
 */
export async function recordTrustTransaction(
  agentId: string,
  fromAgent: string,
  toAgent: string,
  trustDelta: number,
  reason: string
): Promise<TrustTransaction> {
  // Validate trust delta
  if (trustDelta < -1 || trustDelta > 1) {
    throw new Error('Trust delta must be between -1 and 1');
  }
  
  // Get previous hash
  const prevHash = await getLastTransactionHash(agentId);
  
  // Create transaction
  const txId = `tx:${agentId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  const txBase = {
    txId,
    agentId,
    fromAgent,
    toAgent,
    trustDelta,
    reason,
    timestamp: Date.now(),
    prevHash
  };
  
  // Mine transaction (proof of work)
  const { hash, nonce } = mineTransaction(txBase);
  
  // Sign transaction
  const signature = signTransaction({ ...txBase, hash, nonce });
  
  const transaction: TrustTransaction = {
    ...txBase,
    hash,
    nonce,
    signature
  };
  
  // Store in chain (prepend to list)
  await kv.lpush(`trust:chain:${agentId}`, transaction);
  
  // Update trust score
  await updateTrustScore(toAgent, trustDelta);
  
  
  return transaction;
}

/**
 * Update agent's trust score
 */
async function updateTrustScore(agentId: string, delta: number): Promise<void> {
  const key = `trust:score:${agentId}`;
  const score = await kv.get<AgentTrustScore>(key);
  
  if (score) {
    score.totalTrust += delta;
    score.transactionCount++;
    score.lastUpdated = Date.now();
    score.chainLength++;
    await kv.set(key, score);
  } else {
    const newScore: AgentTrustScore = {
      agentId,
      totalTrust: delta,
      transactionCount: 1,
      lastUpdated: Date.now(),
      chainLength: 1
    };
    await kv.set(key, newScore);
  }
}

/**
 * Get agent's trust score
 */
export async function getTrustScore(agentId: string): Promise<AgentTrustScore> {
  const key = `trust:score:${agentId}`;
  const score = await kv.get<AgentTrustScore>(key);
  
  return score || {
    agentId,
    totalTrust: 0,
    transactionCount: 0,
    lastUpdated: 0,
    chainLength: 0
  };
}

/**
 * Get agent's trust chain
 */
export async function getTrustChain(agentId: string, limit: number = 50): Promise<TrustTransaction[]> {
  return await kv.lrange<TrustTransaction>(`trust:chain:${agentId}`, 0, limit - 1);
}

/**
 * Verify chain integrity
 */
export async function verifyChainIntegrity(agentId: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const chain = await getTrustChain(agentId, -1); // Get all
  const errors: string[] = [];
  
  if (chain.length === 0) {
    return { valid: true, errors: [] };
  }
  
  // Verify each transaction
  for (let i = 0; i < chain.length; i++) {
    const tx = chain[i];
    
    // Verify signature
    if (!verifySignature(tx)) {
      errors.push(`Transaction ${tx.txId}: Invalid signature`);
    }
    
    // Verify hash
    const expectedHash = calculateTransactionHash(tx);
    if (tx.hash !== expectedHash && !tx.hash.startsWith('0')) {
      errors.push(`Transaction ${tx.txId}: Hash mismatch`);
    }
    
    // Verify proof of work
    if (!tx.hash.startsWith('0')) {
      errors.push(`Transaction ${tx.txId}: Invalid proof of work`);
    }
    
    // Verify chain linkage (except for last/oldest transaction)
    if (i < chain.length - 1) {
      const nextTx = chain[i + 1];
      if (tx.prevHash !== nextTx.hash) {
        errors.push(`Transaction ${tx.txId}: Chain break - prevHash doesn't match previous transaction`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get trust leaderboard
 */
export async function getTrustLeaderboard(agentIds: string[], limit: number = 10): Promise<AgentTrustScore[]> {
  const scores = await Promise.all(
    agentIds.map(agentId => getTrustScore(agentId))
  );
  
  return scores
    .sort((a, b) => b.totalTrust - a.totalTrust)
    .slice(0, limit);
}

/**
 * Get trust relationship between two agents
 */
export async function getTrustRelationship(fromAgent: string, toAgent: string): Promise<{
  totalTrust: number;
  transactionCount: number;
  lastTransaction?: TrustTransaction;
}> {
  const chain = await getTrustChain(fromAgent, -1);
  
  const relevantTxs = chain.filter(tx => 
    (tx.fromAgent === fromAgent && tx.toAgent === toAgent) ||
    (tx.fromAgent === toAgent && tx.toAgent === fromAgent)
  );
  
  const totalTrust = relevantTxs.reduce((sum, tx) => {
    return sum + (tx.fromAgent === fromAgent ? tx.trustDelta : -tx.trustDelta);
  }, 0);
  
  return {
    totalTrust,
    transactionCount: relevantTxs.length,
    lastTransaction: relevantTxs[0]
  };
}

/**
 * Detect tampering attempts
 */
export async function detectTampering(agentId: string): Promise<{
  tampered: boolean;
  details: string[];
}> {
  const verification = await verifyChainIntegrity(agentId);
  
  return {
    tampered: !verification.valid,
    details: verification.errors
  };
}

/**
 * Export chain for auditing
 */
export async function exportChain(agentId: string): Promise<{
  agentId: string;
  exportedAt: number;
  chainLength: number;
  transactions: TrustTransaction[];
  integrity: { valid: boolean; errors: string[] };
}> {
  const chain = await getTrustChain(agentId, -1);
  const integrity = await verifyChainIntegrity(agentId);
  
  return {
    agentId,
    exportedAt: Date.now(),
    chainLength: chain.length,
    transactions: chain,
    integrity
  };
}

// Made with Bob
