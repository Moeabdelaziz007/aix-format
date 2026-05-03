import { kv, KEYS, TTL } from './index';

/**
 * AIX Sovereign Gateway (Persistent Agent Loop)
 * Inspired by OpenClaw: Agent as a persistent process, not a transient request.
 */

export type GatewayStatus = 'IDLE' | 'THINKING' | 'ACTING' | 'WAITING' | 'COMPLETED' | 'FAILED';

export interface GatewayProcess {
  id: string;
  agentId: string;
  status: GatewayStatus;
  history: Array<{ role: string; content: string; timestamp: number }>;
  currentTask: string;
  lastThought?: string;
  lastAction?: string;
  observations: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Manages the lifecycle of persistent agent processes.
 * @example
 * const proc = await GatewayManager.spawn("agent-1", "do task");
 */
export class GatewayManager {
  /**
   * Initializes a new agentic process (The Control Plane).
   * @param {string} agentId - The agent identifier.
   * @param {string} task - The task to execute.
   * @param {any} [metadata] - Additional metadata.
   * @returns {Promise<GatewayProcess>} The spawned gateway process.
   * @example
   * const proc = await GatewayManager.spawn("agent-1", "do task");
   */
  static async spawn(agentId: string, task: string, metadata: any = {}): Promise<GatewayProcess> {
    const processId = `proc_${Math.random().toString(36).slice(2, 11)}`;
    const process: GatewayProcess = {
      id: processId,
      agentId,
      status: 'THINKING',
      history: [{ role: 'user', content: task, timestamp: Date.now() }],
      currentTask: task,
      observations: {},
      metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await kv.set(KEYS.gateway(processId), process, { ex: TTL.GATEWAY });
    console.log(`[Gateway] Spawned persistent process ${processId} for agent ${agentId}`);
    return process;
  }

  /**
   * Updates the state of a running process (The Heartbeat).
   * @param {string} processId - The process identifier.
   * @param {Partial<GatewayProcess>} update - Process updates to apply.
   * @returns {Promise<GatewayProcess>} The updated process state.
   * @example
   * await GatewayManager.pulse("proc-1", { status: 'COMPLETED' });
   */
  static async pulse(processId: string, update: Partial<GatewayProcess>): Promise<GatewayProcess> {
    const key = KEYS.gateway(processId);
    const existing = await kv.get<GatewayProcess>(key);
    
    if (!existing) {
      throw new Error(`[Gateway] Process ${processId} not found or expired.`);
    }

    const updated = {
      ...existing,
      ...update,
      updatedAt: Date.now()
    };

    await kv.set(key, updated, { ex: TTL.GATEWAY });
    return updated;
  }

  /**
   * Retrieves the current state of a process.
   * @param {string} processId - The process identifier.
   * @returns {Promise<GatewayProcess | null>} The process state.
   * @example
   * const proc = await GatewayManager.getProcess("proc-1");
   */
  static async getProcess(processId: string): Promise<GatewayProcess | null> {
    return kv.get<GatewayProcess>(KEYS.gateway(processId));
  }

  /**
   * Appends an observation to the process (The ReAct Loop).
   * @param {string} processId - The process identifier.
   * @param {string} actionId - The action identifier.
   * @param {any} result - The observation result.
   * @returns {Promise<void>} Resolves when recorded.
   * @example
   * await GatewayManager.recordObservation("proc-1", "act-1", { success: true });
   */
  static async recordObservation(processId: string, actionId: string, result: any): Promise<void> {
    const process = await this.getProcess(processId);
    if (!process) return;

    const observations = { ...process.observations, [actionId]: result };
    await this.pulse(processId, { 
      observations,
      status: 'THINKING', 
      history: [
        ...process.history,
        { role: 'system', content: `Observation (${actionId}): ${JSON.stringify(result)}`, timestamp: Date.now() }
      ]
    });
    
    // Auto-unlock after observation
    await this.unlockAgent(process.agentId);
  }

  /**
   * Resource Locking for M2M Integrity
   * @param {string} agentId - The agent identifier.
   * @param {string} processId - The process identifier.
   * @returns {Promise<boolean>} True if lock was acquired.
   * @example
   * const locked = await GatewayManager.lockAgent("agent-1", "proc-1");
   */
  static async lockAgent(agentId: string, processId: string): Promise<boolean> {
    const lockKey = `aix:lock:agent:${agentId}`;
    try {
      // Upstash set with nx returns true/false or null
      await kv.set(lockKey, processId, { nx: true, ex: 300 }); 
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Releases the resource lock for an agent.
   * @param {string} agentId - The agent identifier.
   * @returns {Promise<void>} Resolves when the lock is released.
   * @example
   * await GatewayManager.unlockAgent("agent-1");
   */
  static async unlockAgent(agentId: string): Promise<void> {
    await kv.del(`aix:lock:agent:${agentId}`);
  }
}
