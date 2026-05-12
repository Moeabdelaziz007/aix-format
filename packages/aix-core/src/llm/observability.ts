import { LLMProvider } from './types';

/**
 * 👁️ AIX Observability - Langfuse Wrapper
 * Made with Moe Abdelaziz
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
        agentId: 'sovereign-agent',
        route: 'aix-gateway',
        trustScore: 10
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
      await this.langfuse.flushAsync();
    }
  }

  async shutdown() {
    if (this.langfuse) {
      await this.langfuse.flushAsync();
    }
  }
}
