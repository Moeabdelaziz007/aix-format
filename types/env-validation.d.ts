/**
 * Environment Variable Validation
 * Validates all required environment variables on startup using Zod schemas
 */
import { z } from 'zod';
/**
 * Complete environment schema
 */
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        staging: "staging";
        production: "production";
        test: "test";
    }>>;
    PORT: z.ZodDefault<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>;
    OPENAI_API_KEY: z.ZodOptional<z.ZodString>;
    ANTHROPIC_API_KEY: z.ZodOptional<z.ZodString>;
    PI_NETWORK_API_KEY: z.ZodOptional<z.ZodString>;
    DATABASE_URL: z.ZodOptional<z.ZodString>;
    REDIS_URL: z.ZodOptional<z.ZodString>;
    NEXT_PUBLIC_API_URL: z.ZodOptional<z.ZodString>;
    API_BASE_URL: z.ZodOptional<z.ZodString>;
    JWT_SECRET: z.ZodOptional<z.ZodString>;
    ENCRYPTION_KEY: z.ZodOptional<z.ZodString>;
    SESSION_SECRET: z.ZodOptional<z.ZodString>;
    SENTRY_DSN: z.ZodOptional<z.ZodString>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<{
        error: "error";
        debug: "debug";
        info: "info";
        warn: "warn";
    }>>;
}, z.core.$strip>;
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
export declare function validateEnv(): ValidationResult;
/**
 * Validate and exit on failure
 */
export declare function validateEnvOrExit(): Env;
/**
 * Get typed environment variable
 */
export declare function getEnv<K extends keyof Env>(key: K): Env[K];
/**
 * Check if environment is production
 */
export declare function isProduction(): boolean;
/**
 * Check if environment is development
 */
export declare function isDevelopment(): boolean;
/**
 * Check if environment is test
 */
export declare function isTest(): boolean;
/**
 * Get secret with audit logging
 */
export declare function getSecret(key: string): string;
/**
 * Mask sensitive value for logging
 */
export declare function maskSecret(value: string): string;
/**
 * Export environment for debugging (with masked secrets)
 */
export declare function exportEnvForDebug(): Record<string, string>;
export {};
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
