#!/usr/bin/env ts-node
/**
 * AIX Codebase Health Score Calculator
 * 
 * Implements geometric mean scoring (Nash 1950) to prevent gaming individual metrics.
 * Automatically runs in pre-push hook and updates openmemory.md
 * 
 * Inspired by: sentrux AI agent improvement (72 → 92 in one loop)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface HealthMetrics {
  apiRoutesCoverage: number;
  typeSafety: number;
  schemaSync: number;
  redisKeyNaming: number;
  circularDeps: number;
  testCoverage: number;
}

const TOTAL_API_ROUTES = 24; // Core routes we're tracking
const PROJECT_ROOT = join(__dirname, '..');

/**
 * Geometric mean - prevents gaming individual metrics
 * All metrics must improve together
 */
function geometricMean(values: number[]): number {
  const product = values.reduce((acc, val) => acc * val, 1);
  return Math.pow(product, 1 / values.length);
}

/**
 * Count API routes with proper error handling and auth
 */
async function countTestedRoutes(): Promise<number> {
  const routesDir = join(PROJECT_ROOT, 'apps/studio/src/app/api');
  const coreSrcDir = join(PROJECT_ROOT, 'packages/aix-core/src');
  let testedCount = 0;
  
  // Check for usage of SovereignHealthService or getGateway in core
  try {
    const coreFiles = execSync(`grep -r "SovereignHealthService" ${coreSrcDir} | wc -l`, { encoding: 'utf-8' });
    testedCount += Math.min(parseInt(coreFiles.trim()), 10); // Max 10 points for core health
  } catch {}

  function scanDir(dir: string) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (entry === 'route.ts') {
        const content = readFileSync(fullPath, 'utf-8');
        // Check for api-helpers usage (standardized routes)
        if (content.includes('api-helpers') && 
            content.includes('successResponse') &&
            content.includes('ERR.')) {
          testedCount++;
        }
      }
    }
  }
  
  scanDir(routesDir);
  return testedCount;
}

/**
 * Count usage of 'any' type in critical files
 */
async function countAnyTypes(): Promise<number> {
  try {
    const result = execSync(
      `grep -r ": any" apps/studio/src/app/api apps/studio/src/lib packages/*/src --include="*.ts" | wc -l`,
      { encoding: 'utf-8', cwd: PROJECT_ROOT }
    );
    return parseInt(result.trim());
  } catch {
    return 0;
  }
}

/**
 * Validate all examples/*.aix files against schema
 */
async function validateExamplesAgainstSchema(): Promise<number> {
  const examplesDir = join(PROJECT_ROOT, 'examples');
  const examples = readdirSync(examplesDir).filter(f => f.endsWith('.aix') || f.endsWith('.aix.json'));
  
  let validCount = 0;
  for (const example of examples) {
    try {
      const content = readFileSync(join(examplesDir, example), 'utf-8');
      const parsed = JSON.parse(content);
      
      // Basic validation - check required fields
      if (parsed.meta && parsed.meta.version && parsed.identity_layer) {
        validCount++;
      }
    } catch {
      // Invalid JSON or missing fields
    }
  }
  
  return examples.length > 0 ? validCount / examples.length : 0;
}

/**
 * Audit Redis key naming consistency
 */
async function auditRedisKeys(): Promise<number> {
  const redisKeysFile = join(PROJECT_ROOT, 'packages/aix-core/src/storage.ts');
  
  try {
    const content = readFileSync(redisKeysFile, 'utf-8');
    
    // Check for consistent namespace pattern (namespace:entity:id)
    const keyFunctions = content.match(/\(.*?\) => `[^`]+`/g) || [];
    let consistentCount = 0;
    
    for (const func of keyFunctions) {
      // Check if follows pattern: namespace:entity:${id}
      if (func.includes(':') && func.includes('${')) {
        consistentCount++;
      }
    }
    
    return keyFunctions.length > 0 ? consistentCount / keyFunctions.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Detect circular imports using madge
 */
async function detectCircularImports(): Promise<number> {
  try {
    // Try to use madge if available
    execSync('npx madge --circular apps/studio/src packages/aix-core/src', {
      cwd: PROJECT_ROOT,
      stdio: 'pipe'
    });
    return 0; // No circular deps
  } catch (error: any) {
    // Parse error output to count circular dependencies
    const output = error.stdout?.toString() || '';
    const circularMatches = output.match(/Circular dependency/g);
    return circularMatches ? circularMatches.length : 0;
  }
}

/**
 * Calculate test coverage percentage
 */
async function getTestCoverage(): Promise<number> {
  try {
    // Check if test files exist
    const testFiles = execSync(
      `find apps/studio/src packages/*/src -name "*.test.ts" -o -name "*.test.tsx" | wc -l`,
      { encoding: 'utf-8', cwd: PROJECT_ROOT }
    );
    
    const sourceFiles = execSync(
      `find apps/studio/src packages/*/src -name "*.ts" -o -name "*.tsx" | grep -v ".test." | wc -l`,
      { encoding: 'utf-8', cwd: PROJECT_ROOT }
    );
    
    const testCount = parseInt(testFiles.trim());
    const sourceCount = parseInt(sourceFiles.trim());
    
    // Aim for at least 30% test coverage
    return sourceCount > 0 ? Math.min(testCount / sourceCount / 0.3, 1) : 0;
  } catch {
    return 0;
  }
}

/**
 * Calculate overall health score
 */
async function calculateHealthScore(): Promise<{ score: number; metrics: HealthMetrics; details: string }> {
  console.log('🔍 Calculating AIX Codebase Health Score...\n');
  
  const testedRoutes = await countTestedRoutes();
  const anyTypes = await countAnyTypes();
  const schemaValid = await validateExamplesAgainstSchema();
  const redisConsistency = await auditRedisKeys();
  const circularDeps = await detectCircularImports();
  const testCoverage = await getTestCoverage();
  
  const metrics: HealthMetrics = {
    apiRoutesCoverage: testedRoutes / TOTAL_API_ROUTES,
    typeSafety: anyTypes === 0 ? 1 : Math.max(0, 1 - (anyTypes / 50)), // Penalize after 50 'any' types
    schemaSync: schemaValid,
    redisKeyNaming: redisConsistency,
    circularDeps: circularDeps === 0 ? 1 : Math.max(0, 1 - (circularDeps / 10)),
    testCoverage: testCoverage,
  };
  
  // Geometric mean - all metrics must improve together
  const score = geometricMean(Object.values(metrics)) * 100;
  
  const details = `
📊 Health Metrics Breakdown:
  • API Routes Coverage: ${(metrics.apiRoutesCoverage * 100).toFixed(1)}% (${testedRoutes}/${TOTAL_API_ROUTES})
  • Type Safety: ${(metrics.typeSafety * 100).toFixed(1)}% (${anyTypes} 'any' types found)
  • Schema Sync: ${(metrics.schemaSync * 100).toFixed(1)}%
  • Redis Key Naming: ${(metrics.redisKeyNaming * 100).toFixed(1)}%
  • Circular Dependencies: ${(metrics.circularDeps * 100).toFixed(1)}% (${circularDeps} found)
  • Test Coverage: ${(metrics.testCoverage * 100).toFixed(1)}%

🎯 Overall Health Score: ${score.toFixed(2)}/100
`;
  
  return { score, metrics, details };
}

/**
 * Update openmemory.md with health score
 */
async function updateOpenMemory(score: number, metrics: HealthMetrics, previousScore?: number) {
  const memoryPath = join(PROJECT_ROOT, 'openmemory.md');
  const timestamp = new Date().toISOString();
  
  // Find lowest metric
  const metricEntries = Object.entries(metrics);
  const lowestMetric = metricEntries.reduce((min, curr) =>
    curr[1] < min[1] ? curr : min
  );
  
  const delta = previousScore ? (score - previousScore).toFixed(2) : 'N/A';
  const deltaSymbol = previousScore && score > previousScore ? '↑' :
                      previousScore && score < previousScore ? '↓' : '→';
  
  const entry = `\n## Health Score Update — ${timestamp}\n\n` +
    `**Score**: ${score.toFixed(2)}/100 ${deltaSymbol} (Delta: ${delta})\n` +
    `**Lowest Metric**: ${lowestMetric[0]} (${(lowestMetric[1] * 100).toFixed(1)}%)\n` +
    `**Metrics Breakdown**:\n` +
    Object.entries(metrics).map(([key, value]) =>
      `  - ${key}: ${(value * 100).toFixed(1)}%`
    ).join('\n') + '\n';
  
  // Append to openmemory
  const currentContent = readFileSync(memoryPath, 'utf-8');
  writeFileSync(memoryPath, currentContent + entry);
  
  console.log('✅ Updated openmemory.md with health score');
}

/**
 * Initialize baseline health score
 */
async function initBaseline() {
  const baselinePath = join(PROJECT_ROOT, '.health-score-baseline.json');
  
  try {
    const result = await calculateHealthScore();
    console.log(result.details);
    
    // Write baseline file
    writeFileSync(baselinePath, JSON.stringify({
      timestamp: new Date().toISOString(),
      score: result.score,
      metrics: result.metrics
    }, null, 2));
    
    console.log(`\n✅ Baseline created: ${baselinePath}`);
    console.log(`📊 Baseline Score: ${result.score.toFixed(2)}/100`);
    console.log('\n⚠️  Add this file to git: git add .health-score-baseline.json');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Baseline initialization failed:', error);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Check for --init flag
    if (process.argv.includes('--init')) {
      return await initBaseline();
    }
    
    const result = await calculateHealthScore();
    console.log(result.details);
    
    // Check for baseline and compare
    const baselinePath = join(PROJECT_ROOT, '.health-score-baseline.json');
    let previousScore: number | undefined;
    
    try {
      const baseline = JSON.parse(readFileSync(baselinePath, 'utf-8'));
      previousScore = baseline.score;
      
      const delta = result.score - previousScore;
      if (delta < -5) {
        console.log(`\n⚠️  Score dropped by ${Math.abs(delta).toFixed(2)} points from baseline`);
      }
    } catch {
      console.log('\n⚠️  No baseline found. Run with --init to create one.');
    }
    
    // Update openmemory
    await updateOpenMemory(result.score, result.metrics, previousScore);
    
    // Write JSON report for CI
    const reportPath = join(PROJECT_ROOT, '.generated/health-score.json');
    writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      score: result.score,
      metrics: result.metrics,
      baseline: previousScore
    }, null, 2));
    
    console.log(`\n📄 Report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    if (result.score < 70) {
      console.log('\n⚠️  Health score below 70 - improvement needed');
      process.exit(1);
    }
    
    console.log('\n✅ Health check passed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Health score calculation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { calculateHealthScore, geometricMean };
