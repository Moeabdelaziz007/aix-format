/**
 * AIX Pet Orchestrator (v1.3.5)
 * Manages the evolution and state of agent personas.
 */
export declare class PetOrchestrator {
    /**
     * Syncs pet state and mood based on activity.
     */
    static sync(agentId: string, pet: any, manifest: any): Promise<void>;
    /**
     * Resets pet to idle state.
     */
    static settle(agentId: string): Promise<void>;
    /**
     * Evaluates if agent should enter Sleep Mode (7 days inactivity).
     * Saves compute resources by 'hibernating' the gateway.
     */
    static checkSleepMode(agentId: string): Promise<boolean>;
}
