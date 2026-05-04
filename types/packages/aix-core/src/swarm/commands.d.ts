import { ICommand } from "../patterns";
export declare class PulseCommand implements ICommand {
    private agentId;
    private action;
    private params;
    constructor(agentId: string, action: string, params: any);
    execute(): Promise<{
        success: boolean;
    }>;
    undo(): Promise<void>;
}
export declare class SpawnSubTaskCommand implements ICommand {
    private parentId;
    private task;
    constructor(parentId: string, task: string);
    execute(): Promise<void>;
}
