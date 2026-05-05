/**
 * 🔍 Tavily Search Tool - Real-time Web Intelligence
 * 
 * Provides high-quality search results and AI-generated answers.
 * Optimized for agentic workflows.
 */

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilyResponse {
  answer?: string;
  results: TavilySearchResult[];
}

/**
 * Execute a search query via Tavily API
 */
export async function searchTavily(
  query: string, 
  apiKey: string,
  options: { depth?: 'basic' | 'smart', maxResults?: number } = {}
): Promise<string> {
  if (!apiKey) {
    return "Error: Tavily API Key missing. Please set TAVILY_API_KEY.";
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: options.depth || 'smart',
        include_answer: true,
        max_results: options.maxResults || 5
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tavily API Error: ${response.status} - ${error}`);
    }

    const data = await response.json() as TavilyResponse;
    
    // Return direct answer if available, otherwise summarize results
    if (data.answer) {
      return `Answer: ${data.answer}\n\nSources:\n${data.results.map(r => `- ${r.title}: ${r.url}`).join('\n')}`;
    }

    return data.results
      .map(r => `[${r.title}](${r.url})\n${r.content}`)
      .join('\n\n');

  } catch (error) {
    console.error('❌ TavilySearch Error:', error);
    return `Search failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Made with Moe Abdelaziz
