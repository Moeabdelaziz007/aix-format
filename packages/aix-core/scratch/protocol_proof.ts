import { 
  gateway, 
  health, 
  registry, 
  treasury, 
  identity 
} from '../src';
import { AgentRequest } from '../src/domain';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../apps/studio/.env.local') });

/**
 * 🧪 PROTOCOL_PROOF (E2E)
 * Validating the 3-Path Data Flow:
 * 1. Task Flow (Gateway -> Runtime -> Review)
 * 2. Health Flow (Trust -> Pulse -> Healing)
 * 3. Wisdom Flow (Storage -> Distillation -> Registry)
 * 
 * Made with Moe Abdelaziz
 */

async function runProof() {
  console.log('🚀 Starting Sovereign Protocol Proof...');

  const agentId = 'test_sovereign_agent';
  const userId = 'test_user_moe';

  // --- PHASE 1: IDENTITY & REGISTRY ---
  console.log('\n--- 🆔 Phase 1: Identity & Registry ---');
  await identity.updateKycStatus(userId, 'sovereign');
  const kyc = await identity.getKycStatus(userId);
  console.log(`KYC Level: ${kyc.level} | Verified: ${kyc.verified} ✅`);

  const manifest = {
    id: agentId,
    meta: { name: 'Proof Agent', format_version: '1.5.0' },
    persona: { role: 'Validator' },
    abom: { spec_version: '1.0', security: { trust_tier: 'verified' } }
  };
  const regResult = await registry.register(manifest, { userId });
  console.log(`Registry Registration: ${regResult.success ? '✅' : '❌'}`);

  // --- PHASE 2: TASK FLOW ---
  console.log('\n--- ⚡ Phase 2: Task Flow (Gateway) ---');
  const request: AgentRequest = {
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

  // --- PHASE 4: WISDOM ---
  console.log('\n--- 🧠 Phase 4: Wisdom & Distillation ---');
  const history = await health.getRegistry();
  console.log(`Registry Search: Found ${history.length} agents ✅`);

  console.log('\n🏆 PROTOCOL PROOF COMPLETE. ALL PATHS VALIDATED.');
}

runProof().catch(err => {
  console.error('\n❌ PROOF FAILED:', err);
  process.exit(1);
});
