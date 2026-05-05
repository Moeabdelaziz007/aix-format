import { MemoryPublisher } from '../memory/publishEvent';
import { bus, RINGS } from '../core/bus';

/**
 * 🧪 AIX RESONANCE TEST (E2E)
 * Verifies that TS can trigger a Quantum Boost in the ecosystem.
 */

async function runTest() {
  console.log('🧪 Starting E2E Resonance Test...');

  // 1. Listen for the pulse on the TS side (to verify publishing)
  bus.subscribe(RINGS.MIND, (pulse) => {
    if (pulse.type === 'QUANTUM_BURST') {
      console.log('✅ TS Bus: Received QUANTUM_BURST pulse.');
    }
  });

  // 2. Emit the burst
  await MemoryPublisher.emitQuantumBurst('test-agent-001', 1.5);

  console.log('🏁 Test Signal Emitted. Check Go logs for multiplier application.');
  process.exit(0);
}

runTest().catch(console.error);
