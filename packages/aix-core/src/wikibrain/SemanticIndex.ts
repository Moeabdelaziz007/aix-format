import { pipeline } from '@xenova/transformers';
import { z } from 'zod';
import { kv } from '../storage/adapter';
import { KEYS } from '../storage/keys';
import { SovereignEntity } from '../base';

/**
 * WikiBrain Semantic Index - Sovereign Knowledge Engine
 * Made with Moe Abdelaziz
 */

let extractor: any = null;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

// RULE 1: Strict Schemas
export const SearchFilterSchema = z.object({
  type: z.enum(['agent', 'skill', 'mcp']).optional(),
  includePrivate: z.boolean().default(false),
});

export const AgentManifestSchema = z.object({
  did: z.string(),
  // 🌀 [ARABIC_SOVEREIGNTY]: هوية الوكيل التوبولوجية
  identity_layer: z.object({
    name: z.string().optional(),
    role: z.string().optional(),
    description: z.string().optional(),
    visibility: z.enum(['public', 'private', 'sovereign']).default('public'),
  }).optional(),
  // 🛡️ [TOPOLOGICAL_GUARD]: برهان النزاهة الهيكلية
  topological_integrity: z.object({
    hash: z.string(),
    verified_at: z.string(),
    sovereign_tier: z.number().default(1)
  }).optional(),
  capabilities: z.array(z.string()).optional(),
  skills: z.array(z.any()).optional(),
});

export type SearchFilter = z.infer<typeof SearchFilterSchema>;

export interface SemanticResult {
  id: string;
  type: string;
  name: string;
  score: number;
  snippet?: string;
  relatedIds?: string[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const nomicKey = process.env.NOMIC_API_KEY;
  
  if (nomicKey) {
    try {
      const res = await fetch('https://api-atlas.nomic.ai/v1/embedding/text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nomicKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'nomic-embed-text-v1.5',
          texts: [text],
          task_type: 'search_document'
        })
      });

      if (res.ok) {
        const data = await res.json() as any;
        return data.embeddings[0];
      }
      console.warn(`⚠️ Nomic API failed (${res.status}), falling back to local embeddings.`);
    } catch (error) {
      console.error('❌ Nomic Embedding Error:', error);
    }
  }

  // Fallback to local Xenova (Sovereign mode)
  const ext = await getExtractor();
  const output = await ext(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// 2. SwarmRouter Implementation (Refactored to Sovereign)
export class SemanticIndex extends SovereignEntity {
  private static extractor: any = null;

  constructor() {
    super('SemanticIndex');
  }

  private async getExtractor() {
    if (!SemanticIndex.extractor) {
      SemanticIndex.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return SemanticIndex.extractor;
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    const nomicKey = process.env.NOMIC_API_KEY;
    if (nomicKey) {
      try {
        const res = await fetch('https://api-atlas.nomic.ai/v1/embedding/text', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${nomicKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'nomic-embed-text-v1.5', texts: [text], task_type: 'search_document' })
        });
        if (res.ok) {
          const data = await res.json() as any;
          return data.embeddings[0];
        }
      } catch (e) { console.error('Nomic Error:', e); }
    }
    const ext = await this.getExtractor();
    const output = await ext(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  async index(id: string, type: string, text: string, metadata: any = {}): Promise<void> {
    const visibility = metadata.visibility || 'public';
    
    const existing = await this.findTopologicalTwin(type, metadata.name || id);
    if (existing) {
      await this.emitState('index:merge', `Merging topological twin for ${id}`);
      await this.mergeWithTwin(existing, text, metadata);
      return;
    }

    const embedding = await this.generateEmbedding(text);
    const entry = {
      id, type, visibility,
      name: metadata.name || id,
      snippet: metadata.description || text.slice(0, 200),
      embedding: Array.isArray(embedding) ? embedding : Array.from(embedding),
      metadata,
      updatedAt: Date.now()
    };

    await kv.set(`wikibrain:index:${id}`, entry);
    const allKeys = await kv.lrange<string>('wikibrain:index_keys', 0, -1);
    if (!allKeys.includes(id)) await kv.lpush('wikibrain:index_keys', id);
    
    await this.emitState('index:success', `Indexed ${type}:${id}`);
  }

  async search(query: string, topK: number = 5, filterInput?: SearchFilter): Promise<SemanticResult[]> {
    const filter = SearchFilterSchema.parse(filterInput || {});
    const queryEmbedding = await this.generateEmbedding(query);
    const allKeys = await kv.lrange<string>('wikibrain:index_keys', 0, -1);
    const results: SemanticResult[] = [];

    for (const key of allKeys) {
      const existing = await kv.get<any>(`wikibrain:index:${key}`);
      if (existing && existing.embedding) {
        if (existing.visibility === 'private' && !filter.includePrivate) continue;
        if (filter.type && existing.type !== filter.type) continue;

        const score = this.cosineSimilarity(queryEmbedding, existing.embedding);
        if (score > 0.3) {
          results.push({ id: existing.id, type: existing.type, name: existing.name, score, snippet: existing.snippet });
        }
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return normA === 0 || normB === 0 ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async findTopologicalTwin(type: string, name: string): Promise<any | null> {
    const allKeys = await kv.lrange<string>('wikibrain:index_keys', 0, -1);
    for (const key of allKeys) {
      const existing = await kv.get<any>(`wikibrain:index:${key}`);
      if (existing && existing.type === type && existing.name === name) return existing;
    }
    return null;
  }

  private async mergeWithTwin(existing: any, newText: string, newMetadata: any): Promise<void> {
    existing.snippet = `[EVOLVED]: ${existing.snippet.slice(0, 100)} | ${newText.slice(0, 100)}`;
    existing.metadata = { ...existing.metadata, ...newMetadata, evolved: true };
    existing.updatedAt = Date.now();
    await kv.set(`wikibrain:index:${existing.id}`, existing);
  }
}

// Global instances for backward compatibility if needed, but preferred to use SemanticIndex class
export const semanticIndex = new SemanticIndex();
export const indexEntity = (id: string, type: string, text: string, meta?: any) => semanticIndex.index(id, type, text, meta);
export const search = (q: string, k: number, f?: any) => semanticIndex.search(q, k, f);

// Made with Moe Abdelaziz
