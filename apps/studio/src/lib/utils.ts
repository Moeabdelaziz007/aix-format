import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Lightweight, zero-dependency YAML parser optimized for AIX manifests.
 * Supports nested objects, lists, and block scalars (|).
 */
export function parseYamlLight(content: string): any {
  const lines = content.split('\n');
  const result: any = {};
  const stack: { obj: any; indent: number }[] = [{ obj: result, indent: -1 }];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed || trimmed.startsWith('#')) {
      i++;
      continue;
    }
    
    const indent = line.search(/\S/);
    
    // Pop stack if indent decreases
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    
    const current = stack[stack.length - 1].obj;
    const colonIndex = trimmed.indexOf(':');
    
    if (colonIndex !== -1) {
      const key = trimmed.substring(0, colonIndex).trim();
      let value = trimmed.substring(colonIndex + 1).trim();
      
      // Multi-line block scalar |
      if (value === '|') {
        let blockValue = '';
        i++;
        // Find first non-empty line to determine block indentation
        let blockIndent = -1;
        let lookAhead = i;
        while (lookAhead < lines.length && blockIndent === -1) {
          if (lines[lookAhead].trim() !== '') {
            blockIndent = lines[lookAhead].search(/\S/);
          }
          lookAhead++;
        }
        
        if (blockIndent === -1) blockIndent = indent + 2;

        while (i < lines.length && (lines[i].trim() === '' || lines[i].search(/\S/) >= blockIndent)) {
          if (lines[i].trim() === '') {
            blockValue += '\n';
          } else {
            blockValue += lines[i].substring(blockIndent) + '\n';
          }
          i++;
        }
        current[key] = blockValue.trimEnd();
        continue;
      } else if (value === '' && i + 1 < lines.length) {
        // Nested object or array
        const nextIndent = lines[i + 1].search(/\S/);
        if (nextIndent > indent) {
          const isArray = lines[i + 1].trim().startsWith('- ');
          current[key] = isArray ? [] : {};
          stack.push({ obj: current[key], indent: indent });
        } else {
          current[key] = null;
        }
      } else {
        current[key] = parseYamlValue(value);
      }
    } else if (trimmed.startsWith('- ')) {
      const value = trimmed.substring(2).trim();
      if (Array.isArray(current)) {
        current.push(parseYamlValue(value));
      }
    }
    i++;
  }
  return result;
}

function parseYamlValue(v: string): any {
  const trimmed = v.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null' || trimmed === '~') return null;
  if (!isNaN(Number(trimmed)) && trimmed !== '') return Number(trimmed);
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.substring(1, trimmed.length - 1);
  }
  return trimmed;
}

/**
 * Lightweight, zero-dependency YAML stringifier.
 */
export function stringifyYamlLight(data: any, indent = 0): string {
  if (data === null) return 'null';
  if (typeof data === 'string') {
    if (data.includes('\n')) {
      const spaces = '  '.repeat(indent + 1);
      return '|' + data.split('\n').map(l => '\n' + spaces + l).join('');
    }
    return data;
  }
  if (typeof data !== 'object') return String(data);
  
  let yaml = '';
  const spaces = '  '.repeat(indent);
  
  if (Array.isArray(data)) {
    for (const item of data) {
      const val = stringifyYamlLight(item, indent + 1).trim();
      yaml += `${spaces}- ${val}\n`;
    }
  } else {
    for (const key in data) {
      const val = data[key];
      if (typeof val === 'object' && val !== null) {
        yaml += `${spaces}${key}:\n${stringifyYamlLight(val, indent + 1)}`;
      } else {
        yaml += `${spaces}${key}: ${stringifyYamlLight(val, indent + 1)}\n`;
      }
    }
  }
  return yaml;
}

export async function parseYamlSafe(content: string): Promise<Record<string, unknown>> {
  try {
    return parseYamlLight(content);
  } catch (error) {
    console.error("YAML Parse Error:", error);
    throw error;
  }
}

export async function stringifyYamlSafe(data: unknown): Promise<string> {
  try {
    return stringifyYamlLight(data);
  } catch (error) {
    console.error("YAML Stringify Error:", error);
    return "# Error generating YAML\n" + (error as Error).message;
  }
}


/**
 * Generates a SHA-256 hex hash of the given string.
 * Used for ABOM integrity verification.
 */
export async function sha256Hex(content: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Computes a canonical SHA-256 checksum for a manifest.
 */
export function computeManifestChecksum(manifest: any): string {
  // Simple canonicalization: sort top-level keys
  const canonical = JSON.stringify(manifest, Object.keys(manifest).sort());
  const bytes = new TextEncoder().encode(canonical);
  return bytesToHex(sha256(bytes));
}
