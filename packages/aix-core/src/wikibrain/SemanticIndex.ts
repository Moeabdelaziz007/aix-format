import { pipeline } from '@xenova/transformers';
import { kv, KEYS } from '../index';

let extractor: any = null;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

export interface SemanticResult {
  id: string;
  type: string;
  name: string;
  score: number;
  snippet?: string;
  relatedIds?: string[];
}

export interface SearchFilter {
  type?: 'agent' | 'skill' | 'mcp';
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
  const ext = await getExtractor();
  const output = await ext(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

export async function indexAgent(manifest: any): Promise<void> {
  const id = manifest.identity_layer?.id || manifest.did;
  if (!id) return;

  const textToIndex = `
    Agent Name: ${manifest.identity_layer?.name || ''}
    Role: ${manifest.identity_layer?.role || ''}
    Description: ${manifest.identity_layer?.description || ''}
    Capabilities: ${(manifest.capabilities || []).join(', ')}
    Skills: ${(manifest.skills || []).map((s: any) => s.name || s).join(', ')}
  `.trim();

  const embedding = await generateEmbedding(textToIndex);

  const entry = {
    id,
    type: 'agent',
    name: manifest.identity_layer?.name || id,
    snippet: manifest.identity_layer?.description || '',
    embedding,
    updatedAt: Date.now()
  };

  await kv.set(`wikibrain:index:${id}`, entry);

  // Auto-linking: Find similar agents
  const allKeys = await kv.lrange<string>('wikibrain:index_keys', 0, -1);
  if (!allKeys.includes(id)) {
    await kv.lpush('wikibrain:index_keys', id);
  }

  // Find similarities and store edges
  const edgesKey = `wikibrain:edges:${id}`;
  const newEdges: any[] = [];

  for (const key of allKeys) {
    if (key === id) continue;
    const existing = await kv.get<any>(`wikibrain:index:${key}`);
    if (existing && existing.embedding) {
      const similarity = cosineSimilarity(embedding, existing.embedding);
      if (similarity > 0.75) {
        newEdges.push({
          target: key,
          score: similarity
        });

        // Add reverse edge
        const reverseEdgesKey = `wikibrain:edges:${key}`;
        const reverseEdges = await kv.get<any[]>(reverseEdgesKey) || [];
        reverseEdges.push({ target: id, score: similarity });
        await kv.set(reverseEdgesKey, reverseEdges);
      }
    }
  }

  if (newEdges.length > 0) {
    const existingEdges = await kv.get<any[]>(edgesKey) || [];
    // merge and dedup
    const merged = [...existingEdges, ...newEdges].reduce((acc, curr) => {
      const found = acc.find((item: any) => item.target === curr.target);
      if (!found) acc.push(curr);
      return acc;
    }, []);
    await kv.set(edgesKey, merged);
  }
}

export async function search(query: string, topK: number, filter?: SearchFilter): Promise<{ results: SemanticResult[], queryEmbedding: number[], searchTimeMs: number }> {
  const start = Date.now();
  const queryEmbedding = await generateEmbedding(query);

  const allKeys = await kv.lrange<string>('wikibrain:index_keys', 0, -1);
  const results: SemanticResult[] = [];

  for (const key of allKeys) {
    const existing = await kv.get<any>(`wikibrain:index:${key}`);
    if (existing && existing.embedding) {
      if (filter && filter.type && existing.type !== filter.type) continue;

      const score = cosineSimilarity(queryEmbedding, existing.embedding);
      if (score > 0.3) { // basic threshold
        const edges = await kv.get<any[]>(`wikibrain:edges:${key}`) || [];
        results.push({
          id: existing.id,
          type: existing.type,
          name: existing.name,
          score,
          snippet: existing.snippet,
          relatedIds: edges.map(e => e.target)
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
