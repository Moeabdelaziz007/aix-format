import { NextRequest, NextResponse } from 'next/server';
import { getGateway } from '@aix-core';

/**
 * API: Agent Run
 * ENTRY: Official HTTP Gate.
 * 
 * Thin wrapper over SovereignGateway.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Delegation to Core SovereignGateway
    const gateway = getGateway({
      githubToken: process.env.GITHUB_TOKEN
    });

    const response = await gateway.execute(body);
    
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API:Agent:Run] Gateway call failed:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Fatal Entry Error' 
    }, { status: 500 });
  }
}

// Made with Moe Abdelaziz
