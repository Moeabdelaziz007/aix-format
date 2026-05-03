import { DQNAgent, RLState } from './rl-engine';
import { RewardCalculator, TaskOutcome } from './reward-calculator';
import { kv } from '../storage/adapter';

export interface CompressionProfile {
  profileId: string;
  taskType: string;
  avgCompressionRatio: number;
  avgQuality: number;
  avgLatency: number;
  successRate: number;
  trainingEpisodes: number;
  lastUpdated: number;
  didAxiom: string;
}

export class ManifestCompressionIntegration {
  private agent: DQNAgent;
  private rewardCalc: RewardCalculator;

  constructor() {
    this.agent = new DQNAgent();
    this.rewardCalc = new RewardCalculator();
  }

  async compressManifest(manifest: any, taskType: string): Promise<{
    compressed: any;
    metadata: {
      originalSize: number;
      compressedSize: number;
      ratio: number;
      algorithm: string;
      latency: number;
    };
  }> {
    const startTime = Date.now();
    const originalSize = JSON.stringify(manifest).length;

    const state: RLState = {
      memoryUsage: originalSize / 1024,
      contextSize: this.estimateTokens(manifest),
      taskType,
      qualityScore: 1.0,
      latency: 0,
      compressionRatio: 1.0
    };

    const action = this.agent.selectAction(state);
    const compressed = await this.applyCompression(manifest, action);
    const compressedSize = JSON.stringify(compressed).length;
    const latency = Date.now() - startTime;

    return {
      compressed,
      metadata: {
        originalSize,
        compressedSize,
        ratio: originalSize / compressedSize,
        algorithm: action.algorithm,
        latency
      }
    };
  }

  private async applyCompression(manifest: any, action: any): Promise<any> {
    const compressed = { ...manifest };
    
    if (action.aggressiveness === 'high') {
      if (compressed.persona?.instructions) {
        compressed.persona.instructions = this.compressText(compressed.persona.instructions, 0.5);
      }
      if (compressed.skills) {
        compressed.skills = compressed.skills.slice(0, Math.ceil(compressed.skills.length * 0.7));
      }
    } else if (action.aggressiveness === 'medium') {
      if (compressed.persona?.instructions) {
        compressed.persona.instructions = this.compressText(compressed.persona.instructions, 0.7);
      }
    }

    return compressed;
  }

  private compressText(text: string, ratio: number): string {
    const words = text.split(' ');
    const targetLength = Math.ceil(words.length * ratio);
    return words.slice(0, targetLength).join(' ');
  }

  private estimateTokens(manifest: any): number {
    return JSON.stringify(manifest).length / 4;
  }

  async recordOutcome(outcome: TaskOutcome): Promise<void> {
    const baseline = { size: outcome.originalSize, latency: 100 };
    const reward = this.rewardCalc.calculate(outcome, baseline);

    const state: RLState = {
      memoryUsage: outcome.originalSize / 1024,
      contextSize: outcome.originalSize / 4,
      taskType: outcome.taskType,
      qualityScore: outcome.quality,
      latency: outcome.latency,
      compressionRatio: outcome.originalSize / outcome.compressedSize
    };

    const nextState: RLState = {
      ...state,
      compressionRatio: outcome.originalSize / outcome.compressedSize,
      latency: outcome.latency
    };

    await this.agent.train({
      state,
      action: outcome.compressionUsed,
      reward,
      nextState,
      done: true,
      timestamp: Date.now()
    });

    await this.updateProfile(outcome, reward);
  }

  private async updateProfile(outcome: TaskOutcome, reward: number): Promise<void> {
    const key = `aix:compression:profile:${outcome.taskType}`;
    const existing = await kv.get<CompressionProfile>(key);

    if (existing) {
      const updated: CompressionProfile = {
        ...existing,
        avgCompressionRatio: (existing.avgCompressionRatio * existing.trainingEpisodes + 
          (outcome.originalSize / outcome.compressedSize)) / (existing.trainingEpisodes + 1),
        avgQuality: (existing.avgQuality * existing.trainingEpisodes + outcome.quality) / 
          (existing.trainingEpisodes + 1),
        avgLatency: (existing.avgLatency * existing.trainingEpisodes + outcome.latency) / 
          (existing.trainingEpisodes + 1),
        successRate: (existing.successRate * existing.trainingEpisodes + 
          (outcome.success ? 1 : 0)) / (existing.trainingEpisodes + 1),
        trainingEpisodes: existing.trainingEpisodes + 1,
        lastUpdated: Date.now()
      };

      await kv.set(key, updated);
    } else {
      const newProfile: CompressionProfile = {
        profileId: `profile_${Date.now()}`,
        taskType: outcome.taskType,
        avgCompressionRatio: outcome.originalSize / outcome.compressedSize,
        avgQuality: outcome.quality,
        avgLatency: outcome.latency,
        successRate: outcome.success ? 1 : 0,
        trainingEpisodes: 1,
        lastUpdated: Date.now(),
        didAxiom: `did:axiom:profile:${outcome.taskType}`
      };

      await kv.set(key, newProfile);
    }
  }

  async getProfile(taskType: string): Promise<CompressionProfile | null> {
    return kv.get<CompressionProfile>(`aix:compression:profile:${taskType}`);
  }

  async getAllProfiles(): Promise<CompressionProfile[]> {
    const taskTypes = ['code', 'data', 'kyc', 'creative', 'conversation'];
    const profiles: CompressionProfile[] = [];

    for (const taskType of taskTypes) {
      const profile = await this.getProfile(taskType);
      if (profile) profiles.push(profile);
    }

    return profiles;
  }
}

// Made with Moe Abdelaziz
