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

// Circuit Breaker States
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * RouterMetrics tracks performance and health metrics
 * Mirrors Go's RouterMetrics struct
 */
export class RouterMetrics {
    public tasksRouted: number = 0;
    public tasksFailed: number = 0;
    public breakerTrips: number = 0;
    public recoveries: number = 0;
    public activeAgents: number = 0;

    public toJSON() {
        return {
            tasksRouted: this.tasksRouted,
            tasksFailed: this.tasksFailed,
            breakerTrips: this.breakerTrips,
            recoveries: this.recoveries,
            activeAgents: this.activeAgents,
        };
    }
}

/**
 * CircuitBreaker implements the circuit breaker pattern
 * Mirrors Go's CircuitBreaker with exact same thresholds and behavior
 *
 * States:
 * - Closed: Normal operation, requests pass through
 * - Open: Failures exceeded threshold, requests blocked
 * - Half-Open: Testing if system recovered, limited requests allowed
 */
export class CircuitBreaker {
    private failureThreshold: number;
    private successThreshold: number;
    private failureCount: number = 0;
    private successCount: number = 0;
    private lastFailure: Date | null = null;
    private openDuration: number; // milliseconds
    private state: CircuitState = 'closed';

    constructor(
        failureThreshold: number = 5,
        successThreshold: number = 3,
        openDurationMs: number = 30000 // 30 seconds
    ) {
        this.failureThreshold = failureThreshold;
        this.successThreshold = successThreshold;
        this.openDuration = openDurationMs;
    }

    /**
     * Record a failure and potentially trip the breaker
     * Mirrors Go's RecordFailure() method
     */
    public recordFailure(metrics: RouterMetrics | null = null): void {
        this.failureCount++;
        this.successCount = 0;

        if (metrics) {
            metrics.tasksFailed++;
        }

        if (this.state === 'half-open' || this.failureCount >= this.failureThreshold) {
            const prevState = this.state;
            this.state = 'open';
            this.lastFailure = new Date();

            if (metrics) {
                metrics.breakerTrips++;
            }

            console.log(
                `[CircuitBreaker] ${prevState} -> OPEN (Failures: ${this.failureCount}, Total Trips: ${metrics?.breakerTrips ?? 0})`
            );
        }
    }

    /**
     * Record a success and potentially close the breaker
     * Mirrors Go's RecordSuccess() method
     */
    public recordSuccess(metrics: RouterMetrics | null = null): void {
        if (metrics) {
            metrics.tasksRouted++;
        }

        if (this.state === 'half-open') {
            this.successCount++;
            if (this.successCount >= this.successThreshold) {
                this.state = 'closed';
                this.failureCount = 0;
                this.successCount = 0;

                if (metrics) {
                    metrics.recoveries++;
                }

            }
        } else if (this.state === 'closed') {
            this.failureCount = 0;
        }
    }

    /**
     * Check if requests are allowed through the breaker
     * Mirrors Go's IsAllowed() method
     */
    public isAllowed(): boolean {
        if (this.state === 'closed') {
            return true;
        }
        if (this.state === 'open') {
            if (this.lastFailure && Date.now() - this.lastFailure.getTime() > this.openDuration) {
                return true;
            }
            return false;
        }
        return true; // half-open allows probing
    }

    /**
     * Check state and transition to half-open if ready
     * Mirrors Go's CheckAndProbe() method
     */
    public checkAndProbe(): boolean {
        if (this.state === 'closed') {
            return true;
        }
        if (this.state === 'open') {
            if (this.lastFailure && Date.now() - this.lastFailure.getTime() > this.openDuration) {
                this.state = 'half-open';
                return true;
            }
            return false;
        }
        return true; // already half-open
    }

    public getState(): CircuitState {
        return this.state;
    }

    public getFailureCount(): number {
        return this.failureCount;
    }

    public getSuccessCount(): number {
        return this.successCount;
    }
}

// 2. SwarmRouter Implementation
export class SwarmRouter {
    private agents: Map<string, AgentNode> = new Map();
    private deadLetterQueue: TaskDescriptor[] = [];
    private breaker: CircuitBreaker;
    private metrics: RouterMetrics;

    constructor() {
        // Initialize with same values as Go: failureThreshold=5, successThreshold=3, openDuration=30s
        this.breaker = new CircuitBreaker(5, 3, 30000);
        this.metrics = new RouterMetrics();
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
        this.metrics.activeAgents = this.agents.size;

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
        // Check and Probe Circuit Breaker
        if (!this.breaker.checkAndProbe()) {
            this.breaker.recordFailure(this.metrics);
            throw new Error(
                `routing service is currently unavailable: circuit breaker is in ${this.breaker.getState()} state`
            );
        }

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
                // Final Score = (Average Capability Weight) * (Trust Level Multiplier) * Priority Boost
                const avgCapScore = rawScore / task.requiredCapabilities.length;
                const finalScore = avgCapScore * (agent.trustLevel * 0.2) + task.priority * 0.1;
                candidates.push({ agentId: agent.id, score: finalScore });
            }
        }

        // Error Discrimination: Missing capabilities vs infrastructure failure
        if (candidates.length === 0) {
            if (this.agents.size === 0) {
                // Infrastructure failure - record breaker failure
                this.breaker.recordFailure(this.metrics);
                throw new Error('infrastructure failure: no agents registered in the swarm');
            }

            // Task mismatch - don't record breaker failure to avoid false positives
            throw new Error(
                `task mismatch: no suitable agent found for task ${task.id} with capabilities [${task.requiredCapabilities.join(', ')}]`
            );
        }

        // Sort descending by score
        candidates.sort((a, b) => b.score - a.score);

        // Limit fallback chain to 3 agents (matching Go implementation)
        const fallbackChain = candidates.slice(1, 4).map(c => c.agentId);

        const plan: AgentExecutionPlan = {
            taskId: task.id,
            primaryAgentId: candidates[0].agentId,
            fallbackChain,
            score: candidates[0].score,
        };

        // Record success in circuit breaker
        this.breaker.recordSuccess(this.metrics);

        console.log(
            `[SwarmRouter] Routed task ${task.id} to agent ${plan.primaryAgentId} (score: ${plan.score.toFixed(2)}, fallbacks: ${fallbackChain.length})`
        );

        return plan;
    }

    public getDeadLetterQueue(): TaskDescriptor[] {
        return this.deadLetterQueue;
    }

    public getMetrics(): RouterMetrics {
        return this.metrics;
    }

    public getCircuitBreakerState(): CircuitState {
        return this.breaker.getState();
    }

    /**
     * Expose breaker for testing purposes
     */
    public getCircuitBreaker(): CircuitBreaker {
        return this.breaker;
    }
}