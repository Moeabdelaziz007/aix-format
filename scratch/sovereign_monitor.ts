
import { trustChain } from '../packages/aix-core/src/trust-chain/index';
import { verifySignature } from '../packages/aix-core/src/utils/crypto';

async function monitor() {
    console.log("🚀 [SOVEREIGN-MONITOR] Starting live TrustChain audit...");
    
    setInterval(async () => {
        const logs = await trustChain.getLatest(5);
        console.log(`\n--- [Pulse Audit: ${new Date().toISOString()}] ---`);
        
        for (const entry of logs) {
            const isValid = await verifySignature(entry.data, entry.signature, entry.publicKey);
            const status = isValid ? "✅ VALID" : "❌ CORRUPTED";
            console.log(`[${entry.type}] ${entry.agentDid.slice(0,8)}... | ${status} | Hash: ${entry.hash.slice(0,12)}`);
        }
    }, 5000);
}

monitor().catch(console.error);
