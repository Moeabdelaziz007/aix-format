/**
 * AIX Studio Monitoring Service
 * Provides error tracking, performance monitoring, and analytics
 */

import { createLogger } from './logger';

const logger = createLogger('Monitoring');

export interface ErrorContext {
  componentStack?: string;
  errorBoundary?: string;
  userId?: string;
  agentId?: string;
  route?: string;
  [key: string]: any;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private errorQueue: Array<{ error: Error; context: ErrorContext; timestamp: number }> = [];
  private metricsQueue: PerformanceMetric[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeClientMonitoring();
    }
  }

  private initializeClientMonitoring() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        route: window.location.pathname,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(event.reason), {
        route: window.location.pathname,
        type: 'unhandledRejection',
      });
    });

    // Start periodic flush
    this.flushInterval = setInterval(() => this.flush(), 30000); // Flush every 30s
  }

  /**
   * Capture an error with context
   */
  captureError(error: Error, context: ErrorContext = {}) {
    const errorData = {
      error,
      context: {
        ...context,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    this.errorQueue.push(errorData);
    
    // Log immediately
    logger.error('Error captured:', {
      message: error.message,
      stack: error.stack,
      context,
    });

    // Send to backend if queue is large
    if (this.errorQueue.length >= 10) {
      this.flush();
    }
  }

  /**
   * Track a performance metric
   */
  trackMetric(metric: PerformanceMetric) {
    this.metricsQueue.push(metric);
    logger.debug('Metric tracked:', metric);

    if (this.metricsQueue.length >= 50) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  trackPageView(route: string, metadata?: Record<string, any>) {
    this.trackMetric({
      name: 'page_view',
      duration: 0,
      timestamp: Date.now(),
      metadata: { route, ...metadata },
    });
  }

  /**
   * Track user action
   */
  trackAction(action: string, metadata?: Record<string, any>) {
    this.trackMetric({
      name: 'user_action',
      duration: 0,
      timestamp: Date.now(),
      metadata: { action, ...metadata },
    });
  }

  /**
   * Measure performance of an async operation
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.trackMetric({ name, duration, timestamp: Date.now(), metadata });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.trackMetric({ 
        name: `${name}_error`, 
        duration, 
        timestamp: Date.now(), 
        metadata: { ...metadata, error: (error as Error).message } 
      });
      throw error;
    }
  }

  /**
   * Flush queued data to backend
   */
  private async flush() {
    if (this.errorQueue.length === 0 && this.metricsQueue.length === 0) {
      return;
    }

    const errors = [...this.errorQueue];
    const metrics = [...this.metricsQueue];
    
    this.errorQueue = [];
    this.metricsQueue = [];

    try {
      // Send to backend monitoring endpoint
      if (typeof fetch !== 'undefined') {
        await fetch('/api/monitoring/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            errors: errors.map(e => ({
              message: e.error.message,
              stack: e.error.stack,
              context: e.context,
              timestamp: e.timestamp,
            })),
            metrics,
          }),
        }).catch(err => {
          logger.warn('Failed to send monitoring data:', err);
        });
      }
    } catch (error) {
      logger.warn('Error flushing monitoring data:', error);
      // Re-queue on failure
      this.errorQueue.push(...errors);
      this.metricsQueue.push(...metrics);
    }
  }

  /**
   * Cleanup on unmount
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// Convenience exports
export const captureError = (error: Error, context?: ErrorContext) => 
  monitoring.captureError(error, context);

export const trackMetric = (metric: PerformanceMetric) => 
  monitoring.trackMetric(metric);

export const trackPageView = (route: string, metadata?: Record<string, any>) => 
  monitoring.trackPageView(route, metadata);

export const trackAction = (action: string, metadata?: Record<string, any>) => 
  monitoring.trackAction(action, metadata);

export const measureAsync = <T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>) => 
  monitoring.measureAsync(name, fn, metadata);

// Made with Moe Abdelaziz
