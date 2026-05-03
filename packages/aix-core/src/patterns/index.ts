/**
 * AIX Sovereign Patterns v2.2
 * Foundation for Lego Block Composition & Russian Doll Nesting.
 */

import { kv } from "../storage/adapter";

// --- Lego Block Pattern (Composition) ---
export abstract class AgentBlock {
  abstract id: string;
  abstract execute(context: any): Promise<any>;
}

// --- Skill Pattern (Atomic Logic) ---
export abstract class AgentSkill {
  abstract name: string;
  abstract run(params: any): Promise<any>;
}

// --- Russian Doll Pattern (Hierarchy) ---
export interface IHierarchy {
  children: any[];
  addChild(child: any): void;
}

// --- Event Bus (Redis Pub/Sub for Decoupling) ---
export class RedisEventBus {
  private static instance: RedisEventBus;
  
  static getInstance() {
    if (!RedisEventBus.instance) RedisEventBus.instance = new RedisEventBus();
    return RedisEventBus.instance;
  }

  async publish(channel: string, message: any) {
    await kv.lpush(`aix:events:${channel}`, message); // Simplified persistence
    // In a real pub/sub, we'd use redis.publish
  }

  async subscribe(channel: string, callback: (data: any) => void) {
    // Simulated subscription via polling or long-lived connection
  }
}

// --- Previous Patterns (Chain, Command, Strategy, Factory) ---
export abstract class PulseHandler {
  private nextHandler?: PulseHandler;
  setNext(handler: PulseHandler): PulseHandler {
    this.nextHandler = handler;
    return handler;
  }
  async handle(request: any): Promise<any> {
    if (this.nextHandler) return this.nextHandler.handle(request);
    return request;
  }
}

export interface ICommand {
  execute(): Promise<any>;
  undo?(): Promise<void>;
}

export interface IStrategy<T, R> {
  execute(input: T): Promise<R>;
}

export abstract class AgentFactory<T> {
  abstract create(type: string, config: any): T;
}

export class AgentEventBus { emit(e: any){} on(e: any){} }
