/**
 * 4-Ring Bus Architecture
 * Central event bus for pet → expectation → gateway → trust-chain flow
 */

import { EventEmitter } from 'events';

export type BusEventType = 
  | 'pet:spawn'
  | 'pet:run'
  | 'pet:complete'
  | 'pet:error'
  | 'expectation:set'
  | 'expectation:step'
  | 'expectation:timeout'
  | 'expectation:complete'
  | 'gateway:spawn'
  | 'gateway:run'
  | 'gateway:pay'
  | 'gateway:error'
  | 'trust:verify'
  | 'trust:lineage'
  | 'trust:pow'
  | 'trust:error';

export interface BusEvent {
  type: BusEventType;
  agentId: string;
  taskId?: string;
  data: any;
  timestamp: number;
  ring: 'pet' | 'expectation' | 'gateway' | 'trust';
}

export interface BusSubscription {
  id: string;
  type: BusEventType | 'all';
  handler: (event: BusEvent) => void | Promise<void>;
}

/**
 * Bus class - 4-Ring Event Bus
 */
export class Bus extends EventEmitter {
  private subscriptions: Map<string, BusSubscription> = new Map();
  private eventHistory: BusEvent[] = [];
  private maxHistorySize = 1000;

  constructor() {
    super();
    this.setMaxListeners(100); // Allow many subscribers
  }

  /**
   * Emit event to bus
   */
  emitEvent(type: BusEventType, agentId: string, data: any, taskId?: string): void {
    const ring = this.getRingFromEventType(type);
    
    const event: BusEvent = {
      type,
      agentId,
      taskId,
      data,
      timestamp: Date.now(),
      ring
    };

    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Emit to EventEmitter
    super.emit(type, event);
    super.emit('all', event);
  }

  /**
   * Subscribe to events
   */
  subscribe(type: BusEventType | 'all', handler: (event: BusEvent) => void | Promise<void>): string {
    const id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: BusSubscription = {
      id,
      type,
      handler
    };

    this.subscriptions.set(id, subscription);
    this.on(type, handler);

    return id;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    this.off(subscription.type, subscription.handler);
    this.subscriptions.delete(subscriptionId);
    return true;
  }

  /**
   * Get event history
   */
  getHistory(filter?: {
    type?: BusEventType;
    agentId?: string;
    ring?: 'pet' | 'expectation' | 'gateway' | 'trust';
    since?: number;
  }): BusEvent[] {
    let events = [...this.eventHistory];

    if (filter) {
      if (filter.type) {
        events = events.filter(e => e.type === filter.type);
      }
      if (filter.agentId) {
        events = events.filter(e => e.agentId === filter.agentId);
      }
      if (filter.ring) {
        events = events.filter(e => e.ring === filter.ring);
      }
      if (filter.since !== undefined) {
        events = events.filter(e => e.timestamp >= filter.since!);
      }
    }

    return events;
  }

  /**
   * Get ring from event type
   */
  private getRingFromEventType(type: BusEventType): 'pet' | 'expectation' | 'gateway' | 'trust' {
    if (type.startsWith('pet:')) return 'pet';
    if (type.startsWith('expectation:')) return 'expectation';
    if (type.startsWith('gateway:')) return 'gateway';
    if (type.startsWith('trust:')) return 'trust';
    return 'gateway'; // default
  }

  /**
   * Get active subscriptions count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Reset bus state (for testing)
   */
  reset(): void {
    this.removeAllListeners();
    this.subscriptions.clear();
    this.eventHistory = [];
  }

  /**
   * Get bus statistics
   */
  getStats(): {
    subscriptions: number;
    historySize: number;
    eventsByRing: Record<string, number>;
    eventsByType: Record<string, number>;
  } {
    const eventsByRing: Record<string, number> = {
      pet: 0,
      expectation: 0,
      gateway: 0,
      trust: 0
    };

    const eventsByType: Record<string, number> = {};

    for (const event of this.eventHistory) {
      eventsByRing[event.ring]++;
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    }

    return {
      subscriptions: this.subscriptions.size,
      historySize: this.eventHistory.length,
      eventsByRing,
      eventsByType
    };
  }
}

/**
 * Singleton instance
 */
let busInstance: Bus | null = null;

/**
 * Get bus instance
 */
export function getBus(): Bus {
  if (!busInstance) {
    busInstance = new Bus();
  }
  return busInstance;
}

/**
 * Reset bus instance (for testing)
 */
export function resetBus(): void {
  if (busInstance) {
    busInstance.reset();
    busInstance = null;
  }
}

/**
 * Helper: Wait for specific event
 */
export function waitForEvent(
  bus: Bus,
  type: BusEventType,
  timeout = 5000
): Promise<BusEvent> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      bus.unsubscribe(subscriptionId);
      reject(new Error(`Timeout waiting for event: ${type}`));
    }, timeout);

    const subscriptionId = bus.subscribe(type, (event) => {
      clearTimeout(timeoutId);
      bus.unsubscribe(subscriptionId);
      resolve(event);
    });
  });
}

// Made with Bob
