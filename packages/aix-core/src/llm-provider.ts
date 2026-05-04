/**
 * AIX LLM Provider — The Missing Keystone
 *
 * This file is the gravity center that was absent.
 * Without it, agent-runtime.ts had TODO placeholders.
 * With it, AIX becomes a real library.
 *
 * Usage:
 *   import { OpenAIProvider } from './llm-provider';
 *   const agent = new AgentRuntimeEngine(id, name, task, {
 *     llm: new OpenAIProvider(openai),
 *     tools: { search: mySearchFn }
 *   });
 */

/**
 * Core contract: any LLM that AIX can drive
 */
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
  model = 'gpt-4o';

  constructor(
    private client: {
      chat: {
        completions: {
          create(params: any): Promise<{ choices: Array<{ message: { content: string | null } }> }>;
        };
      };
    },
    model = 'gpt-4o'
  ) {
    this.model = model;
  }

  async complete(prompt: string, stopTokens?: string[]): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stop: stopTokens,
    });
    return res.choices[0]?.message?.content ?? '';
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
  model = 'claude-3-5-sonnet-20241022';

  constructor(
    private client: {
      messages: {
        create(params: any): Promise<{ content: Array<{ type: string; text: string }> }>;
      };
    },
    model = 'claude-3-5-sonnet-20241022'
  ) {
    this.model = model;
  }

  async complete(prompt: string, _stopTokens?: string[]): Promise<string> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = res.content.find(b => b.type === 'text');
    return block?.text ?? '';
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
  model = 'llama-3.3-70b-versatile';

  constructor(
    private apiKey: string,
    model = 'llama-3.3-70b-versatile'
  ) {
    this.model = model;
  }

  async complete(prompt: string, stopTokens?: string[]): Promise<string> {
    try {
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

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Groq API Error: ${res.status} - ${error}`);
      }

      const data = await res.json() as any;
      return data.choices[0]?.message?.content ?? '';
    } catch (error) {
      console.error('❌ GroqProvider Error:', error);
      throw error;
    }
  }
}
/**
 * Langfuse Tracing Provider
 * Wraps any LLMProvider to add observability
 */
export class LangfuseProvider implements LLMProvider {
  private langfuse: any = null;

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

  model?: string;

  async complete(prompt: string, stopTokens?: string[]): Promise<string> {
    if (!this.langfuse) {
      try {
        const { Langfuse } = await import('langfuse');
        this.langfuse = new Langfuse({
          publicKey: this.config.publicKey,
          secretKey: this.config.secretKey,
          baseUrl: this.config.baseUrl || 'https://cloud.langfuse.com',
        });
      } catch (e) {
        console.warn('⚠️ Langfuse SDK not found, falling back to raw execution');
        return this.inner.complete(prompt, stopTokens);
      }
    }

    const trace = this.langfuse.trace({
      name: 'aix-inference',
      input: this.redactSensitiveData({ prompt }),
      tags: ['sovereign-loop']
    });

    const generation = trace.generation({
      name: 'llm-completion',
      input: this.redactSensitiveData(prompt)
    });

    try {
      const response = await this.inner.complete(prompt, stopTokens);
      
      generation.update({
        output: this.redactSensitiveData(response)
      });
      
      return response;
    } catch (error: any) {
      generation.update({
        level: 'ERROR',
        statusMessage: error.message
      });
      throw error;
    } finally {
      await this.langfuse.flushAsync();
    }
  }
}
