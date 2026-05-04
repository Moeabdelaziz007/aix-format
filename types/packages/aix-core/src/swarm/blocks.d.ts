import { AgentBlock } from "../patterns";
export declare class AuthBlock extends AgentBlock {
    id: string;
    execute(context: any): Promise<{
        authenticated: boolean;
        user: any;
    }>;
}
export declare class KYCBlock extends AgentBlock {
    id: string;
    execute(context: any): Promise<{
        verified: boolean;
        level: number;
    }>;
}
export declare class PayBlock extends AgentBlock {
    id: string;
    execute(context: any): Promise<{
        success: boolean;
        txId: string;
    }>;
}
/**
 * Agent Composer: Assembles an agent from blocks.
 */
export declare class AgentComposer {
    static compose(blocks: AgentBlock[], context: any): Promise<any>;
}
