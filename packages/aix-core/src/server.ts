import http from 'http';
import { getGateway, getHarness, kv, KEYS } from './index';

const PORT = process.env.PORT || 3369;

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/invoke') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { agentId = 'sovereign-alpha-1', task, userId = 'user-sovereign-test' } = payload;

        if (!task) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Task is required' }));
          return;
        }

        console.log(`\n🚀 [API] Received Task: "${task}" for Agent: ${agentId}`);

        const gateway = getGateway({ githubToken: process.env.GITHUB_TOKEN });
        const harness = getHarness();

        // 1. Reset Trust & Balance for proof
        await kv.set(KEYS.agentTrustScore(agentId), 10.0);
        await kv.set(KEYS.agentLastActivity(agentId), 0);
        await kv.set(`user:${userId}:balance`, 5.0);

        // 2. Pre-flight Clearance via Harness
        const clearance = await harness.checkClearance(agentId, userId, 'invoke');
        if (!clearance.allowed) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Clearance DENIED: ${clearance.reason}` }));
          return;
        }

        // 3. Execute Task via Gateway
        const result = await gateway.execute({ agentId, task, userId });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result, null, 2));

      } catch (err: any) {
        console.error('❌ [API] Internal Error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`⚡ Sovereign Gateway API Live at http://localhost:${PORT}`);
  console.log(`📡 Route: POST /api/invoke`);
  console.log(`======================================================\n`);
});
