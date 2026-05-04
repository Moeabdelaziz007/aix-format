import { pipeline } from '@xenova/transformers';
import { z } from 'zod';
import { kv } from '../storage/adapter';
import { KEYS } from '../storage/keys';

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
  identity_layer: z.object({
    name: z.string().optional(),
    role: z.string().optional(),
    description: z.string().optional(),
    visibility: z.enum(['public', 'private', 'sovereign']).default('public'),
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

/**
 * Indexes any entity (agent, skill, pattern) while respecting privacy
 */
export async function indexEntity(id: string, type: string, text: string, metadata: any = {}): Promise<void> {
  const visibility = metadata.visibility || 'public';
  const embedding = await generateEmbedding(text);

  const entry = {
    id,
    type,
    visibility,
    name: metadata.name || id,
    snippet: metadata.description || text.slice(0, 200),
    embedding,
    metadata,
    updatedAt: Date.now()
  };

  await kv.set(`wikibrain:index:${id}`, entry);

  const allKeys = await kv.lrange<string>('wikibrain:index_keys', 0, -1);
  if (!allKeys.includes(id)) {
    await kv.lpush('wikibrain:index_keys', id);
  }
}

/**
 * Legacy wrapper for indexAgent
 */
export async function indexAgent(manifest: any): Promise<void> {
  const validManifest = AgentManifestSchema.parse(manifest);
  const id = validManifest.identity_layer?.name || validManifest.did;
  
  const textToIndex = `
    Agent Name: ${validManifest.identity_layer?.name || ''}
    Role: ${validManifest.identity_layer?.role || ''}
    Description: ${validManifest.identity_layer?.description || ''}
    Capabilities: ${(validManifest.capabilities || []).join(', ')}
  `.trim();

  await indexEntity(id, 'agent', textToIndex, {
    visibility: validManifest.identity_layer?.visibility || 'public',
    name: validManifest.identity_layer?.name || id,
    description: validManifest.identity_layer?.description || ''
  });
}

export class SemanticIndex {
  async search(query: string, options: { limit?: number, filter?: SearchFilter } = {}): Promise<{ text: string, score: number }[]> {
    const { results } = await search(query, options.limit || 5, options.filter);
    return results.map(r => ({
      text: r.snippet || r.name,
      score: r.score
    }));
  }

  async index(id: string, type: string, text: string, metadata: any = {}): Promise<void> {
    await indexEntity(id, type, text, metadata);
  }
}

/**
 * Sovereign Search - Filters results based on visibility and trust
 */
export async function search(query: string, topK: number, filterInput?: SearchFilter): Promise<{ results: SemanticResult[], queryEmbedding: number[], searchTimeMs: number }> {
  const start = Date.now();
  const filter = SearchFilterSchema.parse(filterInput || {});
  const queryEmbedding = await generateEmbedding(query);

  const allKeys = await kv.lrange<string>('wikibrain:index_keys', 0, -1);
  const results: SemanticResult[] = [];

  for (const key of allKeys) {
    const existing = await kv.get<any>(`wikibrain:index:${key}`);
    if (existing && existing.embedding) {
      // RULE 0: Privacy Check
      if (existing.visibility === 'private' && !filter.includePrivate) continue;
      if (filter.type && existing.type !== filter.type) continue;

      const score = cosineSimilarity(queryEmbedding, existing.embedding);
      if (score > 0.3) {
        results.push({
          id: existing.id,
          type: existing.type,
          name: existing.name,
          score,
          snippet: existing.snippet
        });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);

  return {
    results: results.slice(0, topK),
    queryEmbedding,
    searchTimeMs: Date.now() - start
  };
}

// Made with Moe Abdelaziz
