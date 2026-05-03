#!/bin/bash
# Fix circular imports - PASS 2 of Clean Room Protocol

echo "🔬 PASS 2: Fixing circular imports..."

# Replace all imports from './index' with direct imports
find packages/aix-core/src -name "*.ts" -not -name "index.ts" -type f -exec sed -i '' \
  -e "s|import { kv, KEYS, TTL } from './index';|import { kv } from './storage/adapter';\nimport { KEYS, TTL } from './storage/keys';|g" \
  -e "s|import { kv, KEYS, NS } from './index';|import { kv } from './storage/adapter';\nimport { KEYS, NS } from './storage/keys';|g" \
  -e "s|import { kv, KEYS } from './index';|import { kv } from './storage/adapter';\nimport { KEYS } from './storage/keys';|g" \
  -e "s|import { kv } from './index';|import { kv } from './storage/adapter';|g" \
  -e "s|import { kv, KEYS, LearningEngine } from './index';|import { kv } from './storage/adapter';\nimport { KEYS } from './storage/keys';\nimport { LearningEngine } from './learning';|g" \
  {} \;

echo "✅ Fixed circular imports in all files"
echo "Files affected:"
grep -l "from './storage/adapter'" packages/aix-core/src/*.ts | wc -l

# Made with Bob
