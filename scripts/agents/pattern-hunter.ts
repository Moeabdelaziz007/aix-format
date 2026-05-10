#!/usr/bin/env ts-node
/**
 * 🔍 PATTERN HUNTER AGENT
 * Autonomous agent that hunts for optimization patterns across the codebase
 * 
 * Specialization: Detects recurring patterns, anti-patterns, and optimization opportunities
 * Runs: Continuously in background, emits findings to bus
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { createHash } from 'crypto';

interface Pattern {
  id: string;
  type: 'optimization' | 'anti-pattern' | 'duplication' | 'bottleneck';
  location: string[];
  description: string;
  frequency: number;
  impact: number;
  suggestion: string;
  confidence: number;
  detectedAt: number;
}

interface PerformanceMetric {
  component: string;
  metric: string;
  value: number;
  threshold: number;
  trend: 'improving' | 'degrading' | 'stable';
  timestamp: number;
}

export class PatternHunter extends EventEmitter {
  private patterns: Map<string, Pattern> = new Map();
  private metrics: PerformanceMetric[] = [];
  private isRunning = false;
  private scanInterval = 30000; // 30 seconds
  private readonly codebasePath: string;

  constructor(codebasePath: string) {
    super();
    this.codebasePath = codebasePath;
  }

  // ═══════════════════════════════════════════════════════
  // MAIN HUNTING LOOP
  // ═══════════════════════════════════════════════════════
  async start(): Promise<void> {
    this.isRunning = true;
    this.emit('hunter:started', { agent: 'PatternHunter' });

    while (this.isRunning) {
      try {
        // Phase 1: Scan for patterns
        const newPatterns = await this.scanForPatterns();
        
        // Phase 2: Analyze metrics
        const anomalies = await this.analyzeMetrics();
        
        // Phase 3: Detect emergent behaviors
        const emergent = await this.detectEmergentPatterns();
        
        // Phase 4: Generate insights
        const insights = await this.generateInsights(newPatterns, anomalies, emergent);
        
        // Phase 5: Emit findings
        for (const insight of insights) {
          this.emit('pattern:found', insight);
        }

        // Adaptive sleep: faster when finding patterns
        const sleepMs = newPatterns.length > 0 ? 10000 : this.scanInterval;
        await this.sleep(sleepMs);

      } catch (err) {
        this.emit('hunter:error', { agent: 'PatternHunter', error: err });
        await this.sleep(60000); // Back off on error
      }
    }
  }

  stop(): void {
    this.isRunning = false;
    this.emit('hunter:stopped', { agent: 'PatternHunter' });
  }

  // ═══════════════════════════════════════════════════════
  // PATTERN SCANNING
  // ═══════════════════════════════════════════════════════
  private async scanForPatterns(): Promise<Pattern[]> {
    const patterns: Pattern[] = [];
    const files = await this.scanFiles();

    for (const file of files) {
      const content = await fs.promises.readFile(file, 'utf-8');
      
      // Pattern 1: Repeated code blocks (duplication)
      const duplicates = this.findDuplicateBlocks(content, file);
      patterns.push(...duplicates);
      
      // Pattern 2: Performance anti-patterns
      const antiPatterns = this.findAntiPatterns(content, file);
      patterns.push(...antiPatterns);
      
      // Pattern 3: Optimization opportunities
      const optimizations = this.findOptimizations(content, file);
      patterns.push(...optimizations);
      
      // Pattern 4: Architectural bottlenecks
      const bottlenecks = this.findBottlenecks(content, file);
      patterns.push(...bottlenecks);
    }

    // Store new patterns
    for (const pattern of patterns) {
      if (!this.patterns.has(pattern.id)) {
        this.patterns.set(pattern.id, pattern);
      } else {
        // Update frequency
        const existing = this.patterns.get(pattern.id)!;
        existing.frequency++;
        this.patterns.set(pattern.id, existing);
      }
    }

    return patterns;
  }

  // ═══════════════════════════════════════════════════════
  // DUPLICATE DETECTION
  // ═══════════════════════════════════════════════════════
  private findDuplicateBlocks(content: string, file: string): Pattern[] {
    const patterns: Pattern[] = [];
    const lines = content.split('\n');
    const blockSize = 5; // Look for 5+ line duplicates
    const blocks = new Map<string, number[]>();

    // Extract all blocks
    for (let i = 0; i <= lines.length - blockSize; i++) {
      const block = lines.slice(i, i + blockSize).join('\n').trim();
      if (block.length < 50) continue; // Skip small blocks
      
      const hash = this.hash(block);
      if (!blocks.has(hash)) {
        blocks.set(hash, []);
      }
      blocks.get(hash)!.push(i);
    }

    // Find duplicates
    for (const [hash, locations] of blocks) {
      if (locations.length > 1) {
        patterns.push({
          id: `dup-${hash}`,
          type: 'duplication',
          location: [file],
          description: `${locations.length} duplicate code blocks found`,
          frequency: locations.length,
          impact: 0.6,
          suggestion: 'Extract to shared function',
          confidence: 0.9,
          detectedAt: Date.now()
        });
      }
    }

    return patterns;
  }

  // ═══════════════════════════════════════════════════════
  // ANTI-PATTERN DETECTION
  // ═══════════════════════════════════════════════════════
  private findAntiPatterns(content: string, file: string): Pattern[] {
    const patterns: Pattern[] = [];

    // Anti-pattern 1: Nested callbacks (callback hell)
    const nestedCallbacks = (content.match(/\)\s*=>\s*{[^}]*\)\s*=>\s*{[^}]*\)\s*=>\s*{/g) || []).length;
    if (nestedCallbacks > 0) {
      patterns.push({
        id: `anti-callback-${this.hash(file)}`,
        type: 'anti-pattern',
        location: [file],
        description: 'Callback hell detected',
        frequency: nestedCallbacks,
        impact: 0.7,
        suggestion: 'Convert to async/await',
        confidence: 0.95,
        detectedAt: Date.now()
      });
    }

    // Anti-pattern 2: God class (too many methods)
    const methods = (content.match(/^\s*(async\s+)?(\w+)\s*\([^)]*\)\s*{/gm) || []).length;
    if (methods > 20) {
      patterns.push({
        id: `anti-god-${this.hash(file)}`,
        type: 'anti-pattern',
        location: [file],
        description: `God class with ${methods} methods`,
        frequency: 1,
        impact: 0.8,
        suggestion: 'Split into smaller classes',
        confidence: 0.85,
        detectedAt: Date.now()
      });
    }

    // Anti-pattern 3: Magic numbers
    const magicNumbers = (content.match(/\b\d{2,}\b/g) || []).filter(n => 
      !['100', '1000', '0'].includes(n)
    ).length;
    if (magicNumbers > 5) {
      patterns.push({
        id: `anti-magic-${this.hash(file)}`,
        type: 'anti-pattern',
        location: [file],
        description: `${magicNumbers} magic numbers found`,
        frequency: magicNumbers,
        impact: 0.4,
        suggestion: 'Extract to named constants',
        confidence: 0.9,
        detectedAt: Date.now()
      });
    }

    // Anti-pattern 4: Long functions (>50 lines)
    const longFunctions = this.findLongFunctions(content);
    if (longFunctions.length > 0) {
      patterns.push({
        id: `anti-long-${this.hash(file)}`,
        type: 'anti-pattern',
        location: [file],
        description: `${longFunctions.length} functions exceed 50 lines`,
        frequency: longFunctions.length,
        impact: 0.6,
        suggestion: 'Break into smaller functions',
        confidence: 0.8,
        detectedAt: Date.now()
      });
    }

    return patterns;
  }

  // ═══════════════════════════════════════════════════════
  // OPTIMIZATION DETECTION
  // ═══════════════════════════════════════════════════════
  private findOptimizations(content: string, file: string): Pattern[] {
    const patterns: Pattern[] = [];

    // Optimization 1: Unnecessary array copies
    const arrayCopies = (content.match(/\[\.\.\.(\w+)\]/g) || []).length;
    if (arrayCopies > 3) {
      patterns.push({
        id: `opt-array-${this.hash(file)}`,
        type: 'optimization',
        location: [file],
        description: `${arrayCopies} array spread operations`,
        frequency: arrayCopies,
        impact: 0.5,
        suggestion: 'Use array methods or mutate in place',
        confidence: 0.7,
        detectedAt: Date.now()
      });
    }

    // Optimization 2: Synchronous file operations
    const syncOps = (content.match(/fs\.(readFileSync|writeFileSync|existsSync)/g) || []).length;
    if (syncOps > 0) {
      patterns.push({
        id: `opt-sync-${this.hash(file)}`,
        type: 'optimization',
        location: [file],
        description: `${syncOps} synchronous file operations`,
        frequency: syncOps,
        impact: 0.8,
        suggestion: 'Convert to async operations',
        confidence: 0.95,
        detectedAt: Date.now()
      });
    }

    // Optimization 3: Missing memoization
    const expensiveOps = (content.match(/JSON\.(parse|stringify)/g) || []).length;
    if (expensiveOps > 5) {
      patterns.push({
        id: `opt-memo-${this.hash(file)}`,
        type: 'optimization',
        location: [file],
        description: `${expensiveOps} expensive operations without caching`,
        frequency: expensiveOps,
        impact: 0.6,
        suggestion: 'Add memoization layer',
        confidence: 0.75,
        detectedAt: Date.now()
      });
    }

    return patterns;
  }

  // ═══════════════════════════════════════════════════════
  // BOTTLENECK DETECTION
  // ═══════════════════════════════════════════════════════
  private findBottlenecks(content: string, file: string): Pattern[] {
    const patterns: Pattern[] = [];

    // Bottleneck 1: Nested loops
    const nestedLoops = (content.match(/for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)/g) || []).length;
    if (nestedLoops > 0) {
      patterns.push({
        id: `bottle-loop-${this.hash(file)}`,
        type: 'bottleneck',
        location: [file],
        description: `${nestedLoops} nested loops (O(n²) complexity)`,
        frequency: nestedLoops,
        impact: 0.9,
        suggestion: 'Use Map/Set for O(n) lookup',
        confidence: 0.85,
        detectedAt: Date.now()
      });
    }

    // Bottleneck 2: Sequential async operations
    const sequentialAwaits = (content.match(/await\s+\w+[^;]*;\s*await\s+\w+/g) || []).length;
    if (sequentialAwaits > 2) {
      patterns.push({
        id: `bottle-seq-${this.hash(file)}`,
        type: 'bottleneck',
        location: [file],
        description: `${sequentialAwaits} sequential async operations`,
        frequency: sequentialAwaits,
        impact: 0.7,
        suggestion: 'Use Promise.all() for parallel execution',
        confidence: 0.8,
        detectedAt: Date.now()
      });
    }

    return patterns;
  }

  // ═══════════════════════════════════════════════════════
  // METRICS ANALYSIS
  // ═══════════════════════════════════════════════════════
  private async analyzeMetrics(): Promise<PerformanceMetric[]> {
    const anomalies: PerformanceMetric[] = [];

    // Simulate metric collection (in production, read from monitoring)
    const components = ['ExpectationEngine', 'UCB1', 'MetaLoop', 'TrustChain'];
    
    for (const component of components) {
      const metric: PerformanceMetric = {
        component,
        metric: 'latency',
        value: Math.random() * 1000,
        threshold: 500,
        trend: Math.random() > 0.5 ? 'improving' : 'degrading',
        timestamp: Date.now()
      };

      this.metrics.push(metric);

      // Detect anomalies
      if (metric.value > metric.threshold) {
        anomalies.push(metric);
        this.emit('metric:anomaly', metric);
      }
    }

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    return anomalies;
  }

  // ═══════════════════════════════════════════════════════
  // EMERGENT PATTERN DETECTION
  // ═══════════════════════════════════════════════════════
  private async detectEmergentPatterns(): Promise<Pattern[]> {
    const emergent: Pattern[] = [];

    // Pattern 1: Correlated failures
    const recentPatterns = Array.from(this.patterns.values())
      .filter(p => Date.now() - p.detectedAt < 300000); // Last 5 minutes

    const antiPatternCount = recentPatterns.filter(p => p.type === 'anti-pattern').length;
    const bottleneckCount = recentPatterns.filter(p => p.type === 'bottleneck').length;

    if (antiPatternCount > 3 && bottleneckCount > 2) {
      emergent.push({
        id: `emergent-quality-${Date.now()}`,
        type: 'anti-pattern',
        location: ['system'],
        description: 'Code quality degradation detected',
        frequency: 1,
        impact: 0.9,
        suggestion: 'Run comprehensive refactoring pass',
        confidence: 0.85,
        detectedAt: Date.now()
      });
    }

    // Pattern 2: Performance degradation trend
    const recentMetrics = this.metrics.slice(-20);
    const degradingCount = recentMetrics.filter(m => m.trend === 'degrading').length;

    if (degradingCount > 15) {
      emergent.push({
        id: `emergent-perf-${Date.now()}`,
        type: 'bottleneck',
        location: ['system'],
        description: 'System-wide performance degradation',
        frequency: 1,
        impact: 0.95,
        suggestion: 'Investigate resource leaks and optimize hot paths',
        confidence: 0.9,
        detectedAt: Date.now()
      });
    }

    return emergent;
  }

  // ═══════════════════════════════════════════════════════
  // INSIGHT GENERATION
  // ═══════════════════════════════════════════════════════
  private async generateInsights(
    patterns: Pattern[],
    anomalies: PerformanceMetric[],
    emergent: Pattern[]
  ): Promise<any[]> {
    const insights: any[] = [];

    // Insight 1: Top optimization opportunities
    const topOptimizations = Array.from(this.patterns.values())
      .filter(p => p.type === 'optimization')
      .sort((a, b) => b.impact * b.frequency - a.impact * a.frequency)
      .slice(0, 5);

    if (topOptimizations.length > 0) {
      insights.push({
        type: 'optimization_opportunities',
        priority: 'high',
        patterns: topOptimizations,
        estimatedImpact: topOptimizations.reduce((sum, p) => sum + p.impact, 0) / topOptimizations.length
      });
    }

    // Insight 2: Critical anti-patterns
    const criticalAntiPatterns = Array.from(this.patterns.values())
      .filter(p => p.type === 'anti-pattern' && p.impact > 0.7);

    if (criticalAntiPatterns.length > 0) {
      insights.push({
        type: 'critical_anti_patterns',
        priority: 'critical',
        patterns: criticalAntiPatterns,
        recommendation: 'Immediate refactoring required'
      });
    }

    // Insight 3: Performance bottlenecks
    if (anomalies.length > 0) {
      insights.push({
        type: 'performance_anomalies',
        priority: 'high',
        metrics: anomalies,
        recommendation: 'Investigate and optimize affected components'
      });
    }

    // Insight 4: Emergent behaviors
    if (emergent.length > 0) {
      insights.push({
        type: 'emergent_patterns',
        priority: 'critical',
        patterns: emergent,
        recommendation: 'System-wide intervention needed'
      });
    }

    return insights;
  }

  // ─── Helpers ──────────────────────────────────────────────

  private async scanFiles(): Promise<string[]> {
    const files: string[] = [];
    const walk = async (dir: string) => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await walk(fullPath);
        } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
          files.push(fullPath);
        }
      }
    };
    await walk(this.codebasePath);
    return files;
  }

  private findLongFunctions(content: string): number[] {
    const lines = content.split('\n');
    const longFunctions: number[] = [];
    let inFunction = false;
    let functionStart = 0;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.match(/^\s*(async\s+)?(\w+)\s*\([^)]*\)\s*{/)) {
        inFunction = true;
        functionStart = i;
        braceCount = 1;
      } else if (inFunction) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
        
        if (braceCount === 0) {
          const functionLength = i - functionStart;
          if (functionLength > 50) {
            longFunctions.push(functionStart);
          }
          inFunction = false;
        }
      }
    }

    return longFunctions;
  }

  private hash(data: string): string {
    return createHash('sha256').update(data).digest('hex').slice(0, 16);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats(): { totalPatterns: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    for (const pattern of this.patterns.values()) {
      byType[pattern.type] = (byType[pattern.type] || 0) + 1;
    }
    return {
      totalPatterns: this.patterns.size,
      byType
    };
  }
}

// ─── Bootstrap ────────────────────────────────────────────

if (require.main === module) {
  const hunter = new PatternHunter('./packages/aix-core/src');
  
  hunter.on('hunter:started', () => console.log('🔍 Pattern Hunter started'));
  hunter.on('pattern:found', (insight) => {
    console.log(`\n🎯 INSIGHT FOUND:`);
    console.log(JSON.stringify(insight, null, 2));
  });
  hunter.on('metric:anomaly', (metric) => {
    console.log(`\n⚠️  ANOMALY: ${metric.component} ${metric.metric} = ${metric.value.toFixed(0)}ms (threshold: ${metric.threshold}ms)`);
  });
  
  hunter.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Pattern Hunter...');
    hunter.stop();
    console.log(hunter.getStats());
    process.exit(0);
  });
}

// Made with Moe Abdelaziz
