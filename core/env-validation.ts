/**
 * Environment Variable Validation
 * Validates all required environment variables on startup using Zod schemas
 */

import { z } from 'zod';

/**
 * Base environment schema (required in all environments)
 */
const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default(3000),
});

/**
 * API Keys schema (required in production)
 */
const apiKeysSchema = z.object({
  OPENAI_API_KEY: z.string().min(1).startsWith('sk-').optional(),
  ANTHROPIC_API_KEY: z.string().min(1).startsWith('sk-ant-').optional(),
  PI_NETWORK_API_KEY: z.string().min(1).optional(),
});

/**
 * Database schema (required in production)
 */
const databaseSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
});

/**
 * Application schema
 */
const applicationSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  API_BASE_URL: z.string().url().optional(),
});

/**
 * Security schema (required in production)
 */
const securitySchema = z.object({
  JWT_SECRET: z.string().min(32).optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
});

/**
 * Monitoring schema (optional)
 */
const monitoringSchema = z.object({
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

/**
 * Complete environment schema
 */
const envSchema = baseEnvSchema
  .merge(apiKeysSchema)
  .merge(databaseSchema)
  .merge(applicationSchema)
  .merge(securitySchema)
  .merge(monitoringSchema);

/**
 * Production-specific requirements
 */
const productionRequirements = z.object({
  OPENAI_API_KEY: z.string().min(1).startsWith('sk-'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  NEXT_PUBLIC_API_URL: z.string().url(),
});

/**
 * Staging-specific requirements
 */
const stagingRequirements = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

/**
 * Validated environment type
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validation result
 */
export interface ValidationResult {
  success: boolean;
  env?: Env;
  errors?: string[];
  warnings?: string[];
}

/**
 * Validate environment variables
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Parse base environment
    const env = envSchema.parse(process.env);

    // Check environment-specific requirements
    if (env.NODE_ENV === 'production') {
      try {
        productionRequirements.parse(process.env);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach((err: any) => {
            errors.push(`[PRODUCTION] ${err.path.join('.')}: ${err.message}`);
          });
        }
      }
    }

    if (env.NODE_ENV === 'staging') {
      try {
        stagingRequirements.parse(process.env);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach((err: any) => {
            warnings.push(`[STAGING] ${err.path.join('.')}: ${err.message}`);
          });
        }
      }
    }

    // Additional validation checks
    if (env.NODE_ENV === 'production') {
      // Check for development-only values
      if (env.NEXT_PUBLIC_API_URL?.includes('localhost')) {
        errors.push('NEXT_PUBLIC_API_URL cannot contain localhost in production');
      }

      // Check for weak secrets
      if (env.JWT_SECRET && env.JWT_SECRET.length < 64) {
        warnings.push('JWT_SECRET should be at least 64 characters in production');
      }
    }

    // Check for missing optional but recommended vars
    if (!env.REDIS_URL) {
      warnings.push('REDIS_URL not set - caching will be disabled');
    }

    if (!env.SENTRY_DSN && env.NODE_ENV === 'production') {
      warnings.push('SENTRY_DSN not set - error tracking will be disabled');
    }

    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    return { success: true, env, warnings };

  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: any) => {
        errors.push(`${err.path.join('.')}: ${err.message}`);
      });
    } else {
      errors.push(`Unexpected error: ${error}`);
    }

    return { success: false, errors, warnings };
  }
}

/**
 * Validate and exit on failure
 */
export function validateEnvOrExit(): Env {
  const result = validateEnv();

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    result.errors?.forEach(error => {
      console.error(`  - ${error}`);
    });
    process.exit(1);
  }

  if (result.warnings && result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    result.warnings.forEach(warning => {
      console.warn(`  - ${warning}`);
    });
  }

  console.log('✅ Environment variables validated successfully');
  return result.env!;
}

/**
 * Get typed environment variable
 */
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  const result = validateEnv();
  if (!result.success || !result.env) {
    throw new Error(`Environment not validated. Call validateEnv() first.`);
  }
  return result.env[key];
}

/**
 * Check if environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if environment is development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if environment is test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Get secret with audit logging
 */
export function getSecret(key: string): string {
  const value = process.env[key];
  
  if (!value) {
    const error = new Error(`Missing secret: ${key}`);
    console.error('❌ Secret access failed:', {
      key,
      timestamp: new Date().toISOString(),
      stack: error.stack?.split('\n')[2]?.trim()
    });
    throw error;
  }

  // Log access (without the value)
  console.info('🔐 Secret accessed:', {
    key,
    timestamp: new Date().toISOString(),
    caller: new Error().stack?.split('\n')[2]?.trim()
  });

  return value;
}

/**
 * Mask sensitive value for logging
 */
export function maskSecret(value: string): string {
  if (value.length <= 8) {
    return '***';
  }
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
}

/**
 * Export environment for debugging (with masked secrets)
 */
export function exportEnvForDebug(): Record<string, string> {
  const result = validateEnv();
  if (!result.success || !result.env) {
    return {};
  }

  const sensitiveKeys = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'PI_NETWORK_API_KEY',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'SESSION_SECRET',
    'DATABASE_URL',
  ];

  const debug: Record<string, string> = {};
  
  Object.entries(result.env).forEach(([key, value]) => {
    if (sensitiveKeys.includes(key) && typeof value === 'string') {
      debug[key] = maskSecret(value);
    } else {
      debug[key] = String(value);
    }
  });

  return debug;
}

/**
 * Usage examples:
 * 
 * // Validate on app startup
 * const env = validateEnvOrExit();
 * 
 * // Get specific env var
 * const apiKey = getEnv('OPENAI_API_KEY');
 * 
 * // Get secret with audit logging
 * const jwtSecret = getSecret('JWT_SECRET');
 * 
 * // Check environment
 * if (isProduction()) {
 *   // Production-only code
 * }
 * 
 * // Export for debugging
 * console.log(exportEnvForDebug());
 */

// Made with Bob
