 todo list and commit chnages import { RLReward, RLState, RLAction } from './rl-engine';

export interface TaskOutcome {
  taskId: string;
  taskType: string;
  compressionUsed: RLAction;
  originalSize: number;
  compressedSize: number;
  quality: number;
  latency: number;
  success: boolean;
  userFeedback?: number;
}

export class RewardCalculator {
  private weights = {
    compressionRatio: 0.3,
    qualityPreserved: 0.35,
    latency: 0.15,
    taskSuccess: 0.15,
    userSatisfaction: 0.05
  };

  calculate(outcome: TaskOutcome, baseline: { size: number; latency: number }): number {
    const reward: RLReward = {
      compressionRatio: this.calculateCompressionReward(outcome, baseline),
      qualityPreserved: outcome.quality,
      latency: this.calculateLatencyReward(outcome, baseline),
      taskSuccess: outcome.success ? 1.0 : 0.0,
      userSatisfaction: outcome.userFeedback || 0.5
    };

    return (
      reward.compressionRatio * this.weights.compressionRatio +
      reward.qualityPreserved * this.weights.qualityPreserved +
      reward.latency * this.weights.latency +
      reward.taskSuccess * this.weights.taskSuccess +
      reward.userSatisfaction * this.weights.userSatisfaction
    );
  }

  private calculateCompressionReward(outcome: TaskOutcome, baseline: { size: number }): number {
    const ratio = baseline.size / outcome.compressedSize;
    const targetRatio = outcome.compressionUsed.targetRatio;
    
    if (ratio >= targetRatio) return 1.0;
    if (ratio >= targetRatio * 0.8) return 0.8;
    if (ratio >= targetRatio * 0.6) return 0.6;
    return 0.3;
  }

  private calculateLatencyReward(outcome: TaskOutcome, baseline: { latency: number }): number {
    const overhead = outcome.latency - baseline.latency;
    
    if (overhead < 50) return 1.0;
    if (overhead < 100) return 0.8;
    if (overhead < 200) return 0.5;
    return 0.2;
  }

  getRewardComponents(outcome: TaskOutcome, baseline: { size: number; latency: number }): RLReward {
    return {
      compressionRatio: this.calculateCompressionReward(outcome, baseline),
      qualityPreserved: outcome.quality,
      latency: this.calculateLatencyReward(outcome, baseline),
      taskSuccess: outcome.success ? 1.0 : 0.0,
      userSatisfaction: outcome.userFeedback || 0.5
    };
  }
}

// Made with Moe Abdelaziz
