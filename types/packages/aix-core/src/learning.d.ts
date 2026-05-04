/**
 * AIX Hermes Learning Engine
 * Implements Layer 2 (Skill Memory) by extracting successful procedures from agent runs.
 */
export interface ProcedureStep {
    tool: string;
    input: any;
    output: any;
    success: boolean;
}
export interface LearnedProcedure {
    goal: string;
    steps: ProcedureStep[];
    timestamp: number;
}
export interface FeedbackSkill {
    prompt: string;
    response: string;
    usedAt: number;
    successCount: number;
}
/**
 * Records a successful run as a 'Learned Skill'.
 * In the Hermes model, we don't save what happened, we save what worked.
 */
export declare function recordSuccessfulProcedure(agentId: string, goal: string, steps: ProcedureStep[]): Promise<void>;
/**
 * Skill Extraction (Hermes Pattern)
 * Triggered by positive user feedback (thumbs up).
 * Saves the successful interaction as a reusable skill.
 */
export declare function extractSkillFromFeedback(agentId: string, prompt: string, response: string): Promise<string>;
/**
 * Retrieves learned procedures for an agent to be used as 'few-shot' context or specific skills.
 */
export declare function getLearnedProcedures(agentId: string): Promise<LearnedProcedure[]>;
/**
 * Retrieves all feedback-driven skills for an agent.
 */
export declare function getFeedbackSkills(agentId: string): Promise<FeedbackSkill[]>;
/**
 * Episodic Memory: Pattern Recognition
 * Placeholder for long-term pattern extraction (Layer 4).
 */
export declare function updateEpisodicMemory(agentId: string, pattern: string): Promise<void>;
