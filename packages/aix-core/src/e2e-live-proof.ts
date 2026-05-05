import dotenv from 'dotenv';
import path from 'path';
import { getGateway } from './index';
import { kv, KEYS } from './storage';

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

/**
 * 🛰️ AIX E2E LIVE PROOF
 * Demonstrating the Sovereign Stack in action.
 * Made with Moe Abdelaziz
 */

async function main() {
  console.log('🏁 [E2E] Starting Sovereign Agent Live Proof...');
  
  const agentId = 'sovereign-alpha-1';
  const gateway = getGateway({ githubToken: process.env.GITHUB_TOKEN });

  try {
    // 1. Reset Trust (Optional for test)
    console.log('🧪 [E2E] Initializing Agent Trust...');
    await kv.set(KEYS.agentTrustScore(agentId), 10.0);
    await kv.set(KEYS.agentLastActivity(agentId), 0); // Force run

    // 2. Execute Task via Gateway
    const task = "Analyze the current repo structure and suggest a way to integrate WikiBrain logic into a unified Brain service.";
    console.log(`🤖 [E2E] Running Task: "${task}"`);
    
    const result = await gateway.run(agentId, task, true);

    // 3. Verify Results
    console.log('📊 [E2E] Result Summary:');
    console.log('----------------------------');
    console.log(`Success: ${result.success}`);
    console.log(`Steps: ${result.steps}`);
    console.log(`Response: ${result.result?.slice(0, 200)}...`);
    console.log('----------------------------');

    // 4. Check Post-Run Integrity
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
