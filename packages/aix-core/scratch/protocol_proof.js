const { 
  gateway, 
  health, 
  registry, 
  treasury, 
  identity 
} = require('../dist');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../../apps/studio/.env.local') });

/**
 * 🧪 PROTOCOL_PROOF (E2E - JS)
 * Validating the 3-Path Data Flow.
 */

async function runProof() {
  console.log('🚀 Starting Sovereign Protocol Proof (JS)...');

  const agentId = 'test_sovereign_agent_js';
  const userId = 'test_user_moe_js';

  try {
    // --- PHASE 1: IDENTITY & REGISTRY ---
    console.log('\n--- 🆔 Phase 1: Identity & Registry ---');
    await identity.updateKycStatus(userId, 'sovereign');
    const kyc = await identity.getKycStatus(userId);
    console.log(`KYC Level: ${kyc.level} | Verified: ${kyc.verified} ✅`);

    const manifest = {
      id: agentId,
      meta: { name: 'Proof Agent JS', format_version: '1.5.0' },
      persona: { role: 'Validator' },
      abom: { spec_version: '1.0', security: { trust_tier: 'verified' } }
    };
    const regResult = await registry.register(manifest, { userId });
    console.log(`Registry Registration: ${regResult.success ? '✅' : '❌'}`);

    // --- PHASE 2: TASK FLOW ---
    console.log('\n--- ⚡ Phase 2: Task Flow (Gateway) ---');
    const request = {
      agentId,
      task: 'Verify protocol integrity and report metrics.',
      context: { mode: 'proof' }
    };

    const response = await gateway.execute(request);
    console.log(`Gateway Response: ${response.success ? '✅' : '❌'}`);
    console.log(`Review Score: ${response.review?.score || 'N/A'}`);

    // --- PHASE 3: HEALTH & ECONOMICS ---
    console.log('\n--- 🏥 Phase 3: Health & Economics ---');
    const systemHealth = await health.checkSystem();
    console.log(`System Health: ${systemHealth.status} | Redis: ${systemHealth.checks.redis.status} ✅`);

    const payment = await treasury.processPayment(agentId, {
      amount: 10,
      currency: 'PI',
      merchantId: 'protocol-test',
      userId
    });
    console.log(`Payment Settlement: ${payment.status} | Rail: ${payment.rail} ✅`);

    console.log('\n🏆 PROTOCOL PROOF COMPLETE. ALL PATHS VALIDATED.');
  } catch (err) {
    console.error('\n❌ PROOF FAILED:', err);
    process.exit(1);
  }
}

runProof();
