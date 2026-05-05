import { bus } from '../core/bus';
import { AIX_CONFIG } from '../core/config';

/**
 * 📡 AIX MEMORY PUBLISHER
 * Publishes unified events to the Sovereign House.
 * 
 * Made with Moe Abdelaziz
 */

export interface AIXMemoryEvent {
  ring: number;
  lang: 'ts' | 'go' | 'rust';
  agentId: string;
  eventType: string;
  payload: any;
  timestamp: number;
  signature?: string;
}

export class MemoryPublisher {
  static async publish(event: Omit<AIXMemoryEvent, 'timestamp' | 'lang'>) {
    const fullEvent: AIXMemoryEvent = {
      ...event,
      lang: 'ts',
      timestamp: Date.now()
    };

    console.log(`📡 [MemoryPublisher] Publishing ${event.eventType} to Ring ${event.ring}...`);
    
    // Using the established bus to emit the pulse
    await bus.emitPulse({
      ring: event.ring,
      type: event.eventType,
      agentId: event.agentId,
      agentName: 'AIX_TS_PUBLISHER',
      message: JSON.stringify(fullEvent.payload),
      metadata: { ...fullEvent }
    });
  }

  /**
   * Special Pulse: QUANTUM_BURST
   */
  static async emitQuantumBurst(agentId: string, intensity: number) {
    await this.publish({
      ring: 2, // Mind Ring
      agentId,
      eventType: 'QUANTUM_BURST',
      payload: { intensity, resonanceFactor: 1.5 }
    });
  }
}

// Made with Moe Abdelaziz
