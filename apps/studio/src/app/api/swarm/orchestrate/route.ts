import { NextRequest, NextResponse } from 'next/server';

interface SwarmRequest {
  agents: Array<{
    id: string;
    role: string;
    capabilities: string[];
  }>;
  task: string;
  coordinationStrategy: 'sequential' | 'parallel' | 'hierarchical';
}

export async function POST(req: NextRequest) {
  try {
    const body: SwarmRequest = await req.json();
    const { agents, task, coordinationStrategy } = body;

    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: 'agents array required' }, { status: 400 });
    }

    const orchestrationPlan = createOrchestrationPlan(agents, task, coordinationStrategy);
    
    return NextResponse.json({
      success: true,
      orchestration: orchestrationPlan,
      estimatedTime: calculateEstimatedTime(orchestrationPlan),
      costEstimate: calculateCostEstimate(orchestrationPlan)
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function createOrchestrationPlan(agents: Array<Record<string, unknown>>, task: string, strategy: string) {
  const plan = {
    id: `swarm_${Date.now()}`,
    strategy,
    task,
    agents: agents.map(a => a.id),
    steps: [] as unknown[]
  };

  if (strategy === 'sequential') {
    agents.forEach((agent, index) => {
      plan.steps.push({
        step: index + 1,
        agentId: agent.id,
        role: agent.role,
        dependencies: index > 0 ? [agents[index - 1].id] : [],
        estimatedDuration: 5000
      });
    });
  } else if (strategy === 'parallel') {
    agents.forEach((agent, index) => {
      plan.steps.push({
        step: index + 1,
        agentId: agent.id,
        role: agent.role,
        dependencies: [],
        estimatedDuration: 5000
      });
    });
  } else if (strategy === 'hierarchical') {
    plan.steps.push({
      step: 1,
      agentId: agents[0].id,
      role: 'coordinator',
      dependencies: [],
      estimatedDuration: 2000
    });
    agents.slice(1).forEach((agent, index) => {
      plan.steps.push({
        step: index + 2,
        agentId: agent.id,
        role: agent.role,
        dependencies: [agents[0].id],
        estimatedDuration: 5000
      });
    });
  }

  return plan;
}

function calculateEstimatedTime(plan: { steps: Array<{ estimatedDuration: number }> }): number {
  if (plan.strategy === 'sequential') {
    return plan.steps.reduce((sum: number, step: { estimatedDuration: number }) => sum + step.estimatedDuration, 0);
  } else if (plan.strategy === 'parallel') {
    return Math.max(...plan.steps.map((s: { estimatedDuration: number }) => s.estimatedDuration));
  } else {
    return plan.steps[0].estimatedDuration + Math.max(...plan.steps.slice(1).map((s: { estimatedDuration: number }) => s.estimatedDuration));
  }
}

function calculateCostEstimate(plan: { steps: Array<{ estimatedDuration: number }> }): number {
  const costPerAgent = 0.05;
  return plan.agents.length * costPerAgent;
}

// Made with Moe Abdelaziz
