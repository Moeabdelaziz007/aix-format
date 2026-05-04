import { z } from 'zod';
import { CircuitBreaker } from './security/circuit-breaker';

/**
 * AIX LLM Provider — The Sovereign Standard
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

/**
 * Tool registry: name → async function
 */
export type ToolRegistry = Record<string, (input: any) => Promise<string>>;

/**
 * Config passed to AgentRuntimeEngine
 */
export interface AgentRuntimeConfig {
  llm: LLMProvider;
  tools?: ToolRegistry;
}

/**
 * OpenAI adapter
 * Works with openai npm package (v4+)
 *
 * Example:
 *   import OpenAI from 'openai';
 *   const llm = new OpenAIProvider(new OpenAI({ apiKey: '...' }));
 */
export class OpenAIProvider implements LLMProvider {
  private cb: CircuitBreaker;
  model: string;

  constructor(
    private client: any,
    config: { model?: string; name?: string } = {}
  ) {
    this.model = config.model || 'gpt-4o';
    this.cb = new CircuitBreaker({ name: config.name || 'OpenAI' });
  }

  async complete(prompt: string, stopTokens?: string[]): Promise<string> {
    return this.cb.execute(async () => {
      const res = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        stop: stopTokens,
      });
      return res.choices[0]?.message?.content ?? '';
    });
  }
}

/**
 * Anthropic adapter
 * Works with @anthropic-ai/sdk package
 *
 * Example:
 *   import Anthropic from '@anthropic-ai/sdk';
 *   const llm = new AnthropicProvider(new Anthropic({ apiKey: '...' }));
 */
export class AnthropicProvider implements LLMProvider {
  private cb: CircuitBreaker;
  model: string;

  constructor(
    private client: any,
    config: { model?: string; name?: string } = {}
  ) {
    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.cb = new CircuitBreaker({ name: config.name || 'Anthropic' });
  }

  async complete(prompt: string, _stopTokens?: string[]): Promise<string> {
    return this.cb.execute(async () => {
      const res = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });
      const block = res.content.find((b: any) => b.type === 'text');
      return block?.text ?? '';
    });
  }
}

/**
 * Mock provider for testing — no external calls
 *
 * Example:
 *   const llm = new MockProvider([
 *     'I need to search for X. Action: search({ query: "X" })',
 *     'Final Answer: Found the result.',
 *   ]);
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
/**
 * Groq Provider - Fast as Light (v1.3.4)
 * Uses Groq Cloud API for near-instant inference.
 * 
 * Example:
 *   const llm = new GroqProvider(process.env.GROQ_API_KEY!);
 */
export class GroqProvider implements LLMProvider {
  private cb: CircuitBreaker;
  model: string;

  constructor(
    private apiKey: string,
    model = 'llama-3.3-70b-versatile'
  ) {
    this.model = model;
    this.cb = new CircuitBreaker({ name: 'Groq' });
  }

  async complete(prompt: string, stopTokens?: string[]): Promise<string> {
    return this.cb.execute(async () => {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          stop: stopTokens,
          max_tokens: 2048,
          temperature: 0.7
        })
      });

      if (!res.ok) throw new Error(`Groq API Error: ${res.status}`);
      const data = await res.json() as any;
      return data.choices[0]?.message?.content ?? '';
    });
  }
}
/**
 * Langfuse Tracing Provider
 * Wraps any LLMProvider to add observability
 */
export class LangfuseProvider implements LLMProvider {
  private langfuse: any = null;
  public model?: string;

  constructor(
    private inner: LLMProvider,
    private config: {
      publicKey: string;
      secretKey: string;
      baseUrl?: string;
    }
  ) {
    this.model = inner.model;
  }

  private redactSensitiveData(data: any): any {
    if (!data) return data;
    try {
      const json = typeof data === 'string' ? data : JSON.stringify(data);
      const redacted = json
        .replace(/(sk-|gsk_|upstash_|SECRET_|API_KEY)[a-zA-Z0-9_-]{16,}/gi, '[REDACTED_SECRET]')
        .replace(/redis(s)?:\/\/[^"'\s]+/gi, '[REDACTED_REDIS_URL]')
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
      
      return typeof data === 'string' ? redacted : JSON.parse(redacted);
    } catch (e) {
      return '[REDACTION_ERROR]';
    }
  }

  async complete(prompt: string, stopTokens?: string[]): Promise<string> {
    const startTime = Date.now();
    if (!this.langfuse) {
      try {
        const { Langfuse } = await import('langfuse');
        this.langfuse = new Langfuse({
          publicKey: this.config.publicKey,
          secretKey: this.config.secretKey,
          baseUrl: this.config.baseUrl || 'https://cloud.langfuse.com',
        });
      } catch (e) {
        return this.inner.complete(prompt, stopTokens);
      }
    }

    const trace = this.langfuse.trace({
      name: 'agent-execution',
      input: this.redactSensitiveData({ prompt, model: this.model }),
      metadata: {
        agentId: 'sovereign-agent', // Should ideally be passed from runtime
        route: 'aix-gateway',
        trustScore: 10 // Tesla Harmonic 10
      },
      tags: ['production', 'sovereign-loop']
    });

    const generation = trace.generation({
      name: 'llm-completion',
      model: this.model,
      input: this.redactSensitiveData(prompt)
    });

    try {
      const response = await this.inner.complete(prompt, stopTokens);
      const latencyMs = Date.now() - startTime;

      generation.update({ 
        output: this.redactSensitiveData(response),
        metadata: { latencyMs }
      });

      return response;
    } catch (error: any) {
      generation.update({ 
        level: 'ERROR', 
        statusMessage: this.redactSensitiveData(error.message) 
      });
      throw error;
    } finally {
      // In a real long-running process, we'd flush periodically
      // But for agentic bursts, we flush to ensure visibility
      await this.langfuse.flushAsync();
    }
  }

  /**
   * Manual flush for shutdown scenarios
   */
  async shutdown() {
    if (this.langfuse) {
      await this.langfuse.flushAsync();
    }
  }
}
