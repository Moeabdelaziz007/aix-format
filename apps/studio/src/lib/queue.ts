/**
 * Queue Manager for Bulk Operations
 * 
 * Provides job queue management using Bull/BullMQ for:
 * - Bulk agent deployment
 * - Job prioritization
 * - Progress tracking
 * - Failure retry logic
 * - Cleanup handlers
 */

import { kv, KEYS } from './redis';

export type JobStatus = 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';

export interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  status: JobStatus;
  progress: number;
  result?: any;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  priority: number;
}

export interface JobOptions {
  priority?: number;
  maxAttempts?: number;
  timeout?: number;
  retryDelay?: number;
}

export interface QueueStats {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
}

export type JobHandler<T = any, R = any> = (
  job: Job<T>,
  updateProgress: (progress: number) => Promise<void>
) => Promise<R>;

/**
 * Queue Manager
 * Manages job queues with Redis-backed persistence
 */
export class QueueManager {
  private handlers: Map<string, JobHandler> = new Map();
  private activeJobs: Map<string, Job> = new Map();
  private processingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private queueName: string = 'default') {}

  /**
   * Register a job handler for a specific job type
   */
  registerHandler<T = any, R = any>(
    jobType: string,
    handler: JobHandler<T, R>
  ): void {
    this.handlers.set(jobType, handler);
  }

  /**
   * Add a job to the queue
   */
  async addJob<T = any>(
    type: string,
    data: T,
    options: JobOptions = {}
  ): Promise<Job<T>> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: Job<T> = {
      id: jobId,
      type,
      data,
      status: 'pending',
      progress: 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date().toISOString(),
      priority: options.priority || 0,
    };

    // Store job in Redis
    const jobKey = this.getJobKey(jobId);
    await kv.set(jobKey, job, { ex: 86400 }); // 24 hour TTL

    // Add to queue list
    const queueKey = this.getQueueKey();
    const queue = await kv.get<string[]>(queueKey) || [];
    queue.push(jobId);
    await kv.set(queueKey, queue, { ex: 86400 });

    return job;
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    const jobKey = this.getJobKey(jobId);
    const job = await kv.get<Job>(jobKey);
    return job;
  }

  /**
   * Update job progress
   */
  async updateProgress(jobId: string, progress: number): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    job.progress = Math.min(100, Math.max(0, progress));
    
    const jobKey = this.getJobKey(jobId);
    await kv.set(jobKey, job, { ex: 86400 });
  }

  /**
   * Update job status
   */
  async updateStatus(
    jobId: string,
    status: JobStatus,
    result?: any,
    error?: string
  ): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    job.status = status;
    
    if (status === 'active' && !job.startedAt) {
      job.startedAt = new Date().toISOString();
    }
    
    if (status === 'completed' || status === 'failed') {
      job.completedAt = new Date().toISOString();
      job.progress = status === 'completed' ? 100 : job.progress;
    }
    
    if (result !== undefined) {
      job.result = result;
    }
    
    if (error) {
      job.error = error;
    }

    const jobKey = this.getJobKey(jobId);
    await kv.set(jobKey, job, { ex: 86400 });

    // Remove from active queue if completed/failed
    if (status === 'completed' || status === 'failed') {
      const queueKey = this.getQueueKey();
      const queue = await kv.get<string[]>(queueKey) || [];
      const filtered = queue.filter(id => id !== jobId);
      await kv.set(queueKey, filtered, { ex: 86400 });
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Process next job in queue
   */
  async processNext(): Promise<boolean> {
    const queueKey = this.getQueueKey();
    
    // Get next pending job
    const queue = await kv.get<string[]>(queueKey) || [];
    if (queue.length === 0) {
      return false;
    }

    // Find first pending job with highest priority
    let selectedJob: Job | null = null;
    let selectedJobId: string | null = null;

    for (const jobId of queue) {
      const job = await this.getJob(jobId);
      if (job && job.status === 'pending') {
        if (!selectedJob || job.priority > selectedJob.priority) {
          selectedJob = job;
          selectedJobId = jobId;
        }
      }
    }

    if (!selectedJob || !selectedJobId) {
      return false;
    }

    const job = selectedJob;
    const jobId = selectedJobId;

    // Check if handler exists
    const handler = this.handlers.get(job.type);
    if (!handler) {
      await this.updateStatus(jobId, 'failed', null, `No handler for job type: ${job.type}`);
      return false;
    }

    // Mark as active
    await this.updateStatus(jobId, 'active');
    this.activeJobs.set(jobId, job);

    // Process job
    try {
      const updateProgress = async (progress: number) => {
        await this.updateProgress(jobId, progress);
      };

      const result = await handler(job, updateProgress);
      await this.updateStatus(jobId, 'completed', result);
      return true;
    } catch (error: unknown) {
      job.attempts++;
      
      if (job.attempts >= job.maxAttempts) {
        await this.updateStatus(jobId, 'failed', null, error.message);
      } else {
        // Retry: reset to pending
        await this.updateStatus(jobId, 'pending');
      }
      
      return false;
    }
  }

  /**
   * Start processing queue
   */
  startProcessing(intervalMs: number = 1000): void {
    if (this.processingInterval) {
      return; // Already processing
    }

    this.processingInterval = setInterval(async () => {
      try {
        await this.processNext();
      } catch (error) {
        console.error('[QueueManager] Processing error:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop processing queue
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    const queueKey = this.getQueueKey();
    const queue = await kv.get<string[]>(queueKey) || [];
    
    const stats: QueueStats = {
      pending: 0,
      active: 0,
      completed: 0,
      failed: 0,
      total: 0,
    };

    for (const jobId of queue) {
      const job = await this.getJob(jobId);
      if (job) {
        stats.total++;
        if (job.status === 'pending') stats.pending++;
        else if (job.status === 'active') stats.active++;
        else if (job.status === 'completed') stats.completed++;
        else if (job.status === 'failed') stats.failed++;
      }
    }

    return stats;
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.getJob(jobId);
    if (!job) return false;

    if (job.status === 'active') {
      // Cannot cancel active jobs
      return false;
    }

    await this.updateStatus(jobId, 'cancelled');
    
    const queueKey = this.getQueueKey();
    const queue = await kv.get<string[]>(queueKey) || [];
    const filtered = queue.filter(id => id !== jobId);
    await kv.set(queueKey, filtered, { ex: 86400 });
    
    return true;
  }

  /**
   * Clean up completed/failed jobs older than specified time
   */
  async cleanup(olderThanMs: number = 3600000): Promise<number> {
    const queueKey = this.getQueueKey();
    const queue = await kv.get<string[]>(queueKey) || [];
    
    let cleaned = 0;
    const cutoffTime = Date.now() - olderThanMs;
    const remainingJobs: string[] = [];

    for (const jobId of queue) {
      const job = await this.getJob(jobId);
      if (!job) continue;

      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        new Date(job.completedAt).getTime() < cutoffTime
      ) {
        const jobKey = this.getJobKey(jobId);
        await kv.del(jobKey);
        cleaned++;
      } else {
        remainingJobs.push(jobId);
      }
    }

    await kv.set(queueKey, remainingJobs, { ex: 86400 });
    return cleaned;
  }

  /**
   * Get all jobs with optional status filter
   */
  async getJobs(status?: JobStatus): Promise<Job[]> {
    const queueKey = this.getQueueKey();
    const queue = await kv.get<string[]>(queueKey) || [];
    
    const jobs: Job[] = [];
    
    for (const jobId of queue) {
      const job = await this.getJob(jobId);
      if (job && (!status || job.status === status)) {
        jobs.push(job);
      }
    }

    return jobs;
  }

  /**
   * Get Redis key for job
   */
  private getJobKey(jobId: string): string {
    return `queue:${this.queueName}:job:${jobId}`;
  }

  /**
   * Get Redis key for queue
   */
  private getQueueKey(): string {
    return `queue:${this.queueName}:jobs`;
  }
}

/**
 * Singleton queue manager instances
 */
const queueManagers: Map<string, QueueManager> = new Map();

export function getQueueManager(queueName: string = 'default'): QueueManager {
  if (!queueManagers.has(queueName)) {
    queueManagers.set(queueName, new QueueManager(queueName));
  }
  return queueManagers.get(queueName)!;
}

/**
 * Bulk deployment queue specifically for agent deployment
 */
export function getBulkDeployQueue(): QueueManager {
  return getQueueManager('bulk-deploy');
}

// Made with Moe Abdelaziz