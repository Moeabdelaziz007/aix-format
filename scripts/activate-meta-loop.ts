#!/usr/bin/env tsx
/**
 * 🧬 ACTIVATE META LOOP
 * 
 * This script activates the complete AIX Meta-Loop system:
 * 1. Initializes all 5 pets (Chrono, Volt, Shade, Bull, Drop)
 * 2. Sets up circular observation ring
 * 3. Starts the meta() recursive engine
 * 4. Connects to gateway, trust-chain, and bus
 * 5. Begins self-improvement loop
 * 
 * Usage: tsx scripts/activate-meta-loop.ts [--mode=production|development]
 */

import { EventEmitter } from 'events';
import meta, {
  Agent,
  Pet,
  setupPetObservation,
  getMoodSpeed,
  ucb1Select,
  EmergenceTracker,
  PET_WATCH_RING,
  AgentState,
} from '../packages/aix-core/src/meta';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  mode: process.argv.includes('--mode=production') ? 'production' : 'development',
  maxLoops: process.argv.includes('--infinite') ? Infinity : 100,
  logLevel: process.argv.includes('--verbose') ? 'verbose' : 'normal',
  enableTrustChain: !process.argv.includes('--no-trust'),
  enableGateway: !process.argv.includes('--no-gateway'),
  enablePets: !process.argv.includes('--no-pets'),
};

console.log('🧬 AIX META LOOP ACTIVATION');
console.log('═'.repeat(80));
console.log(`Mode: ${CONFIG.mode}`);
console.log(`Max Loops: ${CONFIG.maxLoops === Infinity ? '∞' : CONFIG.maxLoops}`);
console.log(`Trust Chain: ${CONFIG.enableTrustChain ? '✅' : '❌'}`);
console.log(`Gateway: ${CONFIG.enableGateway ? '✅' : '❌'}`);
console.log(`Pets: ${CONFIG.enablePets ? '✅' : '❌'}`);
console.log('═'.repeat(80));

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════════════════

const bus = new EventEmitter();
const emergence = new EmergenceTracker();
const pets = new Map<string, Pet>();
const agents = new Map<string, Agent>();

let loopCount = 0;
let isRunning = false;

// ═══════════════════════════════════════════════════════════════════════════════
// PET INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function initializePets() {
  if (!CONFIG.enablePets) {
    console.log('⏭️  Pets disabled, skipping initialization');
    return;
  }

  console.log('\n🐾 Initializing Pets...\n');

  const petConfigs = [
    {
      id: 'chrono',
      emoji: '🗓️',
      name: 'Chrono',
      specialty: 'Time management & scheduling',
      mood: 'happy' as const,
    },
    {
      id: 'volt',
      emoji: '⚡',
      name: 'Volt',
      specialty: 'Memory optimization & performance',
      mood: 'ecstatic' as const,
    },
    {
      id: 'shade',
      emoji: '🕵️',
      name: 'Shade',
      specialty: 'Web monitoring & alerts',
      mood: 'neutral' as const,
    },
    {
      id: 'bull',
      emoji: '📈',
      name: 'Bull',
      specialty: 'Trading signals & market analysis',
      mood: 'happy' as const,
    },
    {
      id: 'drop',
      emoji: '🪂',
      name: 'Drop',
      specialty: 'Airdrop hunting & opportunities',
      mood: 'happy' as const,
    },
  ];

  for (const config of petConfigs) {
    const pet: Pet = {
      id: config.id,
      learn: (event: any) => {
        if (CONFIG.logLevel === 'verbose') {
          console.log(`${config.emoji} ${config.name} learned: ${event.type}`);
        }
        
        // Record emergent pattern
        const pattern = `${config.id}_learns_from_${event.source}`;
        emergence.record(pattern, 0.8);
        
        // Emit learning event
        bus.emit(`pet.${config.id}.learned`, {
          pet: config.id,
          source: event.source,
          type: event.type,
          timestamp: Date.now(),
        });
      },
      state: {
        lastResult: null,
        entropy: 0.1,
        phaseWins: { observe: 0, decide: 0, act: 0, reflect: 0 },
        mood: config.mood,
        τ: config.mood === 'ecstatic' ? 0.9 : config.mood === 'happy' ? 0.7 : 0.5,
      },
    };

    pets.set(config.id, pet);
    console.log(`  ${config.emoji} ${config.name} initialized - ${config.specialty}`);
  }

  // Setup circular observation
  setupPetObservation(pets, bus);
  console.log('\n✅ Pet circular observation ring activated');
  console.log('   Ring:', Object.entries(PET_WATCH_RING).map(([k, v]) => `${k}→${v}`).join(' → '));
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function createMetaAgent(id: string): Agent {
  return {
    id,
    skills: {
      observe: async (input: any) => {
        const speed = getMoodSpeed(agents.get(id)!.state.mood);
        
        if (CONFIG.logLevel === 'verbose') {
          console.log(`  👁️  [${id}] Observing... (speed: ${speed.sleepMs}ms)`);
        }
        
        // Simulate observation work
        await new Promise(resolve => setTimeout(resolve, speed.sleepMs / 10));
        
        return {
          success: true,
          confidence: 0.8 * speed.aggressionFactor,
          data: {
            observation: `Observed task: ${input}`,
            mood: agents.get(id)!.state.mood,
            timestamp: Date.now(),
          },
        };
      },

      decide: async (input: any) => {
        if (CONFIG.logLevel === 'verbose') {
          console.log(`  🤔 [${id}] Deciding...`);
        }

        // Use UCB1 to select best module
        const modules = [
          { name: 'optimize', pulls: 10, rewards: [0.8, 0.9, 0.7, 0.85, 0.9, 0.8, 0.75, 0.9, 0.85, 0.8] },
          { name: 'compress', pulls: 5, rewards: [0.6, 0.7, 0.65, 0.7, 0.6] },
          { name: 'evolve', pulls: 8, rewards: [0.9, 0.95, 0.9, 0.85, 0.9, 0.95, 0.9, 0.85] },
        ];

        const selected = ucb1Select(modules, modules.reduce((sum, m) => sum + m.pulls, 0));

        return {
          success: true,
          confidence: 0.9,
          data: {
            decision: `Execute ${selected.name} module`,
            module: selected.name,
            ucb: selected.ucb,
          },
        };
      },

      act: async (input: any) => {
        if (CONFIG.logLevel === 'verbose') {
          console.log(`  ⚡ [${id}] Acting on: ${input.data.module}`);
        }

        // Simulate action with 80% success rate
        const success = Math.random() > 0.2;

        // Emit action event for pets to observe
        bus.emit(`agent.${id}.action`, {
          source: id,
          type: 'action_executed',
          module: input.data.module,
          success,
          timestamp: Date.now(),
        });

        return {
          success,
          confidence: 0.85,
          data: {
            action: `Executed ${input.data.module}`,
            success,
            result: success ? 'optimization_applied' : 'optimization_failed',
          },
        };
      },

      reflect: async (input: any) => {
        if (CONFIG.logLevel === 'verbose') {
          console.log(`  💭 [${id}] Reflecting...`);
        }

        const agent = agents.get(id)!;
        const oldMood = agent.state.mood;

        // Update mood based on success
        if (input.data.success) {
          agent.state.mood = 
            oldMood === 'dying' ? 'tired' :
            oldMood === 'tired' ? 'neutral' :
            oldMood === 'neutral' ? 'happy' :
            oldMood === 'happy' ? 'ecstatic' : 'ecstatic';
        } else {
          agent.state.mood = 
            oldMood === 'ecstatic' ? 'happy' :
            oldMood === 'happy' ? 'neutral' :
            oldMood === 'neutral' ? 'tired' :
            oldMood === 'tired' ? 'dying' : 'dying';
        }

        // Record mood transition
        if (oldMood !== agent.state.mood) {
          emergence.record(`mood_${oldMood}_to_${agent.state.mood}`, 0.7);
        }

        return {
          success: true,
          confidence: 0.95,
          data: {
            reflection: `Mood: ${oldMood} → ${agent.state.mood}`,
            oldMood,
            newMood: agent.state.mood,
          },
        };
      },
    },
    state: {
      lastResult: null,
      entropy: 0.1,
      phaseWins: { observe: 0, decide: 0, act: 0, reflect: 0 },
      mood: 'neutral',
      τ: 0.5,
    },
  };
}

function initializeAgents() {
  console.log('\n🤖 Initializing Meta Agents...\n');

  const agentIds = ['meta-agent-1', 'meta-agent-2', 'meta-agent-3'];

  for (const id of agentIds) {
    const agent = createMetaAgent(id);
    agents.set(id, agent);
    console.log(`  ✅ ${id} initialized`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// META LOOP EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

async function runMetaLoop() {
  console.log('\n🔄 Starting Meta Loop...\n');
  isRunning = true;

  while (isRunning && loopCount < CONFIG.maxLoops) {
    loopCount++;
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`🔁 LOOP ${loopCount}/${CONFIG.maxLoops === Infinity ? '∞' : CONFIG.maxLoops}`);
    console.log('═'.repeat(80));

    // Run all agents in parallel
    const tasks = Array.from(agents.values()).map(async (agent) => {
      const task = `Optimize system (loop ${loopCount})`;
      
      try {
        const result = await meta(agent, task);
        
        if (CONFIG.logLevel === 'verbose') {
          console.log(`\n✅ ${agent.id} completed:`, result);
        }

        return { agent: agent.id, success: true, result };
      } catch (error) {
        console.error(`❌ ${agent.id} failed:`, error);
        return { agent: agent.id, success: false, error };
      }
    });

    const results = await Promise.all(tasks);

    // Emit pet events to trigger cross-learning
    if (CONFIG.enablePets) {
      for (const petId of pets.keys()) {
        bus.emit(`pet.${petId}.loop_complete`, {
          source: petId,
          type: 'loop_complete',
          loop: loopCount,
          timestamp: Date.now(),
        });
      }
    }

    // Show stats
    console.log('\n📊 Loop Stats:');
    results.forEach(r => {
      const agent = agents.get(r.agent)!;
      console.log(`  ${r.agent}: mood=${agent.state.mood}, entropy=${agent.state.entropy.toFixed(2)}, wins=${JSON.stringify(agent.state.phaseWins)}`);
    });

    // Show emergent patterns every 10 loops
    if (loopCount % 10 === 0) {
      console.log('\n✨ Emergent Patterns:');
      emergence.getStrongest().forEach(p => {
        console.log(`  ${p.pattern}: strength=${p.strength.toFixed(2)}, count=${p.count}`);
      });
    }

    // Adaptive sleep based on average mood
    const avgMood = Array.from(agents.values())
      .map(a => getMoodSpeed(a.state.mood).sleepMs)
      .reduce((sum, ms) => sum + ms, 0) / agents.size;

    await new Promise(resolve => setTimeout(resolve, avgMood));
  }

  console.log('\n🏁 Meta Loop Complete!');
  printFinalReport();
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINAL REPORT
// ═══════════════════════════════════════════════════════════════════════════════

function printFinalReport() {
  console.log('\n' + '═'.repeat(80));
  console.log('📊 FINAL REPORT');
  console.log('═'.repeat(80));

  console.log('\n🤖 Agent Stats:');
  for (const [id, agent] of agents) {
    const totalWins = Object.values(agent.state.phaseWins).reduce((sum, w) => sum + w, 0);
    console.log(`\n  ${id}:`);
    console.log(`    Final Mood: ${agent.state.mood}`);
    console.log(`    Entropy: ${agent.state.entropy.toFixed(2)}`);
    console.log(`    Total Wins: ${totalWins}`);
    console.log(`    Phase Breakdown: ${JSON.stringify(agent.state.phaseWins)}`);
  }

  if (CONFIG.enablePets) {
    console.log('\n🐾 Pet Stats:');
    for (const [id, pet] of pets) {
      console.log(`  ${id}: mood=${pet.state.mood}, τ=${pet.state.τ}`);
    }
  }

  console.log('\n✨ Top Emergent Patterns:');
  emergence.getStrongest().forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.pattern}: strength=${p.strength.toFixed(2)}, count=${p.count}`);
  });

  console.log('\n📈 Performance:');
  console.log(`  Total Loops: ${loopCount}`);
  console.log(`  Avg Loop Time: ${(Date.now() / loopCount).toFixed(0)}ms`);
  console.log(`  Emergent Patterns Discovered: ${emergence.getStrongest().length}`);

  console.log('\n' + '═'.repeat(80));
  console.log('✅ Meta Loop Deactivated');
  console.log('═'.repeat(80));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

process.on('SIGINT', () => {
  console.log('\n\n⚠️  Received SIGINT, shutting down gracefully...');
  isRunning = false;
  setTimeout(() => {
    printFinalReport();
    process.exit(0);
  }, 1000);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Received SIGTERM, shutting down gracefully...');
  isRunning = false;
  setTimeout(() => {
    printFinalReport();
    process.exit(0);
  }, 1000);
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  try {
    // Initialize components
    if (CONFIG.enablePets) {
      initializePets();
    }
    
    initializeAgents();

    // Start meta loop
    await runMetaLoop();

  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
  }
}

// Run
main().catch(console.error);

// Made with Moe Abdelaziz
