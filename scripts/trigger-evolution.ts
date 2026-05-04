#!/usr/bin/env tsx
/**
 * 🧬 Sovereign Evolution Trigger
 * 
 * Scheduled task to run the proactive evolution engine.
 * Reads active agents from Redis, runs proactive scans, and applies evolutions.
 * 
 * Usage:
 *   npx tsx scripts/trigger-evolution.ts
 * 
 * Made with Moe Abdelaziz
 */

import { kv } from '../packages/aix-core/src/storage/adapter';
import { NS } from '../packages/aix-core/src/storage/keys';
import { proactiveEvolutionEngine } from '../packages/aix-core/src/proactive-evolution-engine';

const GLOBAL_INDEX_KEY = `${NS.REGISTRY}:index`;

async function main() {
  console.log('🧬 [Evolution Trigger] Starting Sovereign Evolution Scan...');
  
  try {
    // 1. Get all registered agents
    const dids = await kv.get<string[]>(GLOBAL_INDEX_KEY);
    
    if (!dids || dids.length === 0) {
      console.log('ℹ️ [Evolution Trigger] No agents found in registry. Skipping.');
      return;
    }

    console.log(`🔍 [Evolution Trigger] Scanning ${dids.length} agents...`);

    for (const agentDid of dids) {
      console.log(`  Checking evolution for: ${agentDid}...`);
      
      try {
        const trigger = await proactiveEvolutionEngine.proactiveScan(agentDid);
        
        if (trigger) {
          console.log(`    ✨ [Pattern Found] Reason: ${trigger.reason}, Action: ${trigger.suggestedAction}`);
          
          const shouldEvolve = await proactiveEvolutionEngine.shouldEvolveNow(trigger);
          
          if (shouldEvolve) {
            console.log(`    🚀 [Executing Evolution] Applying changes to ${agentDid}...`);
            await proactiveEvolutionEngine.executeEvolution(trigger);
          } else {
            console.log(`    ⚠️ [Safety/Limit] Evolution postponed (Safety score or Rate limit).`);
          }
        } else {
          console.log(`    ✅ [Healthy] No evolution needed for this cycle.`);
        }
      } catch (err) {
        console.error(`    ❌ [Error] Failed to scan agent ${agentDid}:`, err);
      }
    }

    console.log('\n🏁 [Evolution Trigger] Sovereign Evolution Scan Complete.');
  } catch (error) {
    console.error('❌ [Fatal] Evolution Trigger failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
