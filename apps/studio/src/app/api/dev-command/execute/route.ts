import { NextRequest } from 'next/server';

export const runtime = 'edge';

interface ReasoningStep {
  id: string;
  timestamp: number;
  phase: 'observe' | 'decide' | 'act' | 'reflect';
  content: string;
  confidence: number;
}

interface TrustNode {
  id: string;
  type: 'validation' | 'execution' | 'verification';
  status: 'pending' | 'mining' | 'complete';
  hash?: string;
  connections: string[];
}

interface StreamChunk {
  id: string;
  content: string;
  type: 'thought' | 'action' | 'result' | 'error';
  timestamp: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const command = searchParams.get('cmd') || '';

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Simulate command execution with multiple phases
        const phases: Array<{ phase: ReasoningStep['phase']; steps: string[] }> = [
          {
            phase: 'observe',
            steps: [
              'Analyzing command input...',
              'Checking system state...',
              'Loading agent context...',
              'Validating permissions...'
            ]
          },
          {
            phase: 'decide',
            steps: [
              'Evaluating execution strategies...',
              'Calculating risk factors...',
              'Selecting optimal path...',
              'Preparing action plan...'
            ]
          },
          {
            phase: 'act',
            steps: [
              'Initializing execution context...',
              'Spawning worker processes...',
              'Executing command logic...',
              'Monitoring progress...'
            ]
          },
          {
            phase: 'reflect',
            steps: [
              'Analyzing execution results...',
              'Updating agent memory...',
              'Recording metrics...',
              'Finalizing state...'
            ]
          }
        ];

        let progress = 0;
        const totalSteps = phases.reduce((sum, p) => sum + p.steps.length, 0);
        const progressIncrement = 100 / totalSteps;

        // Create initial trust node
        const trustNodes: TrustNode[] = [];
        const createTrustNode = (type: TrustNode['type'], connections: string[] = []) => {
          const node: TrustNode = {
            id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            status: 'pending',
            connections
          };
          trustNodes.push(node);
          return node;
        };

        // Initial validation node
        const validationNode = createTrustNode('validation');
        send('trust', validationNode);
        await sleep(300);

        // Update to mining
        validationNode.status = 'mining';
        send('trust', validationNode);
        await sleep(500);

        // Complete validation
        validationNode.status = 'complete';
        validationNode.hash = `0x${Math.random().toString(16).substr(2, 64)}`;
        send('trust', validationNode);

        // Execute phases
        for (const phaseData of phases) {
          for (const stepContent of phaseData.steps) {
            // Send reasoning step
            const step: ReasoningStep = {
              id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timestamp: Date.now(),
              phase: phaseData.phase,
              content: stepContent,
              confidence: 0.7 + Math.random() * 0.3
            };
            send('reasoning', step);

            // Send stream chunk
            const chunk: StreamChunk = {
              id: `chunk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              content: stepContent,
              type: phaseData.phase === 'act' ? 'action' : 'thought',
              timestamp: Date.now()
            };
            send('stream', chunk);

            // Update progress
            progress += progressIncrement;
            send('progress', { progress: Math.min(100, Math.round(progress)) });

            // Create trust nodes at key points
            if (phaseData.phase === 'act' && stepContent.includes('Executing')) {
              const execNode = createTrustNode('execution', [validationNode.id]);
              send('trust', execNode);
              await sleep(300);
              
              execNode.status = 'mining';
              send('trust', execNode);
              await sleep(500);
              
              execNode.status = 'complete';
              execNode.hash = `0x${Math.random().toString(16).substr(2, 64)}`;
              send('trust', execNode);
            }

            await sleep(400 + Math.random() * 400);
          }
        }

        // Final verification node
        const verifyNode = createTrustNode('verification', trustNodes.map(n => n.id));
        send('trust', verifyNode);
        await sleep(300);
        
        verifyNode.status = 'mining';
        send('trust', verifyNode);
        await sleep(800);
        
        verifyNode.status = 'complete';
        verifyNode.hash = `0x${Math.random().toString(16).substr(2, 64)}`;
        send('trust', verifyNode);

        // Send final result
        const resultChunk: StreamChunk = {
          id: `chunk-final-${Date.now()}`,
          content: `✓ Command "${command}" executed successfully`,
          type: 'result',
          timestamp: Date.now()
        };
        send('stream', resultChunk);

        // Complete
        send('complete', { success: true });
        controller.close();

      } catch (error) {
        send('error', { message: error instanceof Error ? error.message : 'Unknown error' });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Made with Bob
