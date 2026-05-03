# AIX Validation Plugin System

## Overview

The AIX parser now features a **plugin-based validation architecture** that enables infinite extensibility without modifying core code. This system allows developers to create custom validators for domain-specific requirements, compliance rules, or organizational standards.

## Architecture

### Core Components

1. **ValidationPlugin** - Base class for all validators
2. **PluginRegistry** - Manages plugin lifecycle and execution
3. **Core Plugins** - Built-in validators for AIX specification
4. **Validation Utils** - Shared utilities for plugin development

### Design Principles

- **Zero Breaking Changes**: Existing code works unchanged
- **Priority-Based Execution**: Plugins run in configurable order
- **Error Isolation**: Plugin failures don't crash the parser
- **Async Support**: Plugins can perform async operations
- **Composability**: Mix and match plugins as needed

## Quick Start

### Using the Default Configuration

The parser automatically uses core validators:

```javascript
import { AIXParser } from './core/parser.js';

const parser = new AIXParser();
const agent = await parser.parseFile('my-agent.aix');
```

### Adding Custom Validators

```javascript
import { AIXParser, defaultRegistry } from './core/parser.js';
import { ValidationPlugin } from './core/validation-plugins.js';
import { addError } from './core/plugins/validation-utils.js';

// Create custom validator
class CompanyNamingValidator extends ValidationPlugin {
  constructor() {
    super('company-naming', 100); // name, priority
  }

  getTargetFields() {
    return ['meta'];
  }

  async validate(manifest, context) {
    if (!manifest.meta?.name?.startsWith('ACME-')) {
      addError(
        context,
        'NAMING_CONVENTION',
        'meta',
        'Agent name must start with ACME- prefix',
        { field: 'name' }
      );
    }
  }
}

// Register globally
defaultRegistry.register(new CompanyNamingValidator());

// Parse with custom validation
const parser = new AIXParser();
const agent = await parser.parseFile('my-agent.aix');
```

### Using Custom Registry

```javascript
import { AIXParser, PluginRegistry } from './core/parser.js';
import { MetaValidator, PersonaValidator } from './core/plugins/index.js';

// Create custom registry
const customRegistry = new PluginRegistry();
customRegistry.register(new MetaValidator());
customRegistry.register(new PersonaValidator());
customRegistry.register(new CompanyNamingValidator());

// Use custom registry
const parser = new AIXParser({ registry: customRegistry });
const agent = await parser.parseFile('my-agent.aix');
```

## Creating Custom Plugins

### Basic Plugin Structure

```javascript
import { ValidationPlugin } from './core/validation-plugins.js';
import { addError, addWarning } from './core/plugins/validation-utils.js';

export class MyValidator extends ValidationPlugin {
  constructor() {
    // name: unique identifier
    // priority: execution order (lower runs first)
    super('my-validator', 100);
  }

  // Optional: declare which fields this plugin validates
  getTargetFields() {
    return ['meta', 'persona'];
  }

  // Required: validation logic
  async validate(manifest, context) {
    // Access manifest data
    const meta = manifest.meta;
    
    // Add errors
    if (!meta?.custom_field) {
      addError(
        context,
        'MISSING_FIELD',
        'meta',
        'Custom field is required',
        { field: 'custom_field' }
      );
    }

    // Add warnings
    if (meta?.deprecated_field) {
      addWarning(
        context,
        'DEPRECATED',
        'meta',
        'This field is deprecated'
      );
    }
  }
}
```

### Plugin Priority

Priority determines execution order (lower runs first):

- **1-10**: Critical validators (structure, security)
- **11-50**: Core specification validators
- **51-100**: Domain-specific validators
- **101+**: Optional/enhancement validators

```javascript
// High priority - runs first
class SecurityValidator extends ValidationPlugin {
  constructor() {
    super('security', 15);
  }
}

// Low priority - runs last
class OptionalValidator extends ValidationPlugin {
  constructor() {
    super('optional', 150);
  }
}
```

### Validation Context

The context object passed to validators contains:

```javascript
{
  errors: [],      // Array to collect errors
  warnings: [],    // Array to collect warnings
  options: {},     // Parser options
  // ... custom properties
}
```

### Error Format

```javascript
{
  code: 'ERROR_CODE',           // Machine-readable code
  section: 'meta',               // Manifest section
  message: 'Human readable',     // Error description
  field: 'fieldName',            // Optional: specific field
  index: 0,                      // Optional: array index
  // ... custom properties
}
```

## Utility Functions

### Validation Helpers

```javascript
import {
  isValidID,
  isValidISO8601,
  isValidSemver,
  isValidURL,
  addError,
  addWarning,
  validateRequiredFields,
  validateRange,
  validateEnum,
  validateArray
} from './core/plugins/validation-utils.js';

// Check formats
if (!isValidURL(api.base_url)) {
  addError(context, 'INVALID_URL', 'apis', 'Invalid URL format');
}

// Validate required fields
validateRequiredFields(
  manifest.meta,
  ['version', 'id', 'name'],
  context,
  'meta'
);

// Validate numeric range
validateRange(
  persona.temperature,
  0,
  2,
  context,
  'persona',
  'temperature'
);

// Validate enum values
validateEnum(
  security.algorithm,
  ['sha256', 'sha512', 'blake3'],
  context,
  'security',
  'algorithm'
);

// Validate arrays
validateArray(
  manifest.skills,
  context,
  'skills',
  'skills',
  (skill, index, ctx, section) => {
    if (!skill.name) {
      addError(ctx, 'MISSING_FIELD', section, `Skill ${index} missing name`);
    }
  }
);
```

## Plugin Registry API

### Registration

```javascript
const registry = new PluginRegistry();

// Register plugin
registry.register(new MyValidator());

// Check if registered
if (registry.hasPlugin('my-validator')) {
  console.log('Plugin registered');
}

// Get plugin
const plugin = registry.getPlugin('my-validator');

// Unregister
registry.unregister('my-validator');

// Clear all
registry.clear();
```

### Execution

```javascript
// Run all plugins
const errors = await registry.runAll(manifest, context);

// Run specific plugins
const errors = await registry.runPlugins(
  ['meta', 'persona'],
  manifest,
  context
);

// Get plugins for field
const metaValidators = registry.getPluginsForField('meta');
```

### Introspection

```javascript
// List all plugins (sorted by priority)
const plugins = registry.listPlugins();

// Get execution statistics
const stats = registry.getStats('my-validator');
console.log(stats.executions);  // Number of times run
console.log(stats.totalTime);   // Total execution time (ms)
console.log(stats.errors);      // Number of errors

// Export registry state
const state = registry.export();
```

## Core Validators

The following validators are included by default:

| Validator | Priority | Fields | Description |
|-----------|----------|--------|-------------|
| MetaValidator | 10 | meta | Validates metadata, IDs, versions |
| SecurityValidator | 15 | security | Validates checksums and algorithms |
| PersonaValidator | 20 | persona | Validates role and instructions |
| SkillsValidator | 30 | skills | Validates skill definitions |
| APIsValidator | 35 | apis | Validates API configurations |
| MCPValidator | 40 | mcp | Validates MCP server configs |
| MemoryValidator | 50 | memory | Validates memory configurations |
| ABOMValidator | 60 | abom | Validates AI Bill of Materials |

## Use Cases

### 1. Compliance Validation

```javascript
class GDPRValidator extends ValidationPlugin {
  constructor() {
    super('gdpr-compliance', 90);
  }

  async validate(manifest, context) {
    // Require privacy policy
    if (!manifest.meta?.privacy_policy_url) {
      addError(
        context,
        'GDPR_VIOLATION',
        'meta',
        'Privacy policy URL required for GDPR compliance'
      );
    }

    // Check data retention
    if (manifest.memory?.episodic?.retention_days > 365) {
      addWarning(
        context,
        'GDPR_WARNING',
        'memory',
        'Data retention exceeds recommended 365 days'
      );
    }
  }
}
```

### 2. Security Hardening

```javascript
class SecurityHardeningValidator extends ValidationPlugin {
  constructor() {
    super('security-hardening', 95);
  }

  async validate(manifest, context) {
    // Require HTTPS for all APIs
    manifest.apis?.forEach((api, index) => {
      if (!api.base_url?.startsWith('https://')) {
        addError(
          context,
          'INSECURE_API',
          'apis',
          `API '${api.name}' must use HTTPS`,
          { index }
        );
      }
    });

    // Require strong checksums
    if (manifest.security?.checksum?.algorithm === 'sha256') {
      addWarning(
        context,
        'WEAK_CHECKSUM',
        'security',
        'Consider using sha512 or blake3'
      );
    }
  }
}
```

### 3. Performance Optimization

```javascript
class PerformanceValidator extends ValidationPlugin {
  constructor() {
    super('performance', 110);
  }

  async validate(manifest, context) {
    // Warn about too many skills
    if (manifest.skills?.length > 20) {
      addWarning(
        context,
        'PERFORMANCE_WARNING',
        'skills',
        `${manifest.skills.length} skills may impact performance`
      );
    }

    // Check temperature settings
    if (manifest.persona?.temperature > 1.5) {
      addWarning(
        context,
        'PERFORMANCE_WARNING',
        'persona',
        'High temperature may produce inconsistent results'
      );
    }
  }
}
```

### 4. Organization Standards

```javascript
class OrgStandardsValidator extends ValidationPlugin {
  constructor(orgPrefix) {
    super('org-standards', 100);
    this.orgPrefix = orgPrefix;
  }

  async validate(manifest, context) {
    // Enforce naming convention
    if (!manifest.meta?.name?.startsWith(this.orgPrefix)) {
      addError(
        context,
        'NAMING_VIOLATION',
        'meta',
        `Agent name must start with '${this.orgPrefix}'`
      );
    }

    // Require author email
    if (!manifest.meta?.author_email) {
      addError(
        context,
        'MISSING_CONTACT',
        'meta',
        'Author email is required'
      );
    }

    // Require ABOM for production
    if (manifest.meta?.environment === 'production') {
      if (!manifest.abom?.constituents?.length) {
        addError(
          context,
          'MISSING_ABOM',
          'abom',
          'Production agents must document dependencies'
        );
      }
    }
  }
}
```

## Best Practices

### 1. Single Responsibility

Each plugin should validate one concern:

```javascript
// Good: Focused validator
class NamingValidator extends ValidationPlugin {
  async validate(manifest, context) {
    // Only validate naming conventions
  }
}

// Bad: Does too much
class EverythingValidator extends ValidationPlugin {
  async validate(manifest, context) {
    // Validates naming, security, performance, etc.
  }
}
```

### 2. Fail Fast

Check prerequisites before detailed validation:

```javascript
async validate(manifest, context) {
  // Check if section exists
  if (!manifest.meta) {
    addError(context, 'MISSING_SECTION', 'meta', 'Meta section required');
    return; // Exit early
  }

  // Now safe to validate details
  if (!manifest.meta.version) {
    addError(context, 'MISSING_FIELD', 'meta', 'Version required');
  }
}
```

### 3. Clear Error Messages

Provide actionable error messages:

```javascript
// Good: Clear and actionable
addError(
  context,
  'INVALID_URL',
  'apis',
  `API '${api.name}' has invalid URL '${api.base_url}'. Must be a valid HTTP(S) URL`,
  { field: 'base_url', value: api.base_url }
);

// Bad: Vague
addError(context, 'ERROR', 'apis', 'Invalid');
```

### 4. Use Appropriate Severity

- **Errors**: Violations that prevent agent from working
- **Warnings**: Issues that should be addressed but aren't critical

```javascript
// Error: Critical issue
if (!manifest.security?.checksum) {
  addError(context, 'MISSING_CHECKSUM', 'security', 'Checksum required');
}

// Warning: Recommendation
if (manifest.security?.checksum?.algorithm === 'sha256') {
  addWarning(context, 'WEAK_ALGORITHM', 'security', 'Consider sha512');
}
```

### 5. Handle Edge Cases

```javascript
async validate(manifest, context) {
  // Handle missing section
  if (!manifest.skills) {
    return; // Optional section
  }

  // Handle wrong type
  if (!Array.isArray(manifest.skills)) {
    addError(context, 'INVALID_TYPE', 'skills', 'Must be array');
    return; // Can't continue
  }

  // Now safe to iterate
  manifest.skills.forEach((skill, index) => {
    // Validate each skill
  });
}
```

## Performance Considerations

### Plugin Overhead

The plugin system adds minimal overhead (<5%):

- Plugin registration: O(1)
- Plugin execution: O(n) where n = number of plugins
- Error collection: O(1) per error

### Optimization Tips

1. **Use appropriate priority**: Critical validators run first
2. **Exit early**: Return when section is missing/invalid
3. **Avoid redundant checks**: Don't re-validate what core plugins check
4. **Batch operations**: Validate multiple items in one pass

```javascript
// Good: Single pass
manifest.skills?.forEach(skill => {
  validateSkillName(skill);
  validateSkillDescription(skill);
});

// Bad: Multiple passes
manifest.skills?.forEach(skill => validateSkillName(skill));
manifest.skills?.forEach(skill => validateSkillDescription(skill));
```

## Migration Guide

### From Old Validators

Old hardcoded validators still work but are deprecated:

```javascript
// Old way (still works)
class AIXParser {
  validateMeta(meta) {
    // Hardcoded validation
  }
}

// New way (recommended)
class MetaValidator extends ValidationPlugin {
  async validate(manifest, context) {
    // Plugin-based validation
  }
}
```

### Gradual Migration

You can migrate incrementally:

1. Core plugins handle: meta, persona, security, skills, apis, mcp, memory, abom
2. Old validators handle: requirements, pricing, identity_layer, pi_network, economics
3. Migrate remaining validators as plugins over time

## Troubleshooting

### Plugin Not Running

```javascript
// Check if registered
if (!registry.hasPlugin('my-validator')) {
  console.log('Plugin not registered');
}

// Check priority order
const plugins = registry.listPlugins();
console.log(plugins.map(p => `${p.name}: ${p.priority}`));
```

### Errors Not Appearing

```javascript
// Ensure you're adding to context.errors
async validate(manifest, context) {
  // Wrong: creates new array
  const errors = [];
  errors.push({ code: 'ERROR' });
  
  // Right: adds to context
  context.errors.push({ code: 'ERROR' });
  // Or use helper
  addError(context, 'ERROR', 'section', 'message');
}
```

### Plugin Exceptions

```javascript
// Plugin errors are caught and reported
class BrokenPlugin extends ValidationPlugin {
  async validate() {
    throw new Error('Oops'); // Caught by registry
  }
}

// Check error stats
const stats = registry.getStats('broken-plugin');
console.log(stats.errors); // Number of exceptions
```

## Examples

See [`examples/custom-validator-plugin.js`](../examples/custom-validator-plugin.js) for complete working examples of:

- Company naming conventions
- Compliance validation
- Performance optimization
- Security hardening

## API Reference

### ValidationPlugin

```typescript
class ValidationPlugin {
  constructor(name: string, priority?: number)
  async validate(manifest: object, context: object): Promise<void>
  getTargetFields(): string[]
  getMetadata(): object
}
```

### PluginRegistry

```typescript
class PluginRegistry {
  register(plugin: ValidationPlugin): void
  unregister(name: string): boolean
  getPlugin(name: string): ValidationPlugin | undefined
  hasPlugin(name: string): boolean
  listPlugins(): ValidationPlugin[]
  async runAll(manifest: object, context?: object): Promise<Error[]>
  async runPlugins(names: string[], manifest: object, context?: object): Promise<Error[]>
  getPluginsForField(fieldName: string): ValidationPlugin[]
  getStats(name: string): object | undefined
  getAllStats(): Map<string, object>
  clear(): void
  export(): object
}
```

## Contributing

To add a new core validator:

1. Create plugin in `core/plugins/`
2. Export from `core/plugins/index.js`
3. Register in `core/parser.js` defaultRegistry
4. Add tests in `tests/validation-plugins.test.js`
5. Update this documentation

## License

Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions  
Licensed under Apache-2.0 License