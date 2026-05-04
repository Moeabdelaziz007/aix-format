/**
 * AIX Sovereign Patterns v2.2
 * Foundation for Lego Block Composition & Russian Doll Nesting.
 */
export declare abstract class AgentBlock {
    abstract id: string;
    abstract execute(context: any): Promise<any>;
}
export declare abstract class AgentSkill {
    abstract name: string;
    abstract run(params: any): Promise<any>;
}
export interface IHierarchy {
    children: any[];
    addChild(child: any): void;
}
export declare class RedisEventBus {
    private static instance;
    static getInstance(): RedisEventBus;
    publish(channel: string, message: any): Promise<void>;
    subscribe(channel: string, callback: (data: any) => void): Promise<void>;
}
export declare abstract class PulseHandler {
    private nextHandler?;
    setNext(handler: PulseHandler): PulseHandler;
    handle(request: any): Promise<any>;
}
export interface ICommand {
    execute(): Promise<any>;
    undo?(): Promise<void>;
}
export interface IStrategy<T, R> {
    execute(input: T): Promise<R>;
}
export declare abstract class AgentFactory<T> {
    abstract create(type: string, config: any): T;
}
export declare class AgentEventBus {
    private static instance;
    private constructor();
    static getInstance(): AgentEventBus;
    emit(e: any, payload?: any): void;
    on(e: any, cb?: any): void;
}
