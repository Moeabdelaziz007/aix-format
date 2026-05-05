// 🌀 [ARABIC_SOVEREIGNTY]: محرك المعرفة السيادي - WikiBrain
// Made with Moe Abdelaziz

import { pipeline } from '@xenova/transformers';
import { z } from 'zod';
import { kv } from '../storage/adapter';
import { SovereignEntity } from '../base';

// RULE 1: Strict Schemas
export const SearchFilterSchema = z.object({
  type: z.enum(['agent', 'skill', 'mcp', 'wisdom']).optional(),
  includePrivate: z.boolean().default(false),
});

export type SearchFilter = z.infer<typeof SearchFilterSchema>;

export interface SemanticResult {
  id: string;
  type: string;
  name: string;
  score: number;
  snippet?: string;
}

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
    
    // 🚀 [SPEED]: Use mget for O(1) fetch of all candidates
    const keys = allKeys.map(k => `wikibrain:index:${k}`);
    const candidates = await kv.mget<any>(...keys);
    
    const results: SemanticResult[] = [];

    for (const existing of candidates) {
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
