import { NextRequest, NextResponse } from 'next/server';

interface KnowledgeDistillRequest {
  conversations: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  taskType: string;
  agentId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: KnowledgeDistillRequest = await req.json();
    const { conversations, taskType, agentId } = body;

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ error: 'conversations required' }, { status: 400 });
    }

    // Extract patterns using semantic analysis
    const patterns = extractPatterns(conversations);
    
    // Store with did:axiom identity
    const knowledgeId = `did:axiom:knowledge:${agentId}:${Date.now()}`;
    
    const distilledKnowledge = {
      id: knowledgeId,
      agentId,
      taskType,
      patterns,
      metadata: {
        conversationCount: conversations.length,
        extractedAt: new Date().toISOString(),
        compressionRatio: calculateCompressionRatio(conversations, patterns)
      }
    };

    return NextResponse.json({
      success: true,
      knowledge: distilledKnowledge,
      retrievalQuery: {
        semantic: patterns.map(p => p.summary).join(' '),
        taskType,
        agentId
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function extractPatterns(conversations: any[]) {
  const patterns = [];
  
  // Group by topic clusters
  const topics = new Map<string, any[]>();
  
  for (const conv of conversations) {
    const topic = extractTopic(conv.content);
    if (!topics.has(topic)) {
      topics.set(topic, []);
    }
    topics.get(topic)!.push(conv);
  }
  
  // Create pattern for each topic
  for (const [topic, convs] of topics) {
    patterns.push({
      topic,
      summary: summarize(convs),
      frequency: convs.length,
      examples: convs.slice(0, 3).map(c => c.content)
    });
  }
  
  return patterns;
}

function extractTopic(content: string): string {
  // Simple keyword extraction
  const keywords = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
  return keywords[0] || 'general';
}

function summarize(conversations: any[]): string {
  // Take first and last message as summary
  if (conversations.length === 0) return '';
  if (conversations.length === 1) return conversations[0].content.slice(0, 100);
  
  return `${conversations[0].content.slice(0, 50)}...${conversations[conversations.length - 1].content.slice(0, 50)}`;
}

function calculateCompressionRatio(conversations: any[], patterns: any[]): number {
  const originalSize = JSON.stringify(conversations).length;
  const compressedSize = JSON.stringify(patterns).length;
  return originalSize / compressedSize;
}

// Made with Moe Abdelaziz
