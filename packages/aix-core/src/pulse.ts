import { kv, KEYS } from './index';

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

/**
 * AIX Pulse Engine (v1.3.6)
 * Real-time event streaming for the AgenticKit.
 * Uses Redis lists as a high-speed event buffer.
 * @example
 * await PulseEngine.emit({ type: 'AGENT_CALL', ... });
 */
export class PulseEngine {
  private static GLOBAL_PULSE_KEY = 'aix:pulse:global';

  /**
   * Records a live event to the global pulse stream.
   * @param {Omit<PulseEvent, 'id' | 'timestamp'>} event - The event to emit.
   * @returns {Promise<void>} Resolves when emitted.
   * @example
   * await PulseEngine.emit({ type: 'INVOCATION', agentId: 'agent-1', ... });
   */
  static async emit(event: Omit<PulseEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: PulseEvent = {
      ...event,
      id: Math.random().toString(36).slice(2, 12),
      timestamp: Date.now()
    };

    // Push to global list, keep last 100 events
    await kv.lpush(this.GLOBAL_PULSE_KEY, fullEvent);
    await kv.ltrim(this.GLOBAL_PULSE_KEY, 0, 99);

    console.log(`[Pulse] ${fullEvent.type} from ${fullEvent.agentName}: ${fullEvent.message}`);
  }

  /**
   * Retrieves the latest N events from the pulse stream.
   * @param {number} [count=20] - Number of events to retrieve.
   * @returns {Promise<PulseEvent[]>} The latest pulse events.
   * @example
   * const events = await PulseEngine.getLatest(10);
   */
  static async getLatest(count: number = 20): Promise<PulseEvent[]> {
    return await kv.lrange<PulseEvent>(this.GLOBAL_PULSE_KEY, 0, count - 1);
  }
}
