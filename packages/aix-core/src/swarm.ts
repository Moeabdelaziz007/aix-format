import { z } from 'zod';
import { kv, KEYS } from './storage';
import { CircuitBreaker } from './infra';
import { getTrustChain } from './trust-chain';

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
        return { primaryAgentId: candidates[0].id };
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
    async executePulse(agentId: string, action: string) {
        const frozen = await kv.get(KEYS.frozen(agentId));
        if (frozen) throw new Error("Agent frozen by safety protocol");
        
        // ... (Pulse logic)
        return { success: true };
    }
}

// Built with Moe Abdelaziz