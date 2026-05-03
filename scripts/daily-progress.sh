#!/usr/bin/env bash
# =============================================================================
# AIX Daily Progress Script — 33 Automation Gems
 # Run every morning: bash scripts/daily-progress.sh
 # Or add to cron:   0 9 * * * cd /path/to/aix-format && bash scripts/daily-progress.sh
# =============================================================================

set -e
BOLD=$(tput bold 2>/dev/null || echo '')
RESET=$(tput sgr0 2>/dev/null || echo '')
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}✔${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
fail() { echo -e "${RED}✗${NC} $1"; }
head() { echo -e "\n${BOLD}=== $1 ===${RESET}"; }

echo ""
echo -e "${BOLD}🌱 AIX Daily Progress — $(date '+%Y-%m-%d %H:%M')${RESET}"
echo "====================================================="

# ──────────────────────────────────────────────────────────────────
head "GEM 1-5: Health Checks"
# ──────────────────────────────────────────────────────────────────

# GEM 1: TypeScript errors count
TS_ERRORS=$(cd packages/aix-core && npx tsc --noEmit 2>&1 | grep -c 'error TS' || true)
if [ "$TS_ERRORS" -eq 0 ]; then
  log "GEM 1: TypeScript — 0 errors 🎉"
else
  warn "GEM 1: TypeScript — ${TS_ERRORS} errors remaining"
fi

# GEM 2: ESLint score
LINT_WARN=$(cd packages/aix-core && npx eslint src/ --format=compact 2>&1 | grep -c 'Warning' || true)
LINT_ERR=$(cd packages/aix-core && npx eslint src/ --format=compact 2>&1 | grep -c 'Error' || true)
log "GEM 2: ESLint — ${LINT_ERR} errors, ${LINT_WARN} warnings"

# GEM 3: Circular imports
CIRCULAR=$(cd packages/aix-core && npx madge --circular src/index.ts 2>&1 | grep -c 'circular' || true)
if [ "$CIRCULAR" -eq 0 ]; then
  log "GEM 3: No circular imports"
else
  warn "GEM 3: ${CIRCULAR} circular import(s) found"
fi

# GEM 4: Dead code check (console.log count)
CONSOLE_LOGS=$(grep -r 'console\.log' packages/aix-core/src/ --include='*.ts' | grep -v 'simulate.ts' | wc -l | tr -d ' ')
if [ "$CONSOLE_LOGS" -eq 0 ]; then
  log "GEM 4: Zero console.log in production code"
else
  warn "GEM 4: ${CONSOLE_LOGS} console.log still present"
fi

# GEM 5: File count + total lines
FILE_COUNT=$(find packages/aix-core/src -name '*.ts' | wc -l | tr -d ' ')
LINE_COUNT=$(find packages/aix-core/src -name '*.ts' -exec wc -l {} + | tail -1 | awk '{print $1}')
log "GEM 5: Codebase — ${FILE_COUNT} files, ${LINE_COUNT} lines"

# ──────────────────────────────────────────────────────────────────
head "GEM 6-12: Build & Bundle"
# ──────────────────────────────────────────────────────────────────

# GEM 6: Build aix-core
if (cd packages/aix-core && npm run build 2>&1 | tail -1 | grep -q 'error'); then
  fail "GEM 6: Build FAILED"
else
  log "GEM 6: Build passed"
fi

# GEM 7: Build size of dist/
if [ -d packages/aix-core/dist ]; then
  DIST_SIZE=$(du -sh packages/aix-core/dist 2>/dev/null | awk '{print $1}')
  log "GEM 7: dist/ size — ${DIST_SIZE}"
fi

# GEM 8: Next.js studio build check
if [ -f apps/studio/package.json ]; then
  STUDIO_KB=$(cd apps/studio && npm run build 2>&1 | grep 'First Load JS shared' | awk '{print $NF}' || echo '?')
  log "GEM 8: Studio First Load JS — ${STUDIO_KB}"
fi

# GEM 9: Unused exports (quick scan)
UNUSED_EXPORTS=$(grep -r 'export const\|export function\|export class' packages/aix-core/src/ --include='*.ts' | wc -l | tr -d ' ')
IMPORTED=$(grep -r 'import.*from.*aix-core' apps/ packages/ --include='*.ts' 2>/dev/null | wc -l | tr -d ' ')
log "GEM 9: Exports ${UNUSED_EXPORTS} defined, ~${IMPORTED} import sites"

# GEM 10: Duplicate file names
DUPS=$(find packages/aix-core/src -name '*.ts' | xargs -I{} basename {} | sort | uniq -d | wc -l | tr -d ' ')
if [ "$DUPS" -eq 0 ]; then log "GEM 10: No duplicate filenames"; else warn "GEM 10: ${DUPS} duplicate names"; fi

# GEM 11: Large files (>500 lines)
LARGE=$(find packages/aix-core/src -name '*.ts' -exec awk 'END{if(NR>500) print FILENAME, NR}' {} \; | wc -l | tr -d ' ')
if [ "$LARGE" -eq 0 ]; then log "GEM 11: All files under 500 lines"; else warn "GEM 11: ${LARGE} file(s) over 500 lines"; fi

# GEM 12: TODO/FIXME count
TODOS=$(grep -r 'TODO\|FIXME\|HACK\|XXX' packages/aix-core/src/ --include='*.ts' | wc -l | tr -d ' ')
log "GEM 12: ${TODOS} TODO/FIXME remaining"

# ──────────────────────────────────────────────────────────────────
head "GEM 13-18: Simulation & Evolution"
# ──────────────────────────────────────────────────────────────────

# GEM 13: Dry-run simulation
SIM_RESULT=$(cd packages/aix-core && npx tsx -e "
import { aix } from './src/aix';
aix.sim([{agentId:'a1',task:'test'},{agentId:'a2',task:'test'}])
  .then(r => console.log('sim:'+r.results.length+':'+r.duration+'ms'))
  .catch(e => console.log('sim:error:'+e.message))
" 2>&1 | grep 'sim:' || echo 'sim:skipped')
log "GEM 13: Parallel sim — ${SIM_RESULT}"

# GEM 14: Backend evolve log (last entry)
if [ -f packages/aix-core/evolution-metrics.json ]; then
  LAST_ROUND=$(jq '.rounds | length' packages/aix-core/evolution-metrics.json 2>/dev/null || echo '?')
  log "GEM 14: Backend evolution — ${LAST_ROUND} rounds logged"
else
  warn "GEM 14: No evolution-metrics.json yet (run npm run evolve)"
fi

# GEM 15: Frontend evolve log (last entry)
if [ -f apps/studio/evolution-log.jsonl ]; then
  FE_ROUNDS=$(wc -l < apps/studio/evolution-log.jsonl | tr -d ' ')
  log "GEM 15: Frontend evolution — ${FE_ROUNDS} rounds logged"
else
  warn "GEM 15: No evolution-log.jsonl yet (run npx tsx scripts/evolve-frontend.ts)"
fi

# GEM 16: Run backend evolve (3 rounds only, fast)
if command -v tsx &>/dev/null || npx tsx --version &>/dev/null 2>&1; then
  log "GEM 16: Triggering backend micro-evolve (3 rounds dry-run)"
  (cd packages/aix-core && ROUNDS=3 npx tsx src/compression/evolve.ts --dry-run 2>&1 | tail -3) || warn "GEM 16: evolve.ts not found, skip"
fi

# GEM 17: Lineage registry health
LINEAGE_COUNT=$(grep -r 'registerGenesis\|registerMutation' packages/aix-core/src/ --include='*.ts' | wc -l | tr -d ' ')
log "GEM 17: Lineage registry — ${LINEAGE_COUNT} registration calls"

# GEM 18: Trust chain entries
TRUST_REFS=$(grep -r 'TrustChain' packages/aix-core/src/ --include='*.ts' | wc -l | tr -d ' ')
log "GEM 18: Trust chain — ${TRUST_REFS} references"

# ──────────────────────────────────────────────────────────────────
head "GEM 19-25: Git & Velocity"
# ──────────────────────────────────────────────────────────────────

# GEM 19: Commits today
COMMITS_TODAY=$(git log --oneline --since='midnight' 2>/dev/null | wc -l | tr -d ' ')
log "GEM 19: Commits today — ${COMMITS_TODAY}"

# GEM 20: Commits this week
COMMITS_WEEK=$(git log --oneline --since='7 days ago' 2>/dev/null | wc -l | tr -d ' ')
log "GEM 20: Commits this week — ${COMMITS_WEEK}"

# GEM 21: Changed files (unstaged)
CHANGED=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
log "GEM 21: Unstaged changes — ${CHANGED} files"

# GEM 22: Lines added/removed today
STATS=$(git diff --stat HEAD~1 HEAD 2>/dev/null | tail -1 || echo '0 insertions, 0 deletions')
log "GEM 22: Last commit delta — ${STATS}"

# GEM 23: Open PRs (via GitHub CLI)
if command -v gh &>/dev/null; then
  OPEN_PRS=$(gh pr list --state open --json number 2>/dev/null | jq length || echo '?')
  log "GEM 23: Open PRs — ${OPEN_PRS}"
else
  warn "GEM 23: gh CLI not installed (skip PR count)"
fi

# GEM 24: Branch count
BRANCHES=$(git branch -a 2>/dev/null | wc -l | tr -d ' ')
log "GEM 24: Branches — ${BRANCHES}"

# GEM 25: Last commit message
LAST_COMMIT=$(git log -1 --format='%s' 2>/dev/null || echo 'unknown')
log "GEM 25: Last commit — ${LAST_COMMIT}"

# ──────────────────────────────────────────────────────────────────
head "GEM 26-33: Smart Suggestions"
# ──────────────────────────────────────────────────────────────────

# GEM 26: Suggest running tsc if errors > 0
if [ "$TS_ERRORS" -gt 0 ]; then
  warn "GEM 26: Fix TypeScript → cd packages/aix-core && npx tsc --noEmit 2>&1 | head -30"
else
  log "GEM 26: TypeScript clean — no action needed"
fi

# GEM 27: Suggest running evolve if no log today
EVOLVE_TODAY=$(find packages/aix-core -name 'evolution-metrics.json' -newer packages/aix-core/package.json 2>/dev/null | wc -l | tr -d ' ')
if [ "$EVOLVE_TODAY" -eq 0 ]; then
  warn "GEM 27: Run evolution today → cd packages/aix-core && npm run evolve"
else
  log "GEM 27: Evolution ran today"
fi

# GEM 28: Suggest simulation test if no sim log
if ! grep -q 'SIM_DONE' packages/aix-core/evolution-metrics.json 2>/dev/null; then
  warn "GEM 28: Run parallel sim test → npx tsx -e \"import {aix} from './packages/aix-core/src/aix'; aix.sim([{agentId:'test',task:'hello'}]).then(console.log)\""
else
  log "GEM 28: Sim test logged"
fi

# GEM 29: Check if .env exists
if [ ! -f .env ] && [ ! -f apps/studio/.env.local ]; then
  warn "GEM 29: No .env found → copy apps/studio/.env.example and fill keys"
else
  log "GEM 29: .env present"
fi

# GEM 30: API key detection
for KEY in OPENAI_API_KEY ANTHROPIC_API_KEY; do
  if [ -z "${!KEY}" ]; then
    warn "GEM 30: ${KEY} not set in environment"
  else
    log "GEM 30: ${KEY} detected"
  fi
done

# GEM 31: Check for new aix-core exports vs import sites
EXPORT_COUNT=$(grep -c '^export' packages/aix-core/src/index.ts 2>/dev/null || echo 0)
log "GEM 31: Public API surface — ${EXPORT_COUNT} export lines in index.ts"

# GEM 32: Detect stale node_modules
if [ packages/aix-core/package.json -nt packages/aix-core/node_modules/.package-lock.json ] 2>/dev/null; then
  warn "GEM 32: node_modules may be stale → cd packages/aix-core && npm install"
else
  log "GEM 32: node_modules up to date"
fi

# GEM 33: Final score
SCORE=$((100 - TS_ERRORS * 2 - CONSOLE_LOGS - TODOS / 2))
SCORE=$((SCORE < 0 ? 0 : SCORE > 100 ? 100 : SCORE))
echo ""
echo -e "${BOLD}🎯 AIX HEALTH SCORE: ${SCORE}/100${RESET}"
echo ""
echo "Next steps:"
echo "  bash scripts/daily-progress.sh    ← run this every morning"
echo "  cd packages/aix-core && npm run evolve"
echo "  cd apps/studio && npx tsx scripts/evolve-frontend.ts --dry-run"
echo ""
