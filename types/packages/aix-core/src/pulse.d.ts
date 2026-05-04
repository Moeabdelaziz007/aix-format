/**
 * AIX Pulse Engine (v1.3.6)
 * Real-time event streaming for the AgenticKit.
 * Uses Redis lists as a high-speed event buffer.
 */
export type PulseEventType = 'INVOCATION' | 'SKILL_EXTRACTED' | 'SECURITY_ALERT' | 'MESSAGE_SENT' | 'AGENT_CALL' | 'EVOLUTION';
export interface PulseEvent {
    id: string;
    timestamp: number;
    type: PulseEventType;
    agentId: string;
    agentName: string;
    message: string;
    metadata?: Record<string, any>;
}
export declare class PulseEngine {
    private static GLOBAL_PULSE_KEY;
    /**
     * Records a live event to the global pulse stream.
     */
    static emit(event: Omit<PulseEvent, 'id' | 'timestamp'>): Promise<void>;
    /**
     * Retrieves the latest N events from the pulse stream.
     */
    static getLatest(count?: number): Promise<PulseEvent[]>;
}
