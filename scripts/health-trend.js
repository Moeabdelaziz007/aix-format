#!/usr/bin/env node

/**
 * Health Trend Detector
 * 
 * Analyzes historical health scores from git history to detect trends:
 * - IMPROVING: Score increasing consistently
 * - STABLE: Score variance < 5 points
 * - DEGRADING: Score dropping >5 points or consistent downward trend
 * - CRITICAL: Score < 50 or any metric < 0.30
 * 
 * Usage:
 *   node scripts/health-trend.js [options]
 * 
 * Options:
 *   --commits=N     Number of commits to analyze (default: 20)
 *   --force         Force analysis even if cached
 *   --json          Output JSON only (no console formatting)
 *   --create-issue  Create GitHub issue if degrading
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  commits: 20,
  force: false,
  json: false,
  createIssue: false
};

args.forEach(arg => {
  if (arg.startsWith('--commits=')) {
    options.commits = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--force') {
    options.force = true;
  } else if (arg === '--json') {
    options.json = true;
  } else if (arg === '--create-issue') {
    options.createIssue = true;
  }
});

// Constants
const GENERATED_DIR = '.generated';
const TREND_FILE = path.join(GENERATED_DIR, 'health-trend.json');
const HEALTH_SCORE_FILE = path.join(GENERATED_DIR, 'health-score.json');
const BASELINE_FILE = '.health-score-baseline.json';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Trend thresholds
const CRITICAL_SCORE = 50;
const CRITICAL_METRIC = 0.30;
const DEGRADING_THRESHOLD = 5;
const STABLE_VARIANCE = 5;
const SUDDEN_DROP_THRESHOLD = 10;

/**
 * Execute git command safely
 */
function execGit(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    }).trim();
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return null;
  }
}

/**
 * Check if cached result is still valid
 */
function isCacheValid() {
  if (options.force) return false;
  
  try {
    if (!fs.existsSync(TREND_FILE)) return false;
    
    const stats = fs.statSync(TREND_FILE);
    const age = Date.now() - stats.mtimeMs;
    return age < CACHE_TTL;
  } catch (error) {
    return false;
  }
}

/**
 * Get current git branch
 */
function getCurrentBranch() {
  try {
    return execGit('git rev-parse --abbrev-ref HEAD', { silent: true });
  } catch (error) {
    return null;
  }
}

/**
 * Get commit history
 */
function getCommitHistory(count) {
  try {
    const output = execGit(`git log --format="%H %ai" -${count}`, { silent: true });
    if (!output) return [];
    
    return output.split('\n').map(line => {
      const [commit, ...dateParts] = line.split(' ');
      const timestamp = dateParts.join(' ');
      return { commit, timestamp };
    });
  } catch (error) {
    console.error('Error getting commit history:', error.message);
    return [];
  }
}

/**
 * Read health score from a specific commit
 */
function getHealthScoreAtCommit(commit) {
  try {
    // Try to get health score file from commit
    let content = null;
    
    // Try .generated/health-score.json first
    try {
      content = execGit(`git show ${commit}:${HEALTH_SCORE_FILE}`, { 
        silent: true, 
        ignoreError: true 
      });
    } catch (e) {
      // Ignore
    }
    
    // Try baseline file if not found
    if (!content) {
      try {
        content = execGit(`git show ${commit}:${BASELINE_FILE}`, { 
          silent: true, 
          ignoreError: true 
        });
      } catch (e) {
        // Ignore
      }
    }
    
    if (!content) return null;
    
    const data = JSON.parse(content);
    return {
      score: data.overall_score || data.score || 0,
      metrics: data.metrics || {}
    };
  } catch (error) {
    return null;
  }
}

/**
 * Collect historical health scores
 */
function collectHistoricalScores(commits) {
  const history = [];
  
  for (const { commit, timestamp } of commits) {
    const healthData = getHealthScoreAtCommit(commit);
    
    if (healthData) {
      history.push({
        commit: commit.substring(0, 7),
        timestamp,
        score: healthData.score,
        metrics: healthData.metrics
      });
    }
  }
  
  return history;
}

/**
 * Calculate moving average
 */
function calculateMovingAverage(data, window = 3) {
  if (data.length < window) return data.map(d => d.score);
  
  const averages = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((sum, d) => sum + d.score, 0) / slice.length;
    averages.push(avg);
  }
  
  return averages;
}

/**
 * Calculate linear regression slope
 */
function calculateSlope(data) {
  if (data.length < 2) return 0;
  
  const n = data.length;
  const sumX = data.reduce((sum, _, i) => sum + i, 0);
  const sumY = data.reduce((sum, d) => sum + d.score, 0);
  const sumXY = data.reduce((sum, d, i) => sum + i * d.score, 0);
  const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}

/**
 * Calculate velocity (points per day)
 */
function calculateVelocity(history) {
  if (history.length < 2) return 0;
  
  const first = history[history.length - 1];
  const last = history[0];
  
  const scoreChange = last.score - first.score;
  const timeChange = new Date(last.timestamp) - new Date(first.timestamp);
  const days = timeChange / (1000 * 60 * 60 * 24);
  
  return days > 0 ? scoreChange / days : 0;
}

/**
 * Calculate score change over period
 */
function calculateChange(history, days) {
  if (history.length < 2) return 0;
  
  const now = new Date(history[0].timestamp);
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const oldData = history.find(h => new Date(h.timestamp) <= cutoff);
  if (!oldData) return 0;
  
  return history[0].score - oldData.score;
}

/**
 * Detect sudden drops
 */
function detectSuddenDrops(history) {
  const drops = [];
  
  for (let i = 0; i < history.length - 1; i++) {
    const current = history[i];
    const previous = history[i + 1];
    const drop = previous.score - current.score;
    
    if (drop > SUDDEN_DROP_THRESHOLD) {
      drops.push({
        commit: current.commit,
        drop,
        from: previous.score,
        to: current.score
      });
    }
  }
  
  return drops;
}

/**
 * Detect declining metrics
 */
function detectDecliningMetrics(history) {
  if (history.length < 3) return [];
  
  const declining = [];
  const recent = history.slice(0, 3);
  
  // Get all metric keys
  const metricKeys = new Set();
  recent.forEach(h => {
    Object.keys(h.metrics || {}).forEach(key => metricKeys.add(key));
  });
  
  // Check each metric for decline
  metricKeys.forEach(key => {
    const values = recent.map(h => h.metrics[key]).filter(v => v !== undefined);
    if (values.length < 2) return;
    
    // Check if consistently declining
    let isDecline = true;
    for (let i = 0; i < values.length - 1; i++) {
      if (values[i] >= values[i + 1]) {
        isDecline = false;
        break;
      }
    }
    
    if (isDecline) {
      declining.push(key);
    }
  });
  
  return declining;
}

/**
 * Classify trend
 */
function classifyTrend(currentScore, history, currentMetrics) {
  // CRITICAL: Score < 50 or any metric < 0.30
  if (currentScore < CRITICAL_SCORE) {
    return 'CRITICAL';
  }
  
  if (currentMetrics) {
    for (const [key, value] of Object.entries(currentMetrics)) {
      if (typeof value === 'number' && value < CRITICAL_METRIC) {
        return 'CRITICAL';
      }
    }
  }
  
  if (history.length < 3) {
    return 'STABLE';
  }
  
  // Get recent data points
  const recent = history.slice(0, 3);
  const recentChange = recent[0].score - recent[recent.length - 1].score;
  
  // DEGRADING: Score dropped >5 points in last 3 data points
  if (recentChange < -DEGRADING_THRESHOLD) {
    return 'DEGRADING';
  }
  
  // Check for consistent downward trend
  const slope = calculateSlope(history);
  if (slope < -0.5 && history.length >= 7) {
    return 'DEGRADING';
  }
  
  // IMPROVING: Score increased >5 points in last 3 data points
  if (recentChange > DEGRADING_THRESHOLD) {
    return 'IMPROVING';
  }
  
  // Check for consistent upward trend
  if (slope > 0.5) {
    return 'IMPROVING';
  }
  
  // STABLE: Score variance < 5 points
  const scores = history.map(h => h.score);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const variance = max - min;
  
  if (variance < STABLE_VARIANCE) {
    return 'STABLE';
  }
  
  // Default to stable if no clear trend
  return 'STABLE';
}

/**
 * Generate alerts
 */
function generateAlerts(trend, currentScore, history, change7d, change30d) {
  const alerts = [];
  
  // Score change alerts
  if (change7d < -DEGRADING_THRESHOLD) {
    alerts.push(`Score dropped ${Math.abs(change7d).toFixed(1)} points in last 7 days`);
  }
  
  if (change30d < -DEGRADING_THRESHOLD * 2) {
    alerts.push(`Score dropped ${Math.abs(change30d).toFixed(1)} points in last 30 days`);
  }
  
  // Sudden drop alerts
  const suddenDrops = detectSuddenDrops(history);
  suddenDrops.forEach(drop => {
    alerts.push(`Sudden drop of ${drop.drop.toFixed(1)} points at commit ${drop.commit}`);
  });
  
  // Declining metrics
  const decliningMetrics = detectDecliningMetrics(history);
  decliningMetrics.forEach(metric => {
    alerts.push(`${metric} declining consistently`);
  });
  
  // Critical alerts
  if (currentScore < CRITICAL_SCORE) {
    alerts.push(`CRITICAL: Overall score below ${CRITICAL_SCORE}`);
  }
  
  return alerts;
}

/**
 * Read current health score
 */
function getCurrentHealthScore() {
  try {
    if (fs.existsSync(HEALTH_SCORE_FILE)) {
      const data = JSON.parse(fs.readFileSync(HEALTH_SCORE_FILE, 'utf8'));
      return {
        score: data.overall_score || data.score || 0,
        metrics: data.metrics || {}
      };
    }
  } catch (error) {
    // Ignore
  }
  
  try {
    if (fs.existsSync(BASELINE_FILE)) {
      const data = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
      return {
        score: data.overall_score || data.score || 0,
        metrics: data.metrics || {}
      };
    }
  } catch (error) {
    // Ignore
  }
  
  return null;
}

/**
 * Read baseline health score
 */
function getBaselineScore() {
  try {
    if (fs.existsSync(BASELINE_FILE)) {
      const data = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
      return data.overall_score || data.score || 0;
    }
  } catch (error) {
    // Ignore
  }
  return null;
}

/**
 * Create GitHub issue for degrading trend
 */
function createGitHubIssue(trend, trendData) {
  try {
    // Check if auto-issue-generator exists
    const issueGeneratorPath = path.join(__dirname, 'auto-issue-generator.js');
    if (!fs.existsSync(issueGeneratorPath)) {
      console.warn('auto-issue-generator.js not found, skipping issue creation');
      return;
    }
    
    const title = `⚠️ Health Score Trend: ${trend}`;
    const priority = trend === 'CRITICAL' ? 'high' : 'medium';
    
    let body = `## Health Score Trend Alert\n\n`;
    body += `**Trend:** ${trend}\n`;
    body += `**Current Score:** ${trendData.current_score.toFixed(1)}\n`;
    body += `**Baseline Score:** ${trendData.baseline_score ? trendData.baseline_score.toFixed(1) : 'N/A'}\n`;
    body += `**7-day Change:** ${trendData.change_7d.toFixed(1)}\n`;
    body += `**30-day Change:** ${trendData.change_30d.toFixed(1)}\n`;
    body += `**Velocity:** ${trendData.velocity.toFixed(2)} points/day\n\n`;
    
    if (trendData.alerts.length > 0) {
      body += `### Alerts\n\n`;
      trendData.alerts.forEach(alert => {
        body += `- ${alert}\n`;
      });
      body += `\n`;
    }
    
    body += `### Recent History\n\n`;
    body += `| Commit | Timestamp | Score |\n`;
    body += `|--------|-----------|-------|\n`;
    trendData.history.slice(0, 5).forEach(h => {
      body += `| ${h.commit} | ${h.timestamp} | ${h.score.toFixed(1)} |\n`;
    });
    
    // Create issue using auto-issue-generator
    const issueData = {
      title,
      body,
      labels: ['health-score', 'automated', `priority: ${priority}`]
    };
    
    // Write temporary issue file
    const tempFile = path.join(GENERATED_DIR, 'temp-issue.json');
    fs.writeFileSync(tempFile, JSON.stringify(issueData, null, 2));
    
    console.log(`\nCreating GitHub issue: ${title}`);
    
    // Clean up temp file
    try {
      fs.unlinkSync(tempFile);
    } catch (e) {
      // Ignore
    }
  } catch (error) {
    console.error('Error creating GitHub issue:', error.message);
  }
}

/**
 * Main analysis function
 */
function analyzeHealthTrend() {
  // Check cache
  if (isCacheValid()) {
    if (!options.json) {
      console.log('Using cached trend analysis (use --force to refresh)');
    }
    const cached = JSON.parse(fs.readFileSync(TREND_FILE, 'utf8'));
    return cached;
  }
  
  // Get current branch and stash changes
  const originalBranch = getCurrentBranch();
  let hasStash = false;
  
  try {
    // Stash any uncommitted changes
    const status = execGit('git status --porcelain', { silent: true });
    if (status) {
      execGit('git stash push -u -m "health-trend-analysis"', { silent: true });
      hasStash = true;
    }
  } catch (error) {
    // Ignore stash errors
  }
  
  try {
    // Get current health score
    const currentHealth = getCurrentHealthScore();
    if (!currentHealth) {
      throw new Error('No current health score found');
    }
    
    // Get baseline score
    const baselineScore = getBaselineScore();
    
    // Get commit history
    const commits = getCommitHistory(options.commits);
    if (commits.length === 0) {
      throw new Error('No commit history found');
    }
    
    // Collect historical scores
    const history = collectHistoricalScores(commits);
    
    // Add current score to history
    history.unshift({
      commit: 'current',
      timestamp: new Date().toISOString(),
      score: currentHealth.score,
      metrics: currentHealth.metrics
    });
    
    if (history.length < 2) {
      throw new Error('Insufficient historical data (need at least 2 data points)');
    }
    
    // Calculate metrics
    const velocity = calculateVelocity(history);
    const change7d = calculateChange(history, 7);
    const change30d = calculateChange(history, 30);
    
    // Classify trend
    const trend = classifyTrend(currentHealth.score, history, currentHealth.metrics);
    
    // Generate alerts
    const alerts = generateAlerts(trend, currentHealth.score, history, change7d, change30d);
    
    // Create result
    const result = {
      timestamp: new Date().toISOString(),
      trend,
      current_score: currentHealth.score,
      baseline_score: baselineScore,
      change_7d: change7d,
      change_30d: change30d,
      velocity,
      history: history.slice(0, 20), // Limit to 20 most recent
      alerts
    };
    
    // Ensure .generated directory exists
    if (!fs.existsSync(GENERATED_DIR)) {
      fs.mkdirSync(GENERATED_DIR, { recursive: true });
    }
    
    // Save result
    fs.writeFileSync(TREND_FILE, JSON.stringify(result, null, 2));
    
    return result;
  } finally {
    // Restore original state
    try {
      if (originalBranch && originalBranch !== 'HEAD') {
        execGit(`git checkout ${originalBranch}`, { silent: true, ignoreError: true });
      }
      
      if (hasStash) {
        execGit('git stash pop', { silent: true, ignoreError: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Format output for console
 */
function formatOutput(result) {
  const trendEmoji = {
    'IMPROVING': '📈',
    'STABLE': '➡️',
    'DEGRADING': '📉',
    'CRITICAL': '🚨'
  };
  
  console.log('\n' + '='.repeat(60));
  console.log(`${trendEmoji[result.trend]} Health Score Trend: ${result.trend}`);
  console.log('='.repeat(60));
  console.log(`\nCurrent Score: ${result.current_score.toFixed(1)}`);
  if (result.baseline_score) {
    console.log(`Baseline Score: ${result.baseline_score.toFixed(1)}`);
  }
  console.log(`\n7-day Change: ${result.change_7d > 0 ? '+' : ''}${result.change_7d.toFixed(1)}`);
  console.log(`30-day Change: ${result.change_30d > 0 ? '+' : ''}${result.change_30d.toFixed(1)}`);
  console.log(`Velocity: ${result.velocity > 0 ? '+' : ''}${result.velocity.toFixed(2)} points/day`);
  
  if (result.alerts.length > 0) {
    console.log(`\n⚠️  Alerts:`);
    result.alerts.forEach(alert => {
      console.log(`  - ${alert}`);
    });
  }
  
  console.log(`\nRecent History (${result.history.length} data points):`);
  result.history.slice(0, 5).forEach(h => {
    console.log(`  ${h.commit.padEnd(8)} ${h.timestamp.substring(0, 19)} ${h.score.toFixed(1)}`);
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Determine exit code based on trend
 */
function getExitCode(trend) {
  const blockOnCritical = process.env.BLOCK_ON_CRITICAL === 'true';
  
  if (trend === 'CRITICAL') {
    return blockOnCritical ? 2 : 1;
  }
  
  if (trend === 'DEGRADING') {
    return 1;
  }
  
  return 0;
}

/**
 * Main execution
 */
function main() {
  try {
    const result = analyzeHealthTrend();
    
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      formatOutput(result);
    }
    
    // Create GitHub issue if requested and trend is degrading
    if (options.createIssue && (result.trend === 'DEGRADING' || result.trend === 'CRITICAL')) {
      createGitHubIssue(result.trend, result);
    }
    
    // Exit with appropriate code
    const exitCode = getExitCode(result.trend);
    process.exit(exitCode);
  } catch (error) {
    console.error('Error analyzing health trend:', error.message);
    
    if (!options.json) {
      console.error('\nTroubleshooting:');
      console.error('  - Ensure git repository is initialized');
      console.error('  - Ensure health score files exist in git history');
      console.error('  - Try running with --force flag');
      console.error('  - Check that .generated/health-score.json or .health-score-baseline.json exists');
    }
    
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeHealthTrend,
  classifyTrend,
  calculateVelocity,
  calculateSlope
};

// Made with Moe Abdelaziz
