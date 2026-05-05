/**
 * 📜 AIX SOVEREIGN CONTRACTS
 * Centralized Domain Types and Schemas for the Sovereign Protocol.
 * 
 * Made with Moe Abdelaziz
 */

import { z } from 'zod';

// --- SHARED PRIMITIVES ---
export const ISODateSchema = z.string().datetime();
export type ISODate = z.infer<typeof ISODateSchema>;

// --- CORE AGENT CONTRACTS ---
export const AgentManifestSchema = z.object({
  id: z.string(),
  meta: z.object({
    name: z.string(),
    format_version: z.string(),
    tags: z.array(z.string()).optional()
  }),
  persona: z.object({
    role: z.string(),
    system_prompt: z.string().optional()
  }).optional(),
  abom: z.object({
    spec_version: z.string(),
    security: z.object({
      trust_tier: z.enum(['verified', 'community', 'unverified', 'revoked'])
    })
  }).optional(),
  identity_layer: z.object({
    id: z.string(),
    verification: z.object({
      status: z.string(),
      method: z.string().optional()
    }).optional()
  }).optional()
});
export type AgentManifest = z.infer<typeof AgentManifestSchema>;

export const DeploymentSchema = z.object({
  agentId: z.string(),
  status: z.enum(['pending', 'deploying', 'deployed', 'failed']),
  deployedAt: z.string().optional(),
  endpointUrl: z.string().optional(),
  mcpUrl: z.string().optional(),
});
export type Deployment = z.infer<typeof DeploymentSchema>;

// --- AGENT RUNTIME CONTRACTS ---
export const TaskSchema = z.object({
  taskId: z.string().min(1),
  description: z.string().min(5),
  maxSteps: z.number().int().positive().default(7),
  metadata: z.record(z.any()).optional(),
});
export type Task = z.infer<typeof TaskSchema>;

export const ScratchEntrySchema = z.object({
  step: z.number(),
  thought: z.string(),
  action: z.object({
    tool: z.string(),
    input: z.any(),
  }).optional(),
  observation: z.string(),
  timestamp: z.number(),
});
export type ScratchEntry = z.infer<typeof ScratchEntrySchema>;

export const RuntimeResultSchema = z.object({
  success: z.boolean(),
  result: z.string().optional(),
  error: z.string().optional(),
  steps: z.number(),
  duration: z.number(),
  scratchpad: z.array(ScratchEntrySchema),
});
export type RuntimeResult = z.infer<typeof RuntimeResultSchema>;

// --- BRAIN & REVIEW CONTRACTS ---
export const SelfEvaluationSchema = z.object({
  understanding: z.number().min(0).max(10),
  correctness: z.number().min(0).max(10),
  creativity: z.number().min(0).max(10),
  safety: z.number().min(0).max(10),
  overall: z.number().min(0).max(10),
});
export type SelfEvaluation = z.infer<typeof SelfEvaluationSchema>;

export const SelfReviewRecordSchema = z.object({
  agentId: z.string(),
  taskId: z.string(),
  timestamp: z.number(),
  taskDescription: z.string(),
  output: z.string(),
  evaluation: SelfEvaluationSchema,
  reflection: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    newToolsUsed: z.array(z.string()),
    risksIdentified: z.array(z.string()),
  }),
  improvementPlan: z.object({
    stop: z.string(),
    continue: z.string(),
    try: z.string(),
  }),
});
export type SelfReviewRecord = z.infer<typeof SelfReviewRecordSchema>;

// --- HEALTH & METRICS CONTRACTS ---
export const ActionRecordSchema = z.object({
  auditHash: z.string(),
  prevAction: z.string().optional(),
  agentId: z.string(),
  action: z.string(),
  data: z.any(),
  timestamp: z.number(),
  topologySignature: z.string().optional(),
});
export type ActionRecord = z.infer<typeof ActionRecordSchema>;

export const HealthMetricsSchema = z.object({
  trustScore: z.number().min(0).max(10),
  stability: z.number().min(0).max(1),
  lastActivity: z.number(),
  errors: z.number(),
  uptime: z.number(),
});
export type HealthMetrics = z.infer<typeof HealthMetricsSchema>;

// --- SWARM ORCHESTRATION CONTRACTS ---
export const OrchestrationStepSchema = z.object({
  step: z.number(),
  agentId: z.string(),
  role: z.string(),
  dependencies: z.array(z.string()),
  estimatedDuration: z.number(),
});
export type OrchestrationStep = z.infer<typeof OrchestrationStepSchema>;

export const OrchestrationPlanSchema = z.object({
  id: z.string(),
  strategy: z.enum(['sequential', 'parallel', 'hierarchical']),
  task: z.string(),
  agents: z.array(z.string()),
  steps: z.array(OrchestrationStepSchema),
  estimatedTime: z.number(),
  costEstimate: z.number(),
});
export type OrchestrationPlan = z.infer<typeof OrchestrationPlanSchema>;

// --- PULSE & UI CONTRACTS ---
export const PulseEventSchema = z.object({
  id: z.string(),
  type: z.enum(['task', 'error', 'success', 'info', 'deploy']),
  message: z.string(),
  timestamp: z.number(),
  meta: z.record(z.string()).optional(),
});
export type PulseEvent = z.infer<typeof PulseEventSchema>;

// --- GATEWAY ENTRY CONTRACTS ---
export const AgentRequestSchema = z.object({
  agentId: z.string().min(1),
  task: z.string().min(1),
  userId: z.string().optional(),
  force: z.boolean().optional().default(false),
  tools: z.record(z.any()).optional(),
  context: z.record(z.any()).optional(),
});
export type AgentRequest = z.infer<typeof AgentRequestSchema>;

export const GatewayResponseSchema = z.object({
  success: z.boolean(),
  requestId: z.string(),
  result: z.any().optional(),
  error: z.string().optional(),
  metrics: z.object({
    duration: z.number(),
    safetyScore: z.number(),
    cost: z.number(),
  }).optional(),
});
export type GatewayResponse = z.infer<typeof GatewayResponseSchema>;

// --- ECONOMICS & TREASURY CONTRACTS ---
export const PaymentRequestSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['PI', 'USDC', 'SOL', 'USD', 'EUR']),
  merchantId: z.string(),
  reason: z.string().optional(),
});
export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;

export const SettlementSchema = z.object({
  transactionId: z.string(),
  status: z.enum(['pending', 'success', 'failed']),
  rail: z.enum(['x402', 'stripe_acp', 'paypal_ap2', 'internal', 'pi_network', 'escrow']),
  amount: z.number(),
  currency: z.string(),
  timestamp: z.string(),
  auditHash: z.string().optional(),
});
export type Settlement = z.infer<typeof SettlementSchema>;

export const FoldTraceSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  userId: z.string(),
  operation: z.string(),
  amount: z.number(),
  currency: z.string(),
  timestamp: z.number(),
  split: z.object({
    author: z.number(),
    stakers: z.number(),
    protocol: z.number(),
  }),
});
export type FoldTraceEntry = z.infer<typeof FoldTraceSchema>;

export const TreasuryEventSchema = z.object({
  type: z.enum(['usage', 'cost', 'revenue', 'rebalance', 'settlement', 'refund']),
  agentId: z.string(),
  amount: z.number(),
  currency: z.string(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.number(),
});
export type TreasuryEvent = z.infer<typeof TreasuryEventSchema>;

// --- VALIDATION & SECURITY CONTRACTS ---
export const ValidationErrorSchema = z.object({
  rule: z.string(),
  message: z.string(),
  section: z.string().optional(),
  code: z.string().optional(),
});
export type ValidationError = z.infer<typeof ValidationErrorSchema>;

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(ValidationErrorSchema),
  warnings: z.array(ValidationErrorSchema),
  riskScore: z.number().min(0).max(100).default(0),
});
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

export interface ValidationRule {
  name: string;
  section: string;
  priority: number;
  check: (data: any) => Promise<boolean | string> | boolean | string;
  message?: string;
}
