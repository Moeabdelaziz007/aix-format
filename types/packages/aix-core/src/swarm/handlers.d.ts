import { PulseHandler } from "../patterns";
import { AIXManifest } from "@aix-types";
import { GatewayProcess } from "../gateway";
export interface PulseRequest {
    process: GatewayProcess;
    manifest: AIXManifest;
    results: {
        security?: any;
        economics?: any;
        reasoning?: any;
        ghost?: any;
    };
}
export declare class SecurityHandler extends PulseHandler {
    handle(request: PulseRequest): Promise<any>;
}
export declare class EconomicsHandler extends PulseHandler {
    handle(request: PulseRequest): Promise<any>;
}
export declare class GhostHandler extends PulseHandler {
    handle(request: PulseRequest): Promise<any>;
}
