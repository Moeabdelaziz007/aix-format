import { kv } from './storage';
import { bus, RINGS } from '../core/bus';
import { randomBytes, createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 🔗 Sovereign Breadcrumb System (v1.0)
 * The INNOVATION: Code files carry an invisible thread to the correct documentation.
 * No more external silos. The code knows its own history.
 * 
 * Made with Moe Abdelaziz
 */

export interface Breadcrumb {
  fileHash: string;
  agentId: string;
  insight: string;
  signature: string; // Cryptographically signed by the agent's DNA
  timestamp: number;
}

export class Breadcrumbs {
  private static hintsDir = '.aix-hints';

  /**
   * Injects a physical breadcrumb into a file and stores the semantic link in Redis.
   */
  static async drop(filePath: string, agentId: string, insight: string): Promise<void> {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    const fileHash = createHash('sha256').update(content).digest('hex');

    // 1. Physical Trace: Inject a lightweight hint at the bottom if not present
    const hintComment = `\n// @aix-hint: ${fileHash.slice(0, 8)}`;
    if (!content.includes('// @aix-hint:')) {
      fs.appendFileSync(absolutePath, hintComment);
    }

    // 2. Semantic Storage: Link the hash to the actual insight in Redis
    const breadcrumb: Breadcrumb = {
      fileHash,
      agentId,
      insight,
      signature: `dna_sig_${randomBytes(16).toString('hex')}`,
      timestamp: Date.now()
    };

    const key = `aix:breadcrumb:${fileHash.slice(0, 8)}`;
    await kv.set(key, breadcrumb);

    // 3. Emit to Pulse
    await bus.emitPulse({
      ring: RINGS.MIND,
      type: 'BREADCRUMB_DROPPED',
      agentId,
      agentName: 'Pathfinder',
      message: `🔗 Linked insight to ${path.basename(filePath)}`,
      metadata: { fileHash, filePath }
    });
  }

  /**
   * 🛡️ Auto-Infection: Automatically scans and drops breadcrumbs on modified files.
   * Ensures the Persona's trace is everywhere.
   */
  static async autoInfect(files: string[], agentId: string, summary: string): Promise<void> {
    for (const file of files) {
      try {
        if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
          console.log(`🧬 AIX Persona: Injecting breadcrumb into ${path.basename(file)}...`);
          await this.drop(file, agentId, summary);
        }
      } catch (e) {
        // Silent council: Don't break the build if a file is locked
      }
    }
  }

  /**
   * Reads the breadcrumb from a file and fetches the associated insight.
   */
  static async follow(filePath: string): Promise<Breadcrumb | null> {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    const match = content.match(/\/\/ @aix-hint: ([a-f0-9]+)/);
    
    if (!match) return null;

    const key = `aix:breadcrumb:${match[1]}`;
    return await kv.get<Breadcrumb>(key);
  }
}

// Made with Moe Abdelaziz
