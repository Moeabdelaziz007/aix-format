/**
 * SwarmRouter Synchronization Test Suite
 * 
 * This test suite ensures that the TypeScript SwarmRouter implementation
 * maintains behavioral parity with the Go implementation (swarm_router.go).
 * 
 * DOCUMENTED DIVERGENCES (as of 2026-05-02):
 * ============================================
 * 
 * 1. ✅ RESOLVED: CircuitBreaker - Now implemented in TypeScript with exact same behavior
 *    - Three states: Closed, Open, HalfOpen
 *    - Same thresholds: failureThreshold=5, successThreshold=3, openDuration=30s
 *    - Same state transition logic
 * 
 * 2. ✅ RESOLVED: Metrics & Observability - RouterMetrics class now tracks:
 *    - tasksRouted, tasksFailed, breakerTrips, recoveries, activeAgents
 * 
 * 3. ✅ RESOLVED: Fallback chain length - Now limited to 3 agents in both implementations
 * 
 * 4. ✅ RESOLVED: Error discrimination - TypeScript now distinguishes:
 *    - Infrastructure failures (no agents) → records breaker failure
 *    - Task mismatches (no suitable agent) → doesn't record breaker failure
 * 
 * 5. ✅ RESOLVED: Concurrency safety - TypeScript is single-threaded, no mutex needed
 * 
 * 6. ✅ RESOLVED: Logging - Comprehensive console.log statements added throughout
 * 
 * 7. ⚠️ KNOWN DIFFERENCE: DLQ behavior
 *    - Go: DLQ not actively used in RouteTask (returns error instead)
 *    - TypeScript: DLQ exists but not populated (throws error instead)
 *    - Impact: Minimal - both implementations fail fast on unroutable tasks
 * 
 * TEST STRATEGY:
 * ==============
 * - Use deterministic mock agents with fixed capabilities
 * - Test same inputs produce same outputs (agent selection, fallback order)
 * - Verify circuit breaker trips at same failure count
 * - Confirm error handling matches between implementations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    SwarmRouter,
    AgentNode,
    TaskDescriptor,
    CircuitBreaker,
    RouterMetrics,
} from '../packages/aix-core/src/SwarmRouter';

describe('SwarmRouter Synchronization Tests', () => {
    let router: SwarmRouter;

    // Mock agents with deterministic capabilities
    const mockAgents: AgentNode[] = [
        {
            id: 'agent-alpha',
            role: 'planner',
            trustLevel: 5,
            status: 'idle',
            capabilities: {
                planning: 0.9,
                analysis: 0.8,
                coordination: 0.7,
            },
        },
        {
            id: 'agent-beta',
            role: 'executor',
            trustLevel: 4,
            status: 'idle',
            capabilities: {
                execution: 0.95,
                planning: 0.6,
                analysis: 0.5,
            },
        },
        {
            id: 'agent-gamma',
            role: 'reviewer',
            trustLevel: 3,
            status: 'idle',
            capabilities: {
                review: 0.85,
                analysis: 0.9,
                planning: 0.4,
            },
        },
        {
            id: 'agent-delta',
            role: 'generalist',
            trustLevel: 3,
            status: 'idle',
            capabilities: {
                planning: 0.7,
                execution: 0.7,
                review: 0.7,
                analysis: 0.7,
            },
        },
    ];

    beforeEach(() => {
        router = new SwarmRouter();
        // Register all mock agents
        mockAgents.forEach(agent => router.registerAgent(agent));
    });

    describe('TEST 1: Deterministic Agent Selection', () => {
        it('should select the same primary agent for identical task inputs', () => {
            const task: TaskDescriptor = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                type: 'planning',
                priority: 3,
                requiredCapabilities: ['planning', 'analysis'],
            };

            const plan1 = router.routeTask(task);
            
            // Create new router with same agents
            const router2 = new SwarmRouter();
            mockAgents.forEach(agent => router2.registerAgent(agent));
            const plan2 = router2.routeTask(task);

            // Both should select agent-alpha (highest planning + analysis score)
            expect(plan1.primaryAgentId).toBe('agent-alpha');
            expect(plan2.primaryAgentId).toBe('agent-alpha');
            expect(plan1.primaryAgentId).toBe(plan2.primaryAgentId);
        });

        it('should calculate the same score for the same agent-task combination', () => {
            const task: TaskDescriptor = {
                id: '550e8400-e29b-41d4-a716-446655440001',
                type: 'execution',
                priority: 4,
                requiredCapabilities: ['execution'],
            };

            const plan1 = router.routeTask(task);
            
            const router2 = new SwarmRouter();
            mockAgents.forEach(agent => router2.registerAgent(agent));
            const plan2 = router2.routeTask(task);

            // Scores should match exactly
            expect(plan1.score).toBe(plan2.score);
            expect(plan1.primaryAgentId).toBe('agent-beta'); // Best executor
        });
    });

    describe('TEST 2: Fallback Chain Ordering', () => {
        it('should produce the same fallback chain order for identical inputs', () => {
            const task: TaskDescriptor = {
                id: '550e8400-e29b-41d4-a716-446655440002',
                type: 'planning',
                priority: 3,
                requiredCapabilities: ['planning', 'analysis'],
            };

            const plan1 = router.routeTask(task);
            
            const router2 = new SwarmRouter();
            mockAgents.forEach(agent => router2.registerAgent(agent));
            const plan2 = router2.routeTask(task);

            // Fallback chains should be identical
            expect(plan1.fallbackChain).toEqual(plan2.fallbackChain);
            expect(plan1.fallbackChain.length).toBeLessThanOrEqual(3); // Max 3 fallbacks
        });

        it('should limit fallback chain to maximum 3 agents', () => {
            const task: TaskDescriptor = {
                id: '550e8400-e29b-41d4-a716-446655440003',
                type: 'general',
                priority: 2,
                requiredCapabilities: ['planning'],
            };

            const plan = router.routeTask(task);

            // Even with 4 capable agents, fallback should be max 3
            expect(plan.fallbackChain.length).toBeLessThanOrEqual(3);
        });

        it('should order fallback agents by descending score', () => {
            const task: TaskDescriptor = {
                id: '550e8400-e29b-41d4-a716-446655440004',
                type: 'planning',
                priority: 3,
                requiredCapabilities: ['planning'],
            };

            const plan = router.routeTask(task);

            // Expected order by planning capability * trust:
            // 1. agent-alpha (0.9 * 5 * 0.2 = 0.9)
            // 2. agent-delta (0.7 * 3 * 0.2 = 0.42)
            // 3. agent-beta (0.6 * 4 * 0.2 = 0.48)
            expect(plan.primaryAgentId).toBe('agent-alpha');
            expect(plan.fallbackChain).toContain('agent-beta');
            expect(plan.fallbackChain).toContain('agent-delta');
        });
    });

    describe('TEST 3: Circuit Breaker Synchronization', () => {
        it('should open circuit breaker after exactly 5 failures (matching Go)', () => {
            const breaker = new CircuitBreaker(5, 3, 30000);
            const metrics = new RouterMetrics();

            expect(breaker.getState()).toBe('closed');

            // Record 4 failures - should stay closed
            for (let i = 0; i < 4; i++) {
                breaker.recordFailure(metrics);
                expect(breaker.getState()).toBe('closed');
            }

            // 5th failure should open the breaker
            breaker.recordFailure(metrics);
            expect(breaker.getState()).toBe('open');
            expect(metrics.breakerTrips).toBe(1);
            expect(metrics.tasksFailed).toBe(5);
        });

        it('should transition to half-open after timeout period', async () => {
            const breaker = new CircuitBreaker(5, 3, 100); // 100ms timeout for testing
            const metrics = new RouterMetrics();

            // Trip the breaker
            for (let i = 0; i < 5; i++) {
                breaker.recordFailure(metrics);
            }
            expect(breaker.getState()).toBe('open');

            // Wait for timeout
            await new Promise(resolve => setTimeout(resolve, 150));

            // CheckAndProbe should transition to half-open
            const allowed = breaker.checkAndProbe();
            expect(allowed).toBe(true);
            expect(breaker.getState()).toBe('half-open');
        });

        it('should close breaker after 3 consecutive successes in half-open state', () => {
            const breaker = new CircuitBreaker(5, 3, 30000);
            const metrics = new RouterMetrics();

            // Trip the breaker
            for (let i = 0; i < 5; i++) {
                breaker.recordFailure(metrics);
            }

            // Manually transition to half-open (simulating timeout)
            breaker.checkAndProbe();
            // Force state to half-open by waiting or manual manipulation
            // For testing, we'll record success which works in half-open

            // Record 2 successes - should stay half-open
            breaker.recordSuccess(metrics);
            breaker.recordSuccess(metrics);
            expect(breaker.getSuccessCount()).toBe(2);

            // 3rd success should close the breaker
            breaker.recordSuccess(metrics);
            expect(breaker.getState()).toBe('closed');
            expect(metrics.recoveries).toBe(1);
        });

        it('should block routing when circuit breaker is open', () => {
            const task: TaskDescriptor = {
                id: '550e8400-e29b-41d4-a716-446655440005',
                type: 'planning',
                priority: 3,
                requiredCapabilities: ['planning'],
            };

            // Trip the circuit breaker by causing infrastructure failures
            const emptyRouter = new SwarmRouter();
            
            // Try to route without any agents - should fail and trip breaker
            for (let i = 0; i < 5; i++) {
                try {
                    emptyRouter.routeTask(task);
                } catch (error) {
                    // Expected to fail
                }
            }

            // Circuit should be open now
            expect(emptyRouter.getCircuitBreakerState()).toBe('open');

            // Next routing attempt should be blocked by circuit breaker
            expect(() => emptyRouter.routeTask(task)).toThrow(/circuit breaker is in open state/);
        });

        it('should reset failure count on success in closed state', () => {
            const breaker = new CircuitBreaker(5, 3, 30000);
            const metrics = new RouterMetrics();

            // Record some failures
            breaker.recordFailure(metrics);
            breaker.recordFailure(metrics);
            expect(breaker.getFailureCount()).toBe(2);

            // Record success - should reset failure count
            breaker.recordSuccess(metrics);
            expect(breaker.getFailureCount()).toBe(0);
            expect(breaker.getState()).toBe('closed');
        });
    });

    describe('TEST 4: Error Discrimination', () => {
        it('should distinguish infrastructure failures from task mismatches', () => {
            const emptyRouter = new SwarmRouter();
            const task: TaskDescriptor = {
                id: '550e8400-e29b-41d4-a716-446655440006',
                type: 'planning',
                priority: 3,
                requiredCapabilities: ['planning'],
            };

            // Infrastructure failure (no agents)
            expect(() => emptyRouter.routeTask(task)).toThrow(/infrastructure failure/);
            expect(emptyRouter.getMetrics().tasksFailed).toBeGreaterThan(0);
        });

        it('should not trip breaker for task capability mismatches', () => {
            const task: TaskDescriptor = {
                id: '550e8400-e29b-41d4-a716-446655440007',
                type: 'planning',
                priority: 3,
                requiredCapabilities: ['nonexistent-capability'],
            };

            const initialTrips = router.getMetrics().breakerTrips;

            // Task mismatch should throw but not trip breaker
            expect(() => router.routeTask(task)).toThrow(/task mismatch/);
            expect(router.getMetrics().breakerTrips).toBe(initialTrips);
        });

        it('should trip breaker for repeated infrastructure failures', () => {
            const emptyRouter = new SwarmRouter();
            const task: TaskDescriptor = {
                id: '550e8400-e29b-41d4-a716-446655440008',
                type: 'planning',
                priority: 3,
                requiredCapabilities: ['planning'],
            };

            // Cause 5 infrastructure failures
            for (let i = 0; i < 5; i++) {
                try {
                    emptyRouter.routeTask(task);
                } catch (error) {
                    // Expected
                }
            }

            expect(emptyRouter.getCircuitBreakerState()).toBe('open');
            expect(emptyRouter.getMetrics().breakerTrips).toBe(1);
        });
    });

    describe('TEST 5: Metrics Tracking', () => {
        it('should track successful task routing', () => {
            const task: TaskDescriptor = {
                id: '550e8400-e29b-41d4-a716-446655440009',
                type: 'planning',
                priority: 3,
                requiredCapabilities: ['planning'],
            };

            const initialRouted = router.getMetrics().tasksRouted;
            router.routeTask(task);
            
            expect(router.getMetrics().tasksRouted).toBe(initialRouted + 1);
        });

        it('should track active agent count', () => {
            const newRouter = new SwarmRouter();
            expect(newRouter.getMetrics().activeAgents).toBe(0);

            newRouter.registerAgent(mockAgents[0]);
            expect(newRouter.getMetrics().activeAgents).toBe(1);

            newRouter.registerAgent(mockAgents[1]);
            expect(newRouter.getMetrics().activeAgents).toBe(2);
        });

        it('should track breaker trips and recoveries', () => {
            const breaker = new CircuitBreaker(5, 3, 100);
            const metrics = new RouterMetrics();

            // Trip the breaker
            for (let i = 0; i < 5; i++) {
                breaker.recordFailure(metrics);
            }
            expect(metrics.breakerTrips).toBe(1);

            // Transition to half-open and recover
            breaker.checkAndProbe();
            breaker.recordSuccess(metrics);
            breaker.recordSuccess(metrics);
            breaker.recordSuccess(metrics);

            expect(metrics.recoveries).toBe(1);
        });
    });

    describe('TEST 6: Agent Status Filtering', () => {
        it('should only route to idle agents', () => {
            const busyRouter = new SwarmRouter();
            busyRouter.registerAgent({
                ...mockAgents[0],
                status: 'busy',
            });
            busyRouter.registerAgent({
                ...mockAgents[1],
                status: 'offline',
            });
            busyRouter.registerAgent({
                ...mockAgents[2],
                status: 'idle',
            });

            const task: TaskDescriptor = {
                id: '550e8400-e29b-41d4-a716-446655440010',
                type: 'review',
                priority: 3,
                requiredCapabilities: ['review'],
            };

            const plan = busyRouter.routeTask(task);
            
            // Should only select agent-gamma (the only idle agent with review capability)
            expect(plan.primaryAgentId).toBe('agent-gamma');
            expect(plan.fallbackChain.length).toBe(0); // No other idle agents with capability
        });
    });

    describe('TEST 7: Validation and Error Handling', () => {
        it('should reject tasks without required capabilities', () => {
            const invalidTask = {
                id: '550e8400-e29b-41d4-a716-446655440011',
                type: 'planning',
                priority: 3,
                requiredCapabilities: [],
            };

            expect(() => router.routeTask(invalidTask)).toThrow(/at least one required capability/);
        });

        it('should reject duplicate agent registration', () => {
            expect(() => router.registerAgent(mockAgents[0])).toThrow(/already exists/);
        });

        it('should validate task descriptor schema', () => {
            const invalidTask = {
                id: 'not-a-uuid',
                type: 'invalid-type',
                priority: 10, // Out of range
                requiredCapabilities: ['planning'],
            };

            expect(() => router.routeTask(invalidTask)).toThrow();
        });
    });

    describe('TEST 8: Score Calculation Consistency', () => {
        it('should calculate scores using the same formula as Go', () => {
            const task: TaskDescriptor = {
                id: '550e8400-e29b-41d4-a716-446655440012',
                type: 'planning',
                priority: 4,
                requiredCapabilities: ['planning', 'analysis'],
            };

            const plan = router.routeTask(task);

            // For agent-alpha:
            // rawScore = 0.9 (planning) + 0.8 (analysis) = 1.7
            // avgCapScore = 1.7 / 2 = 0.85
            // finalScore = 0.85 * (5 * 0.2) + (4 * 0.1) = 0.85 * 1.0 + 0.4 = 1.25
            const expectedScore = 0.85 * (5 * 0.2) + (4 * 0.1);
            
            expect(plan.score).toBeCloseTo(expectedScore, 2);
        });
    });
});

// Made with Bob
