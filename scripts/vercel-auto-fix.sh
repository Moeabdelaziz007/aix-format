#!/bin/bash
# 🚀 VERCEL AUTO-FIX META-LOOP
# Automated build → detect errors → fix → rebuild until success
# Usage: ./scripts/vercel-auto-fix.sh [--max-iterations 10]

set -euo pipefail

# ── Configuration ──────────────────────────────────────────
MAX_ITERATIONS=10
CURRENT_ITERATION=0
BUILD_LOG="vercel-build-$(date +%Y%m%d-%H%M%S).log"
FIX_LOG="auto-fixes-$(date +%Y%m%d-%H%M%S).log"
SRC_DIR="apps/studio/src"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Parse Arguments ────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --max-iterations)
      MAX_ITERATIONS="$2"
      shift 2
      ;;
  esac
done

# ── Logging ────────────────────────────────────────────────
log() { echo -e "${BLUE}[META]${NC} $1" | tee -a "$FIX_LOG"; }
success() { echo -e "${GREEN}[✓]${NC} $1" | tee -a "$FIX_LOG"; }
warn() { echo -e "${YELLOW}[!]${NC} $1" | tee -a "$FIX_LOG"; }
error() { echo -e "${RED}[✗]${NC} $1" | tee -a "$FIX_LOG"; }
fix() { echo -e "${PURPLE}[FIX]${NC} $1" | tee -a "$FIX_LOG"; }

# ── Build Function ─────────────────────────────────────────
run_build() {
  log "🔨 Running build (iteration $CURRENT_ITERATION)..."
  
  cd apps/studio
  
  # Clean build
  rm -rf .next
  
  # Run build and capture output
  if pnpm build > "$BUILD_LOG" 2>&1; then
    success "✅ BUILD SUCCESSFUL!"
    return 0
  else
    error "❌ BUILD FAILED"
    return 1
  fi
}

# ── Error Pattern Detectors ────────────────────────────────

# Pattern 1: 'use client' directive position
detect_use_client_errors() {
  log "🔍 Checking for 'use client' directive errors..."
  
  local errors=$(grep -n "The \"use client\" directive must be placed before" "$BUILD_LOG" || true)
  
  if [ -n "$errors" ]; then
    warn "Found 'use client' position errors"
    
    # Extract file paths
    grep "use client" "$BUILD_LOG" | grep -oE "/[^:]+\.tsx" | while read file; do
      local full_path="apps/studio$file"
      
      if [ -f "$full_path" ]; then
        fix "Fixing $file"
        
        # Read first 5 lines
        local first_line=$(head -1 "$full_path")
        
        if [[ ! "$first_line" =~ ^[\'\"]\s*use\ client ]]; then
          # Move 'use client' to top
          sed -i '' "/^['\"]use client['\"];/d" "$full_path"
          sed -i '' "1i\\
'use client';\\
" "$full_path"
          
          success "  Fixed: $file"
        fi
      fi
    done
    
    return 1
  fi
  
  return 0
}

# Pattern 2: Module not found
detect_missing_modules() {
  log "🔍 Checking for missing modules..."
  
  local missing=$(grep "Module not found" "$BUILD_LOG" || true)
  
  if [ -n "$missing" ]; then
    warn "Found missing modules"
    
    # Extract module names
    grep "Can't resolve" "$BUILD_LOG" | grep -oE "'[^']+'" | tr -d "'" | sort -u | while read module; do
      warn "  Missing: $module"
      
      # Try to install
      case "$module" in
        "@rainbow-me/rainbowkit")
          fix "Installing @rainbow-me/rainbowkit..."
          pnpm add @rainbow-me/rainbowkit wagmi viem @tanstack/react-query
          ;;
        "next-auth")
          fix "Installing next-auth..."
          pnpm add next-auth
          ;;
        *)
          warn "  Unknown module: $module (skipping)"
          ;;
      esac
    done
    
    return 1
  fi
  
  return 0
}

# Pattern 3: Import/Export mismatches
detect_import_export_errors() {
  log "🔍 Checking for import/export errors..."
  
  local errors=$(grep -E "export.*does not exist|has no exported member" "$BUILD_LOG" || true)
  
  if [ -n "$errors" ]; then
    warn "Found import/export mismatches"
    
    # Common fix: change default exports to named exports
    grep -oE "from '[^']+'" "$BUILD_LOG" | grep -oE "'[^']+'" | tr -d "'" | sort -u | while read path; do
      local file="apps/studio/src/$path"
      
      if [ -f "$file" ]; then
        # Check if file uses 'export function' but imported as default
        if grep -q "^export function" "$file" && ! grep -q "^export default" "$file"; then
          fix "  $path uses named exports, not default"
          # This needs manual intervention - log it
          warn "  Manual fix needed: Update imports in files using $path"
        fi
      fi
    done
    
    return 1
  fi
  
  return 0
}

# Pattern 4: TypeScript errors
detect_typescript_errors() {
  log "🔍 Checking for TypeScript errors..."
  
  local errors=$(grep -E "error TS[0-9]+" "$BUILD_LOG" || true)
  
  if [ -n "$errors" ]; then
    warn "Found TypeScript errors"
    
    # Count errors
    local count=$(echo "$errors" | wc -l | tr -d ' ')
    warn "  Total TS errors: $count"
    
    # Show first 5
    echo "$errors" | head -5 | while read line; do
      warn "  $line"
    done
    
    # Common fixes
    if grep -q "Cannot find name" "$BUILD_LOG"; then
      fix "Adding missing type imports..."
      # This is complex - would need AI to fix properly
      warn "  Manual intervention needed for type errors"
    fi
    
    return 1
  fi
  
  return 0
}

# Pattern 5: Syntax errors
detect_syntax_errors() {
  log "🔍 Checking for syntax errors..."
  
  local errors=$(grep -E "SyntaxError|Unexpected token" "$BUILD_LOG" || true)
  
  if [ -n "$errors" ]; then
    error "Found syntax errors"
    
    # Extract file and line
    echo "$errors" | grep -oE "[^:]+:[0-9]+" | while read location; do
      error "  $location"
    done
    
    return 1
  fi
  
  return 0
}

# Pattern 6: Environment variable errors
detect_env_errors() {
  log "🔍 Checking for environment variable errors..."
  
  local errors=$(grep -E "RangeError.*env|Failed to load env" "$BUILD_LOG" || true)
  
  if [ -n "$errors" ]; then
    warn "Found environment variable errors"
    
    # Check for .env.production
    if [ -f "apps/studio/.env.production" ]; then
      fix "Removing problematic .env.production"
      rm -f "apps/studio/.env.production"
      success "  Removed .env.production"
    fi
    
    return 1
  fi
  
  return 0
}

# ── Auto-Fix Strategies ────────────────────────────────────

auto_fix_all() {
  log "🔧 Running auto-fix strategies..."
  
  local fixed=0
  
  # Strategy 1: Fix 'use client' positions
  if detect_use_client_errors; then
    ((fixed++))
  fi
  
  # Strategy 2: Install missing modules
  if detect_missing_modules; then
    ((fixed++))
  fi
  
  # Strategy 3: Fix import/export mismatches
  if detect_import_export_errors; then
    ((fixed++))
  fi
  
  # Strategy 4: Fix TypeScript errors
  if detect_typescript_errors; then
    ((fixed++))
  fi
  
  # Strategy 5: Fix syntax errors
  if detect_syntax_errors; then
    ((fixed++))
  fi
  
  # Strategy 6: Fix environment errors
  if detect_env_errors; then
    ((fixed++))
  fi
  
  if [ $fixed -gt 0 ]; then
    success "Applied $fixed auto-fixes"
    return 1  # Need to rebuild
  else
    log "No auto-fixes needed"
    return 0
  fi
}

# ── Deploy to Vercel ───────────────────────────────────────

deploy_to_vercel() {
  log "🚀 Deploying to Vercel..."
  
  # Check if vercel CLI is installed
  if ! command -v vercel &> /dev/null; then
    error "Vercel CLI not installed. Install with: npm i -g vercel"
    return 1
  fi
  
  # Deploy
  if vercel --prod --yes > vercel-deploy.log 2>&1; then
    success "✅ DEPLOYED TO VERCEL!"
    
    # Extract URL
    local url=$(grep -oE "https://[^[:space:]]+" vercel-deploy.log | head -1)
    success "🌐 URL: $url"
    
    return 0
  else
    error "❌ VERCEL DEPLOYMENT FAILED"
    cat vercel-deploy.log
    return 1
  fi
}

# ── Main Meta-Loop ─────────────────────────────────────────

meta_loop() {
  log "═══════════════════════════════════════════════════════"
  log "🧬 META-LOOP ITERATION $CURRENT_ITERATION / $MAX_ITERATIONS"
  log "═══════════════════════════════════════════════════════"
  
  # Step 1: Try to build
  if run_build; then
    success "🎉 Build successful!"
    
    # Step 2: Deploy to Vercel
    if deploy_to_vercel; then
      success "🎉 Deployment successful!"
      return 0
    else
      error "Deployment failed, but build was successful"
      return 1
    fi
  else
    error "Build failed"
    
    # Step 3: Analyze errors and auto-fix
    auto_fix_all
    
    # Step 4: Continue loop
    return 1
  fi
}

# ── Statistics ─────────────────────────────────────────────

show_final_stats() {
  log ""
  log "═══════════════════════════════════════════════════════"
  log "📊 FINAL STATISTICS"
  log "═══════════════════════════════════════════════════════"
  log "Total Iterations: $CURRENT_ITERATION"
  log "Build Log: $BUILD_LOG"
  log "Fix Log: $FIX_LOG"
  
  if [ -f "vercel-deploy.log" ]; then
    log "Deploy Log: vercel-deploy.log"
  fi
  
  log "═══════════════════════════════════════════════════════"
}

# ── Main Execution ─────────────────────────────────────────

main() {
  log "🚀 Starting Vercel Auto-Fix Meta-Loop"
  log "Max Iterations: $MAX_ITERATIONS"
  log ""
  
  while [ $CURRENT_ITERATION -lt $MAX_ITERATIONS ]; do
    CURRENT_ITERATION=$((CURRENT_ITERATION + 1))
    
    if meta_loop; then
      success "🎉 SUCCESS! Build and deployment complete."
      break
    fi
    
    if [ $CURRENT_ITERATION -lt $MAX_ITERATIONS ]; then
      log "Waiting 3 seconds before next iteration..."
      sleep 3
    fi
  done
  
  if [ $CURRENT_ITERATION -eq $MAX_ITERATIONS ]; then
    error "❌ Max iterations reached. Manual intervention required."
    error "Check logs for details:"
    error "  - Build: $BUILD_LOG"
    error "  - Fixes: $FIX_LOG"
  fi
  
  show_final_stats
}

main "$@"

# Made with Moe Abdelaziz
