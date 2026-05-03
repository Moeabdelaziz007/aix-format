/**
 * AIX Pet Mini Apps - Autonomous Agent Skills
 * 
 * Each Pet is an autonomous agent that:
 * 1. Runs on a cron schedule
 * 2. Publishes results to the event bus
 * 3. Has its own UI widget
 * 4. Adapts behavior based on mood (τ threshold)
 * 
 * Architecture:
 * ```
 * PetAgent
 *   ├── mood engine  (ecstatic → τ=0.9)   ← affects quality
 *   ├── skill runner (cron-based)          ← autonomous execution
 *   ├── bus.emit() results                 ← publishes to system
 *   └── UI widget   (mini app)            ← real-time dashboard
 * ```
 */

export interface PetSkill {
  id: string;
  name: string;
  description: string;
  cronSchedule: string;  // e.g., "*/1 * * * *" for every minute
  execute: (agentId: string, mood: string) => Promise<PetSkillResult>;
  eventType: string;     // e.g., "pet.chrono.alarm"
}

export interface PetSkillResult {
  success: boolean;
  data: any;
  message: string;
  timestamp: number;
}

export interface PetMiniApp {
  petId: string;
  petName: string;
  emoji: string;
  skills: PetSkill[];
  widgetComponent: string;  // React component name
}

// Export all pet mini apps
export * from './chrono';
export * from './volt';
export * from './shade';
export * from './bull';
export * from './drop';
export * from './sage';
export * from './guardian';
export * from './muse';

// Made with Moe Abdelaziz
