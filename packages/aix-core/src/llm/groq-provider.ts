import { LLMProvider } from './types';
import { CircuitBreaker } from '../infra';

/**
 * Groq Provider - Fast as Light
 * Made with Moe Abdelaziz
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
    let lastError: any;
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await this.cb.execute(async () => {
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
            if (res.status === 429) {
              const retryAfter = parseInt(res.headers.get('retry-after') || '1');
              await new Promise(r => setTimeout(r, retryAfter * 1000));
              throw new Error('Rate Limited');
            }
            throw new Error(`Groq API Error: ${res.status}`);
          }
          const data = await res.json() as any;
          return data.choices[0]?.message?.content ?? '';
        });
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ [Groq] Attempt ${attempt + 1} failed: ${(err as Error).message}. Retrying...`);
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
      }
    }
    throw lastError;
  }
}
