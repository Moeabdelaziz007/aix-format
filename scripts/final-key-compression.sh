#!/bin/bash
# 🔑 FINAL KEY COMPRESSION
# Completes the Redis key unification

set -e

SRC_DIR="packages/aix-core/src"

echo "🔑 FINAL KEY COMPRESSION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Replace remaining agent keys
find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:calibration`/KEYS.agentCalibration(agentId)/g' {} \;

find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:current_mood`/KEYS.agentCurrentMood(agentId)/g' {} \;

find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:freq`/KEYS.agentFreq(agentId)/g' {} \;

find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:exp`/KEYS.agentExp(agentId)/g' {} \;

find "$SRC_DIR" -name "*.ts" ! -name "keys.ts" -type f -exec sed -i '' \
  's/`agent:\${agentId}:last_activity`/KEYS.agentLastActivity(agentId)/g' {} \;

echo "✅ Compression complete!"
echo ""

# Verify
REMAINING=$(grep -rn '\`agent:' "$SRC_DIR" --include="*.ts" 2>/dev/null | grep -v "storage/keys.ts" | wc -l | tr -d ' ')
echo "Remaining hardcoded agent:* keys: $REMAINING"

if [ "$REMAINING" -eq 0 ]; then
  echo "🎉 SUCCESS! All agent:* keys unified!"
else
  echo "⚠️  Some keys still remain:"
  grep -rn '\`agent:' "$SRC_DIR" --include="*.ts" 2>/dev/null | grep -v "storage/keys.ts"
fi

# Made with Moe Abdelaziz
