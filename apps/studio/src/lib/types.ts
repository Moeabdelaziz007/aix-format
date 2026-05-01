import type { 
  AIXManifest as Manifest, 
  ABOM as CanonicalABOM, 
  IdentityLayer as CanonicalIdentityLayer, 
  SaasService as CanonicalSaasService,
  Meta as CanonicalMeta,
  Persona as CanonicalPersona,
  BuildProvenance as CanonicalBuildProvenance,
  RegistryEntry as CanonicalRegistryEntry
} from '@aix-types';

export type { Manifest };

/**
 * AIX Studio Unified Types
 * Extends Canonical Protocol Definitions with UI-specific state.
 */

export type DeployStatus = 'idle' | 'deploying' | 'deployed' | 'failed';

export interface DeploymentRecord {
  agentId: string;
  deployedAt: string;
  endpointUrl: string;
  mcpUrl: string;
  status: DeployStatus;
  txHash?: string;
  network?: string;
  signature?: string;
  signer?: string;
}

export interface PetConfig {
  type: 'fox' | 'octopus' | 'owl' | 'bee' | 'lion' | 'dolphin' | 'wolf' | 'butterfly' | 'elephant' | 'eagle';
  color: string;
  mood: 'curious' | 'busy' | 'happy' | 'tired' | 'alert' | 'creative' | 'sleep' | 'energized';
  level: number;
  accessories?: string[];
}


/**
 * RegistryEntry: Canonical + UI Overlays
 */
export interface RegistryEntry extends CanonicalRegistryEntry {
  deployment?: DeploymentRecord;
  risk_score?: number;
  pet?: PetConfig;
}

/**
 * AgentRecord: Internal Studio State
 */
export interface AgentRecord {
  id: string;
  name: string;
  role: string;
  createdAt: string;
  yaml: string;
  did?: string;
  kyc_tier?: string;
  deployment?: DeploymentRecord;
  pet?: PetConfig;
  color?: string;
  status?: 'online' | 'offline' | 'busy';
  successRate?: number;
  tasksCompleted?: number;
  manifest?: CanonicalManifest;
}


export type NormalizedAgent = AgentRecord & { isMock: boolean };

// ─── MCP Specifics ─────────────────────────────────────────────────────────

export interface McpDiscoveryResponse {
  mcpVersion: string;
  generated: string;
  totalAgents: number;
  agents: CanonicalRegistryEntry[];
}

export interface AgentSkill {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface McpPrompt {
  name: string;
  description?: string;
}

// ─── Identity & Auth ───────────────────────────────────────────────────────

export interface PiUser {
  uid: string;
  username?: string;
  credentials?: {
    scopes: string[];
    valid_until: {
      timestamp: number;
      iso8601: string;
    };
  };
}

export interface AuthResult {
  user: PiUser;
  accessToken: string;
}

// ─── Scan & Compliance ─────────────────────────────────────────────────────

export interface RiskItem {
  category: 'Capability' | 'Supply Chain' | 'Identity' | 'Compliance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
}

export interface ScanResult {
  score: number;
  grade: 'A'|'B'|'C'|'D'|'F';
  risks: RiskItem[];
  recommendations: string[];
  timestamp: string;
}
