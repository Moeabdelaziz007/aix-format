import crypto from 'crypto';
import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';

/**
 * AIX Pulse Engine (v1.3.6)
 * Real-time event streaming for the AgenticKit.
 * Uses Redis lists as a high-speed event buffer.
 */

export type PulseEventType = 'INVOCATION' | 'SKILL_EXTRACTED' | 'SECURITY_ALERT' | 'MESSAGE_SENT' | 'AGENT_CALL' | 'EVOLUTION';

export interface PulseEvent {
  id: string;
  timestamp: number;
  type: PulseEventType;
  agentId: string;
  agentName: string;
  message: string;
  metadata?: Record<string, any>;
}

export class PulseEngine {
  private static GLOBAL_PULSE_KEY = 'aix:pulse:global';

  /**
   * Records a live event to the global pulse stream.
   */
  static async emit(event: Omit<PulseEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: PulseEvent = {
      ...event,
      id: crypto.randomBytes(6).toString('hex'),
      timestamp: Date.now()
    };

    // Push to global list, keep last 100 events
    await kv.lpush(this.GLOBAL_PULSE_KEY, fullEvent);
    await kv.ltrim(this.GLOBAL_PULSE_KEY, 0, 99);

  }

  /**
   * Retrieves the latest N events from the pulse stream.
   */
  static async getLatest(count: number = 20): Promise<PulseEvent[]> {
    return await kv.lrange<PulseEvent>(this.GLOBAL_PULSE_KEY, 0, count - 1);
  }
}
