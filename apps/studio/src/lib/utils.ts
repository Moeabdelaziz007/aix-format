import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function parseYamlLight(str: string): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  const lines = str.split("\n");
  for (const line of lines) {
    if (line.includes(":")) {
      const parts = line.split(":");
      obj[parts[0].trim()] = parts.slice(1).join(":").trim();
    }
  }
  return obj;
}
