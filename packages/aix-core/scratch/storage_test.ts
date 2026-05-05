import { StorageOrchestrator } from '../src/storage';
import dotenv from 'dotenv';
import path from 'path';

// Load env from studio app since that's where the Redis credentials are
dotenv.config({ path: path.resolve(__dirname, '../../../apps/studio/.env.local') });

/**
 * 🧪 Phase 3: Storage Adapter Unit Tests
 * Testing save/load, compression, and integrity.
 */

async function runTests() {
  console.log('🧪 Starting Storage Adapter Tests...');
  const storage = StorageOrchestrator.getInstance();

  const isUp = await storage.healthCheck();
  if (!isUp) {
    console.error('❌ Redis is down. Skipping tests.');
    return;
  }

  // Test 1: Small Payload (Uncompressed)
  const smallKey = 'test:small';
  const smallData = { hello: 'world', timestamp: Date.now() };
  await storage.save(smallKey, smallData);
  const loadedSmall = await storage.load(smallKey);
  console.log('Test 1 (Small):', JSON.stringify(loadedSmall) === JSON.stringify(smallData) ? '✅ PASSED' : '❌ FAILED');

  // Test 2: Large Payload (Auto-compressed)
  const largeKey = 'test:large';
  const largeData = {
    content: 'A'.repeat(15000), // > 10KB
    meta: 'large-payload'
  };
  await storage.save(largeKey, largeData);
  const loadedLarge = await storage.load<typeof largeData>(largeKey);
  console.log('Test 2 (Large Auto-compress):', JSON.stringify(loadedLarge) === JSON.stringify(largeData) ? '✅ PASSED' : '❌ FAILED');

  // Verify it actually compressed (check raw prefix)
  const { kv } = await import('../src/storage');
  const rawLarge = await kv.get<string>(largeKey);
  console.log('Test 2 (Compression Check):', rawLarge?.startsWith('__gz__') ? '✅ Compressed' : '❌ Not Compressed');

  // Test 3: TTL
  const ttlKey = 'test:ttl';
  await storage.save(ttlKey, { temp: true }, { ttl: 1 });
  console.log('Test 3 (TTL Save): ✅ Done');
  
  // Cleanup
  await kv.del(smallKey, largeKey, ttlKey);
  console.log('🧹 Cleanup complete.');
}

runTests().catch(console.error);
