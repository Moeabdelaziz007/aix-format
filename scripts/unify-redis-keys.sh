#!/bin/bash
# 🔑 REDIS KEY UNIFICATION SCRIPT
# Replaces all hardcoded Redis keys with KEYS.* helpers
# Part of Meta-Compression Layer 3: Strings → Constants

set -e

SRC_DIR="packages/aix-core/src"

echo "🔑 REDIS KEY UNIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backup before changes
echo "📦 Creating backup..."
cp -r "$SRC_DIR" "${SRC_DIR}.backup.$(date +%s)"

REPLACEMENTS=0

# Agent-scoped key replacements
echo "🔄 Replacing agent-scoped keys..."

# agent:${agentId}:sessions
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:sessions`/KEYS.agentSessions(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:skills (list)
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:skills`/KEYS.agentSkills(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:skill:${hash}
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:skill:\${hash}`/KEYS.agentSkillDetail(agentId, hash)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:expectation:${taskId}
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:expectation:\${taskId}`/KEYS.agentExpectation(agentId, taskId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:failure_stats
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:failure_stats`/KEYS.agentFailureStats(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:failures
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:failures`/KEYS.agentFailures(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:failure_patterns
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:failure_patterns`/KEYS.agentFailurePatterns(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:pattern:${hash} or ${patternHash} or ${failurePatternHash}
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:pattern:\${hash}`/KEYS.agentFailurePattern(agentId, hash)/g' {} \;
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:pattern:\${patternHash}`/KEYS.agentFailurePattern(agentId, patternHash)/g' {} \;
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:pattern:\${failurePatternHash}`/KEYS.agentFailurePattern(agentId, failurePatternHash)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 3))

# agent:${agentId}:recent_actions
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:recent_actions`/KEYS.agentRecentActions(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:channels:telegram
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:channels:telegram`/KEYS.agentChannelsTelegram(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:channels:whatsapp
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:channels:whatsapp`/KEYS.agentChannelsWhatsapp(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:curiosity_score
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:curiosity_score`/KEYS.agentCuriosityScore(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:action:${actionId}:usage
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:action:\${actionId}:usage`/KEYS.agentActionUsage(agentId, actionId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:explorations
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:explorations`/KEYS.agentExplorations(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:happiness_history
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:happiness_history`/KEYS.agentHappinessHistory(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:expectation_calibration
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:expectation_calibration`/KEYS.agentExpectationCalibration(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:pet_state
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:pet_state`/KEYS.agentPetState(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:model:${modelId}:metrics
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:model:\${modelId}:metrics`/KEYS.agentModelMetrics(agentId, modelId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:trust_score
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:trust_score`/KEYS.agentTrustScore(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:trust_history
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:trust_history`/KEYS.agentTrustHistory(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# agent:${agentId}:resonance_profile
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:resonance_profile`/KEYS.agentResonanceProfile(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# resonance:agent:${agentId}:task_types
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`resonance:agent:\${agentId}:task_types`/KEYS.agentResonanceTaskTypes(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# AIX-scoped key replacements
echo "🔄 Replacing AIX-scoped keys..."

# aix:action:result:${agentId} or ${this.agentId}
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:action:result:\${agentId}`/KEYS.aixActionResult(agentId)/g' {} \;
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:action:result:\${this\.agentId}`/KEYS.aixActionResult(this.agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 2))

# aix:events:${channel}
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:events:\${channel}`/KEYS.aixEvents(channel)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# aix:economics:ledger:${agentId}
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:economics:ledger:\${agentId}`/KEYS.aixEconomicsLedger(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# aix:economics:reinvestment:${agentId}
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:economics:reinvestment:\${agentId}`/KEYS.aixEconomicsReinvestment(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# aix:economics:stake:${agentId}
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:economics:stake:\${agentId}`/KEYS.aixEconomicsStake(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# aix:lock:agent:${agentId}
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:lock:agent:\${agentId}`/KEYS.aixLockAgent(agentId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# aix:model:${modelId}:stats
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:model:\${modelId}:stats`/KEYS.aixModelStats(modelId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# aix:model:${modelId}:calls
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:model:\${modelId}:calls`/KEYS.aixModelCalls(modelId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 1))

# aix:p2p:node:${nodeId} or ${this.nodeId}
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:p2p:node:\${nodeId}`/KEYS.aixP2PNode(nodeId)/g' {} \;
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:p2p:node:\${this\.nodeId}`/KEYS.aixP2PNode(this.nodeId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 2))

# aix:p2p:routing:${fromId}:${toId} or ${this.nodeId}:${targetId}
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:p2p:routing:\${fromId}:\${toId}`/KEYS.aixP2PRouting(fromId, toId)/g' {} \;
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:p2p:routing:\${this\.nodeId}:\${targetId}`/KEYS.aixP2PRouting(this.nodeId, targetId)/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 2))

# aix:swarm:topology
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  "s/'aix:swarm:topology'/KEYS.aixSwarmTopology()/g" {} \;
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:swarm:topology`/KEYS.aixSwarmTopology()/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 2))

# aix:swarm:nodes
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  "s/'aix:swarm:nodes'/KEYS.aixSwarmNodes()/g" {} \;
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:swarm:nodes`/KEYS.aixSwarmNodes()/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 2))

# aix:swarm:edges
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  "s/'aix:swarm:edges'/KEYS.aixSwarmEdges()/g" {} \;
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`aix:swarm:edges`/KEYS.aixSwarmEdges()/g' {} \;
REPLACEMENTS=$((REPLACEMENTS + 2))

echo ""
echo "✅ Applied $REPLACEMENTS replacement patterns"
echo ""

# Verify results
echo "🔍 Verifying results..."
REMAINING_AGENT=$(grep -rn "\`agent:" "$SRC_DIR" --include="*.ts" 2>/dev/null | grep -v "storage/keys.ts" | wc -l | tr -d ' ')
REMAINING_AIX=$(grep -rn "\`aix:" "$SRC_DIR" --include="*.ts" 2>/dev/null | grep -v "storage/keys.ts" | wc -l | tr -d ' ')

echo "Remaining hardcoded keys:"
echo "  - agent:* keys: $REMAINING_AGENT"
echo "  - aix:* keys: $REMAINING_AIX"
echo ""

if [ "$REMAINING_AGENT" -eq 0 ] && [ "$REMAINING_AIX" -eq 0 ]; then
  echo "🎉 SUCCESS! All hardcoded keys have been unified!"
else
  echo "⚠️  Some keys still need manual attention:"
  if [ "$REMAINING_AGENT" -gt 0 ]; then
    echo ""
    echo "Remaining agent:* keys:"
    grep -rn "\`agent:" "$SRC_DIR" --include="*.ts" 2>/dev/null | grep -v "storage/keys.ts" | head -5
  fi
  if [ "$REMAINING_AIX" -gt 0 ]; then
    echo ""
    echo "Remaining aix:* keys:"
    grep -rn "\`aix:" "$SRC_DIR" --include="*.ts" 2>/dev/null | grep -v "storage/keys.ts" | head -5
  fi
fi

echo ""
echo "📊 Compression complete!"
echo "Next: Review changes with 'git diff packages/aix-core/src'"

# Made with Moe Abdelaziz
