import { z } from 'zod';
import { CircuitBreaker, CircuitState as CentralCircuitState } from './security/circuit-breaker';
import { GroqProvider } from './llm-provider';
import { getTrustChain } from './trust-chain';

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
    private breaker: CircuitBreaker;

    constructor() {
        this.breaker = new CircuitBreaker({
            name: 'SwarmRouter',
            failureThreshold: 3,
            recoveryTimeout: 9000
        });
    }

    /**
     * Register a new agent node to the swarm
     */
    public registerAgent(agent: AgentNode): void {
        const validated = AgentNodeSchema.parse(agent);
        
        if (this.agents.has(validated.id)) {
            throw new Error(`agent registration failed: ID ${validated.id} already exists`);
        }

        this.agents.set(validated.id, validated);

        console.log(
            `[SwarmRouter] Registered agent: ${validated.id} (role: ${validated.role}, trust: ${validated.trustLevel})`
        );
    }

    /**
     * Routes a task to the most capable agents using a weighted matrix
     * Returns an ExecutionPlan or throws error if unroutable
     * Mirrors Go's RouteTask() method with circuit breaker integration
     */
    public routeTask(taskInput: unknown): AgentExecutionPlan {
        const task = TaskDescriptorSchema.parse(taskInput);

        if (task.requiredCapabilities.length === 0) {
            throw new Error('task must have at least one required capability');
        }

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
                const avgCapScore = rawScore / task.requiredCapabilities.length;
                const finalScore = avgCapScore * (agent.trustLevel * 0.2) + task.priority * 0.1;
                candidates.push({ agentId: agent.id, score: finalScore });
            }
        }

        if (candidates.length === 0) {
            throw new Error(`task mismatch: no suitable agent found for task ${task.id}`);
        }

        candidates.sort((a, b) => b.score - a.score);
        const fallbackChain = candidates.slice(1, 4).map(c => c.agentId);

        return {
            taskId: task.id,
            primaryAgentId: candidates[0].agentId,
            fallbackChain,
            score: candidates[0].score,
        };
    }

    /**
     * Intelligent Routing with LLM decision making
     * 🌀 RULE 5: Meta-Loop active layers
     * 🔬 Research: Harvard SCORE τ-coupling
     */
    public async routeWithLLM(taskDescription: string, agentId?: string): Promise<string> {
        return this.breaker.execute(async () => {
            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey) throw new Error('GROQ_API_KEY missing');

            let selectedModel = 'llama-3.1-8b-instant'; // Default small
            let qualityThreshold = 0.5;

            // 🚀 TURBOQUANT: Performance-Aware Routing
            // Fetch recent performance patterns to adjust qualityThreshold
            if (agentId) {
                try {
                    const { ReadableMemory } = await import('./memory-readable');
                    const memoryTree = await ReadableMemory.getMemoryTree(agentId);
                    const skills = memoryTree.children?.find(c => c.id === 'skills')?.children || [];
                    
                    // Simple Quantization: If average skill successCount is high, we can use cheaper models
                    const avgSuccess = skills.reduce((acc, s) => acc + (s.metadata?.successCount || 0), 0) / (skills.length || 1);
                    if (avgSuccess > 5 && qualityThreshold > 0.5) {
                        console.log(`[SwarmRouter:TurboQuant] High competence (${avgSuccess.toFixed(1)}) detected, optimizing for efficiency.`);
                        qualityThreshold -= 0.1; // Optimization: competent agents need less powerful models
                    }
                } catch (e) {
                    console.warn('⚠️ Performance-aware routing failed, using default mood threshold');
                }
            }

            const lowerTask = taskDescription.toLowerCase();
            
            // Living Routing Logic based on τ
            if (qualityThreshold >= 0.7 || lowerTask.includes('analyze') || lowerTask.includes('code')) {
                selectedModel = 'llama-3.3-70b-versatile';
            } else if (qualityThreshold <= 0.2) {
                selectedModel = 'llama-3.1-8b-instant'; // Forced economy mode
            }

            const llm = new GroqProvider(apiKey, selectedModel);
            
            // Log decision to TrustChain (RULE 3)
            const trustChain = getTrustChain();
            await trustChain.append('ROUTING_DECISION', agentId || 'swarm-router', {
                task: taskDescription,
                model: selectedModel,
                qualityThreshold,
                timestamp: Date.now()
            });

            return selectedModel;
        });
    }

    public getDeadLetterQueue(): TaskDescriptor[] {
        return this.deadLetterQueue;
    }

    public getCircuitBreakerState(): CentralCircuitState {
        return this.breaker.getState();
    }
}

// Made with Moe Abdelaziz