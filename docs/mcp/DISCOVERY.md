# MCP Discovery Endpoint

GET https://axiomid.app/api/mcp-discovery

## Response
  {
    "mcpVersion": "1.0",
    "generated": "2026-04-30T00:00:00Z",
    "totalAgents": 3,
    "agents": [{
      "did": "did:aix:abc123",
      "name": "ResearchAgent",
      "role": "research-assistant",
      "capabilities": ["text-generation"],
      "kyc_tier": "verified",
      "specVersion": "1.0"
    }]
  }

## Cache: s-maxage=60, stale-while-revalidate=300
## CORS: Access-Control-Allow-Origin: *
