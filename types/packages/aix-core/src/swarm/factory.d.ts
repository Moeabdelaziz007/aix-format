import { AgentFactory } from "../patterns";
import { AIXManifest } from "@aix-types";
export type AgentType = 'trader' | 'guardian' | 'ghost' | 'scout';
export declare class SovereignAgentFactory extends AgentFactory<any> {
    create(type: AgentType, config: AIXManifest): {
        role: string;
        meta: import("@aix-types").Meta;
        persona: import("@aix-types").Persona;
        security: import("@aix-types").Security;
        identity_layer: import("@aix-types").IdentityLayer;
        skills?: any[];
        apis?: any[];
        mcp?: {
            endpoints: Array<{
                uri: string;
                name?: string;
            }>;
        };
        abom: import("@aix-types").ABOM;
        build_provenance?: import("@aix-types").BuildProvenance;
        economics: import("@aix-types").Economics;
        is_shadow_clone?: boolean;
        ghost_config?: import("@aix-types").GhostConfig;
    };
}
