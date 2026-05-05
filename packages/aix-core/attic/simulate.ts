import { randomUUID } from 'crypto';
import { SwarmRouter, AgentNode, TaskDescriptor } from './SwarmRouter';

async function runSimulation() {
    console.log("🚀 Starting Swarm Routing Simulation (1000 Tasks)...");
    const router = new SwarmRouter();

    // 1. Initialize Swarm Nodes (Based on AXIOM.md Graph nodes)
    const nodes: AgentNode[] = [
        { id: 'planner-alpha', role: 'decompose_issue', trustLevel: 3, status: 'idle', capabilities: { 'analysis': 0.9, 'planning': 1.0, 'architecture': 0.8 } },
        { id: 'executor-rust', role: 'implement', trustLevel: 3, status: 'idle', capabilities: { 'coding_rust': 1.0, 'testing': 0.8 } },
        { id: 'executor-go', role: 'implement', trustLevel: 3, status: 'idle', capabilities: { 'coding_go': 0.9, 'testing': 0.7, 'orchestration': 0.8 } },
        { id: 'executor-ts', role: 'implement', trustLevel: 3, status: 'idle', capabilities: { 'coding_ts': 0.95, 'ui': 0.9 } },
        { id: 'reviewer-strict', role: 'pr_feedback', trustLevel: 4, status: 'idle', capabilities: { 'code_review': 1.0, 'security_audit': 0.9 } },
        { id: 'memory-keeper', role: 'archive', trustLevel: 5, status: 'idle', capabilities: { 'compression': 1.0, 'signing': 1.0 } },
    ];

    nodes.forEach(node => router.registerAgent(node));

    // 2. Setup Reporting Metrics
    const report = {
        totalTasksProcessed: 0,
        successfulRoutes: 0,
        deadLetterQueueSize: 0,
        agentLoadDistribution: {} as Record<string, number>,
    };
    nodes.forEach(n => report.agentLoadDistribution[n.id] = 0);

    // 3. Generate and Route 1000 Tasks
    const taskPool = [
        { type: 'planning', caps: ['planning', 'analysis'] },
        { type: 'execution', caps: ['coding_rust'] },
        { type: 'execution', caps: ['coding_ts', 'ui'] },
        { type: 'review', caps: ['code_review'] },
        { type: 'archiving', caps: ['compression', 'signing'] },
        // The following will fail and go to DLQ because no agent has 'ruby' capability (Stack Purity rule)
        { type: 'execution', caps: ['coding_ruby'] }
    ];

    for (let i = 0; i < 1000; i++) {
        const randomTemplate = taskPool[Math.floor(Math.random() * taskPool.length)];

        const task: TaskDescriptor = {
            id: randomUUID(),
            type: randomTemplate.type as any,
            priority: Math.floor(Math.random() * 5) + 1,
            requiredCapabilities: randomTemplate.caps,
        };

        try {
            const plan = router.routeTask(task);
            report.totalTasksProcessed++;

            if (plan) {
                report.successfulRoutes++;
                report.agentLoadDistribution[plan.primaryAgentId]++;
            }
        } catch (error) {
            console.error(`Validation Error on task ${task.id}:`, error);
        }
    }

    // 4. Finalize Report
    report.deadLetterQueueSize = router.getDeadLetterQueue().length;

    console.log("\n📊 --- Swarm Routing Distribution Report ---");
    console.log(JSON.stringify(report, null, 2));

    if (report.deadLetterQueueSize > 0) {
        console.log(`\n⚠️ Note: ${report.deadLetterQueueSize} tasks were sent to Dead Letter Queue (e.g., requested forbidden stack languages like Ruby).`);
    }
}

// Execute
runSimulation().catch(console.error);