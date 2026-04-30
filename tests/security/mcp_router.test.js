import test from 'node:test';
import assert from 'node:assert/strict';
import { MCPRouter } from '../../core/src/mcp_router.js';

const mockServers = [
  {
    id: "server-1",
    url: "https://mcp.trusted.com",
    did: "did:web:trusted.com",
    pricing: { costPerCall: 0.001, currency: "PI" },
    abom: { riskScore: 1.2 }
  },
  {
    id: "server-2",
    url: "https://mcp.cheap.com",
    did: "did:web:cheap.com",
    pricing: { costPerCall: 0.0001, currency: "PI" },
    abom: { riskScore: 6.5 } // High risk
  },
  {
    id: "server-3",
    url: "https://mcp.premium.com",
    did: "did:web:premium.com",
    pricing: { costPerCall: 0.05, currency: "PI" },
    abom: { riskScore: 0.5 }
  }
];

test('MCPRouter - Basic initialization', () => {
  const router = new MCPRouter();
  assert.equal(router.defaultRiskThreshold, 5.0);
});

test('MCPRouter - Route correctly filters by risk and budget', () => {
  const router = new MCPRouter();
  const request = {
    clientId: "client_123",
    maxBudget: 0.005,
    maxRisk: 5.0
  };

  const result = router.routeRequest(request, mockServers);

  assert.equal(result.status, "success");
  assert.equal(result.selectedServer.id, "server-1");
  // Server-2 is rejected due to high risk (6.5 > 5.0)
  // Server-3 is rejected due to budget (0.05 > 0.005)
});

test('MCPRouter - Revenue Split Calculation', () => {
  const router = new MCPRouter({ platformFeePercentage: 0.10 }); // 10% fee
  const request = { clientId: "client_456", maxBudget: 0.1 };

  const result = router.routeRequest(request, mockServers);

  // With maxBudget 0.1 and maxRisk 5.0 (default),
  // both server-1 and server-3 are eligible.
  // server-1 score: (0.001 * 1) + (1.2 * 0.5) = 0.001 + 0.60 = 0.601
  // server-3 score: (0.05 * 1) + (0.5 * 0.5) = 0.05 + 0.25 = 0.30 (better score as it is lower!)

  // So server-3 is selected correctly based on the scoring heuristic.
  assert.equal(result.selectedServer.id, "server-3");
  assert.equal(result.economics.split.total, 0.05);
  assert.ok(Math.abs(result.economics.split.platformFee - 0.005) < 0.00001);
  assert.equal(result.economics.split.developerRevenue, 0.045);
});

test('MCPRouter - Rate Limiting Exception', () => {
  const router = new MCPRouter();
  // Create a bucket with 0 capacity
  router.getOrCreateBucket("client_spam", 0, 0);

  const request = { clientId: "client_spam", maxBudget: 1.0 };

  assert.throws(
    () => router.routeRequest(request, mockServers),
    /Rate limit exceeded/
  );
});

test('MCPRouter - No eligible servers exception', () => {
  const router = new MCPRouter();
  const request = { clientId: "client_poor", maxBudget: 0.000001 };

  assert.throws(
    () => router.routeRequest(request, mockServers),
    /No eligible servers found/
  );
});
