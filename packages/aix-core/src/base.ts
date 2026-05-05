
import { EventEmitter } from 'events';

/**
 * 🏛️ SOVEREIGN_ENTITY_BASE
 * The root of all sentient components in AIX-Format.
 * Provides unified communication and state broadcasting.
 * Made with Moe Abdelaziz
 */
export abstract class SovereignEntity extends EventEmitter {
  protected entityId: string;

  constructor(entityId: string) {
    super();
    this.entityId = entityId;
  }

  /**
   * 📡 Broadcasts state to the ecosystem.
   * Centralized to allow future expansion (WebSockets, TrustChain logging, etc.)
   */
  protected async emitState(type: string, message: string): Promise<void> {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] [${this.entityId}] [${type.toUpperCase()}] ${message}`;
    
    // 1. Local Event
    this.emit(type, { message, timestamp });
    
    // 2. Console (Development/Live Logs)
    console.log(formattedMessage);
    
    // 3. Proactive: Could append to a local "Pulse Log" for the Dashboard
  }
}
