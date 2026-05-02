import { useState, useCallback, useEffect } from 'react';

export interface SemanticResult {
  id: string;
  type: string;
  name: string;
  score: number;
  snippet?: string;
  relatedIds?: string[];
}

export function useWikiBrainSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/wikibrain/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, topK: 5 })
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(handler);
  }, [query, performSearch]);

  return {
    query,
    setQuery,
    results,
    loading,
    error
  };
}
