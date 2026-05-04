#!/usr/bin/env ts-node
/**
 * Automated Storage Adapter Improvement Script
 * Fixes type casting inconsistencies and adds missing KEYS helpers
 */

import * as fs from 'fs';
import * as path from 'path';

interface Fix {
  file: string;
  description: string;
  apply: () => void;
}

const fixes: Fix[] = [];

// Fix 1: Update lpush method in storage adapter
fixes.push({
  file: 'packages/aix-core/src/storage/adapter.ts',
  description: 'Fix lpush type casting to match sadd/srem pattern',
  apply: () => {
    const filePath = path.join(process.cwd(), 'packages/aix-core/src/storage/adapter.ts');
    let content = fs.readFileSync(filePath, 'utf-8');
    
    const oldLpush = `  async lpush(key: string, value: any): Promise<number> {
    return this.withRetry(() => this.client.lpush(key, value), 'LPUSH', key) as any;
  }`;
    
    const newLpush = `  async lpush(key: string, value: any): Promise<number> {
    const result = await this.withRetry(() => this.client.lpush(key, value), 'LPUSH', key);
    return Number(result) || 0;
  }`;
    
    content = content.replace(oldLpush, newLpush);
    fs.writeFileSync(filePath, content, 'utf-8');
  }
});

// Fix 2: Update lrange method in storage adapter
fixes.push({
  file: 'packages/aix-core/src/storage/adapter.ts',
  description: 'Fix lrange type casting to match smembers pattern',
  apply: () => {
    const filePath = path.join(process.cwd(), 'packages/aix-core/src/storage/adapter.ts');
    let content = fs.readFileSync(filePath, 'utf-8');
    
    const oldLrange = `  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    return (await this.withRetry(() => this.client.lrange<T>(key, start, stop), 'LRANGE', key)) || [];
  }`;
    
    const newLrange = `  async lrange<T = any>(key: string, start: number, stop: number): Promise<T[]> {
    const result = await this.withRetry(() => this.client.lrange(key, start, stop), 'LRANGE', key);
    return (result as T[]) || [];
  }`;
    
    content = content.replace(oldLrange, newLrange);
    fs.writeFileSync(filePath, content, 'utf-8');
  }
});

// Fix 3: Add RATE key helpers to keys.ts
fixes.push({
  file: 'core/storage/keys.ts',
  description: 'Add missing RATE namespace key generation functions',
  apply: () => {
    const filePath = path.join(process.cwd(), 'core/storage/keys.ts');
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Find the bus keys section and add rate keys after it
    const busKeysSection = `  // Bus event keys
  bus: (ring: string, event: string) => \`\${NS.BUS}\${ring}:\${event}\`,
  busQueue: (ring: string) => \`\${NS.BUS}\${ring}:queue\`,
  busBacklog: () => \`\${NS.BUS}backlog\`,`;
    
    const busKeysWithRate = `  // Bus event keys
  bus: (ring: string, event: string) => \`\${NS.BUS}\${ring}:\${event}\`,
  busQueue: (ring: string) => \`\${NS.BUS}\${ring}:queue\`,
  busBacklog: () => \`\${NS.BUS}backlog\`,
  
  // Rate limiting keys
  rate: (key: string) => \`\${NS.RATE}\${key}\`,
  rateLimit: (identifier: string) => \`\${NS.RATE}limit:\${identifier}\`,
  rateWindow: (identifier: string) => \`\${NS.RATE}window:\${identifier}\`,`;
    
    content = content.replace(busKeysSection, busKeysWithRate);
    fs.writeFileSync(filePath, content, 'utf-8');
  }
});

// Fix 4: Update rate-limit-adapter to use KEYS helper
fixes.push({
  file: 'core/rate-limit-adapter.ts',
  description: 'Update rate-limit-adapter to use centralized KEYS helper',
  apply: () => {
    const filePath = path.join(process.cwd(), 'core/rate-limit-adapter.ts');
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Update import
    content = content.replace(
      "import { NS } from './storage/keys';",
      "import { KEYS } from './storage/keys';"
    );
    
    // Update consume method
    content = content.replace(
      'const upstashKey = `${NS.RATE}:${key}`;',
      'const upstashKey = KEYS.rate(key);'
    );
    
    // Update reset method
    content = content.replace(
      /const upstashKey = `\$\{NS\.RATE\}:\$\{key\}`;/g,
      'const upstashKey = KEYS.rate(key);'
    );
    
    fs.writeFileSync(filePath, content, 'utf-8');
  }
});

// Main execution
async function main() {
  console.log('🔧 Starting automated codebase improvements...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const fix of fixes) {
    try {
      console.log(`📝 Applying: ${fix.description}`);
      console.log(`   File: ${fix.file}`);
      fix.apply();
      console.log(`   ✅ Success\n`);
      successCount++;
    } catch (error) {
      console.log(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}\n`);
      failCount++;
    }
  }
  
  console.log('━'.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successful fixes: ${successCount}`);
  console.log(`   ❌ Failed fixes: ${failCount}`);
  console.log(`   📁 Total fixes attempted: ${fixes.length}\n`);
  
  if (failCount === 0) {
    console.log('🎉 All improvements applied successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run: npm run build');
    console.log('   2. Run: npm test');
    console.log('   3. Review changes: git diff');
  } else {
    console.log('⚠️  Some fixes failed. Please review the errors above.');
    process.exit(1);
  }
}

main().catch(console.error);

// Made with Bob
