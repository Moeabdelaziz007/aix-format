#!/bin/bash

###############################################################################
# SwarmRouter Synchronization Verification Script
#
# Purpose: Ensures TypeScript SwarmRouter stays synchronized with Go implementation
# Triggers: Run on every commit touching swarm_router.go OR SwarmRouter.ts
# Exit Codes:
#   0 - All sync tests passed
#   1 - Sync tests failed or divergence detected
#
# Usage:
#   ./scripts/sync-swarm-router.sh
#   ./scripts/sync-swarm-router.sh --verbose
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VERBOSE=false
if [[ "$1" == "--verbose" ]]; then
    VERBOSE=true
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         SwarmRouter Synchronization Verification              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if required files exist
GO_FILE="swarm_router.go"
TS_FILE="packages/aix-core/src/SwarmRouter.ts"
TEST_FILE="tests/swarm-router-sync.test.ts"

if [[ ! -f "$GO_FILE" ]]; then
    echo -e "${RED}✗ Error: $GO_FILE not found${NC}"
    exit 1
fi

if [[ ! -f "$TS_FILE" ]]; then
    echo -e "${RED}✗ Error: $TS_FILE not found${NC}"
    exit 1
fi

if [[ ! -f "$TEST_FILE" ]]; then
    echo -e "${RED}✗ Error: $TEST_FILE not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All required files found${NC}"
echo ""

# Function to extract key metrics from implementations
check_implementation_features() {
    echo -e "${BLUE}[1/4] Checking implementation features...${NC}"
    
    # Check Go implementation
    GO_HAS_BREAKER=$(grep -c "CircuitBreaker" "$GO_FILE" || echo "0")
    GO_HAS_METRICS=$(grep -c "RouterMetrics" "$GO_FILE" || echo "0")
    GO_FALLBACK_LIMIT=$(grep -c "i < 4" "$GO_FILE" || echo "0")
    
    # Check TypeScript implementation
    TS_HAS_BREAKER=$(grep -c "CircuitBreaker" "$TS_FILE" || echo "0")
    TS_HAS_METRICS=$(grep -c "RouterMetrics" "$TS_FILE" || echo "0")
    TS_FALLBACK_LIMIT=$(grep -c "slice(1, 4)" "$TS_FILE" || echo "0")
    
    FEATURE_ISSUES=0
    
    if [[ "$GO_HAS_BREAKER" -gt 0 && "$TS_HAS_BREAKER" -eq 0 ]]; then
        echo -e "${RED}  ✗ CircuitBreaker missing in TypeScript${NC}"
        FEATURE_ISSUES=$((FEATURE_ISSUES + 1))
    else
        echo -e "${GREEN}  ✓ CircuitBreaker present in both implementations${NC}"
    fi
    
    if [[ "$GO_HAS_METRICS" -gt 0 && "$TS_HAS_METRICS" -eq 0 ]]; then
        echo -e "${RED}  ✗ RouterMetrics missing in TypeScript${NC}"
        FEATURE_ISSUES=$((FEATURE_ISSUES + 1))
    else
        echo -e "${GREEN}  ✓ RouterMetrics present in both implementations${NC}"
    fi
    
    if [[ "$GO_FALLBACK_LIMIT" -gt 0 && "$TS_FALLBACK_LIMIT" -eq 0 ]]; then
        echo -e "${YELLOW}  ⚠ Fallback chain limit may differ${NC}"
    else
        echo -e "${GREEN}  ✓ Fallback chain limit consistent${NC}"
    fi
    
    echo ""
    return $FEATURE_ISSUES
}

# Function to check circuit breaker thresholds
check_breaker_thresholds() {
    echo -e "${BLUE}[2/4] Checking circuit breaker thresholds...${NC}"
    
    # Extract thresholds from Go
    GO_FAILURE_THRESHOLD=$(grep -oP "NewCircuitBreaker\(\K\d+" "$GO_FILE" | head -1 || echo "0")
    GO_SUCCESS_THRESHOLD=$(grep -oP "NewCircuitBreaker\(\d+,\s*\K\d+" "$GO_FILE" | head -1 || echo "0")
    
    # Extract thresholds from TypeScript
    TS_FAILURE_THRESHOLD=$(grep -oP "new CircuitBreaker\(\K\d+" "$TS_FILE" | head -1 || echo "0")
    TS_SUCCESS_THRESHOLD=$(grep -oP "new CircuitBreaker\(\d+,\s*\K\d+" "$TS_FILE" | head -1 || echo "0")
    
    THRESHOLD_ISSUES=0
    
    if [[ "$GO_FAILURE_THRESHOLD" != "$TS_FAILURE_THRESHOLD" ]]; then
        echo -e "${RED}  ✗ Failure threshold mismatch: Go=$GO_FAILURE_THRESHOLD, TS=$TS_FAILURE_THRESHOLD${NC}"
        THRESHOLD_ISSUES=$((THRESHOLD_ISSUES + 1))
    else
        echo -e "${GREEN}  ✓ Failure threshold matches: $GO_FAILURE_THRESHOLD${NC}"
    fi
    
    if [[ "$GO_SUCCESS_THRESHOLD" != "$TS_SUCCESS_THRESHOLD" ]]; then
        echo -e "${RED}  ✗ Success threshold mismatch: Go=$GO_SUCCESS_THRESHOLD, TS=$TS_SUCCESS_THRESHOLD${NC}"
        THRESHOLD_ISSUES=$((THRESHOLD_ISSUES + 1))
    else
        echo -e "${GREEN}  ✓ Success threshold matches: $GO_SUCCESS_THRESHOLD${NC}"
    fi
    
    echo ""
    return $THRESHOLD_ISSUES
}

# Function to run TypeScript sync tests
run_sync_tests() {
    echo -e "${BLUE}[3/4] Running synchronization test suite...${NC}"
    
    # Check if npm test command exists
    if ! command -v npm &> /dev/null; then
        echo -e "${YELLOW}  ⚠ npm not found, skipping test execution${NC}"
        echo ""
        return 0
    fi
    
    # Run the specific sync test file
    if $VERBOSE; then
        npm test -- tests/swarm-router-sync.test.ts
    else
        npm test -- tests/swarm-router-sync.test.ts --reporter=dot 2>&1 | grep -E "(PASS|FAIL|✓|✗|Error)" || true
    fi
    
    TEST_EXIT_CODE=${PIPESTATUS[0]}
    
    if [[ $TEST_EXIT_CODE -eq 0 ]]; then
        echo -e "${GREEN}  ✓ All synchronization tests passed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}  ✗ Synchronization tests failed${NC}"
        echo ""
        return 1
    fi
}

# Function to check for recent changes
check_recent_changes() {
    echo -e "${BLUE}[4/4] Checking for recent changes...${NC}"
    
    if ! command -v git &> /dev/null; then
        echo -e "${YELLOW}  ⚠ git not found, skipping change detection${NC}"
        echo ""
        return 0
    fi
    
    # Check if files were modified in last commit
    GO_MODIFIED=$(git diff HEAD~1 HEAD --name-only 2>/dev/null | grep -c "$GO_FILE" || echo "0")
    TS_MODIFIED=$(git diff HEAD~1 HEAD --name-only 2>/dev/null | grep -c "$TS_FILE" || echo "0")
    
    if [[ "$GO_MODIFIED" -gt 0 && "$TS_MODIFIED" -eq 0 ]]; then
        echo -e "${YELLOW}  ⚠ Warning: Go implementation modified but TypeScript not updated${NC}"
        echo -e "${YELLOW}    Consider reviewing TypeScript implementation for sync${NC}"
    elif [[ "$TS_MODIFIED" -gt 0 && "$GO_MODIFIED" -eq 0 ]]; then
        echo -e "${YELLOW}  ⚠ Warning: TypeScript implementation modified but Go not updated${NC}"
        echo -e "${YELLOW}    Consider reviewing Go implementation for sync${NC}"
    elif [[ "$GO_MODIFIED" -gt 0 && "$TS_MODIFIED" -gt 0 ]]; then
        echo -e "${GREEN}  ✓ Both implementations modified in sync${NC}"
    else
        echo -e "${GREEN}  ✓ No recent changes detected${NC}"
    fi
    
    echo ""
}

# Main execution
TOTAL_ISSUES=0

check_implementation_features
TOTAL_ISSUES=$((TOTAL_ISSUES + $?))

check_breaker_thresholds
TOTAL_ISSUES=$((TOTAL_ISSUES + $?))

run_sync_tests
TOTAL_ISSUES=$((TOTAL_ISSUES + $?))

check_recent_changes

# Final summary
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
if [[ $TOTAL_ISSUES -eq 0 ]]; then
    echo -e "${GREEN}✓ SYNC VERIFICATION PASSED${NC}"
    echo -e "${GREEN}  SwarmRouter implementations are synchronized${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    exit 0
else
    echo -e "${RED}✗ SYNC VERIFICATION FAILED${NC}"
    echo -e "${RED}  Found $TOTAL_ISSUES issue(s) requiring attention${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Action Required:${NC}"
    echo "  1. Review the divergences listed above"
    echo "  2. Update TypeScript implementation to match Go behavior"
    echo "  3. Run this script again to verify sync"
    echo ""
    exit 1
fi

# Made with Bob
