import fs from "fs/promises";
import path from "path";
import { RegistryEntry } from "./types";

const REGISTRY_PATH = path.join(process.cwd(), "data", "registry.json");

export async function getRegistry(): Promise<RegistryEntry[]> {
  try {
    const data = await fs.readFile(REGISTRY_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

export async function saveRegistry(entries: RegistryEntry[]): Promise<void> {
  const dir = path.dirname(REGISTRY_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(REGISTRY_PATH, JSON.stringify(entries, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save registry:", error);
    throw new Error("Could not persist registry data");
  }
}
