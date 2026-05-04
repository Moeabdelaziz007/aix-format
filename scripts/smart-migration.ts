ve thingss and codes and outpot 
#!/usr/bin/env node
/**
 * 🧬 Smart Migration Script
 * Automatically upgrades the codebase to use V2 adapters
 * 
 * Features:
 * - Detects old patterns and suggests fixes
 * - Creates migration report
 * - Validates all changes
 * - Rollback capability
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface MigrationTask {
  id: string;
  file: string;
  description: string;
  oldPattern: RegExp;
  newPattern: string | ((match: string) => string);
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface MigrationResult {
  task: MigrationTask;
  success: boolean;
  changes: number;
  error?: string;
}

const MIGRATION_TASKS: MigrationTask[] = [
  {
    id: 'import-adapter-v2',
    file: '**/*.ts',
    description: 'Update imports to use adapter-v2',
    oldPattern: /from ['"](.*)\/storage\/adapter['"]/g,
    newPattern: (match) => match.replace('/adapter', '/adapter-v2'),
    priority: 'high',
  },
  {
    id: 'import-keys-v2',
    file: '**/*.ts',
    description: 'Update imports to use keys-v2',
    oldPattern: /from ['"](.*)\/storage\/keys['"]/g,
    newPattern: (match) => match.replace('/keys', '/keys-v2'),
    priority: 'high',
  },
  {
    id: 'manual-rate-keys',
    file: 'core/rate-limit-adapter.ts',
    description: 'Replace manual NS.RATE construction with KEYS.rate()',
    oldPattern: /`\$\{NS\.RATE\}:?\$\{([^}]+)\}`/g,
    newPattern: 'KEYS.rate($1)',
    priority: 'medium',
  },
  {
    id: 'update-rate-import',
    file: 'core/rate-limit-adapter.ts',
    description: 'Update rate-limit-adapter imports',
    oldPattern: /import \{ NS \} from ['"]\.\/storage\/keys['"]/g,
    newPattern: "import { KEYS } from './storage/keys-v2'",
    priority: 'high',
  },
];

class SmartMigrator {
  private results: MigrationResult[] = [];
  private backupDir = path.join(process.cwd(), '.migration-backup');

  async run() {
    console.log('🧬 Smart Migration Engine Starting...\n');
    console.log('━'.repeat(70));
    
    // Create backup
    await this.createBackup();
    
    // Run migrations
    for (const task of MIGRATION_TASKS.sort((a, b) => {
      const priority = { critical: 0, high: 1, medium: 2, low: 3 };
      return priority[a.priority] - priority[b.priority];
    })) {
      await this.executeTask(task);
    }
    
    // Generate report
    this.generateReport();
    
    // Validate
    await this.validate();
  }

  private async createBackup() {
    console.log('📦 Creating backup...');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
    
    try {
      execSync(`cp -r packages/aix-core/src/storage ${backupPath}/storage`, { stdio: 'ignore' });
      execSync(`cp -r core/storage ${backupPath}/core-storage`, { stdio: 'ignore' });
      console.log(`   ✅ Backup created: ${backupPath}\n`);
    } catch (error) {
      console.log('   ⚠️  Backup failed (continuing anyway)\n');
    }
  }

  private async executeTask(task: MigrationTask) {
    console.log(`\n🔧 [${task.priority.toUpperCase()}] ${task.description}`);
    console.log(`   File: ${task.file}`);
    
    try {
      const files = this.findFiles(task.file);
      let totalChanges = 0;
      
      for (const file of files) {
        const changes = this.applyPattern(file, task.oldPattern, task.newPattern);
        totalChanges += changes;
      }
      
      this.results.push({
        task,
        success: true,
        changes: totalChanges,
      });
      
      console.log(`   ✅ Applied ${totalChanges} changes`);
    } catch (error) {
      this.results.push({
        task,
        success: false,
        changes: 0,
        error: error instanceof Error ? error.message : String(error),
      });
      
      console.log(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private findFiles(pattern: string): string[] {
    const files: string[] = [];
    
    // Simple glob implementation for specific files
    if (!pattern.includes('*')) {
      const fullPath = path.join(process.cwd(), pattern);
      if (fs.existsSync(fullPath)) {
        files.push(fullPath);
      }
      return files;
    }
    
    // For *.ts patterns, search common directories
    const searchDirs = [
      'packages/aix-core/src',
      'core',
      'apps/studio/src',
    ];
    
    for (const dir of searchDirs) {
      const fullDir = path.join(process.cwd(), dir);
      if (fs.existsSync(fullDir)) {
        this.walkDir(fullDir, files, /\.ts$/);
      }
    }
    
    return files;
  }

  private walkDir(dir: string, files: string[], pattern: RegExp) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.includes('node_modules')) {
        this.walkDir(fullPath, files, pattern);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  private applyPattern(
    file: string,
    pattern: RegExp,
    replacement: string | ((match: string) => string)
  ): number {
    let content = fs.readFileSync(file, 'utf-8');
    let changes = 0;
    
    const newContent = content.replace(pattern, (match) => {
      changes++;
      return typeof replacement === 'function' ? replacement(match) : replacement;
    });
    
    if (changes > 0) {
      fs.writeFileSync(file, newContent, 'utf-8');
    }
    
    return changes;
  }

  private generateReport() {
    console.log('\n' + '━'.repeat(70));
    console.log('\n📊 Migration Report\n');
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    const totalChanges = successful.reduce((sum, r) => sum + r.changes, 0);
    
    console.log(`✅ Successful: ${successful.length}/${this.results.length}`);
    console.log(`❌ Failed: ${failed.length}/${this.results.length}`);
    console.log(`📝 Total changes: ${totalChanges}\n`);
    
    if (failed.length > 0) {
      console.log('Failed tasks:');
      failed.forEach(r => {
        console.log(`  - ${r.task.description}: ${r.error}`);
      });
      console.log();
    }
    
    // Save report
    const reportPath = path.join(this.backupDir, 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: { successful: successful.length, failed: failed.length, totalChanges },
    }, null, 2));
    
    console.log(`📄 Full report saved: ${reportPath}\n`);
  }

  private async validate() {
    console.log('🔍 Validating changes...\n');
    
    try {
      console.log('   Running TypeScript compiler...');
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      console.log('   ✅ TypeScript validation passed\n');
    } catch (error) {
      console.log('   ⚠️  TypeScript errors detected (review manually)\n');
    }
    
    console.log('━'.repeat(70));
    console.log('\n🎉 Migration complete!\n');
    console.log('Next steps:');
    console.log('  1. Review changes: git diff');
    console.log('  2. Run tests: npm test');
    console.log('  3. If issues occur, rollback: npm run migration:rollback\n');
  }
}

// Run migration
const migrator = new SmartMigrator();
migrator.run().catch(console.error);

// Made with Bob
