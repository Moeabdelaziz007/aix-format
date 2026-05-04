/**
 * 🔬 Model Database — Performance Tracking & Metrics
 * 
 * Tracks quality, latency, cost for each model.
 * Enables data-driven routing decisions.
 * 
 * RESEARCH IMPACT:
 * - Real performance metrics > theoretical benchmarks
 * - Continuous learning from actual usage
 * - Adapts to deployment-specific characteristics
 */

/**
 * Model performance profile
 */
export interface ModelProfile {
  id: string;
  name: string;
  provider: string;
  
  // Performance metrics (measured from actual usage)
  avgQuality: number;        // 0-1 (from user feedback)
  avgLatency: number;        // ms (measured)
  costPer1kTokens: number;   // π per 1k tokens
  
  // Capabilities
  maxTokens: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  
  // Usage statistics
  totalCalls: number;
  successRate: number;       // 0-1 (successful calls / total calls)
  lastUsed: number;          // timestamp
  
  // Quality tracking
  qualityHistory: number[];  // Last N quality scores
  latencyHistory: number[];  // Last N latency measurements
}

/**
 * Model update metrics
 */
export interface ModelMetrics {
  quality?: number;          // 0-1 quality score
  latency?: number;          // ms
  success: boolean;          // whether call succeeded
  timestamp?: number;        // when measured
}

import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';

/**
 * In-memory model database with Redis persistence
 */
class ModelDatabaseImpl {
  private models: Map<string, ModelProfile> = new Map();
  private readonly HISTORY_SIZE = 100; // Keep last 100 measurements
  private initialized = false;
  private readonly STORAGE_KEY = 'aix:model_database:profiles';
  
  constructor() {
    // Initial sync will happen on first use via ensureInitialized()
  }

  /**
   * Ensure data is loaded from Redis
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const stored = await kv.get<Record<string, ModelProfile>>(this.STORAGE_KEY);
      if (stored) {
        this.models = new Map(Object.entries(stored));
        console.log(`📊 ModelDatabase: Loaded ${this.models.size} profiles from Redis.`);
      } else {
        console.log('📊 ModelDatabase: No profiles in Redis. Initializing defaults...');
        this.initializeDefaultModels();
        await this.save();
      }
    } catch (error) {
      console.error('❌ ModelDatabase Load Error:', error);
      this.initializeDefaultModels(); // Fallback to defaults
    }
    
    this.initialized = true;
  }

  /**
   * Persist current state to Redis
   */
  private async save(): Promise<void> {
    try {
      const data = Object.fromEntries(this.models.entries());
      await kv.set(this.STORAGE_KEY, data);
    } catch (error) {
      console.error('❌ ModelDatabase Save Error:', error);
    }
  }
  
  /**
   * Initialize with default model profiles
   * 
   * Based on typical LLM characteristics
   */
  private initializeDefaultModels(): void {
    const defaultModels: ModelProfile[] = [
      // OpenAI Models
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        avgQuality: 0.95,
        avgLatency: 3000,
        costPer1kTokens: 0.01,
        maxTokens: 128000,
        supportsStreaming: true,
        supportsTools: true,
        totalCalls: 0,
        successRate: 0.98,
        lastUsed: Date.now(),
        qualityHistory: [],
        latencyHistory: []
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        avgQuality: 0.93,
        avgLatency: 4000,
        costPer1kTokens: 0.03,
        maxTokens: 8192,
        supportsStreaming: true,
        supportsTools: true,
        totalCalls: 0,
        successRate: 0.97,
        lastUsed: Date.now(),
        qualityHistory: [],
        latencyHistory: []
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        avgQuality: 0.75,
        avgLatency: 1500,
        costPer1kTokens: 0.0015,
        maxTokens: 16384,
        supportsStreaming: true,
        supportsTools: true,
        totalCalls: 0,
        successRate: 0.95,
        lastUsed: Date.now(),
        qualityHistory: [],
        latencyHistory: []
      },
      
      // Anthropic Models
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        avgQuality: 0.96,
        avgLatency: 3500,
        costPer1kTokens: 0.015,
        maxTokens: 200000,
        supportsStreaming: true,
        supportsTools: true,
        totalCalls: 0,
        successRate: 0.98,
        lastUsed: Date.now(),
        qualityHistory: [],
        latencyHistory: []
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        avgQuality: 0.88,
        avgLatency: 2500,
        costPer1kTokens: 0.003,
        maxTokens: 200000,
        supportsStreaming: true,
        supportsTools: true,
        totalCalls: 0,
        successRate: 0.97,
        lastUsed: Date.now(),
        qualityHistory: [],
        latencyHistory: []
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        avgQuality: 0.72,
        avgLatency: 1000,
        costPer1kTokens: 0.00025,
        maxTokens: 200000,
        supportsStreaming: true,
        supportsTools: true,
        totalCalls: 0,
        successRate: 0.96,
        lastUsed: Date.now(),
        qualityHistory: [],
        latencyHistory: []
      },
      
      // Open Source Models
      {
        id: 'llama-3-70b',
        name: 'Llama 3 70B',
        provider: 'meta',
        avgQuality: 0.85,
        avgLatency: 2000,
        costPer1kTokens: 0.0008,
        maxTokens: 8192,
        supportsStreaming: true,
        supportsTools: false,
        totalCalls: 0,
        successRate: 0.94,
        lastUsed: Date.now(),
        qualityHistory: [],
        latencyHistory: []
      },
      {
        id: 'llama-3-8b',
        name: 'Llama 3 8B',
        provider: 'meta',
        avgQuality: 0.68,
        avgLatency: 800,
        costPer1kTokens: 0.0002,
        maxTokens: 8192,
        supportsStreaming: true,
        supportsTools: false,
        totalCalls: 0,
        successRate: 0.92,
        lastUsed: Date.now(),
        qualityHistory: [],
        latencyHistory: []
      },
      
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        avgQuality: 0.82,
        avgLatency: 2200,
        costPer1kTokens: 0.00025,
        maxTokens: 32768,
        supportsStreaming: true,
        supportsTools: true,
        totalCalls: 0,
        successRate: 0.95,
        lastUsed: Date.now(),
        qualityHistory: [],
        latencyHistory: []
      },
      
      // Groq Models
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B (Groq)',
        provider: 'groq',
        avgQuality: 0.88,
        avgLatency: 300, // Near instant
        costPer1kTokens: 0.00, // Free tier mostly
        maxTokens: 8192,
        supportsStreaming: true,
        supportsTools: true,
        totalCalls: 0,
        successRate: 0.99,
        lastUsed: Date.now(),
        qualityHistory: [],
        latencyHistory: []
      }
    ];
    
    for (const model of defaultModels) {
      this.models.set(model.id, model);
    }
  }
  
  /**
   * Get all available models
   */
  async getAllModels(): Promise<ModelProfile[]> {
    await this.ensureInitialized();
    return Array.from(this.models.values());
  }
  
  /**
   * Get specific model by ID
   */
  async getModel(modelId: string): Promise<ModelProfile | undefined> {
    await this.ensureInitialized();
    return this.models.get(modelId);
  }
  
  /**
   * Update model metrics after use
   * 
   * Implements exponential moving average for quality/latency
   */
  async updateMetrics(
    modelId: string,
    metrics: ModelMetrics
  ): Promise<void> {
    await this.ensureInitialized();
    const model = this.models.get(modelId);
    if (!model) {
      return;
    }
    
    // Update total calls
    model.totalCalls++;
    model.lastUsed = metrics.timestamp ?? Date.now();
    
    // Update success rate (exponential moving average, α=0.1)
    const successValue = metrics.success ? 1 : 0;
    model.successRate = 0.9 * model.successRate + 0.1 * successValue;
    
    // Update quality if provided
    if (metrics.quality !== undefined) {
      model.qualityHistory.push(metrics.quality);
      if (model.qualityHistory.length > this.HISTORY_SIZE) {
        model.qualityHistory.shift();
      }
      
      // Exponential moving average (α=0.2 for faster adaptation)
      model.avgQuality = 0.8 * model.avgQuality + 0.2 * metrics.quality;
    }
    
    // Update latency if provided
    if (metrics.latency !== undefined) {
      model.latencyHistory.push(metrics.latency);
      if (model.latencyHistory.length > this.HISTORY_SIZE) {
        model.latencyHistory.shift();
      }
      
      // Exponential moving average (α=0.2)
      model.avgLatency = 0.8 * model.avgLatency + 0.2 * metrics.latency;
    }

    await this.save();
  }
  
  /**
   * Get models by capability
   */
  async getModelsByCapability(capability: string): Promise<ModelProfile[]> {
    const allModels = await this.getAllModels();
    
    switch (capability) {
      case 'tools':
        return allModels.filter(m => m.supportsTools);
      case 'streaming':
        return allModels.filter(m => m.supportsStreaming);
      case 'long-context':
        return allModels.filter(m => m.maxTokens >= 100000);
      default:
        return allModels;
    }
  }
  
  /**
   * Get models by provider
   */
  async getModelsByProvider(provider: string): Promise<ModelProfile[]> {
    const allModels = await this.getAllModels();
    return allModels.filter(m => m.provider === provider);
  }
  
  /**
   * Get top N models by quality
   */
  async getTopModelsByQuality(n: number = 5): Promise<ModelProfile[]> {
    const allModels = await this.getAllModels();
    return allModels
      .sort((a, b) => b.avgQuality - a.avgQuality)
      .slice(0, n);
  }
  
  /**
   * Get cheapest N models
   */
  async getCheapestModels(n: number = 5): Promise<ModelProfile[]> {
    const allModels = await this.getAllModels();
    return allModels
      .sort((a, b) => a.costPer1kTokens - b.costPer1kTokens)
      .slice(0, n);
  }
  
  /**
   * Get fastest N models
   */
  async getFastestModels(n: number = 5): Promise<ModelProfile[]> {
    const allModels = await this.getAllModels();
    return allModels
      .sort((a, b) => a.avgLatency - b.avgLatency)
      .slice(0, n);
  }
  
  /**
   * Add or update a model
   */
  async upsertModel(model: ModelProfile): Promise<void> {
    await this.ensureInitialized();
    this.models.set(model.id, model);
    await this.save();
  }
  
  /**
   * Remove a model
   */
  async removeModel(modelId: string): Promise<boolean> {
    await this.ensureInitialized();
    const deleted = this.models.delete(modelId);
    if (deleted) await this.save();
    return deleted;
  }
  
  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalModels: number;
    totalCalls: number;
    avgQuality: number;
    avgLatency: number;
    avgCost: number;
  }> {
    const models = await this.getAllModels();
    
    const totalCalls = models.reduce((sum, m) => sum + m.totalCalls, 0);
    const avgQuality = models.reduce((sum, m) => sum + m.avgQuality, 0) / models.length;
    const avgLatency = models.reduce((sum, m) => sum + m.avgLatency, 0) / models.length;
    const avgCost = models.reduce((sum, m) => sum + m.costPer1kTokens, 0) / models.length;
    
    return {
      totalModels: models.length,
      totalCalls,
      avgQuality,
      avgLatency,
      avgCost
    };
  }
  
  /**
   * Reset all metrics (for testing)
   */
  async resetMetrics(): Promise<void> {
    await this.ensureInitialized();
    for (const model of this.models.values()) {
      model.totalCalls = 0;
      model.qualityHistory = [];
      model.latencyHistory = [];
    }
    await this.save();
  }
  
  /**
   * Clear database (for testing)
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();
    this.models.clear();
    await this.save();
  }
}

// Singleton instance
export const ModelDatabase = new ModelDatabaseImpl();

// Made with Moe Abdelaziz
