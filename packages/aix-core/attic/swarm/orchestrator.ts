import { 
  SecurityHandler, 
  EconomicsHandler, 
  GhostHandler, 
  PulseRequest 
} from "./handlers";
import { GatewayProcess, AIXManifest } from "@aix-types";


export class PulseOrchestrator {
  private chain: SecurityHandler;

  constructor() {
    // Construct the chain
    this.chain = new SecurityHandler();
    this.chain
      .setNext(new GhostHandler())
      .setNext(new EconomicsHandler());
  }

  /**
   * 📡 PREDICTIVE SWARM RADAR (Round 56)
   * Scans for cognitive drift before pulse execution.
   */
  public async predictSwarmFailure(manifest: AIXManifest): Promise<boolean> {
    if (!manifest.topological_integrity) return true; // High risk if missing integrity
    
    const gateway = new Gateway();
    const topology = await gateway.verifyTopology(manifest.did);
    
    // If structural integrity score < 90, predict failure
    return topology.score < 90;
  }

  async executePulse(process: GatewayProcess, manifest: AIXManifest) {
    const gateway = new Gateway();
    const gear = gateway.getSovereignGear(manifest.identity_layer?.role || 'general');

    // 🌀 [ARABIC_SOVEREIGNTY]: ضبط عمق النبضة بناءً على "ناقل الحركة"
    console.log(`[Orchestrator] Executing Pulse in ${gear} mode...`);

    const request: PulseRequest = {
      process,
      manifest,
      results: {},
      sovereignGear: gear // 🛰️ Injecting gear into handlers
    };

    try {
      return await this.chain.handle(request);
    } catch (error: any) {
      // 🩹 [SELF_HEALING]: If failed in TURBO, try once in SOVEREIGN
      if (gear === 'TURBO' && error.message.includes('SOVEREIGN_ALARM')) {
        console.log('🔄 [Self-Healing] Shifting to SOVEREIGN gear for retry...');
        request.sovereignGear = 'SOVEREIGN';
        return await this.chain.handle(request);
      }

      AgentEventBus.getInstance().emit('pulse:error', {
        agentId: process.agentId,
        error: error.message
      });
      throw error;
    }
  }
}
