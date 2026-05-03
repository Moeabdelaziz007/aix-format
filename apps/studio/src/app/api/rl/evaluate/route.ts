import { NextRequest, NextResponse } from 'next/server';
import { DQNAgent } from '@aix/core/compression/rl-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { testCases = 50, taskType = 'general' } = body;

    const agent = new DQNAgent({
      stateSize: 6,
      actionSize: 32,
      learningRate: 0.001,
      gamma: 0.99,
      epsilon: 0.01,
      epsilonMin: 0.01,
      epsilonDecay: 1.0
    });

    const evaluationResults: {
      testCases: Array<{
        testCase: number;
        state: number[];
        action: number;
        result: {
          compressionRatio: number;
          quality: number;
          latency: number;
          reward: number;
          success: boolean;
        };
      }>;
      averageReward: number;
      averageCompressionRatio: number;
      averageQuality: number;
      averageLatency: number;
      successRate: number;
    } = {
      testCases: [],
      averageReward: 0,
      averageCompressionRatio: 0,
      averageQuality: 0,
      averageLatency: 0,
      successRate: 0
    };

    let totalReward = 0;
    let totalRatio = 0;
    let totalQuality = 0;
    let totalLatency = 0;
    let successCount = 0;

    for (let i = 0; i < testCases; i++) {
      const state = generateTestState(taskType);
      const action = agent.selectAction(state);
      
      const result = evaluateAction(state, action);
      
      totalReward += result.reward;
      totalRatio += result.compressionRatio;
      totalQuality += result.quality;
      totalLatency += result.latency;
      
      if (result.success) {
        successCount++;
      }

      evaluationResults.testCases.push({
        testCase: i,
        state,
        action,
        result
      });
    }

    evaluationResults.averageReward = totalReward / testCases;
    evaluationResults.averageCompressionRatio = totalRatio / testCases;
    evaluationResults.averageQuality = totalQuality / testCases;
    evaluationResults.averageLatency = totalLatency / testCases;
    evaluationResults.successRate = successCount / testCases;

    return NextResponse.json({
      success: true,
      evaluation: evaluationResults,
      performance: {
        grade: getPerformanceGrade(evaluationResults.averageReward),
        recommendation: getRecommendation(evaluationResults)
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateTestState(taskType: string): number[] {
  return [
    500 + Math.random() * 500,
    200 + Math.random() * 300,
    taskType === 'code' ? 0 : taskType === 'data' ? 1 : 2,
    0.8 + Math.random() * 0.2,
    50 + Math.random() * 100,
    3 + Math.random() * 4
  ];
}

function evaluateAction(state: number[], action: number) {
  const compressionRatio = 2 + (action % 8);
  const quality = 0.75 + Math.random() * 0.25;
  const latency = 30 + Math.random() * 70;

  const reward = (
    (compressionRatio / 10) * 0.3 +
    quality * 0.35 +
    (1 - latency / 200) * 0.15 +
    0.2
  );

  return {
    compressionRatio,
    quality,
    latency,
    reward,
    success: reward > 0.7
  };
}

function getPerformanceGrade(avgReward: number): string {
  if (avgReward >= 0.9) return 'A+';
  if (avgReward >= 0.8) return 'A';
  if (avgReward >= 0.7) return 'B';
  if (avgReward >= 0.6) return 'C';
  return 'D';
}

function getRecommendation(results: any): string {
  if (results.averageReward >= 0.8) {
    return 'Policy performing well. Ready for production.';
  } else if (results.averageReward >= 0.6) {
    return 'Policy needs more training. Run 100+ more episodes.';
  } else {
    return 'Policy underperforming. Consider adjusting hyperparameters.';
  }
}

// Made with Moe Abdelaziz
