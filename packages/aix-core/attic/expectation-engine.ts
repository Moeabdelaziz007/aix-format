/**
 * Expectation Engine
 * Monitors agent task execution and validates expectations
 */

export interface Expectation {
  agentId: string;
  taskId: string;
  expectedSteps: string[];
  expectedMs: number;
  description: string;
  startTime: number;
  currentStep: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'timeout';
}

export interface ExpectationResult {
  met: boolean;
  actualMs?: number;
  completedSteps?: string[];
  failureReason?: string;
}

/**
 * ExpectationEngine class
 */
export class ExpectationEngine {
  private expectations: Map<string, Expectation> = new Map();
  private completedTasks: Set<string> = new Set();
  private failedTasks: Map<string, string> = new Map();

  /**
   * Set expectation for a task
   * CORRECT SIGNATURE: (agentId, taskId, expectedSteps, expectedMs, description)
   */
  async setExpectation(
    agentId: string,
    taskId: string,
    expectedSteps: string[],
    expectedMs: number,
    description: string
  ): Promise<void> {
    const key = this.getKey(agentId, taskId);
    
    const expectation: Expectation = {
      agentId,
      taskId,
      expectedSteps,
      expectedMs,
      description,
      startTime: Date.now(),
      currentStep: 0,
      status: 'pending'
    };

    this.expectations.set(key, expectation);
  }

  /**
   * Mark expectation as met
   */
  async markExpectationMet(agentId: string, taskId: string): Promise<void> {
    const key = this.getKey(agentId, taskId);
    const expectation = this.expectations.get(key);

    if (expectation) {
      expectation.status = 'completed';
      this.completedTasks.add(key);
      this.expectations.delete(key);
    }
  }

  /**
   * Mark expectation as failed
   */
  async markExpectationFailed(agentId: string, taskId: string, reason: string): Promise<void> {
    const key = this.getKey(agentId, taskId);
    const expectation = this.expectations.get(key);

    if (expectation) {
      expectation.status = 'failed';
      this.failedTasks.set(key, reason);
      this.expectations.delete(key);
    }
  }

  /**
   * Update current step
   */
  async updateStep(agentId: string, taskId: string, step: string): Promise<void> {
    const key = this.getKey(agentId, taskId);
    const expectation = this.expectations.get(key);

    if (expectation) {
      const stepIndex = expectation.expectedSteps.indexOf(step);
      if (stepIndex !== -1) {
        expectation.currentStep = stepIndex + 1;
        expectation.status = 'in_progress';
      }
    }
  }

  /**
   * Check if expectation is met
   */
  async checkExpectation(agentId: string, taskId: string): Promise<ExpectationResult> {
    const key = this.getKey(agentId, taskId);
    const expectation = this.expectations.get(key);

    if (!expectation) {
      // Check if already completed
      if (this.completedTasks.has(key)) {
        return { met: true };
      }

      // Check if failed
      const failureReason = this.failedTasks.get(key);
      if (failureReason) {
        return { met: false, failureReason };
      }

      return { met: false, failureReason: 'Expectation not found' };
    }

    const actualMs = Date.now() - expectation.startTime;

    // Check timeout
    if (actualMs > expectation.expectedMs) {
      expectation.status = 'timeout';
      this.failedTasks.set(key, 'Timeout exceeded');
      this.expectations.delete(key);
      return {
        met: false,
        actualMs,
        failureReason: 'Timeout exceeded'
      };
    }

    // Check if all steps completed
    if (expectation.currentStep >= expectation.expectedSteps.length) {
      expectation.status = 'completed';
      this.completedTasks.add(key);
      this.expectations.delete(key);
      return {
        met: true,
        actualMs,
        completedSteps: expectation.expectedSteps
      };
    }

    return {
      met: false,
      actualMs,
      completedSteps: expectation.expectedSteps.slice(0, expectation.currentStep)
    };
  }

  /**
   * Get expectation
   */
  getExpectation(agentId: string, taskId: string): Expectation | undefined {
    const key = this.getKey(agentId, taskId);
    return this.expectations.get(key);
  }

  /**
   * Check if task is completed
   */
  isCompleted(agentId: string, taskId: string): boolean {
    const key = this.getKey(agentId, taskId);
    return this.completedTasks.has(key);
  }

  /**
   * Check if task is failed
   */
  isFailed(agentId: string, taskId: string): boolean {
    const key = this.getKey(agentId, taskId);
    return this.failedTasks.has(key);
  }

  /**
   * Get failure reason
   */
  getFailureReason(agentId: string, taskId: string): string | undefined {
    const key = this.getKey(agentId, taskId);
    return this.failedTasks.get(key);
  }

  /**
   * Get all active expectations
   */
  getActiveExpectations(): Expectation[] {
    return Array.from(this.expectations.values());
  }

  /**
   * Get all completed tasks
   */
  getCompletedTasks(): string[] {
    return Array.from(this.completedTasks);
  }

  /**
   * Get all failed tasks
   */
  getFailedTasks(): Map<string, string> {
    return new Map(this.failedTasks);
  }

  /**
   * Reset engine state (for testing)
   */
  reset(): void {
    this.expectations.clear();
    this.completedTasks.clear();
    this.failedTasks.clear();
  }

  /**
   * Generate key for agent + task
   */
  private getKey(agentId: string, taskId: string): string {
    return `${agentId}:${taskId}`;
  }
}

/**
 * Singleton instance
 */
let engineInstance: ExpectationEngine | null = null;

/**
 * Get expectation engine instance
 */
export function getExpectationEngine(): ExpectationEngine {
  if (!engineInstance) {
    engineInstance = new ExpectationEngine();
  }
  return engineInstance;
}

/**
 * Reset expectation engine instance (for testing)
 */
export function resetExpectationEngine(): void {
  if (engineInstance) {
    engineInstance.reset();
    engineInstance = null;
  }
}

// Made with Moe Abdelaziz
