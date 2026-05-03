#!/usr/bin/env ts-node
/**
 * 🧬 REAL COMPRESSION ENGINE
 * 
 * AST-based code transformation using ts-morph
 * Not abstract — works on actual codebase
 * 
 * Usage: npx ts-node scripts/compress.ts
 */

import { Project, SyntaxKind, ImportDeclaration, SourceFile } from 'ts-morph';
import * as path from 'path';

interface CompressionStats {
  removed: number;
  fixed: number;
  merged: number;
  files: number;
}

class CompressionEngine {
  private project: Project;
  private stats: CompressionStats = {
    removed: 0,
    fixed: 0,
    merged: 0,
    files: 0
  };

  constructor(tsConfigPath: string) {
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: false
    });
  }

  /**
   * Run all compression passes
   */
  async compress(): Promise<CompressionStats> {
    const sourceFiles = this.project.getSourceFiles('src/**/*.ts')
      .filter(f => !f.getFilePath().includes('index.ts'));

    console.log(`\n🔍 Analyzing ${sourceFiles.length} files...\n`);

    for (const file of sourceFiles) {
      this.stats.files++;
      
      // PASS 1: Dead Code Elimination
      this.removeConsoleLogs(file);
      this.removeUnusedImports(file);
      
      // PASS 2: Fix Index Imports
      this.fixIndexImports(file);
      
      // PASS 5: Fix Hardcoded Keys
      this.fixHardcodedKeys(file);
    }

    // Save all changes
    await this.project.save();

    return this.stats;
  }

  /**
   * PASS 1a: Remove console.log statements
   */
  private removeConsoleLogs(file: SourceFile): void {
    const calls = file.getDescendantsOfKind(SyntaxKind.CallExpression);
    
    for (const call of calls) {
      const expr = call.getExpression().getText();
      if (expr.startsWith('console.')) {
        const statement = call.getFirstAncestorByKind(SyntaxKind.ExpressionStatement);
        if (statement) {
          statement.remove();
          this.stats.removed++;
        }
      }
    }
  }

  /**
   * PASS 1b: Remove unused imports
   */
  private removeUnusedImports(file: SourceFile): void {
    const imports = file.getImportDeclarations();
    
    for (const imp of imports) {
      const namedImports = imp.getNamedImports();
      
      for (const named of namedImports) {
        const refs = named.findReferencesAsNodes();
        // If only referenced in import declaration itself, it's unused
        if (refs.length <= 1) {
          named.remove();
          this.stats.removed++;
        }
      }
      
      // Remove import declaration if no named imports left
      if (imp.getNamedImports().length === 0 && !imp.getDefaultImport()) {
        imp.remove();
        this.stats.removed++;
      }
    }
  }

  /**
   * PASS 2: Fix remaining './index' imports
   */
  private fixIndexImports(file: SourceFile): void {
    const imports = file.getImportDeclarations();
    
    for (const imp of imports) {
      const moduleSpec = imp.getModuleSpecifierValue();
      
      if (moduleSpec === './index' || moduleSpec === '../index') {
        // Try to resolve to direct source
        const resolved = this.resolveDirectSource(imp, file);
        if (resolved) {
          imp.setModuleSpecifier(resolved);
          this.stats.fixed++;
        }
      }
    }
  }

  /**
   * PASS 5: Fix hardcoded Redis keys
   */
  private fixHardcodedKeys(file: SourceFile): void {
    const templates = file.getDescendantsOfKind(SyntaxKind.TemplateExpression);
    
    for (const template of templates) {
      const text = template.getText();
      
      // Check for hardcoded patterns
      if (text.includes('aix:lock:agent:')) {
        const agentIdMatch = text.match(/\$\{(\w+)\}/);
        if (agentIdMatch) {
          const agentId = agentIdMatch[1];
          template.replaceWithText(`KEYS.aixLockAgent(${agentId})`);
          this.stats.fixed++;
        }
      }
      
      // Add more patterns as needed
      if (text.includes('agent:') && text.includes(':')) {
        // Pattern: `agent:${agentId}:something`
        const match = text.match(/`agent:\$\{(\w+)\}:(\w+)`/);
        if (match) {
          const [, agentId, key] = match;
          const keyName = this.camelCase(`agent_${key}`);
          template.replaceWithText(`KEYS.${keyName}(${agentId})`);
          this.stats.fixed++;
        }
      }
    }
  }

  /**
   * Resolve './index' import to direct source
   */
  private resolveDirectSource(imp: ImportDeclaration, file: SourceFile): string | null {
    const namedImports = imp.getNamedImports();
    if (namedImports.length === 0) return null;
    
    // For now, map common imports to their sources
    const importMap: Record<string, string> = {
      'kv': './storage/adapter',
      'KEYS': './storage/keys',
      'TTL': './storage/keys',
      'NS': './storage/keys'
    };
    
    const firstImport = namedImports[0].getName();
    return importMap[firstImport] || null;
  }

  /**
   * Convert snake_case to camelCase
   */
  private camelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Print compression report
   */
  printReport(): void {
    console.log('\n📊 COMPRESSION REPORT');
    console.log('━'.repeat(50));
    console.log(`Files processed: ${this.stats.files}`);
    console.log(`Dead code removed: ${this.stats.removed}`);
    console.log(`Imports fixed: ${this.stats.fixed}`);
    console.log(`Files merged: ${this.stats.merged}`);
    console.log('━'.repeat(50));
    console.log(`Total changes: ${this.stats.removed + this.stats.fixed + this.stats.merged}`);
    console.log('\n✅ Compression complete!\n');
  }
}

// Main execution
async function main() {
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
  
  console.log('🧬 REAL COMPRESSION ENGINE');
  console.log('━'.repeat(50));
  console.log(`Working directory: ${process.cwd()}`);
  console.log(`TypeScript config: ${tsConfigPath}`);
  
  const engine = new CompressionEngine(tsConfigPath);
  
  try {
    await engine.compress();
    engine.printReport();
  } catch (error) {
    console.error('❌ Compression failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { CompressionEngine, CompressionStats };

// Made with Moe Abdelaziz
