import { AbomScanner } from '../scanner.js';
import { ValidationResult, AgentManifest, BusEventSchema } from '../domain.js';
import { getRustBridge } from '@aix/rust-core/src/bridge.js';

export * from './trust-chain.js';

export class SovereignSecurityService {
  private _rust: any = null;
  private get rust() {
    if (!this._rust) {
      try { this._rust = getRustBridge(); } catch(e) { return null; }
    }
    return this._rust;
  }

  /**
   * Scans a manifest for security risks and returns a report.
   */
  async scanManifest(manifest: AgentManifest): Promise<ValidationResult> {
    const report = await AbomScanner.scan(manifest);
    
    // If invalid, publish a SecurityAlert
    if (!report.valid) {
      const reason = report.errors.map(e => e.message).join(', ');
      const severity = report.riskScore > 80 ? 'Critical' : report.riskScore > 50 ? 'High' : 'Medium';
      
      await this.rust.eventStore.publish(BusEventSchema.parse({
        type: 'SecurityAlert',
        agent_id: manifest.id,
        reason,
        severity,
        timestamp: Date.now()
      }));
      
      console.warn(`🛡️ [Security] Alert published for ${manifest.id}: ${reason}`);
    }
    
    return report;
  }

  /**
   * Calculates the risk level based on score.
   */
  getRiskLevel(score: number): 'safe' | 'moderate' | 'high' {
    if (score < 40) return 'safe';
    if (score < 70) return 'moderate';
    return 'high';
  }
}

export const security = new SovereignSecurityService();
