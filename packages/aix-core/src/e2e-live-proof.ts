import { getGateway, getHarness, kv, KEYS } from './index';

// Environment variables should be provided by the shell or root config

/**
 * 🛰️ AIX E2E LIVE PROOF
 * Demonstrating the Sovereign Stack in action.
 * Made with Moe Abdelaziz
 */

async function main() {
  console.log('🏁 [E2E] Starting Sovereign Agent Live Proof...');
  
  const agentId = 'sovereign-alpha-1';
  const userId = 'user-sovereign-test';
  const gateway = getGateway({ githubToken: process.env.GITHUB_TOKEN });
  const harness = getHarness();

  try {
    // 1. Reset Trust & Balance
    console.log('🧪 [E2E] Initializing Environment...');
    await kv.set(KEYS.agentTrustScore(agentId), 10.0);
    await kv.set(KEYS.agentLastActivity(agentId), 0); // Force run
    await kv.set(`user:${userId}:balance`, 5.0); // 5 PI

    // 2. Pre-flight Clearance via Harness
    console.log('🛡️ [E2E] Checking Harness Clearance...');
    const clearance = await harness.checkClearance(agentId, userId, 'invoke');
    
    if (!clearance.allowed) {
      console.error(`❌ [E2E] Clearance DENIED: ${clearance.reason}`);
      process.exit(1);
    }
    console.log(`✅ [E2E] Clearance GRANTED. Metrics:`, clearance.metrics);

    // 3. Execute Task via Gateway
    const task = "Verify the new HarnessGate consolidation and explain how it simplifies the middleware logic.";
    console.log(`🤖 [E2E] Running Task: "${task}"`);
    
    const result = await gateway.execute({ agentId, task, userId });

    // 4. Verify Results
    console.log('📊 [E2E] Result Summary:');
    console.log('----------------------------');
    console.log(`Success: ${result.success}`);
    console.log(`Latency: ${result.metrics?.duration}ms`);
    console.log(`Response: ${result.result?.slice(0, 200)}...`);
    console.log('----------------------------');

    // 5. Check Post-Run Integrity
    const finalTrust = await kv.get(KEYS.agentTrustScore(agentId));
    console.log(`🛡️ [E2E] Post-Run Trust Score: ${finalTrust}`);

    console.log('✅ [E2E] Sovereign Meta-Loop cycle completed successfully.');
    process.exit(0);

  } catch (error) {
    console.error('❌ [E2E] Proof FAILED:', error);
    process.exit(1);
  }
}

main();
