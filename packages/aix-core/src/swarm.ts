import { z } from 'zod';
import { kv, KEYS } from './memory/storage.js';
import { CircuitBreaker } from './infra.js';
import { health } from './health.js';
import { OrchestrationPlan, OrchestrationStep, OrchestrationPlanSchema, BusEventSchema } from './domain.js';
import { getRustBridge } from '@aix/rust-core/src/bridge.js';

/**
 * 🐝 SOVEREIGN_SWARM
 * Orchestration, Routing, and Collaborative Execution.
 * Made with Moe Abdelaziz
 */

// --- ROUTER SCHEMAS ---

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
    trustLevel: z.number().min(0).max(5),
    status: z.enum(['idle', 'busy', 'offline']),
    capabilities: z.record(z.string(), z.number().min(0).max(1.0)),
});
export type AgentNode = z.infer<typeof AgentNodeSchema>;

// --- SWARM ROUTER ---

export class SwarmRouter {
    private agents: Map<string, AgentNode> = new Map();
    private breaker: CircuitBreaker;
    private rust = getRustBridge();

    constructor() {
        this.breaker = new CircuitBreaker({
            name: 'SwarmRouter',
            failureThreshold: 3,
            recoveryTimeout: 9000
        });
    }

    public registerAgent(agent: AgentNode): void {
        const validated = AgentNodeSchema.parse(agent);
        this.agents.set(validated.id, validated);
        console.log(`[Swarm:Router] Registered ${validated.id}`);
    }

    public async routeTask(taskInput: unknown): Promise<{ primaryAgentId: string }> {
        const task = TaskDescriptorSchema.parse(taskInput);
        const candidates = Array.from(this.agents.values())
            .filter(a => a.status === 'idle')
            .map(a => {
                let score = 0;
                task.requiredCapabilities.forEach(c => score += (a.capabilities[c] || 0));
                return { id: a.id, score: score * a.trustLevel };
            })
            .sort((a, b) => b.score - a.score);

        if (candidates.length === 0) throw new Error('No capable agents found');
        
        const primaryAgentId = candidates[0].id;

        // Audit Routing in Pulse
        await this.rust.eventStore.publish(BusEventSchema.parse({
            type: 'TaskSpawned',
            agent_id: primaryAgentId,
            task_id: task.id,
            timestamp: Date.now()
        }));

        return { primaryAgentId };
    }

    public async getDecisionModel(task: string): Promise<string> {
        return this.breaker.execute(async () => {
            const complexity = task.length > 100 ? 0.8 : 0.3;
            return complexity > 0.7 ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant';
        });
    }
}

// --- PULSE ENGINE ---

export class PulseOrchestrator {
    async createPlan(agents: Array<{ id: string; role: string; capabilities: string[] }>, task: string, strategy: 'sequential' | 'parallel' | 'hierarchical'): Promise<OrchestrationPlan> {
        const planId = `swarm_${Date.now()}`;
        const steps: OrchestrationStep[] = [];

        if (strategy === 'sequential') {
            agents.forEach((agent, index) => {
                steps.push({
                    step: index + 1,
                    agentId: agent.id,
                    role: agent.role,
                    dependencies: index > 0 ? [agents[index - 1].id] : [],
                    estimatedDuration: 5000
                });
            });
        } else if (strategy === 'parallel') {
            agents.forEach((agent, index) => {
                steps.push({
                    step: index + 1,
                    agentId: agent.id,
                    role: agent.role,
                    dependencies: [],
                    estimatedDuration: 5000
                });
            });
        } else if (strategy === 'hierarchical') {
            steps.push({
                step: 1,
                agentId: agents[0].id,
                role: 'coordinator',
                dependencies: [],
                estimatedDuration: 2000
            });
            agents.slice(1).forEach((agent, index) => {
                steps.push({
                    step: index + 2,
                    agentId: agent.id,
                    role: agent.role,
                    dependencies: [agents[0].id],
                    estimatedDuration: 5000
                });
            });
        }

        const estimatedTime = this.calculateEstimatedTime(strategy, steps);
        const costEstimate = agents.length * 0.05;

        return OrchestrationPlanSchema.parse({
            id: planId,
            strategy,
            task,
            agents: agents.map(a => a.id),
            steps,
            estimatedTime,
            costEstimate
        });
    }

    private calculateEstimatedTime(strategy: string, steps: OrchestrationStep[]): number {
        if (strategy === 'sequential') {
            return steps.reduce((sum, step) => sum + step.estimatedDuration, 0);
        } else if (strategy === 'parallel') {
            return Math.max(...steps.map(s => s.estimatedDuration));
        } else {
            return steps[0].estimatedDuration + Math.max(...steps.slice(1).map(s => s.estimatedDuration));
        }
    }

    async executePulse(agentId: string, action: string) {
        const frozen = await kv.get(KEYS.frozen(agentId));
        if (frozen) throw new Error("Agent frozen by safety protocol");
        
        return { success: true };
    }
}

// Built with Moe Abdelaziz