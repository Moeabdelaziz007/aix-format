#!/usr/bin/env node

/**
 * AIX Format - Autonomous Issue Generator
 * 
 * PHILOSOPHY: This script embodies the "autonomy with accountability" principle.
 * It OBSERVES health metrics and CREATES issues for human review, but does NOT
 * automatically fix code. Humans remain in control of all code changes.
 * 
 * WORKFLOW:
 * 1. Read health score from .generated/health-score.json
 * 2. Identify metrics below 70% threshold
 * 3. Check for existing issues (prevent duplicates)
 * 4. Create or update GitHub issues with actionable suggestions
 * 5. Log all actions for transparency
 * 
 * USAGE:
 *   node scripts/auto-issue-generator.js
 *   GITHUB_TOKEN=xxx node scripts/auto-issue-generator.js
 */

const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');
const { execSync } = require('child_process');

// Configuration
const HEALTH_SCORE_PATH = '.generated/health-score.json';
const THRESHOLD = 0.70; // 70%
const ISSUE_LABELS = ['auto-generated', 'health-score'];

/**
 * Issue templates for each metric
 * Each template includes title, problem description, and suggested fixes
 */
const ISSUE_TEMPLATES = {
  apiRoutesCoverage: {
    title: '🔌 API Coverage below threshold',
    emoji: '🔌',
    getProblem: (value) => `API route coverage is at ${(value * 100).toFixed(1)}%, below the 70% threshold. This means some API endpoints lack proper validation or tests.`,
    getSuggestions: () => [
      'Run `npm run validate:routes` to identify uncovered routes',
      'Add validation tests for missing API endpoints',
      'Review `scripts/validate-routes.ts` for coverage details',
      'Ensure all routes in `apps/` have corresponding test files'
    ]
  },
  typeSafety: {
    title: '🔒 TypeScript Safety degraded',
    emoji: '🔒',
    getProblem: (value) => `TypeScript safety score is ${(value * 100).toFixed(1)}%, below the 70% threshold. This indicates excessive use of \`any\` types or missing type definitions.`,
    getSuggestions: () => [
      'Search for `: any` types in the codebase: `grep -r ": any" packages/ apps/`',
      'Replace `any` with proper type definitions',
      'Enable stricter TypeScript compiler options in tsconfig.json',
      'Add type definitions for external libraries in `types/`',
      'Review type safety report in health score output'
    ]
  },
  schemaSync: {
    title: '📋 Schema Sync failing',
    emoji: '📋',
    getProblem: (value) => `Schema synchronization is at ${(value * 100).toFixed(1)}%, below the 70% threshold. Example files may not match the current schema definitions.`,
    getSuggestions: () => [
      'Run `npm run schema:sync` to check sync status',
      'Update example files in `examples/` to match current schemas',
      'Verify schema files in `schemas/` are valid JSON Schema',
      'Check `schema-sync.config.json` for sync configuration',
      'Ensure all `.aix.json` files validate against schemas'
    ]
  },
  redisKeyNaming: {
    title: '🔑 Redis Key Naming inconsistent',
    emoji: '🔑',
    getProblem: (value) => `Redis key naming consistency is at ${(value * 100).toFixed(1)}%, below the 70% threshold. Keys may not follow the standardized pattern.`,
    getSuggestions: () => [
      'Review `docs/REDIS_LAYOUT.md` for key naming conventions',
      'Standardize keys to format: `aix:{domain}:{entity}:{id}`',
      'Update `packages/aix-core/src/storage/keys.ts` with proper patterns',
      'Search for hardcoded Redis keys: `grep -r "redis.set\\|redis.get" packages/`',
      'Use the key builder utilities instead of string concatenation'
    ]
  },
  circularDeps: {
    title: '🔄 Circular Dependencies detected',
    emoji: '🔄',
    getProblem: (value) => `Circular dependency score is ${(value * 100).toFixed(1)}%, below the 70% threshold. The codebase has circular import chains that need refactoring.`,
    getSuggestions: () => [
      'Run `npm run check:circular` to identify circular dependencies',
      'Refactor imports to break circular chains',
      'Move shared types to a separate file (e.g., `types/shared.ts`)',
      'Use dependency injection instead of direct imports',
      'Consider extracting common code to a utility module',
      'Review module boundaries in `packages/` structure'
    ]
  },
  testCoverage: {
    title: '🧪 Test Coverage below target',
    emoji: '🧪',
    getProblem: (value) => `Test coverage is at ${(value * 100).toFixed(1)}%, below the 70% threshold. Critical code paths may lack proper testing.`,
    getSuggestions: () => [
      'Run `npm test -- --coverage` to see detailed coverage report',
      'Add test files for uncovered modules in `tests/` directory',
      'Focus on critical paths: validation, security, economics',
      'Ensure each package has a corresponding `.test.ts` file',
      'Review `vitest.config.ts` for coverage configuration',
      'Aim for 80%+ coverage on core business logic'
    ]
  },
  missingZodValidation: {
    title: '🛡️ Missing Zod Validation in API Routes',
    emoji: '🛡️',
    getProblem: (value) => `API route validation coverage is at ${(value * 100).toFixed(1)}%, below the 70% threshold. Some routes lack input validation with Zod schemas.`,
    getSuggestions: () => [
      'Search for API routes without Zod: `grep -r "export async function POST\\|export async function GET" apps/studio/src/app/api/ | grep -v "z.object"`',
      'Add Zod schema validation to all POST/PUT/PATCH routes',
      'Example: `const schema = z.object({ userId: z.string(), amount: z.number() }); const body = schema.parse(await req.json());`',
      'Install zod if not present: `npm install zod`',
      'Review existing validated routes in `apps/studio/src/app/api/` for patterns'
    ]
  },
  unsafeEnvAccess: {
    title: '⚠️ Unsafe Environment Variable Access',
    emoji: '⚠️',
    getProblem: (value) => `Environment variable safety is at ${(value * 100).toFixed(1)}%, below the 70% threshold. Code uses \`process.env.X!\` without fallbacks, risking production crashes.`,
    getSuggestions: () => [
      'Search for unsafe env access: `grep -r "process\\.env\\.[A-Z_]*!" packages/ apps/`',
      'Replace `process.env.X!` with `requireEnv("X")` helper function',
      'Add fallback values: `const key = process.env.API_KEY || throw new Error("API_KEY required");`',
      'Use environment validation library like `envalid` or `zod`',
      'Create `.env.example` with all required variables documented',
      'Add startup validation that checks all required env vars before server starts'
    ]
  },
  stripeWebhookSecurity: {
    title: '🔐 Stripe Webhook Security Missing',
    emoji: '🔐',
    getProblem: (value) => `Stripe webhook security is at ${(value * 100).toFixed(1)}%, below the 70% threshold. Webhooks may lack signature verification, allowing fake payment events.`,
    getSuggestions: () => [
      'Search for Stripe webhooks: `grep -r "stripe.*webhook\\|/api/stripe/webhook" apps/`',
      'Verify all webhooks use `stripe.webhooks.constructEvent(rawBody, signature, secret)`',
      'NEVER use `req.json()` for webhooks - use `req.text()` to preserve raw body',
      'Add `STRIPE_WEBHOOK_SECRET` to environment variables',
      'Test webhooks locally with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`',
      'Log all webhook signature verification failures for security monitoring'
    ]
  }
};

/**
 * Read and parse the health score file
 * @returns {Object|null} Health score data or null if file doesn't exist
 */
function readHealthScore() {
  try {
    const filePath = path.join(process.cwd(), HEALTH_SCORE_PATH);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Health score file not found: ${HEALTH_SCORE_PATH}`);
      console.warn('   Run `npm run health:check` to generate it.');
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    console.log(`✅ Loaded health score from ${HEALTH_SCORE_PATH}`);
    console.log(`   Overall score: ${(data.score * 100).toFixed(1)}%`);
    
    return data;
  } catch (error) {
    console.error(`❌ Error reading health score: ${error.message}`);
    return null;
  }
}

/**
 * Extract GitHub repository info from git remote
 * @returns {Object} {owner, repo}
 */
function getRepoInfo() {
  try {
    // Try environment variables first (for CI)
    if (process.env.GITHUB_REPOSITORY) {
      const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
      return { owner, repo };
    }

    // Fall back to git remote
    const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    
    // Parse GitHub URL (supports both HTTPS and SSH)
    const match = remote.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }

    throw new Error('Could not parse GitHub repository from git remote');
  } catch (error) {
    console.error(`❌ Error getting repo info: ${error.message}`);
    console.error('   Set GITHUB_REPOSITORY env var (format: owner/repo)');
    process.exit(1);
  }
}

/**
 * Initialize Octokit with GitHub token
 * @returns {Octokit} Configured Octokit instance
 */
function initGitHub() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    console.error('   Get a token from: https://github.com/settings/tokens');
    console.error('   Required scopes: repo (for private repos) or public_repo');
    process.exit(1);
  }

  return new Octokit({ auth: token });
}

/**
 * Search for existing open issues with specific labels
 * @param {Octokit} octokit - GitHub API client
 * @param {Object} repoInfo - {owner, repo}
 * @param {string} metricName - Name of the metric
 * @returns {Promise<Object|null>} Existing issue or null
 */
async function findExistingIssue(octokit, repoInfo, metricName) {
  try {
    const { data: issues } = await octokit.issues.listForRepo({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      state: 'open',
      labels: [...ISSUE_LABELS, metricName].join(',')
    });

    return issues.length > 0 ? issues[0] : null;
  } catch (error) {
    console.error(`❌ Error searching for existing issue: ${error.message}`);
    return null;
  }
}

/**
 * Format issue body with metric details and suggestions
 * @param {string} metricName - Name of the metric
 * @param {number} value - Current metric value (0-1)
 * @param {Object} template - Issue template
 * @returns {string} Formatted issue body
 */
function formatIssueBody(metricName, value, template) {
  const percentage = (value * 100).toFixed(1);
  const thresholdPercentage = (THRESHOLD * 100).toFixed(0);
  
  const suggestions = template.getSuggestions()
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n');

  return `## ${template.emoji} Health Score Alert

**Metric:** \`${metricName}\`  
**Current Value:** ${percentage}% ${value < THRESHOLD ? '🔴' : '🟡'}  
**Threshold:** ${thresholdPercentage}%  
**Status:** ${value < THRESHOLD ? 'BELOW THRESHOLD' : 'WARNING'}

### Problem

${template.getProblem(value)}

### Suggested Fixes

${suggestions}

### Documentation

- [Health Score Documentation](../docs/AUTOMATION_RESEARCH.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Architecture Overview](../docs/ARCHITECTURE.md)

---

*This issue was automatically generated by the AIX Format health monitoring system.*  
*Last updated: ${new Date().toISOString()}*  
*Health score file: \`.generated/health-score.json\`*
`;
}

/**
 * Create a new GitHub issue
 * @param {Octokit} octokit - GitHub API client
 * @param {Object} repoInfo - {owner, repo}
 * @param {string} metricName - Name of the metric
 * @param {number} value - Current metric value
 * @returns {Promise<Object>} Created issue
 */
async function createGitHubIssue(octokit, repoInfo, metricName, value) {
  const template = ISSUE_TEMPLATES[metricName];
  
  if (!template) {
    throw new Error(`No template found for metric: ${metricName}`);
  }

  const body = formatIssueBody(metricName, value, template);
  const labels = [...ISSUE_LABELS, metricName];

  try {
    const { data: issue } = await octokit.issues.create({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      title: template.title,
      body,
      labels
    });

    console.log(`✅ Created issue #${issue.number}: ${template.title}`);
    console.log(`   URL: ${issue.html_url}`);
    
    return issue;
  } catch (error) {
    console.error(`❌ Error creating issue: ${error.message}`);
    throw error;
  }
}

/**
 * Update an existing issue with new metric data
 * @param {Octokit} octokit - GitHub API client
 * @param {Object} repoInfo - {owner, repo}
 * @param {Object} issue - Existing issue
 * @param {string} metricName - Name of the metric
 * @param {number} value - Current metric value
 * @returns {Promise<void>}
 */
async function updateExistingIssue(octokit, repoInfo, issue, metricName, value) {
  const template = ISSUE_TEMPLATES[metricName];
  const percentage = (value * 100).toFixed(1);
  
  const comment = `## 📊 Health Score Update

**Metric:** \`${metricName}\`  
**Current Value:** ${percentage}% ${value < THRESHOLD ? '🔴' : '🟡'}  
**Updated:** ${new Date().toISOString()}

The metric is still below the threshold. Please review the suggestions above and take action.

${value < 0.5 ? '⚠️ **CRITICAL:** This metric has dropped below 50%!' : ''}
`;

  try {
    await octokit.issues.createComment({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      issue_number: issue.number,
      body: comment
    });

    console.log(`✅ Updated issue #${issue.number} with new metrics`);
    console.log(`   URL: ${issue.html_url}`);
  } catch (error) {
    console.error(`❌ Error updating issue: ${error.message}`);
    throw error;
  }
}

/**
 * Process a single failed metric
 * @param {Octokit} octokit - GitHub API client
 * @param {Object} repoInfo - {owner, repo}
 * @param {string} metricName - Name of the metric
 * @param {number} value - Current metric value
 * @returns {Promise<void>}
 */
async function processMetric(octokit, repoInfo, metricName, value) {
  console.log(`\n🔍 Processing metric: ${metricName} (${(value * 100).toFixed(1)}%)`);

  // Check for existing issue
  const existingIssue = await findExistingIssue(octokit, repoInfo, metricName);

  if (existingIssue) {
    console.log(`   Found existing issue #${existingIssue.number}`);
    await updateExistingIssue(octokit, repoInfo, existingIssue, metricName, value);
  } else {
    console.log(`   No existing issue found, creating new one...`);
    await createGitHubIssue(octokit, repoInfo, metricName, value);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🤖 AIX Format - Autonomous Issue Generator\n');
  console.log('=' .repeat(60));

  // Step 1: Read health score
  const healthData = readHealthScore();
  if (!healthData || !healthData.metrics) {
    console.error('❌ No valid health data found. Exiting.');
    process.exit(1);
  }

  // Step 2: Find metrics below threshold
  const failedMetrics = Object.entries(healthData.metrics)
    .filter(([_, value]) => value < THRESHOLD)
    .sort(([, a], [, b]) => a - b); // Sort by severity (lowest first)

  if (failedMetrics.length === 0) {
    console.log('\n✅ All metrics are above threshold! No issues to create.');
    console.log(`   Overall score: ${(healthData.score * 100).toFixed(1)}%`);
    process.exit(0);
  }

  console.log(`\n⚠️  Found ${failedMetrics.length} metric(s) below threshold:`);
  failedMetrics.forEach(([name, value]) => {
    console.log(`   - ${name}: ${(value * 100).toFixed(1)}%`);
  });

  // Step 3: Initialize GitHub API
  const octokit = initGitHub();
  const repoInfo = getRepoInfo();
  console.log(`\n📦 Repository: ${repoInfo.owner}/${repoInfo.repo}`);

  // Step 4: Process each failed metric
  let successCount = 0;
  let errorCount = 0;

  for (const [metricName, value] of failedMetrics) {
    try {
      await processMetric(octokit, repoInfo, metricName, value);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to process ${metricName}: ${error.message}`);
      errorCount++;
    }
  }

  // Step 5: Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Successfully processed: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📈 Overall health score: ${(healthData.score * 100).toFixed(1)}%`);

  if (errorCount > 0) {
    console.log('\n⚠️  Some issues could not be created. Check errors above.');
    process.exit(1);
  }

  console.log('\n✅ Issue generation complete!');
  process.exit(0);
}

// Execute main function
if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

// Export for testing
module.exports = {
  readHealthScore,
  getRepoInfo,
  formatIssueBody,
  ISSUE_TEMPLATES,
  THRESHOLD
};

// Made with Moe Abdelaziz
