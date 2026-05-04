/**
 * AIX Sovereign Gateway (Persistent Agent Loop)
 * Inspired by OpenClaw: Agent as a persistent process, not a transient request.
 */
export type GatewayStatus = 'IDLE' | 'THINKING' | 'ACTING' | 'WAITING' | 'COMPLETED' | 'FAILED';
export interface GatewayProcess {
    id: string;
    agentId: string;
    status: GatewayStatus;
    history: Array<{
        role: string;
        content: string;
        timestamp: number;
    }>;
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
 */
export declare class GatewayManager {
    /**
     * Initializes a new agentic process (The Control Plane).
     */
    static spawn(agentId: string, task: string, metadata?: any): Promise<GatewayProcess>;
    /**
     * Updates the state of a running process (The Heartbeat).
     */
    static pulse(processId: string, update: Partial<GatewayProcess>): Promise<GatewayProcess>;
    /**
     * Retrieves the current state of a process.
     */
    static getProcess(processId: string): Promise<GatewayProcess | null>;
    /**
     * Appends an observation to the process (The ReAct Loop).
     */
    static recordObservation(processId: string, actionId: string, result: any): Promise<void>;
    /**
     * Resource Locking for M2M Integrity
     */
    static lockAgent(agentId: string, processId: string): Promise<boolean>;
    static unlockAgent(agentId: string): Promise<void>;
}
