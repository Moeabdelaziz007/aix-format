#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 AIX Webpack Auto-Fix${NC}"
echo "======================="
echo ""

# Store original directory
ORIGINAL_DIR=$(pwd)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$WORKSPACE_ROOT/apps/studio"

# Function to print status
print_status() {
  echo -e "${BLUE}$1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Step 1: Clean build artifacts
print_status "1️⃣ Cleaning build artifacts..."
rm -rf .next .turbo node_modules/.cache 2>/dev/null || true
print_success "Cleaned .next, .turbo, and cache"

# Step 2: Check configuration files
print_status "2️⃣ Checking configuration..."

# Check next.config.ts
if ! grep -q '"@aix-format/aix-zkkyc"' next.config.ts; then
  print_warning "transpilePackages may need updating in next.config.ts"
  echo "Expected: [\"@aix-format/aix-zkkyc\", \"@aix-format/mcp-gateway\"]"
fi

# Check tsconfig.json
if ! grep -q '"jsx": "preserve"' tsconfig.json; then
  print_warning "tsconfig.json may need jsx: preserve"
fi

# Check package.json
if ! grep -q '"next":' package.json; then
  print_error "package.json missing Next.js dependency!"
  exit 1
fi

print_success "Configuration files checked"

# Step 3: Check for common code issues
print_status "3️⃣ Scanning for common issues..."

# Check for invalid displayName
INVALID_DISPLAYNAME=$(grep -r "function\.displayName" src/ 2>/dev/null | wc -l || echo "0")
if [ "$INVALID_DISPLAYNAME" -gt 0 ]; then
  print_warning "Found $INVALID_DISPLAYNAME files with invalid function.displayName"
  echo "Run: find src -type f -name '*.tsx' -o -name '*.ts' | xargs sed -i '' '/function\.displayName/d'"
fi

# Check for 'use client' not on line 1
USE_CLIENT_ISSUES=$(find src -name "*.tsx" -exec grep -l "use client" {} \; | while read file; do
  if [ "$(head -n 1 "$file" | grep -c "use client")" -eq 0 ]; then
    echo "$file"
  fi
done | wc -l)

if [ "$USE_CLIENT_ISSUES" -gt 0 ]; then
  print_warning "Found $USE_CLIENT_ISSUES files with 'use client' not on line 1"
fi

# Check for React.memo on page.tsx files
MEMO_ON_PAGES=$(find src/app -name "page.tsx" -exec grep -l "React.memo" {} \; | wc -l || echo "0")
if [ "$MEMO_ON_PAGES" -gt 0 ]; then
  print_warning "Found $MEMO_ON_PAGES page.tsx files with React.memo (breaks Next.js)"
fi

print_success "Code scan complete"

# Step 4: Reinstall dependencies
print_status "4️⃣ Reinstalling dependencies..."
cd "$WORKSPACE_ROOT"

if ! pnpm install; then
  print_error "pnpm install failed!"
  exit 1
fi

print_success "Dependencies installed"

# Step 5: Verify critical packages
print_status "5️⃣ Verifying critical packages..."
cd "$WORKSPACE_ROOT/apps/studio"

MISSING_PACKAGES=()

if [ ! -d "node_modules/@rainbow-me/rainbowkit" ]; then
  MISSING_PACKAGES+=("@rainbow-me/rainbowkit")
fi

if [ ! -d "node_modules/wagmi" ]; then
  MISSING_PACKAGES+=("wagmi")
fi

if [ ! -d "node_modules/next" ]; then
  MISSING_PACKAGES+=("next")
fi

if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
  print_error "Missing packages: ${MISSING_PACKAGES[*]}"
  print_warning "Try: cd $WORKSPACE_ROOT && pnpm install --force"
  exit 1
fi

print_success "All critical packages present"

# Step 6: Check for duplicate React
print_status "6️⃣ Checking for duplicate React versions..."
REACT_COUNT=$(pnpm list react --depth=0 2>/dev/null | grep -c "react@" || echo "1")

if [ "$REACT_COUNT" -gt 1 ]; then
  print_warning "Multiple React versions detected"
  echo "Run: pnpm dedupe"
fi

print_success "React version check complete"

# Step 7: Test build
print_status "7️⃣ Testing build..."
echo ""

if pnpm build; then
  echo ""
  print_success "🎉 Build successful!"
  echo ""
  echo "Next steps:"
  echo "  1. Test locally: pnpm dev"
  echo "  2. Deploy: ./scripts/vercel-auto-fix.sh"
  echo ""
else
  echo ""
  print_error "Build failed!"
  echo ""
  echo "Troubleshooting steps:"
  echo "  1. Check build.log for errors"
  echo "  2. Review docs/WEBPACK_FIXES.md"
  echo "  3. Try: rm -rf node_modules && pnpm install"
  echo ""
  exit 1
fi

# Return to original directory
cd "$ORIGINAL_DIR"

# Made with Moe Abdelaziz
