/**
 * Tests for .cursor/rules/openmemory.mdc
 *
 * This file was added in the PR and defines cursor IDE rules for AI-assisted
 * memory management. These tests validate the file's structure, required
 * configuration values, and security guardrails.
 *
 * Usage: node --test tests/openmemory_cursor_rules.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const OPENMEMORY_MDC_PATH = join(REPO_ROOT, '.cursor', 'rules', 'openmemory.mdc');

// Read file once for all tests
let fileContent = '';
let fileLines = [];

try {
  fileContent = readFileSync(OPENMEMORY_MDC_PATH, 'utf8');
  fileLines = fileContent.split('\n');
} catch {
  // Will be caught by the existence test below
}

/**
 * Extracts the YAML front matter block from the file content.
 * Front matter is delimited by lines containing only '---'.
 */
function parseFrontMatter(content) {
  const lines = content.split('\n');
  if (lines[0].trim() !== '---') return null;
  const endIdx = lines.slice(1).findIndex(l => l.trim() === '---');
  if (endIdx === -1) return null;
  const frontMatterLines = lines.slice(1, endIdx + 1);
  const result = {};
  for (const line of frontMatterLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

describe('openmemory.mdc cursor rules file', () => {

  describe('File Existence and Basic Properties', () => {
    it('should exist at .cursor/rules/openmemory.mdc', () => {
      assert.ok(
        existsSync(OPENMEMORY_MDC_PATH),
        `Expected file to exist at: ${OPENMEMORY_MDC_PATH}`
      );
    });

    it('should be non-empty with substantial content', () => {
      assert.ok(fileContent.length > 1000, 'File should contain substantial content (>1000 chars)');
    });

    it('should contain more than 100 lines', () => {
      assert.ok(fileLines.length > 100, `Expected >100 lines, got ${fileLines.length}`);
    });

    it('should be encoded as UTF-8 text without null bytes', () => {
      assert.ok(!fileContent.includes('\0'), 'File should not contain null bytes');
    });
  });

  describe('Front Matter Validation', () => {
    it('should start with YAML front matter delimited by ---', () => {
      assert.strictEqual(
        fileLines[0].trim(),
        '---',
        'File must begin with front matter opening delimiter ---'
      );
    });

    it('should have a closing front matter delimiter', () => {
      const closingIdx = fileLines.slice(1).findIndex(l => l.trim() === '---');
      assert.ok(closingIdx !== -1, 'File must have a closing --- for front matter');
    });

    it('should have a description field in front matter', () => {
      const frontMatter = parseFrontMatter(fileContent);
      assert.ok(frontMatter !== null, 'Front matter should be parseable');
      assert.ok('description' in frontMatter, 'Front matter must contain a description field');
    });

    it('should have description set to "Openmemory MCP Instructions"', () => {
      const frontMatter = parseFrontMatter(fileContent);
      assert.ok(frontMatter !== null, 'Front matter should be parseable');
      assert.ok(
        frontMatter.description.includes('Openmemory MCP Instructions'),
        `Expected description to contain "Openmemory MCP Instructions", got: ${frontMatter.description}`
      );
    });

    it('should have alwaysApply set to true in front matter', () => {
      const frontMatter = parseFrontMatter(fileContent);
      assert.ok(frontMatter !== null, 'Front matter should be parseable');
      assert.strictEqual(
        frontMatter.alwaysApply,
        'true',
        'alwaysApply must be set to true so the rules always apply'
      );
    });

    it('should have globs field in front matter', () => {
      const frontMatter = parseFrontMatter(fileContent);
      assert.ok(frontMatter !== null, 'Front matter should be parseable');
      assert.ok('globs' in frontMatter, 'Front matter must contain a globs field');
    });

    it('should have globs covering all files (["**/*"])', () => {
      assert.ok(
        fileContent.includes('["**/*"]'),
        'Globs should include ["**/*"] to apply to all files'
      );
    });
  });

  describe('User Identification', () => {
    it('should contain ## User Identification section', () => {
      assert.ok(
        fileContent.includes('## User Identification'),
        'File must contain a "## User Identification" section'
      );
    });

    it('should specify user_id as cryptojoker710', () => {
      assert.ok(
        fileContent.includes('cryptojoker710'),
        'File must specify user_id value "cryptojoker710"'
      );
    });

    it('should label the user_id field with **user_id:** prefix', () => {
      assert.ok(
        fileContent.includes('**user_id:** cryptojoker710'),
        'user_id must be formatted as "**user_id:** cryptojoker710"'
      );
    });
  });

  describe('Project Identification', () => {
    it('should contain ## Project Identification section', () => {
      assert.ok(
        fileContent.includes('## Project Identification'),
        'File must contain a "## Project Identification" section'
      );
    });

    it('should specify project_id as AIX', () => {
      assert.ok(
        fileContent.includes('**project_id:** AIX'),
        'File must specify project_id as "AIX" using **project_id:** prefix'
      );
    });
  });

  describe('Required Major Sections', () => {
    const requiredSections = [
      '## Core Philosophy',
      '## NON-NEGOTIABLE: Memory Operation Requirements',
      '## CRITICAL: Memory-First Development',
      '## Workflow Principles',
      '## Memory Type Guidelines',
      '## Memory Title Guidelines',
      '## Memory Storage Intelligence',
      '## Tool Usage',
      '## Git Metadata Integration',
      '## Operating Principles',
      '## Session Patterns',
      '## The OpenMemory Guide (Additional Layer)',
    ];

    for (const section of requiredSections) {
      it(`should contain section: "${section}"`, () => {
        assert.ok(
          fileContent.includes(section),
          `File must contain the section: ${section}`
        );
      });
    }
  });

  describe('Memory Operation Rules', () => {
    it('should require at least 2 search-memory calls before coding', () => {
      // The file should mention minimum 2 searches as a blocking requirement
      assert.ok(
        fileContent.includes('at least 2') || fileContent.includes('minimum 2'),
        'File must specify requirement for at least 2 memory searches before implementation'
      );
    });

    it('should require at least 1 add-memory call after implementation', () => {
      assert.ok(
        fileContent.includes('at least 1 `add-memory`') || fileContent.includes('add-memory tool call'),
        'File must specify requirement to store memory after implementation'
      );
    });

    it('should define TASK REDEFINITION concept splitting tasks into A and B', () => {
      assert.ok(
        fileContent.includes('TASK REDEFINITION') &&
        fileContent.includes('Task A') &&
        fileContent.includes('Task B'),
        'File must define TASK REDEFINITION splitting every request into Task A (memory ops) and Task B (actual request)'
      );
    });

    it('should define MANDATORY EXECUTION PATTERN section', () => {
      assert.ok(
        fileContent.includes('MANDATORY EXECUTION PATTERN'),
        'File must contain MANDATORY EXECUTION PATTERN section'
      );
    });

    it('should list FAILURE CONDITIONS', () => {
      assert.ok(
        fileContent.includes('FAILURE CONDITIONS'),
        'File must define FAILURE CONDITIONS for memory operations'
      );
    });

    it('should list writing code without memory search as a FAILURE', () => {
      assert.ok(
        fileContent.includes('Writing code without searching memories first') ||
        fileContent.includes('without searching memories'),
        'File must flag writing code without memory search as a FAILURE'
      );
    });
  });

  describe('Memory Type Definitions', () => {
    const expectedMemoryTypes = [
      'component',
      'implementation',
      'debug',
      'user_preference',
      'project_info',
    ];

    for (const memType of expectedMemoryTypes) {
      it(`should define memory type: "${memType}"`, () => {
        assert.ok(
          fileContent.includes(memType),
          `File must reference memory type "${memType}"`
        );
      });
    }

    it('should describe Component Memories section', () => {
      assert.ok(
        fileContent.includes('### Component Memories'),
        'File must include ### Component Memories section'
      );
    });

    it('should describe Implementation Memories section', () => {
      assert.ok(
        fileContent.includes('### Implementation Memories'),
        'File must include ### Implementation Memories section'
      );
    });

    it('should describe Debugging Memories section', () => {
      assert.ok(
        fileContent.includes('### Debugging Memories'),
        'File must include ### Debugging Memories section'
      );
    });

    it('should describe User Preference Memories section', () => {
      assert.ok(
        fileContent.includes('### User Preference Memories'),
        'File must include ### User Preference Memories section'
      );
    });

    it('should describe Project Info Memories section', () => {
      assert.ok(
        fileContent.includes('### Project Info Memories'),
        'File must include ### Project Info Memories section'
      );
    });
  });

  describe('Tool Usage Documentation', () => {
    it('should document the search-memory tool', () => {
      assert.ok(
        fileContent.includes('search-memory'),
        'File must document the search-memory tool'
      );
    });

    it('should document the add-memory tool', () => {
      assert.ok(
        fileContent.includes('add-memory'),
        'File must document the add-memory tool'
      );
    });

    it('should specify query as a required parameter for search-memory', () => {
      assert.ok(
        fileContent.includes('Required: query'),
        'File must specify "query" as a required parameter for search-memory'
      );
    });

    it('should specify title as required for add-memory', () => {
      assert.ok(
        fileContent.includes('Required: title'),
        'File must specify "title" as a required parameter for add-memory'
      );
    });

    it('should specify content and memory_type as required for add-memory', () => {
      assert.ok(
        fileContent.includes('Required: content'),
        'File must specify "content" as required for add-memory'
      );
    });
  });

  describe('Git Metadata Integration', () => {
    it('should document required git parameters for add-memory', () => {
      assert.ok(
        fileContent.includes('git_repo_name') &&
        fileContent.includes('git_branch') &&
        fileContent.includes('git_commit_hash'),
        'File must document git_repo_name, git_branch, and git_commit_hash parameters'
      );
    });

    it('should provide git extraction commands', () => {
      assert.ok(
        fileContent.includes('git remote get-url origin') ||
        fileContent.includes('git rev-parse HEAD'),
        'File must provide git commands for extracting metadata'
      );
    });

    it('should define fallback behavior when git commands fail', () => {
      assert.ok(
        fileContent.includes('Fallback') || fileContent.includes('fallback') || fileContent.includes('unknown'),
        'File must define fallback behavior when git metadata cannot be extracted'
      );
    });
  });

  describe('Security Guardrails', () => {
    it('should contain Non-Negotiable Guardrails section', () => {
      assert.ok(
        fileContent.includes('Non-Negotiable Guardrails') ||
        fileContent.includes('### Non-Negotiable Guardrails'),
        'File must contain Non-Negotiable Guardrails section'
      );
    });

    it('should explicitly prohibit storing API keys and tokens', () => {
      assert.ok(
        fileContent.includes('API keys') || fileContent.includes('api keys'),
        'File must explicitly prohibit storing API keys in memories'
      );
    });

    it('should prohibit storing passwords', () => {
      assert.ok(
        fileContent.includes('Passwords') || fileContent.includes('passwords'),
        'File must prohibit storing passwords in memories'
      );
    });

    it('should provide SECURITY WARNING before add-memory tool', () => {
      assert.ok(
        fileContent.includes('SECURITY WARNING'),
        'File must include SECURITY WARNING about not storing secrets'
      );
    });

    it('should provide safe placeholder examples for sensitive data (e.g. <YOUR_TOKEN>)', () => {
      assert.ok(
        fileContent.includes('<YOUR_TOKEN>') || fileContent.includes('<API_KEY>'),
        'File must show placeholder patterns like <YOUR_TOKEN> or <API_KEY> for safe storage'
      );
    });

    it('should instruct to NEVER store credentials (UNDER NO CIRCUMSTANCES)', () => {
      assert.ok(
        fileContent.includes('UNDER NO CIRCUMSTANCES') || fileContent.includes('NEVER store'),
        'File must use emphatic language about never storing secrets/credentials'
      );
    });

    it('should list prohibited content categories', () => {
      const prohibitedItems = [
        'Private keys',
        'Passwords',
        'OAuth tokens',
      ];
      for (const item of prohibitedItems) {
        assert.ok(
          fileContent.includes(item),
          `File must list "${item}" as prohibited content in memories`
        );
      }
    });
  });

  describe('Namespace Workflow', () => {
    it('should contain Namespace Workflow section', () => {
      assert.ok(
        fileContent.includes('Namespace Workflow'),
        'File must contain Namespace Workflow section'
      );
    });

    it('should state a memory can have at most ONE namespace', () => {
      assert.ok(
        fileContent.includes('at most ONE namespace') || fileContent.includes('ONE namespace'),
        'File must specify that a memory can have at most one namespace'
      );
    });

    it('should allow memories with NO namespace', () => {
      assert.ok(
        fileContent.includes('NO namespace') || fileContent.includes('no namespace'),
        'File must allow memories to have no namespace'
      );
    });
  });

  describe('Search Pattern Documentation', () => {
    it('should document 3 distinct search patterns', () => {
      // The file describes 3 search patterns: global prefs, all prefs, project facts
      assert.ok(
        fileContent.includes('Pattern 1') || fileContent.includes('**Pattern 1'),
        'File must document distinct search patterns'
      );
    });

    it('should explain user_id + project_id search scope', () => {
      assert.ok(
        fileContent.includes('user_id') && fileContent.includes('project_id'),
        'File must document user_id and project_id search parameters'
      );
    });

    it('should explain that project facts search uses project_id without user_id', () => {
      assert.ok(
        fileContent.includes('no user_id') ||
        fileContent.includes('(no user_id)') ||
        fileContent.includes('no `user_id`'),
        'File must explain that project fact searches use project_id without user_id'
      );
    });
  });

  describe('Initial Codebase Deep Dive', () => {
    it('should contain Initial Codebase Deep Dive section', () => {
      assert.ok(
        fileContent.includes('Initial Codebase Deep Dive'),
        'File must contain Initial Codebase Deep Dive section'
      );
    });

    it('should instruct checking if openmemory.md is empty before diving', () => {
      assert.ok(
        fileContent.includes('openmemory.md') &&
        (fileContent.includes('empty') || fileContent.includes('0 bytes')),
        'File must instruct to check if openmemory.md is empty before performing deep dive'
      );
    });
  });
});

describe('Deleted PR files no longer exist', () => {
  const deletedFiles = [
    '.aix-hints/CONSTITUTION.md',
    '.aix-hints/cold/ring-0-rust.md',
    '.aix-hints/cold/ring-1-zkkyc.md',
    '.aix-hints/cold/ring-2-swarm.md',
    '.aix-hints/cold/ring-3-studio.md',
    '.aix-plugins.json',
    '.env.example',
    '.generated/COMPREHENSIVE_DEEP_DIVE_ANALYSIS.md',
    '.generated/HEALTH_REPORT.md',
    '.generated/QUANTUM_TOPOLOGY_ANALYSIS.md',
    '.github/CODEOWNERS',
    '.github/workflows/ai-guardrails.yml',
    '.github/workflows/aix-validation.yml',
    '.github/workflows/ci.yml',
    '.github/workflows/dead-code-scan.yml',
    '.github/workflows/deploy-studio.yml',
    '.github/workflows/evolution.yml',
    '.github/workflows/health-autonomy.yml',
    '.github/workflows/health-check.yml',
    '.github/workflows/jules-scheduled.yml',
    '.github/workflows/pattern-watcher.yml',
    '.github/workflows/quality.yml',
    '.github/workflows/schema-drift-check.yml',
    '.github/workflows/security-signature-gate.yml',
  ];

  for (const relPath of deletedFiles) {
    const absPath = join(REPO_ROOT, relPath);
    it(`should not exist: ${relPath}`, () => {
      assert.strictEqual(
        existsSync(absPath),
        false,
        `File was deleted in this PR and should no longer exist: ${relPath}`
      );
    });
  }

  // Regression: verify the new file still exists while deleted files are gone
  it('should still have the newly added openmemory.mdc while deleted files are absent', () => {
    assert.ok(
      existsSync(OPENMEMORY_MDC_PATH),
      'The newly added .cursor/rules/openmemory.mdc must exist'
    );
    assert.strictEqual(
      existsSync(join(REPO_ROOT, '.aix-plugins.json')),
      false,
      '.aix-plugins.json was deleted and must not exist'
    );
    assert.strictEqual(
      existsSync(join(REPO_ROOT, '.env.example')),
      false,
      '.env.example was deleted and must not exist'
    );
  });
});
