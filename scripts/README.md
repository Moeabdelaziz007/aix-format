# 🧬 AIX Meta-Loop Scripts

Automated tools for self-improving codebase maintenance and deployment.

---

## 📁 Scripts Overview

### 1. `meta-loop-cleaner.sh` - Code Quality Scanner
**Purpose:** Scan codebase for 10 common code quality issues and anti-patterns.

**Features:**
- ✅ Detects 10 code smell patterns
- ✅ Dry-run mode for safe scanning
- ✅ Aggressive mode for auto-fixes
- ✅ Detailed statistics

**Usage:**
```bash
# Make executable
chmod +x scripts/meta-loop-cleaner.sh

# Scan only (no changes)
./scripts/meta-loop-cleaner.sh --dry-run

# Scan and auto-fix
./scripts/meta-loop-cleaner.sh --aggressive

# Both modes
./scripts/meta-loop-cleaner.sh --dry-run --aggressive
```

**What it detects:**
1. **Dangerous Type Assertions** - `as unknown` usage
2. **Missing Error Handling** - Empty catch blocks
3. **Console.log in Production** - Debug statements
4. **TODO/FIXME Comments** - Unfinished work
5. **Duplicate Imports** - Same import twice
6. **Unused Variables** - Declared but never used
7. **Long Functions** - Functions >100 lines
8. **Magic Numbers** - Hardcoded values
9. **Circular Dependencies** - Excessive parent imports
10. **Missing TypeScript Types** - `: any` and `: unknown`

**Output:**
- `meta-loop-YYYYMMDD-HHMMSS.log` - Scan results

---

## 🚀 Quick Start Guide

### First Time Setup

1. **Install dependencies:**
```bash
cd apps/studio
pnpm install
```

2. **Make scripts executable:**
```bash
chmod +x scripts/*.sh
```

### Typical Workflow

#### Scenario 1: Code Quality Check Before Commit
```bash
# Scan for issues
./scripts/meta-loop-cleaner.sh --dry-run

# Fix automatically
./scripts/meta-loop-cleaner.sh --aggressive

# Review changes
git diff
```

---

## 📊 Current Codebase Stats

- **Total Lines:** 36,194
- **Total Files:** ~150 (TS/TSX)
- **Average Lines/File:** ~241

---

## 🔧 Troubleshooting

### Script won't run
```bash
# Make sure it's executable
chmod +x scripts/meta-loop-cleaner.sh

# Check bash is available
which bash
```

---

## 🎯 Best Practices

1. **Always run dry-run first** before aggressive mode
2. **Review auto-fixes** before committing
3. **Keep logs** for debugging
4. **Run cleaner** before every PR

---

## 🤝 Contributing

When adding new auto-fix strategies:
- ✅ Always test in dry-run mode first
- ✅ Add detailed logging
- ✅ Handle edge cases
- ✅ Update this README

---

## 📚 Related Documentation

- [Critical Fixes Applied](../docs/CRITICAL_FIXES_APPLIED.md)
- [Next Steps Guide](../NEXT_STEPS.md)
- [Fixes Summary](../FIXES_SUMMARY.md)

---

**Made with ❤️ by AIX Evolution Mode**