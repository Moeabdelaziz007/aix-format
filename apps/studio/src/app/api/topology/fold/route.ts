import { NextRequest, NextResponse } from 'next/server';

interface TopologyFoldRequest {
  agents: string[];
  message: string;
  collapseCondition?: 'all_complete' | 'first_success' | 'majority';
}

export async function POST(req: NextRequest) {
  try {
    const body: TopologyFoldRequest = await req.json();
    const { agents, message, collapseCondition = 'all_complete' } = body;

    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: 'agents array required' }, { status: 400 });
    }

    const foldedMessage = {
      id: `fold_${Date.now()}`,
      type: 'topology_fold',
      targets: agents,
      content: message,
      collapseCondition,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    return NextResponse.json({
      success: true,
      fold: foldedMessage,
      estimatedSavings: {
        messages: agents.length - 1,
        tokens: message.length * (agents.length - 1),
        cost: (message.length * (agents.length - 1) * 0.00002).toFixed(4)
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Made with Moe Abdelaziz
