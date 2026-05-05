import { z } from 'zod';

/**
 * ⚙️ AIX CORE CONFIGURATION
 * The central settings for the Brain Core Room.
 * 
 * Made with Moe Abdelaziz
 */

export const ConfigSchema = z.object({
  VERSION: z.string(),
  ROOMS: z.record(z.string()),
  MEMORY: z.object({
    NAMESPACE: z.string(),
    TURBOQUANT_THRESHOLD: z.number(),
    DEFAULT_TTL: z.number()
  }),
  SECURITY: z.object({
    DNA_SECRET: z.string().min(32),
    ALGO: z.string()
  })
});

const rawConfig = {
  VERSION: '1.2.0-sovereign',
  ROOMS: {
    ENGINE: 'packages/aix-agency',
    BRAIN: 'packages/aix-core',
    DNA: 'packages/aix-security',
    STUDIO: 'apps/studio'
  },
  MEMORY: {
    NAMESPACE: 'aix',
    TURBOQUANT_THRESHOLD: 5120, // 5KB
    DEFAULT_TTL: 3600 // 1 hour
  },
  SECURITY: {
    DNA_SECRET: process.env.AIX_DNA_SECRET || 'aix_dna_secret_2026_32_bytes_len_minimum',
    ALGO: 'aes-256-cbc'
  }
};

export const AIX_CONFIG = ConfigSchema.parse(rawConfig);

export type RoomName = keyof typeof AIX_CONFIG.ROOMS;

// Made with Moe Abdelaziz
