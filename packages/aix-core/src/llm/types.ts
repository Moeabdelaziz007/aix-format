import { z } from 'zod';
import { CircuitBreaker } from '../infra';

/**
 * 🌌 AIX LLM Types
 */

export const LLMConfigSchema = z.object({
  model: z.string().optional(),
  apiKey: z.string().min(1, "API Key is required"),
  circuitBreaker: z.object({
    failureThreshold: z.number().optional(),
    recoveryTimeout: z.number().optional()
  }).optional()
});

export interface LLMProvider {
  complete(prompt: string, stopTokens?: string[]): Promise<string>;
  model?: string;
}

export type ToolRegistry = Record<string, (input: any) => Promise<string>>;

export interface AgentRuntimeConfig {
  llm: LLMProvider;
  tools?: ToolRegistry;
}

/**
 * Mock provider for testing — no external calls
 */
export class MockProvider implements LLMProvider {
  model = 'mock';
  private responses: string[];
  private index = 0;

  constructor(responses: string[]) {
    this.responses = responses;
  }

  async complete(_prompt: string, _stopTokens?: string[]): Promise<string> {
    const r = this.responses[this.index] ?? 'Final Answer: done.';
    this.index = Math.min(this.index + 1, this.responses.length - 1);
    return r;
  }
}
