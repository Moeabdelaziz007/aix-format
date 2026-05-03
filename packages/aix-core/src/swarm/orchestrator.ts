import { 
  SecurityHandler, 
  EconomicsHandler, 
  GhostHandler, 
  PulseRequest 
} from "./handlers";
import { GatewayProcess, AIXManifest } from "@aix-types";


/**
 * Orchestrates the execution of pulse handlers.
 * @example
 * await new PulseOrchestrator().executePulse(proc, manifest);
 */
export class PulseOrchestrator {
  private chain: SecurityHandler;

  constructor() {
    // Construct the chain
    this.chain = new SecurityHandler();
    this.chain
      .setNext(new GhostHandler())
      .setNext(new EconomicsHandler());
  }

  async executePulse(process: GatewayProcess, manifest: AIXManifest) {
    const request: PulseRequest = {
      process,
      manifest,
      results: {}
    };

    try {
      const finalRequest = await this.chain.handle(request);
      
      // Emit event (Observer Pattern)
      AgentEventBus.getInstance().emit('pulse:success', {
        agentId: process.agentId,
        yield: finalRequest.results.economics?.yield
      });

      return finalRequest;
    } catch (error: any) {
      AgentEventBus.getInstance().emit('pulse:error', {
        agentId: process.agentId,
        error: error.message
      });
      throw error;
    }
  }
}
