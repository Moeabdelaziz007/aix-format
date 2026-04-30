/**
 * API Endpoint: /api/mcp-router
 * MCP Revenue Router Gateway
 *
 * Intercepts AIX client requests, evaluates ABOM risk and budgets,
 * applies TokenBucket quotas, and routes to the optimal MCP server.
 */

import { NextResponse } from 'next/server';
// Ensure Next.js doesn't try to purge standard classes
import { MCPRouter } from '../../../../../../core/index.js';

// Global instances for memory-based rate limiting (In a real production environment this would be Redis/KV)
const router = new MCPRouter({
  defaultRiskThreshold: 5.0,
  platformFeePercentage: 0.05
});

// Dummy database of MCP servers registered in the network
const registeredServers = [
  {
    id: "mcp-trusted-01",
    url: "https://mcp1.axiom-network.io",
    did: "did:web:axiom-network.io",
    pricing: { costPerCall: 0.005, currency: "PI" },
    abom: { riskScore: 0.8 }
  },
  {
    id: "mcp-cheap-02",
    url: "https://mcp2.community-node.dev",
    did: "did:web:community-node.dev",
    pricing: { costPerCall: 0.0005, currency: "PI" },
    abom: { riskScore: 4.5 }
  },
  {
    id: "mcp-premium-03",
    url: "https://mcp3.enterprise-node.io",
    did: "did:web:enterprise-node.io",
    pricing: { costPerCall: 0.05, currency: "PI" },
    abom: { riskScore: 0.1 }
  }
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, payload, routingPolicy } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "Client Identity (clientId) is required for Sovereign Routing." },
        { status: 400 }
      );
    }

    const maxBudget = routingPolicy?.maxBudget || 0.01;
    const maxRisk = routingPolicy?.maxRisk || 5.0;

    // Use the MCP Router to find the best server
    const routingResult = router.routeRequest(
      { clientId, maxBudget, maxRisk },
      registeredServers
    );

    return NextResponse.json({
      success: true,
      data: routingResult,
      // The client would then use this URL to make the actual execution call
      // or we could act as a full proxy and forward the `payload` here.
      forward_url: routingResult.selectedServer.url
    });

  } catch (error: any) {
    if (error.message.includes('Rate limit exceeded')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 } // Too Many Requests
      );
    }

    if (error.message.includes('No eligible servers')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 } // Not Found / Unavailable
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error during MCP Routing." },
      { status: 500 }
    );
  }
}
