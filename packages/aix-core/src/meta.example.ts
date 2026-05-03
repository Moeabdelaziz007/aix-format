/**
 * 🧬 AIX META ENGINE - Usage Example
 * 
 * This demonstrates how the ONE function runs everything:
 * - ReAct loop
 * - Pet circular observation
 * - UCB1 module selection
 * - Mood-based speed control
 * - Emergent cross-learning
 */

import meta, {
  Agent,
  Phase,
  PhaseResult,
  Pet,
  setupPetObservation,
  getMoodSpeed,
  ucb1Select,
  EmergenceTracker,
  PET_WATCH_RING,
} from './meta';
import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Simple Agent with ReAct Loop
// ═══════════════════════════════════════════════════════════════════════════════

async function example1_SimpleAgent() {
  console.log('\n🧬 EXAMPLE 1: Simple Agent with ReAct Loop\n');

  const agent: Agent = {
    id: 'agent-001',
    skills: {
      observe: async (input) => ({
        success: true,
        confidence: 0.8,
        data: { observation: `Observed: ${input}` },
      }),
      decide: async (input: any) => ({
        success: true,
        confidence: 0.9,
        data: { decision: `Decided based on: ${input.data.observation}` },
      }),
      act: async (input: any) => ({
        success: true,
        confidence: 0.85,
        data: { action: `Acted on: ${input.data.decision}` },
      }),
      reflect: async (input: any) => ({
        success: true,
        confidence: 0.95,
        data: { reflection: `Reflected on: ${input.data.action}` },
      }),
    },
    state: {
      lastResult: null,
      entropy: 0,
      phaseWins: { observe: 0, decide: 0, act: 0, reflect: 0 },
      mood: 'happy',
      τ: 0.7,
    },
  };

  // Run the meta loop
  const result = await meta(agent, 'Hello World');
  
  console.log('Result:', result);
  console.log('Phase Wins:', agent.state.phaseWins);
  console.log('Entropy:', agent.state.entropy);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Pet Circular Observation
// ═══════════════════════════════════════════════════════════════════════════════

async function example2_PetObservation() {
  console.log('\n🐾 EXAMPLE 2: Pet Circular Observation\n');

  const bus = new EventEmitter();
  const emergence = new EmergenceTracker();

  // Create 5 pets
  const pets = new Map<string, Pet>([
    ['bull', {
      id: 'bull',
      learn: (event: any) => {
        console.log(`📈 Bull learned from ${event.source}: ${event.type}`);
        emergence.record('bull_learns_from_volt', 0.8);
      },
      state: {
        lastResult: null,
        entropy: 0,
        phaseWins: { observe: 0, decide: 0, act: 0, reflect: 0 },
        mood: 'happy',
        τ: 0.7,
      },
    }],
    ['volt', {
      id: 'volt',
      learn: (event: any) => {
        console.log(`⚡ Volt learned from ${event.source}: ${event.type}`);
        emergence.record('volt_learns_from_shade', 0.75);
      },
      state: {
        lastResult: null,
        entropy: 0,
        phaseWins: { observe: 0, decide: 0, act: 0, reflect: 0 },
        mood: 'ecstatic',
        τ: 0.9,
      },
    }],
    ['shade', {
      id: 'shade',
      learn: (event: any) => {
        console.log(`🕵️ Shade learned from ${event.source}: ${event.type}`);
        emergence.record('shade_learns_from_drop', 0.7);
      },
      state: {
        lastResult: null,
        entropy: 0,
        phaseWins: { observe: 0, decide: 0, act: 0, reflect: 0 },
        mood: 'neutral',
        τ: 0.5,
      },
    }],
    ['drop', {
      id: 'drop',
      learn: (event: any) => {
        console.log(`🪂 Drop learned from ${event.source}: ${event.type}`);
        emergence.record('drop_learns_from_chrono', 0.85);
      },
      state: {
        lastResult: null,
        entropy: 0,
        phaseWins: { observe: 0, decide: 0, act: 0, reflect: 0 },
        mood: 'happy',
        τ: 0.7,
      },
    }],
    ['chrono', {
      id: 'chrono',
      learn: (event: any) => {
        console.log(`🗓️ Chrono learned from ${event.source}: ${event.type}`);
        emergence.record('chrono_learns_from_bull', 0.9);
      },
      state: {
        lastResult: null,
        entropy: 0,
        phaseWins: { observe: 0, decide: 0, act: 0, reflect: 0 },
        mood: 'happy',
        τ: 0.7,
      },
    }],
  ]);

  // Setup circular observation
  setupPetObservation(pets, bus);

  console.log('Pet Watch Ring:', PET_WATCH_RING);
  console.log('\nEmitting events...\n');

  // Emit some events
  bus.emit('pet.volt.boost', { source: 'volt', type: 'boost_applied', data: { cpu: 45 } });
  bus.emit('pet.shade.alert', { source: 'shade', type: 'price_alert', data: { symbol: 'BTC' } });
  bus.emit('pet.drop.found', { source: 'drop', type: 'airdrop_found', data: { chain: 'Base' } });
  bus.emit('pet.chrono.alarm', { source: 'chrono', type: 'alarm_fired', data: { label: 'Meeting' } });
  bus.emit('pet.bull.signal', { source: 'bull', type: 'trade_signal', data: { action: 'BUY' } });

  // Show emergent patterns
  console.log('\n✨ Emergent Patterns:');
  emergence.getStrongest().forEach(p => {
    console.log(`  ${p.pattern}: strength=${p.strength.toFixed(2)}, count=${p.count}`);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: UCB1 Module Selection
// ═══════════════════════════════════════════════════════════════════════════════

async function example3_UCB1Selection() {
  console.log('\n🎯 EXAMPLE 3: UCB1 Module Selection\n');

  interface Module {
    name: string;
    pulls: number;
    rewards: number[];
  }

  const modules: Module[] = [
    { name: 'gateway.ts', pulls: 10, rewards: [0.8, 0.9, 0.7, 0.85, 0.9, 0.8, 0.75, 0.9, 0.85, 0.8] },
    { name: 'pets.ts', pulls: 5, rewards: [0.6, 0.7, 0.65, 0.7, 0.6] },
    { name: 'trust-chain.ts', pulls: 8, rewards: [0.9, 0.95, 0.9, 0.85, 0.9, 0.95, 0.9, 0.85] },
  ];

  const totalPulls = modules.reduce((sum, m) => sum + m.pulls, 0);

  console.log('Modules:');
  modules.forEach(m => {
    const avgReward = m.rewards.reduce((a, b) => a + b, 0) / m.rewards.length;
    console.log(`  ${m.name}: pulls=${m.pulls}, avgReward=${avgReward.toFixed(2)}`);
  });

  const selected = ucb1Select(modules, totalPulls);
  console.log(`\n✅ UCB1 Selected: ${selected.name} (UCB=${selected.ucb?.toFixed(3)})`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Mood-Based Speed Control
// ═══════════════════════════════════════════════════════════════════════════════

async function example4_MoodSpeed() {
  console.log('\n😊 EXAMPLE 4: Mood-Based Speed Control\n');

  const moods: Array<'ecstatic' | 'happy' | 'neutral' | 'tired' | 'dying'> = [
    'ecstatic', 'happy', 'neutral', 'tired', 'dying'
  ];

  console.log('Mood → Speed Mapping:');
  moods.forEach(mood => {
    const speed = getMoodSpeed(mood);
    console.log(`  ${mood.padEnd(10)}: sleep=${speed.sleepMs}ms, aggression=${speed.aggressionFactor.toFixed(2)}x`);
  });

  console.log('\n💡 Insight: ecstatic pet runs 10x faster than dying pet!');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Complete Integration
// ═══════════════════════════════════════════════════════════════════════════════

async function example5_CompleteIntegration() {
  console.log('\n🌟 EXAMPLE 5: Complete Integration\n');

  const bus = new EventEmitter();
  const emergence = new EmergenceTracker();

  // Create agent with mood-based speed
  const agent: Agent = {
    id: 'meta-agent',
    skills: {
      observe: async (input) => {
        const speed = getMoodSpeed(agent.state.mood);
        await new Promise(resolve => setTimeout(resolve, speed.sleepMs / 10)); // Simulate work
        return {
          success: true,
          confidence: 0.8 * speed.aggressionFactor,
          data: { observation: `Observed with mood=${agent.state.mood}` },
        };
      },
      decide: async (input: any) => ({
        success: true,
        confidence: 0.9,
        data: { decision: 'Optimize based on observation' },
      }),
      act: async (input: any) => {
        const success = Math.random() > 0.2; // 80% success rate
        return {
          success,
          confidence: 0.85,
          data: { action: 'Applied optimization', success },
        };
      },
      reflect: async (input: any) => {
        // Update mood based on success
        if (input.success) {
          agent.state.mood = agent.state.mood === 'dying' ? 'tired' :
                             agent.state.mood === 'tired' ? 'neutral' :
                             agent.state.mood === 'neutral' ? 'happy' :
                             agent.state.mood === 'happy' ? 'ecstatic' : 'ecstatic';
        } else {
          agent.state.mood = agent.state.mood === 'ecstatic' ? 'happy' :
                             agent.state.mood === 'happy' ? 'neutral' :
                             agent.state.mood === 'neutral' ? 'tired' :
                             agent.state.mood === 'tired' ? 'dying' : 'dying';
        }
        
        return {
          success: true,
          confidence: 0.95,
          data: { reflection: `New mood: ${agent.state.mood}` },
        };
      },
    },
    state: {
      lastResult: null,
      entropy: 0,
      phaseWins: { observe: 0, decide: 0, act: 0, reflect: 0 },
      mood: 'neutral',
      τ: 0.5,
    },
  };

  console.log('Running 5 meta loops with mood evolution...\n');

  for (let i = 0; i < 5; i++) {
    const startMood = agent.state.mood;
    const result = await meta(agent, `Task ${i + 1}`);
    const endMood = agent.state.mood;
    
    console.log(`Loop ${i + 1}: ${startMood} → ${endMood}`);
    
    if (startMood !== endMood) {
      emergence.record(`mood_transition_${startMood}_to_${endMood}`, 0.8);
    }
  }

  console.log('\n📊 Final Stats:');
  console.log(`  Phase Wins:`, agent.state.phaseWins);
  console.log(`  Final Mood: ${agent.state.mood}`);
  console.log(`  Entropy: ${agent.state.entropy.toFixed(2)}`);

  console.log('\n✨ Emergent Mood Transitions:');
  emergence.getStrongest().forEach(p => {
    console.log(`  ${p.pattern}: ${p.count} times`);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN ALL EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════════

async function runAllExamples() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🧬 AIX META ENGINE - Complete Examples                  ║');
  console.log('║     "The ONE Function That Runs Everything"                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  await example1_SimpleAgent();
  await example2_PetObservation();
  await example3_UCB1Selection();
  await example4_MoodSpeed();
  await example5_CompleteIntegration();

  console.log('\n✅ All examples completed!\n');
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export { runAllExamples };

// Made with Moe Abdelaziz
