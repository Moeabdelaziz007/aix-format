import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis';

// POST /api/skills/[id]/test - Test skill execution
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { id } = params;
    const { input } = body;

    // Get skill
    const skill = await kv.get<Record<string, unknown>>(`skill:${id}`);
    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Simulate skill execution (in production, this would call actual skill logic)
    const startTime = Date.now();
    
    // Mock execution based on skill type
    let output;
    const skillType = skill.type as string || 'generic';
    
    switch (skillType) {
      case 'web_search':
        output = {
          results: [
            { title: 'Mock Result 1', url: 'https://example.com/1', snippet: 'Test snippet 1' },
            { title: 'Mock Result 2', url: 'https://example.com/2', snippet: 'Test snippet 2' },
          ],
          query: input,
        };
        break;
      
      case 'code_execution':
        output = {
          stdout: 'Hello, World!',
          stderr: '',
          exitCode: 0,
          executionTime: 45,
        };
        break;
      
      case 'sentiment_analysis':
        output = {
          sentiment: 'positive',
          score: 0.85,
          confidence: 0.92,
        };
        break;
      
      default:
        output = {
          processed: true,
          input,
          result: `Processed by ${skill.name}`,
        };
    }

    const executionTime = Date.now() - startTime;

    // Log test execution
    await kv.lpush(`skill:${id}:test-history`, {
      timestamp: new Date().toISOString(),
      input,
      output,
      executionTime,
      success: true,
    });

    // Keep only last 10 test results
    await kv.ltrim(`skill:${id}:test-history`, 0, 9);

    return NextResponse.json({
      success: true,
      output,
      metadata: {
        skillId: id,
        skillName: skill.name,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Skills API] Test error:', error);
    return NextResponse.json(
      { 
        error: 'Skill test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Made with Moe Abdelaziz
