#!/usr/bin/env ts-node
/**
 * AIX Self-Healing System
 * 
 * Orchestrates all health monitoring tools and generates comprehensive reports.
 * Runs automatically in CI/CD and can be triggered manually.
 * 
 * Usage:
 *   npm run health:check
 *   npm run health:fix
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = join(__dirname, '..');
const REPORT_DIR = join(PROJECT_ROOT, '.generated');
const HEALTH_REPORT = join(REPORT_DIR, 'HEALTH_REPORT.md');

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  score?: number;
  message: string;
  details?: string;
  fixCommand?: string;
}

const results: HealthCheckResult[] = [];

/**
 * Run a command and capture output
 */
function runCommand(cmd: string, options: { silent?: boolean; ignoreError?: boolean } = {}): string {
  try {
    const output = execSync(cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit'
    });
    return output;
  } catch (error: any) {
    if (!options.ignoreError) {
      throw error;
    }
    const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
    const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
    return stdout || stderr || '';
  }
}

/**
 * Check 1: Health Score
 */
async function checkHealthScore(): Promise<void> {
  console.log('\n🏥 Running Health Score Check...');
  
  try {
    runCommand('ts-node scripts/health-score.ts', { silent: true });
    
    const healthScorePath = join(REPORT_DIR, 'health-score.json');
    if (existsSync(healthScorePath)) {
      const data = JSON.parse(readFileSync(healthScorePath, 'utf-8'));
      const score = Math.round(data.score * 100);
      
      results.push({
        name: 'Health Score',
        status: score >= 70 ? 'pass' : score >= 50 ? 'warn' : 'fail',
        score,
        message: `Overall health: ${score}%`,
        details: Object.entries(data.metrics)
          .map(([key, value]) => `  - ${key}: ${Math.round((value as number) * 100)}%`)
          .join('\n'),
        fixCommand: score < 70 ? 'npm run health:fix' : undefined
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Health Score',
      status: 'fail',
      message: 'Failed to calculate health score',
      details: error.message
    });
  }
}

/**
 * Check 2: Dead Code Scan
 */
async function checkDeadCode(): Promise<void> {
  console.log('\n☠️  Running Dead Code Scan...');
  
  try {
    runCommand('bash scripts/dead-code-scan.sh', { silent: true, ignoreError: true });
    
    const deadCodePath = join(REPORT_DIR, 'dead-code-report.json');
    if (existsSync(deadCodePath)) {
      const data = JSON.parse(readFileSync(deadCodePath, 'utf-8'));
      const { critical, high, medium, low } = data.summary || { critical: 0, high: 0, medium: 0, low: 0 };
      
      const status = critical > 0 ? 'fail' : high > 0 ? 'warn' : 'pass';
      
      results.push({
        name: 'Dead Code Analysis',
        status,
        message: `Found ${critical} critical, ${high} high, ${medium} medium, ${low} low risk exports`,
        details: `  - ☠️ CRITICAL: ${critical}\n  - ⚠️ HIGH: ${high}\n  - 🔶 MEDIUM: ${medium}\n  - 📊 LOW: ${low}`,
        fixCommand: critical > 0 || high > 0 ? 'Review .generated/dead-code-report.md' : undefined
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Dead Code Analysis',
      status: 'warn',
      message: 'Dead code scan incomplete',
      details: error.message
    });
  }
}

/**
 * Check 3: Pattern Compliance
 */
async function checkPatterns(): Promise<void> {
  console.log('\n🔍 Running Pattern Watcher...');
  
  try {
    const output = runCommand('node scripts/pattern-watcher.js', { silent: true, ignoreError: true });
    
    const hasErrors = output.includes('CRITICAL VIOLATIONS');
    const hasWarnings = output.includes('⚠️');
    
    results.push({
      name: 'Pattern Compliance',
      status: hasErrors ? 'fail' : hasWarnings ? 'warn' : 'pass',
      message: hasErrors ? 'Critical pattern violations found' : hasWarnings ? 'Pattern warnings detected' : 'All patterns compliant',
      details: output.split('\n').filter(l => l.includes('✅') || l.includes('⚠️') || l.includes('❌')).join('\n')
    });
  } catch (error: any) {
    results.push({
      name: 'Pattern Compliance',
      status: 'warn',
      message: 'Pattern check incomplete',
      details: error.message
    });
  }
}

/**
 * Check 4: TypeScript Compilation
 */
async function checkTypeScript(): Promise<void> {
  console.log('\n📘 Checking TypeScript...');
  
  try {
    runCommand('npx tsc --noEmit', { silent: true });
    
    results.push({
      name: 'TypeScript',
      status: 'pass',
      message: 'No type errors'
    });
  } catch (error: any) {
    const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
    const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
    const diagnosticOutput = stdout || stderr || String(error?.message || 'Unknown TypeScript failure');
    const errorCount = (diagnosticOutput.match(/error TS/g) || []).length;
    
    results.push({
      name: 'TypeScript',
      status: 'fail',
      message: `${errorCount} type errors found`,
      details: diagnosticOutput.split('\n').slice(0, 10).join('\n'),
      fixCommand: 'npx tsc --noEmit'
    });
  }
}

/**
 * Check 5: Test Coverage
 */
async function checkTests(): Promise<void> {
  console.log('\n🧪 Running Tests...');
  
  try {
    const output = runCommand('npm test', { silent: true, ignoreError: true });
    
    const passedMatches = [...output.matchAll(/(\d+)\s+passed/g)].map((m) => parseInt(m[1], 10));
    const failedMatches = [...output.matchAll(/(\d+)\s+failed/g)].map((m) => parseInt(m[1], 10));

    const passed = passedMatches.reduce((sum, n) => sum + n, 0);
    const failed = failedMatches.reduce((sum, n) => sum + n, 0);
    
    results.push({
      name: 'Test Suite',
      status: failed > 0 ? 'fail' : passed > 0 ? 'pass' : 'warn',
      message: `${passed} passed, ${failed} failed`,
      fixCommand: failed > 0 ? 'npm test' : undefined
    });
  } catch (error: any) {
    results.push({
      name: 'Test Suite',
      status: 'warn',
      message: 'Tests incomplete',
      details: error.message
    });
  }
}

/**
 * Check 6: Security Audit
 */
async function checkSecurity(): Promise<void> {
  console.log('\n🔐 Running Security Audit...');
  
  try {
    const output = runCommand('npm audit --json', { silent: true, ignoreError: true });
    const audit = JSON.parse(output);
    
    const { critical, high, moderate, low } = audit.metadata.vulnerabilities || {};
    
    const status = critical > 0 ? 'fail' : high > 0 ? 'warn' : 'pass';
    
    results.push({
      name: 'Security Audit',
      status,
      message: `${critical} critical, ${high} high, ${moderate} moderate, ${low} low vulnerabilities`,
      fixCommand: critical > 0 || high > 0 ? 'npm audit fix' : undefined
    });
  } catch (error: any) {
    results.push({
      name: 'Security Audit',
      status: 'warn',
      message: 'Security audit incomplete'
    });
  }
}

/**
 * Generate comprehensive health report
 */
function generateReport(): void {
  const timestamp = new Date().toISOString();
  const passCount = results.filter(r => r.status === 'pass').length;
  const warnCount = results.filter(r => r.status === 'warn').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  
  const overallStatus = failCount > 0 ? '❌ FAILING' : warnCount > 0 ? '⚠️ WARNING' : '✅ HEALTHY';
  
  let report = `# 🏥 AIX Self-Healing System Report

**Generated:** ${timestamp}  
**Overall Status:** ${overallStatus}  
**Summary:** ${passCount} passed, ${warnCount} warnings, ${failCount} failures

---

## 📊 Health Checks

`;

  for (const result of results) {
    const emoji = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
    
    report += `### ${emoji} ${result.name}\n\n`;
    report += `**Status:** ${result.status.toUpperCase()}\n`;
    report += `**Message:** ${result.message}\n`;
    
    if (result.score !== undefined) {
      report += `**Score:** ${result.score}%\n`;
    }
    
    if (result.details) {
      report += `\n**Details:**\n\`\`\`\n${result.details}\n\`\`\`\n`;
    }
    
    if (result.fixCommand) {
      report += `\n**Fix Command:** \`${result.fixCommand}\`\n`;
    }
    
    report += '\n---\n\n';
  }

  report += `## 🔧 Recommended Actions\n\n`;
  
  const actionsNeeded = results.filter(r => r.fixCommand);
  if (actionsNeeded.length > 0) {
    actionsNeeded.forEach((r, i) => {
      report += `${i + 1}. **${r.name}:** \`${r.fixCommand}\`\n`;
    });
  } else {
    report += 'No immediate actions required. System is healthy! ✅\n';
  }

  report += `\n---\n\n*Generated by AIX Self-Healing System*\n`;

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(HEALTH_REPORT, report);
  console.log(`\n📄 Report saved to: ${HEALTH_REPORT}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🤖 AIX Self-Healing System');
  console.log('═'.repeat(60));
  
  await checkHealthScore();
  await checkDeadCode();
  await checkPatterns();
  await checkTypeScript();
  await checkTests();
  await checkSecurity();
  
  generateReport();
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Summary:');
  console.log(`  ✅ Passed: ${results.filter(r => r.status === 'pass').length}`);
  console.log(`  ⚠️  Warnings: ${results.filter(r => r.status === 'warn').length}`);
  console.log(`  ❌ Failed: ${results.filter(r => r.status === 'fail').length}`);
  
  const hasFailures = results.some(r => r.status === 'fail');
  process.exit(hasFailures ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Made with Bob
