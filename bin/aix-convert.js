#!/usr/bin/env node

/**
 * AIX Format Conversion Tool
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2025
 * 
 * Convert AIX files between YAML, JSON, and TOML formats.
 * Automatically recalculates checksums after conversion.
 * 
 * Usage: aix-convert <input> <output> --format <yaml|json|toml>
 * 
 * Copyright © 2025 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under MIT License - See LICENSE.md
 */

import { AIXParser } from '../core/parser.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Parse command line arguments
const args = process.argv.slice(2);

// Display usage
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
AIX Format Conversion Tool v1.0
Created by Mohamed Abdelaziz - AMRIKYY AI Solutions

Usage:
  aix-convert <input> <output> --format <yaml|json|toml>

Options:
  --format, -f <fmt>  Target format (yaml, json, toml) [required]
  --pretty, -p        Pretty print output (JSON only)
  --help, -h          Show this help message

Examples:
  aix-convert agent.yaml agent.json --format json
  aix-convert agent.json agent.toml --format toml
  aix-convert agent.toml agent.yaml --format yaml --pretty

The tool will:
  - Parse and validate the input file
  - Convert to the target format
  - Recalculate checksums automatically
  - Preserve all data integrity
`);
  process.exit(0);
}

// Extract arguments
const inputPath = args[0];
const outputPath = args[1];
const formatIndex = args.findIndex(arg => arg === '--format' || arg === '-f');
const targetFormat = formatIndex !== -1 ? args[formatIndex + 1] : null;
const pretty = args.includes('--pretty') || args.includes('-p');

// Validate arguments
if (!inputPath || !outputPath) {
  console.error('❌ Error: Missing input or output file');
  console.error('   Usage: aix-convert <input> <output> --format <yaml|json|toml>');
  process.exit(1);
}

if (!targetFormat) {
  console.error('❌ Error: Target format not specified');
  console.error('   Use: --format <yaml|json|toml>');
  process.exit(1);
}

if (!['yaml', 'json', 'toml', 'yml'].includes(targetFormat.toLowerCase())) {
  console.error(`❌ Error: Unsupported format: ${targetFormat}`);
  console.error('   Supported formats: yaml, json, toml');
  process.exit(1);
}

// Resolve paths
const resolvedInput = resolve(inputPath);
const resolvedOutput = resolve(outputPath);

// Check if input exists
if (!existsSync(resolvedInput)) {
  console.error(`❌ Error: Input file not found: ${inputPath}`);
  process.exit(1);
}

// Parse input
const parser = new AIXParser();

try {
  console.log(`📖 Reading ${inputPath}...`);
  const agent = parser.parseFile(resolvedInput);
  
  console.log(`✅ Parsed successfully`);
  console.log(`   Agent: ${agent.meta.name}`);
  console.log(`   Format: ${parser.detectFormat(readFileSync(resolvedInput, 'utf-8'), resolvedInput)}`);
  
  // Convert to target format
  console.log(`\n🔄 Converting to ${targetFormat}...`);
  
  let output;
  const normalizedFormat = targetFormat.toLowerCase() === 'yml' ? 'yaml' : targetFormat.toLowerCase();
  
  switch (normalizedFormat) {
    case 'json':
      output = convertToJSON(agent.data, pretty);
      break;
    case 'yaml':
      output = convertToYAML(agent.data);
      break;
    case 'toml':
      output = convertToTOML(agent.data);
      break;
    default:
      throw new Error(`Unsupported format: ${targetFormat}`);
  }
  
  // Recalculate checksum
  console.log(`🔐 Recalculating checksum...`);
  const contentWithoutSecurity = removeSecuritySection(output);
  const algorithm = agent.security.checksum.algorithm || 'sha256';
  const newChecksum = parser.calculateChecksum(contentWithoutSecurity, algorithm);
  
  // Update checksum in data
  agent.data.security.checksum.value = newChecksum;
  
  // Regenerate output with new checksum
  switch (normalizedFormat) {
    case 'json':
      output = convertToJSON(agent.data, pretty);
      break;
    case 'yaml':
      output = convertToYAML(agent.data);
      break;
    case 'toml':
      output = convertToTOML(agent.data);
      break;
  }
  
  // Write output
  console.log(`💾 Writing ${outputPath}...`);
  writeFileSync(resolvedOutput, output, 'utf-8');
  
  console.log(`\n✅ Conversion successful!`);
  console.log(`   Input: ${inputPath}`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Format: ${targetFormat}`);
  console.log(`   Checksum: ${newChecksum.substring(0, 16)}...`);
  
  process.exit(0);
  
} catch (error) {
  console.error(`\n❌ Conversion failed: ${error.message}`);
  
  if (parser.errors.length > 0) {
    console.error(`\n   Validation errors:`);
    parser.errors.forEach(e => {
      console.error(`   - [${e.code}] ${e.message}`);
    });
  }
  
  process.exit(1);
}

/**
 * Convert data to JSON
 */
function convertToJSON(data, pretty = false) {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

/**
 * Convert data to YAML
 */
function convertToYAML(data, indent = 0) {
  const spaces = ' '.repeat(indent);
  let result = '';
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      continue;
    }
    
    result += `${spaces}${key}:`;
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      // Object
      result += '\n';
      result += convertToYAML(value, indent + 2);
    } else if (Array.isArray(value)) {
      // Array
      if (value.length === 0) {
        result += ' []\n';
      } else if (typeof value[0] === 'object') {
        // Array of objects
        result += '\n';
        for (const item of value) {
          result += `${spaces}  - `;
          if (typeof item === 'object' && !Array.isArray(item)) {
            // Object in array - inline simple objects
            const entries = Object.entries(item);
            if (entries.length <= 3) {
              result += entries.map(([k, v]) => `${k}: ${formatYAMLValue(v)}`).join(', ');
              result += '\n';
            } else {
              // Multi-line object
              result += '\n';
              result += convertToYAML(item, indent + 4);
            }
          } else {
            result += formatYAMLValue(item) + '\n';
          }
        }
      } else {
        // Array of primitives - inline if short
        if (value.length <= 5 && value.every(v => typeof v === 'string' && v.length < 30)) {
          result += ' ' + JSON.stringify(value) + '\n';
        } else {
          result += '\n';
          for (const item of value) {
            result += `${spaces}  - ${formatYAMLValue(item)}\n`;
          }
        }
      }
    } else if (typeof value === 'string' && (value.includes('\n') || value.length > 80)) {
      // Multi-line string
      result += ' |\n';
      const lines = value.split('\n');
      for (const line of lines) {
        result += `${spaces}  ${line}\n`;
      }
    } else {
      // Primitive value
      result += ` ${formatYAMLValue(value)}\n`;
    }
  }
  
  return result;
}

/**
 * Format YAML value
 */
function formatYAMLValue(value) {
  if (typeof value === 'string') {
    // Quote strings if they contain special characters or look like other types
    if (value === 'true' || value === 'false' || value === 'null' || 
        !isNaN(value) || value.includes(':') || value.includes('#')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (value === null) {
    return 'null';
  }
  return JSON.stringify(value);
}

/**
 * Convert data to TOML
 */
function convertToTOML(data) {
  let result = '';
  
  // Handle top-level sections
  for (const [section, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      continue;
    }
    
    result += `[${section}]\n`;
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      for (const [key, val] of Object.entries(value)) {
        if (typeof val === 'object' && !Array.isArray(val)) {
          // Nested object - use dotted key or subsection
          result += `\n[${section}.${key}]\n`;
          result += convertTOMLObject(val);
        } else {
          result += `${key} = ${formatTOMLValue(val)}\n`;
        }
      }
    } else {
      result += `value = ${formatTOMLValue(value)}\n`;
    }
    
    result += '\n';
  }
  
  return result;
}

/**
 * Convert TOML object
 */
function convertTOMLObject(obj) {
  let result = '';
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      // Skip nested objects for simplicity
      continue;
    }
    result += `${key} = ${formatTOMLValue(value)}\n`;
  }
  return result;
}

/**
 * Format TOML value
 */
function formatTOMLValue(value) {
  if (typeof value === 'string') {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (value === null) {
    return '""';
  }
  return JSON.stringify(value);
}

/**
 * Remove security section from content
 */
function removeSecuritySection(content) {
  const lines = content.split('\n');
  const filtered = [];
  let inSecurity = false;
  let securityIndent = 0;
  
  for (const line of lines) {
    if (line.trim().startsWith('security:') || line.trim().startsWith('"security"') || line.trim().startsWith('[security]')) {
      inSecurity = true;
      securityIndent = line.search(/\S/);
      continue;
    }
    
    if (inSecurity) {
      const currentIndent = line.search(/\S/);
      // Check if we're back to top-level
      if (currentIndent !== -1 && currentIndent <= securityIndent && line.trim() !== '') {
        inSecurity = false;
      }
    }
    
    if (!inSecurity) {
      filtered.push(line);
    }
  }
  
  return filtered.join('\n').trim();
}

