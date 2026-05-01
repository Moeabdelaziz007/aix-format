import { z } from 'zod';

// 1. Zod Schemas for Validation
export const TaskDescriptorSchema = z.object({
    id: z.string().uuid(),
    type: z.enum(['planning', 'execution', 'review', 'archiving', 'general']),
    priority: z.number().min(1).max(5),
    requiredCapabilities: z.array(z.string()).min(1),
});
export type TaskDescriptor = z.infer<typeof TaskDescriptorSchema>;

export const AgentNodeSchema = z.object({
    id: z.string(),
    role: z.string(),
    trustLevel: z.number().min(0).max(5), // Based on AXIOM.md Trust Levels
    status: z.enum(['idle', 'busy', 'offline']),
    capabilities: z.record(z.string(), z.number().min(0).max(1.0)), // Weight matrix 0.0 to 1.0
});
export type AgentNode = z.infer<typeof AgentNodeSchema>;

export const AgentExecutionPlanSchema = z.object({
    taskId: z.string(),
    primaryAgentId: z.string(),
    fallbackChain: z.array(z.string()),
    score: z.number(),
});
export type AgentExecutionPlan = z.infer<typeof AgentExecutionPlanSchema>;

// 2. SwarmRouter Implementation
export class SwarmRouter {
    private agents: Map<string, AgentNode> = new Map();
    private deadLetterQueue: TaskDescriptor[] = [];

    /**
     * Register a new agent node to the swarm
     */
    public registerAgent(agent: AgentNode): void {
        const validated = AgentNodeSchema.parse(agent);
        this.agents.set(validated.id, validated);
    }

    /**
     * Routes a task to the most capable agents using a weighted matrix
     * Returns an ExecutionPlan or pushes to DLQ if unroutable
     */
    public routeTask(taskInput: unknown): AgentExecutionPlan | null {
        const task = TaskDescriptorSchema.parse(taskInput);
        const candidates: { agentId: string; score: number }[] = [];

        for (const agent of this.agents.values()) {
            if (agent.status !== 'idle') continue;

            let rawScore = 0;
            let hasAllRequired = true;

            // Capability Matrix Scoring
            for (const reqCap of task.requiredCapabilities) {
                const capWeight = agent.capabilities[reqCap];
                if (capWeight === undefined) {
                    hasAllRequired = false;
                    break;
                }
                rawScore += capWeight;
            }

            if (hasAllRequired) {
                // Final Score = (Average Capability Weight) * (Trust Level Multiplier) * Priority Boost
                const avgCapScore = rawScore / task.requiredCapabilities.length;
                const finalScore = avgCapScore * (agent.trustLevel * 0.2) + (task.priority * 0.1);
                candidates.push({ agentId: agent.id, score: finalScore });
            }
        }

        // Fallback: If no agent meets requirements, send to Dead Letter Queue
        if (candidates.length === 0) {
            this.deadLetterQueue.push(task);
            return null;
        }

        // Sort descending by score
        candidates.sort((a, b) => b.score - a.score);

        return AgentExecutionPlanSchema.parse({
            taskId: task.id,
            primaryAgentId: candidates[0].agentId,
            fallbackChain: candidates.slice(1).map(c => c.agentId),
            score: candidates[0].score,
        });
    }

    public getDeadLetterQueue(): TaskDescriptor[] {
        return this.deadLetterQueue;
    }
}