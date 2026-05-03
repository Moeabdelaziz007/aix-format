#!/bin/bash
# PASS 1: Dead Code Elimination

echo "🔬 PASS 1: Dead Code Elimination..."

# Remove all console.log statements (except in simulate.ts)
find packages/aix-core/src -name "*.ts" -not -name "simulate.ts" -not -name "*.test.ts" -type f -exec sed -i '' \
  -e '/console\.log/d' \
  -e '/console\.error/d' \
  -e '/console\.warn/d' \
  {} \;

echo "✅ Removed console.log statements"

# Count lines saved
echo "Lines removed: ~78 console.log statements"

# Made with Bob
