import { NextRequest, NextResponse } from 'next/server';
import { DQNAgent } from '@aix-core';

interface TrainingRequest {
  episodes?: number;
  taskType?: string;
}

interface TrainingResults {
  episodes: Array<{
    episode: number;
    reward: number;
    avgReward: number;
    epsilon: number;
    action: number;
  }>;
  totalReward: number;
  averageReward: number;
  finalEpsilon: number;
  convergenceEpisode: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: TrainingRequest = await req.json();
    const { episodes = 100, taskType = 'general' } = body;

    if (episodes < 10 || episodes > 1000) {
      return NextResponse.json({ error: 'episodes must be between 10 and 1000' }, { status: 400 });
    }

    const agent = new DQNAgent({
      stateSize: 6,
      actionSize: 32,
      learningRate: 0.001,
      gamma: 0.99,
      epsilon: 1.0,
      epsilonMin: 0.01,
      epsilonDecay: 0.995
    });

    const trainingResults = await runTraining(agent, episodes, taskType);

    return NextResponse.json({
      success: true,
      training: trainingResults,
      model: {
        stateSize: 6,
        actionSize: 32,
        episodes,
        converged: trainingResults.convergenceEpisode !== -1
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function runTraining(agent: DQNAgent, episodes: number, taskType: string): Promise<TrainingResults> {
  const trainingResults: TrainingResults = {
    episodes: [],
    totalReward: 0,
    averageReward: 0,
    finalEpsilon: 0,
    convergenceEpisode: -1
  };

  let rewardWindow: number[] = [];
  const windowSize = 10;

  for (let episode = 0; episode < episodes; episode++) {
    const state = generateRandomState(taskType);
    const action = agent.selectAction(state);
    
    const { nextState, reward, done } = simulateCompression(state, action);
    
    agent.remember(state, action, reward, nextState, done);
    
    if (agent.getReplayBufferSize() >= 32) {
      await agent.replay(32);
    }

    trainingResults.totalReward += reward;
    rewardWindow.push(reward);
    if (rewardWindow.length > windowSize) {
      rewardWindow.shift();
    }

    const avgReward = rewardWindow.reduce((a, b) => a + b, 0) / rewardWindow.length;

    trainingResults.episodes.push({
      episode,
      reward,
      avgReward,
      epsilon: agent.getEpsilon(),
      action
    });

    if (trainingResults.convergenceEpisode === -1 && avgReward > 0.8 && rewardWindow.length === windowSize) {
      trainingResults.convergenceEpisode = episode;
    }

    if ((episode + 1) % 10 === 0) {
      agent.updateTargetNetwork();
    }
  }

  trainingResults.averageReward = trainingResults.totalReward / episodes;
  trainingResults.finalEpsilon = agent.getEpsilon();

  return trainingResults;
}

function generateRandomState(taskType: string): number[] {
  return [
    Math.random() * 1000,
    Math.random() * 500,
    taskType === 'code' ? 0 : taskType === 'data' ? 1 : 2,
    Math.random(),
    Math.random() * 200,
    Math.random() * 10
  ];
}

function simulateCompression(state: number[], action: number): { nextState: number[], reward: number, done: boolean } {
  const compressionRatio = 2 + (action % 8);
  const quality = 0.7 + Math.random() * 0.3;
  const latency = 20 + Math.random() * 80;

  const reward = (
    (compressionRatio / 10) * 0.3 +
    quality * 0.35 +
    (1 - latency / 200) * 0.15 +
    0.2
  );

  const nextState = [
    state[0] / compressionRatio,
    state[1] * 0.8,
    state[2],
    quality,
    latency,
    compressionRatio
  ];

  return { nextState, reward, done: true };
}

// Made with Moe Abdelaziz
