#!/bin/bash
# PWA Validation Script - Tests Voice-First Deploy Architecture

set -e

echo "🎤 AIX Voice-First Deploy Architecture Validation"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

# Test function
test_file() {
  local file=$1
  local description=$2
  
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $description"
    ((PASS++))
    return 0
  else
    echo -e "${RED}✗${NC} $description"
    ((FAIL++))
    return 1
  fi
}

test_content() {
  local file=$1
  local pattern=$2
  local description=$3
  
  if [ -f "$file" ] && grep -q "$pattern" "$file"; then
    echo -e "${GREEN}✓${NC} $description"
    ((PASS++))
    return 0
  else
    echo -e "${RED}✗${NC} $description"
    ((FAIL++))
    return 1
  fi
}

test_warning() {
  local file=$1
  local description=$2
  
  if [ ! -f "$file" ]; then
    echo -e "${YELLOW}⚠${NC} $description"
    ((WARN++))
    return 1
  fi
  return 0
}

echo "📱 PWA Infrastructure Tests"
echo "----------------------------"

# Test PWA files
test_file "apps/studio/public/manifest.json" "PWA manifest exists"
test_file "apps/studio/public/sw.js" "Service Worker exists"
test_file "docs/VOICE_FIRST_DEPLOY_ARCHITECTURE.md" "Architecture documentation exists"

# Test manifest content
test_content "apps/studio/public/manifest.json" '"name"' "Manifest has name field"
test_content "apps/studio/public/manifest.json" '"icons"' "Manifest has icons array"
test_content "apps/studio/public/manifest.json" '"start_url"' "Manifest has start_url"
test_content "apps/studio/public/manifest.json" '"display"' "Manifest has display mode"

# Test service worker content
test_content "apps/studio/public/sw.js" "addEventListener.*install" "SW has install event"
test_content "apps/studio/public/sw.js" "addEventListener.*activate" "SW has activate event"
test_content "apps/studio/public/sw.js" "addEventListener.*fetch" "SW has fetch event"
test_content "apps/studio/public/sw.js" "addEventListener.*sync" "SW has background sync"
test_content "apps/studio/public/sw.js" "addEventListener.*push" "SW has push notifications"
test_content "apps/studio/public/sw.js" "caches.open" "SW uses Cache API"

echo ""
echo "🎤 Voice Integration Tests"
echo "---------------------------"

# Test voice components
test_file "apps/studio/src/components/providers/VoiceCommandProvider.tsx" "VoiceCommandProvider exists"
test_file "apps/studio/src/hooks/useVoiceCommands.ts" "useVoiceCommands hook exists"
test_file "apps/studio/src/hooks/useDeployment.ts" "useDeployment hook exists"

# Test voice patterns
test_content "apps/studio/src/hooks/useVoiceCommands.ts" "parseIntent" "Intent parser exists"
test_content "apps/studio/src/hooks/useVoiceCommands.ts" "open_deploy" "Deploy intent exists"
test_content "apps/studio/src/hooks/useVoiceCommands.ts" "open_voice_wizard" "Voice wizard intent exists"

echo ""
echo "🐾 Pet Mini Apps Tests"
echo "-----------------------"

# Test pet infrastructure
test_file "packages/aix-core/src/pet-mini-apps/index.ts" "Pet mini apps base exists"
test_file "packages/aix-core/src/pet-mini-apps/chrono.ts" "Chrono pet exists"
test_file "docs/AIX_PET_MINI_APPS.md" "Pet documentation exists"

# Test pet patterns
test_content "packages/aix-core/src/pet-mini-apps/index.ts" "PetAgent" "PetAgent interface exists"
test_content "packages/aix-core/src/pet-mini-apps/chrono.ts" "ChronoPet" "ChronoPet class exists"

echo ""
echo "🚀 Deployment Tests"
echo "-------------------"

# Test deployment infrastructure
test_file "apps/studio/src/app/workspace/[agentId]/deploy/page.tsx" "Deploy page exists"
test_content "apps/studio/src/app/workspace/[agentId]/deploy/page.tsx" "handleDeploy" "Deploy function exists"

echo ""
echo "⚠️  Missing Components (To Be Implemented)"
echo "-------------------------------------------"

# Warn about missing components
test_warning "apps/studio/src/app/api/voice-wizard/extract/route.ts" "Voice extraction API (Phase 2)"
test_warning "apps/studio/src/app/api/voice-wizard/generate-manifest/route.ts" "Manifest generator API (Phase 2)"
test_warning "apps/studio/src/app/pets/[petId]/install/page.tsx" "Pet install page (Phase 3)"
test_warning "apps/studio/src/lib/pwa-installer.ts" "PWA installer utility (Phase 2)"
test_warning "apps/studio/src/hooks/usePWA.ts" "PWA React hook (Phase 2)"

echo ""
echo "📊 Architecture Validation"
echo "--------------------------"

# Count lines of code
if [ -f "apps/studio/public/manifest.json" ]; then
  MANIFEST_LINES=$(wc -l < "apps/studio/public/manifest.json" | tr -d ' ')
  echo -e "${GREEN}✓${NC} manifest.json: $MANIFEST_LINES lines"
fi

if [ -f "apps/studio/public/sw.js" ]; then
  SW_LINES=$(wc -l < "apps/studio/public/sw.js" | tr -d ' ')
  echo -e "${GREEN}✓${NC} sw.js: $SW_LINES lines"
fi

if [ -f "docs/VOICE_FIRST_DEPLOY_ARCHITECTURE.md" ]; then
  DOC_LINES=$(wc -l < "docs/VOICE_FIRST_DEPLOY_ARCHITECTURE.md" | tr -d ' ')
  echo -e "${GREEN}✓${NC} Architecture doc: $DOC_LINES lines"
fi

echo ""
echo "🔍 Pattern Analysis"
echo "-------------------"

# Count voice/deploy patterns
VOICE_PATTERNS=$(find apps/studio/src -name "*.tsx" -o -name "*.ts" | xargs grep -l "voice\|Voice" 2>/dev/null | wc -l | tr -d ' ')
DEPLOY_PATTERNS=$(find apps/studio/src -name "*.tsx" -o -name "*.ts" | xargs grep -l "deploy\|Deploy" 2>/dev/null | wc -l | tr -d ' ')

echo "Voice patterns found: $VOICE_PATTERNS files"
echo "Deploy patterns found: $DEPLOY_PATTERNS files"

echo ""
echo "📈 Test Summary"
echo "==============="
echo -e "${GREEN}Passed:${NC} $PASS"
echo -e "${RED}Failed:${NC} $FAIL"
echo -e "${YELLOW}Warnings:${NC} $WARN"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ All critical tests passed!${NC}"
  echo ""
  echo "🎯 Next Steps:"
  echo "1. Implement voice extraction API (Phase 2)"
  echo "2. Create dynamic manifest generator"
  echo "3. Build install flow UI"
  echo "4. Test E2E voice → deploy flow"
  exit 0
else
  echo -e "${RED}✗ Some tests failed. Review the output above.${NC}"
  exit 1
fi

# Made with Bob
