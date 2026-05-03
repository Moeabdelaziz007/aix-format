import { ICommand } from "../patterns";
import { kv, PulseEngine } from "../index";

/**
 * Command pattern implementation for agent pulse actions.
 * @example
 * await new PulseCommand("agent-1", "jump", {}).execute();
 */
export class PulseCommand implements ICommand {
  constructor(
    private agentId: string, 
    private action: string, 
    private params: any
  ) {}

  async execute() {
    console.log(`[Command] Executing ${this.action} for ${this.agentId}`);
    
    // Simulate action execution
    await PulseEngine.emit({
      type: 'AGENT_CALL',
      agentId: this.agentId,
      agentName: this.agentId,
      message: `Executed action: ${this.action}`
    });

    return { success: true };
  }

  async undo() {
    console.log(`[Command] Rolling back ${this.action} for ${this.agentId}`);
    await kv.del(`aix:action:result:${this.agentId}`);
  }
}

/**
 * Command to spawn child agents for sub-tasks.
 * @example
 * await new SpawnSubTaskCommand("parent", "task").execute();
 */
export class SpawnSubTaskCommand implements ICommand {
  constructor(private parentId: string, private task: string) {}

  async execute() {
    console.log(`[Command] Spawning sub-task for ${this.parentId}: ${this.task}`);
    // Logic to spawn a child agent
  }
}
