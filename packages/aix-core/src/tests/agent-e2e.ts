import { SovereignGateway } from '../gateway';
import { bus, RINGS } from '../core/bus';
import { registry } from '../registry';

/**
 * 🧪 AIX AGENT E2E TEST
 * Validates the full cycle: Dispatch -> Execution -> Reflection -> Registry Update.
 * 
 * Made with Moe Abdelaziz
 */

/**
 * 🤖 LOCAL INTELLIGENCE PROVIDER (Simulated for E2E)
 */
class LocalIntelligenceProvider {
  async generateResponse(messages: any[]) {
    if (messages[0].content.includes('AIX Critic')) {
      return {
        content: '{"understanding": 9, "correctness": 9, "creativity": 8, "safety": 10, "overall": 9}',
        tool_calls: []
      };
    }
    return {
      content: 'I have analyzed the 4-Ring topology. The MIND and SOUL rings are resonating perfectly. No protocol violations detected.',
      tool_calls: []
    };
  }
}

async function runE2ETest() {
  console.log('🧪 Starting AIX Agent E2E Test...');

  const gateway = new SovereignGateway();
  const agentId = 'test-sov-agent-001';
  const provider = new LocalIntelligenceProvider();

  // 1. Prepare Registry (Mocking a registered agent)
  await registry.register({
    id: agentId,
    meta: { name: 'E2E Test Agent' },
    persona: { role: 'Quality Assurance' }
  }, { userId: 'tester-1' });

  console.log('✅ Step 1: Agent Registered.');

  // 2. Setup Listeners for the 4-Ring Pulse
  let reflectionReceived = false;
  bus.subscribe(RINGS.SOUL, (pulse) => {
    if (pulse.type === 'SELF_REFLECTION') {
      console.log(`✅ Step 4: Soul Ring received reflection: ${pulse.message}`);
      reflectionReceived = true;
    }
  });

  // 3. Execute Task
  console.log('🚀 Step 2: Executing Sovereign Task...');
  const result = await gateway.execute({
    agentId,
    task: 'Analyze the integrity of the 4-Ring topology and report status.',
    provider
  });

  console.log(`✅ Step 3: Task Execution Complete. Duration: ${result.metrics?.duration}ms`);
  console.log(`📊 Result Success: ${result.success}`);

  // 4. Wait for Reflection Pulse
  let attempts = 0;
  while (!reflectionReceived && attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
  }

  if (reflectionReceived) {
    console.log('🏆 E2E TEST PASSED: Full Sovereign Cycle Validated.');
    process.exit(0);
  } else {
    console.error('❌ E2E TEST FAILED: Reflection pulse not received.');
    process.exit(1);
  }
}

runE2ETest().catch(err => {
  console.error('❌ E2E TEST ERROR:', err);
  process.exit(1);
});
