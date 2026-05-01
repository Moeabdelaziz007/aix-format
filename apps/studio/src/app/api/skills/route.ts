import { NextResponse } from 'next/server';

/**
 * AIX Skills Registry - Standard capabilities available for agents
 */

const SKILLS_REGISTRY = [
  { id: 'web-search',      name: 'Web Search',       tier: 'free'       },
  { id: 'code-execution',  name: 'Code Execution',   tier: 'builder'    },
  { id: 'email-send',      name: 'Email Sender',     tier: 'builder'    },
  { id: 'shopify-connect', name: 'Shopify Connect',  tier: 'pro'        },
  { id: 'voice-response',  name: 'Voice Response',   tier: 'pro'        },
  { id: 'abom-scan',       name: 'ABOM Scanner',     tier: 'enterprise' },
];

export async function GET() {
  return NextResponse.json({ success: true, skills: SKILLS_REGISTRY });
}
