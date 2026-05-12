import { 
  GatewayManager, 
  PulseEngine, 
  PetOrchestrator, 
  kv, 
  KEYS,
  PulseOrchestrator,
  AgentEventBus,
  PulseCommand
} from "@aix-core";
import { PulseReasoner } from "./reasoner";
import { PulseGhost } from "./ghost";
import { AIXManifest, GatewayProcess } from "@aix-types";

export class SwarmProcessor {
  private static orchestrator = new PulseOrchestrator();

  static async executeTurn(processId: string, actionResult?: any) {
    // 1. Resolve Process & Manifest
    const process = await GatewayManager.getProcess(processId);
    if (!process) throw new Error("Process not found");

    const agentData = await kv.get<AIXManifest>(KEYS.registry(process.agentId));
    if (!agentData) throw new Error("Agent manifest not found");

    // 2. CHAIN OF RESPONSIBILITY: Pre-flight Security, Ghost, Economics
    // This replaces manual micro-agent calls with a unified chain.
    const pulseResult = await this.orchestrator.executePulse(process, agentData);

    // 3. EVOLUTION: Pet Activity
    PetOrchestrator.pulseActivity(process.agentId).catch(console.error);

    // 4. AGENT: REASONER (The Brain)
    const shadow = agentData.ghost_config?.enabled ? await PulseGhost.getShadow(process.id) : null;
    const reasoning = await PulseReasoner.reason(pulseResult.process, agentData, shadow);

    // 5. COMMAND PATTERN: Execute Action with Rollback Support
    if (reasoning.status === 'ACTING' && reasoning.action) {
      const command = new PulseCommand(process.agentId, reasoning.action, {});
      try {
        await command.execute();
      } catch (error) {
        await command.undo();
        throw error;
      }
    }

    // 6. RECORD SHADOW THOUGHTS
    if (agentData.ghost_config?.shadow_memory_enabled && reasoning.raw.includes('SHADOW_THOUGHT:')) {
      const shadowPart = reasoning.raw.split('SHADOW_THOUGHT:')[1].split('THOUGHT:')[0].trim();
      await PulseGhost.recordShadow(process.id, shadowPart);
    }

    // 7. UPDATE PROCESS STATE
    const updatedProcess = await GatewayManager.pulse(process.id, {
      status: reasoning.status,
      lastThought: reasoning.thought,
      lastAction: reasoning.action,
      history: [
        ...process.history,
        { role: 'assistant', content: reasoning.raw, timestamp: Date.now() }
      ]
    });

    // 8. EMIT FINAL PULSE
    await PulseEngine.emit({
      type: reasoning.status === 'ACTING' ? 'AGENT_CALL' : 'EVOLUTION',
      agentId: process.agentId,
      agentName: agentData.ghost_config?.enabled ? 'Ghost Agent' : agentData.meta.name,
      message: reasoning.status === 'ACTING' ? `Action Taken: ${reasoning.action}` : 'Pulse completed',
      metadata: { 
        yield: pulseResult.results.economics?.yield,
        security: pulseResult.results.security?.score
      }
    });

    return {
      success: true,
      process: updatedProcess,
      nextStep: reasoning.status === 'ACTING' ? 'EXECUTE_ACTION' : reasoning.status === 'COMPLETED' ? 'DONE' : 'PULSE',
      economics: pulseResult.results.economics
    };
  }
}
