#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Dead Code Archaeology Scanner — ماسح الكود الميت الأثري
# ═══════════════════════════════════════════════════════════════════════════
#
# Purpose | الغرض:
# Identifies orphaned exports that are never imported or used anywhere in the
# codebase. Primary cause of agent degradation after 30 days in production.
#
# يحدد الصادرات المهجورة التي لم يتم استيرادها أو استخدامها في أي مكان في
# قاعدة الكود. السبب الرئيسي لتدهور الوكيل بعد 30 يومًا في الإنتاج.
#
# Author: Mohamed Abdelaziz - AMRIKYY AI Solutions
# License: Apache-2.0
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# Configuration | التكوين
# ═══════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_DIR="$PROJECT_ROOT/.generated"
REPORT_FILE="$REPORT_DIR/dead-code-report.md"
JSON_REPORT="$REPORT_DIR/dead-code-report.json"
CACHE_DIR="$PROJECT_ROOT/.cache/dead-code"

# Severity thresholds | عتبات الخطورة
CRITICAL_DAYS=90        # Days since export with zero usage
HIGH_RISK_USAGE=2       # Max usage count for high risk
BURST_COMMIT_COUNT=5    # Commits in burst window
BURST_WINDOW_HOURS=2    # Time window for burst detection

# Colors for terminal output | ألوان لإخراج الطرفية
RED='\033[0;31m'
YELLOW='\033[1;33m'
ORANGE='\033[0;33m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Emojis for severity | رموز تعبيرية للخطورة
CRITICAL_EMOJI="☠️"
HIGH_EMOJI="⚠️"
MEDIUM_EMOJI="🔶"
LOW_EMOJI="📊"
SUCCESS_EMOJI="✅"

# ═══════════════════════════════════════════════════════════════════════════
# Utility Functions | وظائف المساعدة
# ═══════════════════════════════════════════════════════════════════════════

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}${SUCCESS_EMOJI} $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed | التحقق من تثبيت الأدوات المطلوبة
check_dependencies() {
    local missing_deps=()
    
    if ! command -v rg &> /dev/null; then
        missing_deps+=("ripgrep (rg)")
    fi
    
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing required dependencies:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        echo "Install with:"
        echo "  brew install ripgrep jq  # macOS"
        echo "  apt-get install ripgrep jq  # Ubuntu/Debian"
        exit 1
    fi
}

# Create necessary directories | إنشاء الدلائل الضرورية
setup_directories() {
    mkdir -p "$REPORT_DIR"
    mkdir -p "$CACHE_DIR"
}

# ═══════════════════════════════════════════════════════════════════════════
# Export Detection | كشف الصادرات
# ═══════════════════════════════════════════════════════════════════════════

# Find all package entry points | العثور على جميع نقاط دخول الحزم
find_entry_points() {
    log_info "البحث عن نقاط دخول الحزم..."
    log_info "Finding package entry points..."
    
    local entry_points=()
    
    # Main entry points
    entry_points+=("$PROJECT_ROOT/packages/aix-core/src/index.ts")
    entry_points+=("$PROJECT_ROOT/packages/aix-types/index.d.ts")
    
    # Find all other index.ts files in packages
    while IFS= read -r file; do
        entry_points+=("$file")
    done < <(find "$PROJECT_ROOT/packages" -name "index.ts" -o -name "index.d.ts" 2>/dev/null)
    
    # Remove duplicates
    printf '%s\n' "${entry_points[@]}" | sort -u
}

# Extract exports from a file | استخراج الصادرات من ملف
extract_exports() {
    local file="$1"
    local exports=()
    
    if [ ! -f "$file" ]; then
        return
    fi
    
    # Pattern 1: export function functionName
    while IFS= read -r line; do
        if [[ $line =~ ^export[[:space:]]+function[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*) ]]; then
            exports+=("${BASH_REMATCH[1]}:function:$file")
        fi
    done < "$file"
    
    # Pattern 2: export const constantName
    while IFS= read -r line; do
        if [[ $line =~ ^export[[:space:]]+const[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*) ]]; then
            exports+=("${BASH_REMATCH[1]}:const:$file")
        fi
    done < "$file"
    
    # Pattern 3: export class ClassName
    while IFS= read -r line; do
        if [[ $line =~ ^export[[:space:]]+class[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*) ]]; then
            exports+=("${BASH_REMATCH[1]}:class:$file")
        fi
    done < "$file"
    
    # Pattern 4: export type TypeName
    while IFS= read -r line; do
        if [[ $line =~ ^export[[:space:]]+type[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*) ]]; then
            exports+=("${BASH_REMATCH[1]}:type:$file")
        fi
    done < "$file"
    
    # Pattern 5: export interface InterfaceName
    while IFS= read -r line; do
        if [[ $line =~ ^export[[:space:]]+interface[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*) ]]; then
            exports+=("${BASH_REMATCH[1]}:interface:$file")
        fi
    done < "$file"
    
    # Pattern 6: export { namedExport }
    while IFS= read -r line; do
        if [[ $line =~ ^export[[:space:]]*\{[[:space:]]*([a-zA-Z_][a-zA-Z0-9_,[:space:]]*)\} ]]; then
            local names="${BASH_REMATCH[1]}"
            IFS=',' read -ra NAME_ARRAY <<< "$names"
            for name in "${NAME_ARRAY[@]}"; do
                name=$(echo "$name" | xargs) # trim whitespace
                exports+=("$name:named:$file")
            done
        fi
    done < "$file"
    
    printf '%s\n' "${exports[@]}"
}

# ═══════════════════════════════════════════════════════════════════════════
# Usage Analysis | تحليل الاستخدام
# ═══════════════════════════════════════════════════════════════════════════

# Calculate usage score for an export | حساب نقاط الاستخدام للصادرات
calculate_usage_score() {
    local export_name="$1"
    local export_file="$2"
    
    local direct_imports=0
    local dynamic_imports=0
    local schema_refs=0
    local doc_refs=0
    
    # Direct imports in .ts, .tsx, .js files
    # استيرادات مباشرة في ملفات .ts, .tsx, .js
    direct_imports=$(rg -t ts -t tsx -t js \
        --glob '!node_modules' \
        --glob '!dist' \
        --glob '!build' \
        --glob '!*.test.ts' \
        --glob '!*.spec.ts' \
        --glob '!index.ts' \
        --glob '!index.d.ts' \
        "import.*\b$export_name\b" \
        "$PROJECT_ROOT" 2>/dev/null | wc -l || echo 0)
    
    # Dynamic import() usage
    # استخدام import() الديناميكي
    dynamic_imports=$(rg -t ts -t tsx -t js \
        --glob '!node_modules' \
        "import\(.*$export_name" \
        "$PROJECT_ROOT" 2>/dev/null | wc -l || echo 0)
    
    # Schema references
    # مراجع في الـ schemas
    schema_refs=$(rg -t json \
        --glob 'schemas/**' \
        "\"$export_name\"" \
        "$PROJECT_ROOT" 2>/dev/null | wc -l || echo 0)
    
    # Documentation references
    # مراجع في التوثيق
    doc_refs=$(rg -t md \
        --glob 'docs/**' \
        "\b$export_name\b" \
        "$PROJECT_ROOT" 2>/dev/null | wc -l || echo 0)
    
    # Calculate total score
    local total=$(( $(echo "$direct_imports" | head -n1 || echo 0) + $(echo "$dynamic_imports" | head -n1 || echo 0) + $(echo "$schema_refs" | head -n1 || echo 0) + $(echo "$doc_refs" | head -n1 || echo 0) ))
    
    echo "$total:$direct_imports:$dynamic_imports:$schema_refs:$doc_refs"
}

# ═══════════════════════════════════════════════════════════════════════════
# Git History Analysis | تحليل تاريخ Git
# ═══════════════════════════════════════════════════════════════════════════

# Get days since export was added | الحصول على الأيام منذ إضافة الصادرات
get_export_age() {
    local file="$1"
    local export_name="$2"
    
    # Get first commit that added this export
    local first_commit=$(git log --all --format=%ct --diff-filter=A -- "$file" 2>/dev/null | tail -1)
    
    if [ -z "$first_commit" ]; then
        echo "0"
        return
    fi
    
    local now=$(date +%s)
    local age_seconds=$((now - first_commit))
    local age_days=$((age_seconds / 86400))
    
    echo "$age_days"
}

# Check if export was part of burst commit | التحقق من كون الصادرات جزءًا من دفعة سريعة
is_burst_commit() {
    local file="$1"
    local export_name="$2"
    
    # Get commits in the last BURST_WINDOW_HOURS hours when export was added
    local first_commit_time=$(git log --all --format=%ct --diff-filter=A -- "$file" 2>/dev/null | tail -1)
    
    if [ -z "$first_commit_time" ]; then
        echo "false"
        return
    fi
    
    local window_start=$((first_commit_time - BURST_WINDOW_HOURS * 3600))
    local window_end=$((first_commit_time + BURST_WINDOW_HOURS * 3600))
    
    local commit_count=$(git log --all --format=%ct --since="$window_start" --until="$window_end" 2>/dev/null | wc -l)
    
    if [ "$commit_count" -ge "$BURST_COMMIT_COUNT" ]; then
        echo "true"
    else
        echo "false"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# Severity Classification | تصنيف الخطورة
# ═══════════════════════════════════════════════════════════════════════════

# Determine severity level | تحديد مستوى الخطورة
classify_severity() {
    local usage_total="$1"
    local age_days="$2"
    local is_burst="$3"
    
    # CRITICAL: >90 days with zero usage
    if [ "${age_days:-0}" -ge "$CRITICAL_DAYS" ] && [ "${usage_total:-0}" -eq 0 ]; then
        echo "CRITICAL"
        return
    fi
    
    # HIGH: <2 usage locations or burst commit with low usage
    if [ "${usage_total:-0}" -lt "$HIGH_RISK_USAGE" ] || { [ "$is_burst" = "true" ] && [ "${usage_total:-0}" -lt 5 ]; }; then
        echo "HIGH"
        return
    fi
    
    # MEDIUM: Limited usage (2-5 locations)
    if [ "$usage_total" -ge 2 ] && [ "$usage_total" -le 5 ]; then
        echo "MEDIUM"
        return
    fi
    
    # LOW: Well-used (>5 locations)
    echo "LOW"
}

# Get suggested action | الحصول على الإجراء المقترح
get_suggested_action() {
    local severity="$1"
    local usage_total="$2"
    
    case "$severity" in
        CRITICAL)
            echo "DELETE"
            ;;
        HIGH)
            if [ "$usage_total" -eq 0 ]; then
                echo "DELETE"
            else
                echo "DEPRECATE"
            fi
            ;;
        MEDIUM)
            echo "DOCUMENT"
            ;;
        LOW)
            echo "MONITOR"
            ;;
        *)
            echo "REVIEW"
            ;;
    esac
}

# ═══════════════════════════════════════════════════════════════════════════
# Report Generation | إنشاء التقرير
# ═══════════════════════════════════════════════════════════════════════════

# Initialize report | تهيئة التقرير
init_report() {
    cat > "$REPORT_FILE" << 'EOF'
# ☠️ Dead Code Archaeology Report
## تقرير علم آثار الكود الميت

**Generated**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Project**: AIX Format - Sovereign Protocol

---

## 📊 Executive Summary | الملخص التنفيذي

EOF

    # Initialize JSON report
    echo '{"timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'","exports":[]}' > "$JSON_REPORT"
}

# Add export to report | إضافة صادرات إلى التقرير
add_to_report() {
    local severity="$1"
    local export_name="$2"
    local export_type="$3"
    local export_file="$4"
    local age_days="$5"
    local usage_total="$6"
    local usage_breakdown="$7"
    local action="$8"
    local is_burst="$9"
    
    local emoji=""
    case "$severity" in
        CRITICAL) emoji="$CRITICAL_EMOJI" ;;
        HIGH) emoji="$HIGH_EMOJI" ;;
        MEDIUM) emoji="$MEDIUM_EMOJI" ;;
        LOW) emoji="$LOW_EMOJI" ;;
    esac
    
    # Add to markdown report
    cat >> "$REPORT_FILE" << EOF

### $emoji $severity: \`$export_name\`

- **Type**: $export_type
- **File**: \`$export_file\`
- **Age**: $age_days days
- **Usage Count**: $usage_total
- **Usage Breakdown**: $usage_breakdown
- **Burst Commit**: $is_burst
- **Suggested Action**: **$action**

EOF

    # Add to JSON report
    local json_entry=$(jq -n \
        --arg severity "$severity" \
        --arg name "$export_name" \
        --arg type "$export_type" \
        --arg file "$export_file" \
        --argjson age "${age_days:-0}" \
        --argjson usage "${usage_total:-0}" \
        --arg breakdown "$usage_breakdown" \
        --arg action "$action" \
        --arg burst "$is_burst" \
        '{severity:$severity,name:$name,type:$type,file:$file,age:$age,usage:$usage,breakdown:$breakdown,action:$action,burst:$burst}')
    
    jq ".exports += [$json_entry]" "$JSON_REPORT" > "$JSON_REPORT.tmp" && mv "$JSON_REPORT.tmp" "$JSON_REPORT"
}

# Finalize report | إنهاء التقرير
finalize_report() {
    local critical_count="$1"
    local high_count="$2"
    local medium_count="$3"
    local low_count="$4"
    
    # Add summary to markdown
    sed -i.bak "s/## 📊 Executive Summary.*/## 📊 Executive Summary | الملخص التنفيذي\n\n- $CRITICAL_EMOJI **CRITICAL**: $critical_count\n- $HIGH_EMOJI **HIGH**: $high_count\n- $MEDIUM_EMOJI **MEDIUM**: $medium_count\n- $LOW_EMOJI **LOW**: $low_count\n/" "$REPORT_FILE"
    rm -f "$REPORT_FILE.bak"
    
    # Add summary to JSON
    jq ".summary = {critical:$critical_count,high:$high_count,medium:$medium_count,low:$low_count}" "$JSON_REPORT" > "$JSON_REPORT.tmp" && mv "$JSON_REPORT.tmp" "$JSON_REPORT"
}

# ═══════════════════════════════════════════════════════════════════════════
# Main Execution | التنفيذ الرئيسي
# ═══════════════════════════════════════════════════════════════════════════

main() {
    log_info "🔍 بدء فحص الكود الميت..."
    log_info "🔍 Starting Dead Code Archaeology Scan..."
    echo ""
    
    # Check dependencies
    check_dependencies
    
    # Setup
    setup_directories
    cd "$PROJECT_ROOT"
    
    # Initialize report
    init_report
    
    # Counters
    local critical_count=0
    local high_count=0
    local medium_count=0
    local low_count=0
    local total_exports=0
    
    # Find all entry points
    log_info "📦 Scanning package entry points..."
    local entry_points=$(find_entry_points)
    
    # Process each entry point
    while IFS= read -r entry_point; do
        if [ ! -f "$entry_point" ]; then
            continue
        fi
        
        log_info "Analyzing: $entry_point"
        
        # Extract exports
        local exports=$(extract_exports "$entry_point")
        
        # Process each export
        while IFS= read -r export_line; do
            if [ -z "$export_line" ]; then
                continue
            fi
            
            IFS=':' read -r export_name export_type export_file <<< "$export_line"
            
            total_exports=$((total_exports + 1))
            
            # Calculate usage
            local usage_data=$(calculate_usage_score "$export_name" "$export_file")
            IFS=':' read -r usage_total direct dynamic schema docs <<< "$usage_data"
            local usage_breakdown="Direct:$direct, Dynamic:$dynamic, Schema:$schema, Docs:$docs"
            
            # Get age
            local age_days=$(get_export_age "$export_file" "$export_name")
            
            # Check burst
            local is_burst=$(is_burst_commit "$export_file" "$export_name")
            
            # Classify severity
            local severity=$(classify_severity "$usage_total" "$age_days" "$is_burst")
            
            # Get action
            local action=$(get_suggested_action "$severity" "$usage_total")
            
            # Update counters
            case "$severity" in
                CRITICAL) critical_count=$((critical_count + 1)) ;;
                HIGH) high_count=$((high_count + 1)) ;;
                MEDIUM) medium_count=$((medium_count + 1)) ;;
                LOW) low_count=$((low_count + 1)) ;;
            esac
            
            # Add to report
            add_to_report "$severity" "$export_name" "$export_type" "$export_file" "$age_days" "$usage_total" "$usage_breakdown" "$action" "$is_burst"
            
        done <<< "$exports"
        
    done <<< "$entry_points"
    
    # Finalize report
    finalize_report "$critical_count" "$high_count" "$medium_count" "$low_count"
    
    echo ""
    log_success "✅ Scan complete! | اكتمل الفحص!"
    echo ""
    echo "📊 Results | النتائج:"
    echo "  Total Exports: $total_exports"
    echo "  $CRITICAL_EMOJI CRITICAL: $critical_count"
    echo "  $HIGH_EMOJI HIGH: $high_count"
    echo "  $MEDIUM_EMOJI MEDIUM: $medium_count"
    echo "  $LOW_EMOJI LOW: $low_count"
    echo ""
    echo "📄 Reports generated:"
    echo "  - Markdown: $REPORT_FILE"
    echo "  - JSON: $JSON_REPORT"
    echo ""
    
    # Exit with error if critical orphans found
    if [ "$critical_count" -gt 0 ]; then
        log_error "☠️ CRITICAL orphans detected! Review and remove before merging."
        exit 1
    fi
    
    log_success "No critical issues found."
    exit 0
}

# Run main function
main "$@"

# Made with Moe Abdelaziz
