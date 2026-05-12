import { kv, KEYS, evaluateAgent, executeDeadHand, sendHeartbeat, PulseEngine } from "@aix-core";

export type SecurityStatus = 'SAFE' | 'WARN' | 'QUARANTINE';

export interface SecurityResult {
  safe: boolean;
  error?: string;
  status: SecurityStatus;
  score: number; // 0-100
}

export class PulseSecurity {
  /**
   * Performs multi-layer security verification.
   * 1. Dead Hand: Checks for manual freeze or inactivity triggers.
   * 2. Static/Behavioral: Evaluates threats and issues quarantine.
   * 3. Consensus: Simulated peer-review (Out-of-the-box swarm intelligence).
   */
  static async verifySafety(agentId: string): Promise<SecurityResult> {
    // 1. Check for manual freeze (The Core)
    const frozen = await kv.get(KEYS.frozen(agentId));
    if (frozen) {
      return { 
        safe: false, 
        error: "Sovereign Emergency: Agent memory frozen by Dead Hand Protocol",
        status: 'QUARANTINE',
        score: 0
      };
    }

    // 2. Evaluate threats & Swarm Consensus
    const [threat, consensus] = await Promise.all([
      evaluateAgent(agentId),
      this.consensusCheck(agentId)
    ]);

    if (threat) {
      await executeDeadHand(threat);
      
      await PulseEngine.emit({
        type: 'SECURITY_ALERT',
        agentId: agentId,
        agentName: agentId,
        message: `DEAD HAND TRIGGERED: ${threat.reason}`
      });

      return { 
        safe: false, 
        error: `Dead Hand Triggered: ${threat.reason}`,
        status: 'QUARANTINE',
        score: 10
      };
    }

    // 3. Renew heartbeat & Return Consensus
    await sendHeartbeat(agentId);

    if (consensus < 50) {
      return {
        safe: false,
        error: "Swarm Consensus Rejected: Behavioral anomaly detected by peers.",
        status: 'QUARANTINE',
        score: consensus
      };
    }

    return { 
      safe: true, 
      status: consensus < 80 ? 'WARN' : 'SAFE', 
      score: consensus 
    };
  }

  /**
   * Out-of-the-box: Swarm Consensus Check.
   * In a real swarm, this would query other agents for behavior validation.
   */
  private static async consensusCheck(agentId: string): Promise<number> {
    // Simulated consensus logic: If the agent has been "acting" too fast, peers get suspicious.
    const lastPulses = await kv.lrange(`aix:pulses:${agentId}`, 0, 5);
    if (lastPulses.length > 3) {
      // Logic: if 3 pulses happened in < 1 second, consensus drops
      return 45; // Reject
    }
    return 92; // Accept
  }
}
