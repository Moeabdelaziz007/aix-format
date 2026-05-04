import { kv } from "../storage/adapter";
import { KEYS } from "../storage/keys";

// --- Lego Block Pattern (Composition) ---
export abstract class AgentBlock {
  abstract id: string;
  abstract execute(context: unknown): Promise<unknown>;
}

// --- Skill Pattern (Atomic Logic) ---
export abstract class AgentSkill {
  abstract name: string;
  abstract run(params: unknown): Promise<unknown>;
}

// --- Russian Doll Pattern (Hierarchy) ---
export interface IHierarchy {
  children: unknown[];
  addChild(child: unknown): void;
}

// --- Event Bus (Redis Pub/Sub for Decoupling) ---
export class RedisEventBus {
  private static instance: RedisEventBus;
  
  static getInstance() {
    if (!RedisEventBus.instance) RedisEventBus.instance = new RedisEventBus();
    return RedisEventBus.instance;
  }

  async publish(channel: string, message: unknown) {
    await kv.lpush(KEYS.aixEvents(channel), message);
  }

  async subscribe(channel: string, callback: (data: unknown) => void) {
    // Simulated subscription
  }
}

// --- Previous Patterns (Chain, Command, Strategy, Factory) ---
export abstract class PulseHandler {
  private nextHandler?: PulseHandler;
  setNext(handler: PulseHandler): PulseHandler {
    this.nextHandler = handler;
    return handler;
  }
  async handle(request: unknown): Promise<unknown> {
    if (this.nextHandler) return this.nextHandler.handle(request);
    return request;
  }
}

export interface ICommand {
  execute(): Promise<unknown>;
  undo?(): Promise<void>;
}

export interface IStrategy<T, R> {
  execute(input: T): Promise<R>;
}

export abstract class AgentFactory<T> {
  abstract create(type: string, config: unknown): T;
}

export class AgentEventBus { 
  emit(e: string, data: unknown){} 
  on(e: string, handler: (data: unknown) => void){} 
}

// Made with Moe Abdelaziz
