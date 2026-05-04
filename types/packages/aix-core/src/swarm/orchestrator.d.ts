import { AIXManifest } from "@aix-types";
import { GatewayProcess } from "../gateway";
export declare class PulseOrchestrator {
    private chain;
    constructor();
    executePulse(process: GatewayProcess, manifest: AIXManifest): Promise<any>;
}
