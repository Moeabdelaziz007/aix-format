import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import { kv } from './storage';

/**
 * 🌌 SOVEREIGN_EVENT_BUS (v3.0)
 * The nervous system of AIX Format. Bridge between TS, Go, and Rust.
 * 
 * Made with Moe Abdelaziz
 */

export const RINGS = {
  GENESIS: 0,
  SOUL: 1,
  MIND: 2,
  BODY: 3
} as const;

export interface BusEvent {
  id: string;
  timestamp: number;
  ring: number;
  type: string;
  agentId: string;
  agentName: string;
  message: string;
  metadata?: Record<string, any>;
}

export class Bus extends EventEmitter {
  private static instance: Bus;
  private globalPulseKey = 'aix:pulse:global';
  private maxPulseEvents = 100;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  public static getInstance(): Bus {
    if (!Bus.instance) {
      Bus.instance = new Bus();
    }
    return Bus.instance;
  }

  /**
   * Emits an event to the global pulse (Redis) and local listeners.
   * This is the E2E bridge for Quantum Resonance.
   */
  async emitPulse(event: Omit<BusEvent, 'id' | 'timestamp'>): Promise<string> {
    const fullEvent: BusEvent = {
      ...event,
      id: randomBytes(8).toString('hex'),
      timestamp: Date.now()
    };

    // 🔬 TurboQuant Logic: High-speed Redis Pipeline
    const pipeline = kv.pipeline();
    pipeline.lpush(this.globalPulseKey, fullEvent);
    pipeline.ltrim(this.globalPulseKey, 0, this.maxPulseEvents - 1);
    
    // Publish for real-time Go/Rust listeners
    pipeline.publish(`aix:ring:${fullEvent.ring}`, JSON.stringify(fullEvent));
    
    await pipeline.exec();

    // Local Emit
    super.emit(fullEvent.type, fullEvent);
    super.emit('pulse', fullEvent);

    return fullEvent.id;
  }
}

export const bus = Bus.getInstance();
