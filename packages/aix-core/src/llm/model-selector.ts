import { LLMProvider, MockProvider } from './types';
import { GroqProvider } from './groq-provider';

/**
 * 🧭 AIX Model Selector
 * Handles routing and provider instantiation.
 * 
 * Made with Moe Abdelaziz
 */
export class ModelSelector {
  static select(config: { provider: string; apiKey: string; model?: string }): LLMProvider {
    switch (config.provider.toLowerCase()) {
      case 'groq':
        return new GroqProvider(config.apiKey, config.model);
      case 'mock':
        return new MockProvider(['Mock response']);
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }

  /**
   * Routes a task to the best model based on intent.
   * (Placeholder for future cognitive routing)
   */
  static getBestModel(intent: string): string {
    if (intent.includes('fast') || intent.includes('simple')) {
      return 'llama-3.1-8b-instant';
    }
    return 'llama-3.3-70b-versatile';
  }
}
