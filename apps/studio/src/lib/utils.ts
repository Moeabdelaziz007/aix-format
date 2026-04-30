import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse YAML string using js-yaml with dynamic import.
 * This ensures js-yaml is only loaded in the browser when needed.
 */
export async function parseYamlSafe(content: string): Promise<Record<string, unknown>> {
  try {
    const yaml = await import("js-yaml");
    return yaml.load(content, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown>;
  } catch (error) {
    console.error("YAML Parse Error:", error);
    throw error;
  }
}

/**
 * Safely stringify object to YAML using js-yaml with dynamic import.
 */
export async function stringifyYamlSafe(data: unknown): Promise<string> {
  try {
    const yaml = await import("js-yaml");
    return yaml.dump(data, { indent: 2, lineWidth: -1 });
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
