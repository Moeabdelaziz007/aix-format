# Self-Improvement Engine

## Philosophy: Monitoring vs Autonomy

The AIX Format self-improvement engine embodies a core principle: **autonomy with accountability**. Unlike traditional monitoring systems that simply alert humans to problems, or fully autonomous systems that make changes without oversight, our approach strikes a balance:

- **OBSERVE**: Continuously monitor codebase health metrics
- **ANALYZE**: Detect trends and patterns in code quality
- **RECOMMEND**: Create actionable GitHub issues with specific suggestions
- **EMPOWER**: Humans remain in control of all code changes

This philosophy ensures that:
1. Problems are identified automatically and consistently
2. Solutions are suggested based on best practices
3. Human judgment guides all actual code modifications
4. The system learns from historical patterns

## Architecture

The self-improvement engine consists of three interconnected components:

```
┌─────────────────┐
│  Health Score   │  Measures 6 key metrics using geometric mean
│  Calculator     │  (prevents gaming individual metrics)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Trend Detector  │  Analyzes git history to identify patterns:
│                 │  • IMPROVING: Consistent upward trend
│                 │  • STABLE: Low variance (<5 points)
│                 │  • DEGRADING: Downward trend (>5 points)
│                 │  • CRITICAL: Score <50 or metric <0.30
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Issue Generator │  Creates GitHub issues for failing metrics
│                 │  • Prevents duplicates
│                 │  • Provides actionable suggestions
│                 │  • Updates existing issues
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Issues   │  Human-reviewed action items
└─────────────────┘
```

## Components

### 1. Health Score Calculator ([`scripts/health-score.ts`](../scripts/health-score.ts))

Calculates an overall health score (0-100) based on six metrics:

| Metric | Description | Target |
|--------|-------------|--------|
| **API Routes Coverage** | Percentage of API routes with proper error handling and validation | 100% |
| **Type Safety** | TypeScript safety score (penalizes `any` types) | 100% |
| **Schema Sync** | Percentage of example files that validate against schemas | 100% |
| **Redis Key Naming** | Consistency of Redis key naming patterns | 100% |
| **Circular Dependencies** | Absence of circular import chains | 0 circular deps |
| **Test Coverage** | Ratio of test files to source files | 30%+ |

**Key Features:**
- Uses **geometric mean** (Nash 1950) to prevent gaming individual metrics
- All metrics must improve together for score to increase
- Generates JSON report in `.generated/health-score.json`
- Updates `openmemory.md` with historical tracking
- Compares against baseline (`.health-score-baseline.json`)

**Usage:**
```bash
# Calculate current health score
npm run health-score

# Initialize baseline
npm run health-score -- --init

# View report
npm run health-score:report
```

### 2. Trend Detector ([`scripts/health-trend.js`](../scripts/health-trend.js))

Analyzes historical health scores from git history to detect trends:

**Trend Classifications:**
- **IMPROVING**: Score increasing consistently (>5 points in last 3 commits)
- **STABLE**: Score variance < 5 points across history
- **DEGRADING**: Score dropping >5 points or consistent downward trend
- **CRITICAL**: Score < 50 or any metric < 0.30 (blocks merges)

**Analysis Metrics:**
- **Velocity**: Points per day (rate of change)
- **7-day Change**: Score delta over last week
- **30-day Change**: Score delta over last month
- **Sudden Drops**: Commits with >10 point drops
- **Declining Metrics**: Individual metrics with consistent decline

**Usage:**
```bash
# Analyze trend (default: last 20 commits)
node scripts/health-trend.js

# Analyze more commits
node scripts/health-trend.js --commits=50

# Force refresh (ignore cache)
node scripts/health-trend.js --force

# JSON output only
node scripts/health-trend.js --json

# Create GitHub issue if degrading
node scripts/health-trend.js --create-issue
```

### 3. Issue Generator ([`scripts/auto-issue-generator.js`](../scripts/auto-issue-generator.js))

Automatically creates GitHub issues for metrics below 70% threshold:

**Features:**
- **Duplicate Prevention**: Searches for existing issues before creating new ones
- **Smart Updates**: Adds comments to existing issues with new metrics
- **Actionable Suggestions**: Each issue includes specific steps to fix the problem
- **Priority Labeling**: Labels issues with `auto-generated`, `health-score`, and metric name
- **Documentation Links**: References relevant docs for context

**Issue Templates:**

Each metric has a dedicated template with:
- Clear problem description
- Current vs. target values
- Step-by-step fix suggestions
- Links to relevant documentation
- Automatic timestamp and metadata

**Usage:**
```bash
# Generate issues for failing metrics
npm run health:fix

# Requires GITHUB_TOKEN environment variable
GITHUB_TOKEN=ghp_xxx npm run health:fix
```

## CI Integration

### Workflow: Health Score Autonomy

**File:** [`.github/workflows/health-autonomy.yml`](../.github/workflows/health-autonomy.yml)

**Triggers:**
- Push to `main` branch
- Pull requests (all branches)
- Daily schedule (00:00 UTC)

**Jobs:**

#### 1. `health-check`
Runs on all triggers (push, PR, schedule):

**Steps:**
1. Checkout code with full git history
2. Setup Node.js 18 with npm caching
3. Install dependencies
4. Run health score calculation
5. Run trend analysis
6. Upload artifacts (health-score.json, health-trend.json)
7. Post summary to GitHub Actions UI
8. **Merge Blocking**: Fail if trend is CRITICAL (exit code 2)

**Artifacts:**
- `health-score-report`: Current health metrics
- `health-trend-report`: Trend analysis and history

**Summary Output:**
```markdown
## 📊 Health Score Summary

**Overall Score:** 85.3/100

### Metrics Breakdown
- **apiRoutesCoverage**: 92%
- **typeSafety**: 88%
- **schemaSync**: 100%
- **redisKeyNaming**: 75%
- **circularDeps**: 100%
- **testCoverage**: 65%

### 📈 Trend Analysis
- **Trend:** IMPROVING
- **7-day Change:** +5.2 points
- **Velocity:** +0.74 points/day
```

#### 2. `auto-remediate`
Runs only on `main` branch (not PRs):

**Steps:**
1. Download health score artifact
2. Check if score < 75
3. If below threshold, run issue generator
4. Post remediation summary

**Conditions:**
- Only runs on `main` branch
- Only runs after successful `health-check`
- Skipped on pull requests (prevents spam)

**Environment:**
- Uses `GITHUB_TOKEN` for issue creation
- Has `issues: write` permission

### Merge Blocking

The workflow implements smart merge blocking:

**CRITICAL Trend (blocks merge):**
- Overall score < 50
- Any metric < 0.30
- Exit code: 2

**DEGRADING Trend (warning):**
- Score dropped >5 points
- Consistent downward trend
- Exit code: 1 (doesn't block, but warns)

**STABLE/IMPROVING (passes):**
- Score variance < 5 points
- Upward trend
- Exit code: 0

### Permissions

The workflow requires specific GitHub permissions:

```yaml
permissions:
  contents: read        # Read repository code
  issues: write         # Create/update issues
  pull-requests: write  # Comment on PRs
```

## Manual Usage

### Quick Commands

```bash
# Run full health check (score + trend)
npm run health:check

# Generate issues for failing metrics
npm run health:fix

# Run complete workflow (check + fix)
npm run health:full
```

### Detailed Workflows

#### 1. Check Current Health

```bash
# Calculate health score
npm run health-score

# View detailed report
cat .generated/health-score.json | jq '.'

# Check trend
node scripts/health-trend.js
```

#### 2. Initialize Baseline

```bash
# Create baseline for comparison
npm run health-score -- --init

# Commit baseline to git
git add .health-score-baseline.json
git commit -m "chore: initialize health score baseline"
```

#### 3. Analyze Historical Trends

```bash
# Analyze last 20 commits (default)
node scripts/health-trend.js

# Analyze last 50 commits
node scripts/health-trend.js --commits=50

# Force refresh cache
node scripts/health-trend.js --force

# Get JSON output for scripting
node scripts/health-trend.js --json > trend.json
```

#### 4. Generate Issues Locally

```bash
# Set GitHub token
export GITHUB_TOKEN=ghp_your_token_here

# Generate issues
npm run health:fix

# Or run directly
node scripts/auto-issue-generator.js
```

## Issue Templates

### Example: Type Safety Issue

```markdown
## 🔒 Health Score Alert

**Metric:** `typeSafety`
**Current Value:** 65.0% 🔴
**Threshold:** 70%
**Status:** BELOW THRESHOLD

### Problem

TypeScript safety score is 65.0%, below the 70% threshold. This indicates 
excessive use of `any` types or missing type definitions.

### Suggested Fixes

1. Search for `: any` types in the codebase: `grep -r ": any" packages/ apps/`
2. Replace `any` with proper type definitions
3. Enable stricter TypeScript compiler options in tsconfig.json
4. Add type definitions for external libraries in `types/`
5. Review type safety report in health score output

### Documentation

- [Health Score Documentation](../docs/AUTOMATION_RESEARCH.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Architecture Overview](../docs/ARCHITECTURE.md)

---

*This issue was automatically generated by the AIX Format health monitoring system.*
*Last updated: 2026-05-02T13:00:00.000Z*
*Health score file: `.generated/health-score.json`*
```

### Issue Labels

All auto-generated issues include:
- `auto-generated`: Marks as system-created
- `health-score`: Groups health-related issues
- `{metricName}`: Specific metric identifier (e.g., `typeSafety`)

## Troubleshooting

### Common Issues

#### 1. "No health score found"

**Problem:** Health score file doesn't exist

**Solution:**
```bash
# Generate health score
npm run health-score

# Verify file exists
ls -la .generated/health-score.json
```

#### 2. "Insufficient historical data"

**Problem:** Not enough commits with health scores in git history

**Solution:**
```bash
# Commit current health score
git add .generated/health-score.json
git commit -m "chore: add health score"

# Or initialize baseline
npm run health-score -- --init
git add .health-score-baseline.json
git commit -m "chore: initialize health baseline"
```

#### 3. "GITHUB_TOKEN required"

**Problem:** Issue generator needs GitHub authentication

**Solution:**
```bash
# Create token at: https://github.com/settings/tokens
# Required scopes: repo (private) or public_repo (public)

export GITHUB_TOKEN=ghp_your_token_here
npm run health:fix
```

#### 4. "Could not parse GitHub repository"

**Problem:** Git remote not configured or not GitHub

**Solution:**
```bash
# Check git remote
git remote -v

# Or set environment variable
export GITHUB_REPOSITORY=owner/repo
npm run health:fix
```

#### 5. Workflow fails with "bc: command not found"

**Problem:** `bc` calculator not available in CI environment

**Solution:**
The workflow uses `bc` for floating-point comparison. It's pre-installed on GitHub Actions `ubuntu-latest` runners. If running locally on a system without `bc`:

```bash
# Ubuntu/Debian
sudo apt-get install bc

# macOS
brew install bc

# Or use alternative comparison in workflow
```

#### 6. Trend analysis shows "No commit history"

**Problem:** Shallow git clone in CI

**Solution:**
The workflow uses `fetch-depth: 0` to get full history:
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # Full history required
```

### Debug Mode

Enable verbose logging:

```bash
# Health score with debug output
DEBUG=* npm run health-score

# Trend analysis with verbose output
node scripts/health-trend.js --force

# Issue generator with detailed logs
DEBUG=octokit:* npm run health:fix
```

### Verify CI Integration

```bash
# Test workflow locally with act
act -j health-check

# Or push to a test branch
git checkout -b test/health-ci
git push origin test/health-ci

# Check workflow run at:
# https://github.com/owner/repo/actions
```

## Best Practices

### 1. Commit Health Scores Regularly

```bash
# Add to pre-push hook
npm run health-score
git add .generated/health-score.json
```

### 2. Review Issues Weekly

- Check [auto-generated issues](../../issues?q=is%3Aissue+is%3Aopen+label%3Aauto-generated)
- Prioritize CRITICAL metrics first
- Close issues when metrics improve

### 3. Monitor Trends

```bash
# Check trend before major changes
npm run health:check

# Ensure trend is STABLE or IMPROVING
```

### 4. Set Baseline After Major Improvements

```bash
# After significant refactoring
npm run health-score -- --init
git add .health-score-baseline.json
git commit -m "chore: update health baseline after refactor"
```

### 5. Use in Code Reviews

- Check health score in PR comments
- Ensure PRs don't degrade metrics
- Reference health issues in PR descriptions

## Metrics Deep Dive

### API Routes Coverage

**What it measures:** Percentage of API routes using standardized error handling

**How it's calculated:**
```typescript
// Scans for routes using api-helpers
const hasStandardization = content.includes('api-helpers') && 
                          content.includes('successResponse') &&
                          content.includes('ERR.');
```

**Improvement strategies:**
1. Use `api-helpers` utilities in all routes
2. Standardize error codes with `ERR.` constants
3. Implement consistent response formats
4. Add validation middleware

### Type Safety

**What it measures:** Absence of `any` types in TypeScript code

**How it's calculated:**
```typescript
// Penalizes after 50 'any' types
typeSafety = anyTypes === 0 ? 1 : Math.max(0, 1 - (anyTypes / 50))
```

**Improvement strategies:**
1. Replace `any` with proper types
2. Use `unknown` for truly dynamic data
3. Create type definitions for external libraries
4. Enable `strict` mode in tsconfig.json

### Schema Sync

**What it measures:** Percentage of example files that validate against schemas

**How it's calculated:**
```typescript
// Validates each .aix file against schema
validCount / totalExamples
```

**Improvement strategies:**
1. Update examples to match current schemas
2. Run `npm run validate:examples` regularly
3. Add schema validation to pre-commit hooks
4. Keep schemas and examples in sync

### Redis Key Naming

**What it measures:** Consistency of Redis key patterns

**How it's calculated:**
```typescript
// Checks for namespace:entity:${id} pattern
consistentCount / totalKeyFunctions
```

**Improvement strategies:**
1. Follow pattern: `aix:{domain}:{entity}:{id}`
2. Use key builder utilities
3. Document key patterns in REDIS_LAYOUT.md
4. Avoid hardcoded key strings

### Circular Dependencies

**What it measures:** Absence of circular import chains

**How it's calculated:**
```typescript
// Uses madge to detect cycles
circularDeps === 0 ? 1 : Math.max(0, 1 - (circularDeps / 10))
```

**Improvement strategies:**
1. Extract shared types to separate files
2. Use dependency injection
3. Refactor module boundaries
4. Run `npm run check:circular` regularly

### Test Coverage

**What it measures:** Ratio of test files to source files

**How it's calculated:**
```typescript
// Aims for 30% minimum coverage
Math.min(testCount / sourceCount / 0.3, 1)
```

**Improvement strategies:**
1. Add `.test.ts` files for each module
2. Focus on critical business logic
3. Use `npm test -- --coverage` to identify gaps
4. Aim for 80%+ on core packages

## Future Enhancements

### Planned Features

1. **Machine Learning Predictions**
   - Predict future health scores based on trends
   - Identify patterns in metric degradation
   - Suggest proactive improvements

2. **Automated PR Comments**
   - Comment on PRs with health impact
   - Show before/after metrics
   - Suggest improvements inline

3. **Custom Metrics**
   - Allow projects to define custom health metrics
   - Plugin system for metric calculators
   - Configurable thresholds per project

4. **Historical Dashboards**
   - Web UI for visualizing trends
   - Compare branches and releases
   - Export reports for stakeholders

5. **Integration with Other Tools**
   - SonarQube integration
   - CodeClimate compatibility
   - Slack/Discord notifications

## Contributing

To improve the self-improvement engine:

1. **Add New Metrics**: Edit [`scripts/health-score.ts`](../scripts/health-score.ts)
2. **Enhance Trend Detection**: Modify [`scripts/health-trend.js`](../scripts/health-trend.js)
3. **Improve Issue Templates**: Update [`scripts/auto-issue-generator.js`](../scripts/auto-issue-generator.js)
4. **Extend CI Workflow**: Edit [`.github/workflows/health-autonomy.yml`](../.github/workflows/health-autonomy.yml)

See [CONTRIBUTING.md](../CONTRIBUTING.md) for general contribution guidelines.

## References

- **Geometric Mean**: Nash, J. (1950). "The Bargaining Problem"
- **Sentrux AI**: Inspiration for autonomous improvement loops
- **GitHub Actions**: [Official Documentation](https://docs.github.com/en/actions)
- **Octokit**: [GitHub API Client](https://github.com/octokit/octokit.js)

---

*Made with Moe Abdelaziz - The AI that improves itself* 🤖