import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';

/**
 * Sovereign 4-Ring Bus Architecture
 * Central event stream for pet → expectation → gateway → trust-chain flow
 * 
 * Made with Moe Abdelaziz
 */

export type BusRing = 'pet' | 'expectation' | 'gateway' | 'trust' | 'mind';

export type BusEventType = 
  | 'pet:spawn' | 'pet:run' | 'pet:complete' | 'pet:error'
  | 'expectation:set' | 'expectation:step' | 'expectation:timeout' | 'expectation:complete'
  | 'gateway:spawn' | 'gateway:run' | 'gateway:pay' | 'gateway:error'
  | 'trust:verify' | 'trust:lineage' | 'trust:pow' | 'trust:error'
  | 'agent:started' | 'agent:thought' | 'agent:action' | 'agent:observation';

export interface BusEvent {
  id: string;
  type: BusEventType | string;
  agentId: string;
  taskId?: string;
  data: unknown;
  timestamp: number;
  ring: BusRing;
  auditHash?: string;
}

export interface BusSubscription {
  id: string;
  type: string | 'all';
  handler: (event: BusEvent) => void | Promise<void>;
}

export class Bus extends EventEmitter {
  private subscriptions: Map<string, BusSubscription> = new Map();
  private maxHistorySize = 1000;

  constructor() {
    super();
    this.setMaxListeners(200);
  }

  /**
   * Emit event to bus and persist to Redis (RULE 3)
   */
  async emitEvent(type: BusEventType | string, agentId: string, data: unknown, taskId?: string): Promise<string> {
    const ring = this.getRingFromEventType(type);
    const eventId = `evt_${randomBytes(8).toString('hex')}`;
    
    const event: BusEvent = {
      id: eventId,
      type,
      agentId,
      taskId,
      data,
      timestamp: Date.now(),
      ring
    };

    // RULE 3: Persist to Redis Stream/List for sovereign history
    await kv.lpush(KEYS.agentBusHistory(agentId), JSON.stringify(event));
    await kv.ltrim(KEYS.agentBusHistory(agentId), 0, this.maxHistorySize);

    // Local Emit
    super.emit(type, event);
    super.emit('all', event);

    return eventId;
  }

  /**
   * Secure Subscription (RULE 2)
   */
  subscribe(type: string | 'all', handler: (event: BusEvent) => void | Promise<void>): string {
    const id = `sub_${randomBytes(6).toString('hex')}`;
    
    const subscription: BusSubscription = { id, type, handler };
    this.subscriptions.set(id, subscription);
    this.on(type, handler);

    return id;
  }

  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    this.off(subscription.type, subscription.handler);
    this.subscriptions.delete(subscriptionId);
    return true;
  }

  /**
   * Get sovereign history from Redis
   */
  async getSovereignHistory(agentId: string, limit = 100): Promise<BusEvent[]> {
    const data = await kv.lrange<string>(KEYS.agentBusHistory(agentId), 0, limit - 1);
    return data.map(d => JSON.parse(d));
  }

  private getRingFromEventType(type: string): BusRing {
    if (type.startsWith('pet:')) return 'pet';
    if (type.startsWith('expectation:')) return 'expectation';
    if (type.startsWith('gateway:')) return 'gateway';
    if (type.startsWith('trust:')) return 'trust';
    if (type.startsWith('agent:')) return 'mind';
    return 'gateway';
  }

  reset(): void {
    this.removeAllListeners();
    this.subscriptions.clear();
  }
}

let busInstance: Bus | null = null;

export function getBus(): Bus {
  if (!busInstance) busInstance = new Bus();
  return busInstance;
}

// Made with Moe Abdelaziz
