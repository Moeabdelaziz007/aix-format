/**
 * AIX Error Handler - Production-Grade Retry & Circuit Breaker
 * Created by Mohamed H Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Implements production-grade error handling including:
 * - Retry logic with exponential/linear/constant backoff
 * - Circuit breaker pattern (Hystrix-style)
 * - RFC 7807 error formatting
 * - Security-first approach with Zod validation
 * - Cryptographically secure request IDs
 *
 * Research backing:
 * - Netflix Hystrix (2012): Circuit breaker pattern for microservices
 * - AWS Well-Architected Framework: Exponential backoff with jitter
 * - Google SRE Book: Error budgets and graceful degradation
 *
 * Copyright © 2026 Mohamed H Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */
import { z } from 'zod';
/**
 * RULE 1: All inputs → Zod validation
 */
declare const ErrorContextSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    agentId: z.ZodOptional<z.ZodString>;
    action: z.ZodOptional<z.ZodString>;
    requestId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    agentId?: string | undefined;
    action?: string | undefined;
    requestId?: string | undefined;
}, {
    code?: string | undefined;
    agentId?: string | undefined;
    action?: string | undefined;
    requestId?: string | undefined;
}>;
type ErrorContext = z.infer<typeof ErrorContextSchema>;
interface SafeError {
    message: string;
    requestId: string;
    context: ErrorContext;
    stack?: string;
}
/**
 * Circuit Breaker Configuration Schema
 */
declare const CircuitBreakerConfigSchema: z.ZodObject<{
    failureThreshold: z.ZodOptional<z.ZodNumber>;
    successThreshold: z.ZodOptional<z.ZodNumber>;
    timeoutSeconds: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    failureThreshold: z.ZodOptional<z.ZodNumber>;
    successThreshold: z.ZodOptional<z.ZodNumber>;
    timeoutSeconds: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    failureThreshold: z.ZodOptional<z.ZodNumber>;
    successThreshold: z.ZodOptional<z.ZodNumber>;
    timeoutSeconds: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
type CircuitBreakerConfig = z.infer<typeof CircuitBreakerConfigSchema>;
/**
 * Circuit Breaker Implementation
 *
 * Implements the circuit breaker pattern to prevent cascading failures.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failing, reject all requests immediately
 * - HALF_OPEN: Testing recovery, allow limited requests
 */
export declare class CircuitBreaker {
    private config;
    private state;
    private failures;
    private successes;
    private nextAttemptTime;
    constructor(config?: CircuitBreakerConfig);
    /**
     * Record successful operation
     */
    recordSuccess(): void;
    /**
     * Record failed operation
     */
    recordFailure(): void;
    /**
     * Open the circuit breaker
     */
    private open;
    /**
     * Close the circuit breaker
     */
    private close;
    /**
     * Check if circuit breaker is open
     *
     * @returns True if open (rejecting requests)
     */
    isOpen(): boolean;
    /**
     * Get current circuit breaker state
     *
     * @returns State information
     */
    getState(): {
        state: string;
        failures: number;
        successes: number;
        nextAttempt: string | null;
        config: Required<CircuitBreakerConfig>;
    };
}
/**
 * Custom Error Classes
 */
export declare class CircuitBreakerError extends Error {
    readonly details: Record<string, unknown>;
    readonly timestamp: string;
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class MaxRetriesExceededError extends Error {
    readonly details: Record<string, unknown>;
    readonly timestamp: string;
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class TimeoutError extends Error {
    readonly timestamp: string;
    constructor(message: string);
}
/**
 * RULE 0: Security First - Handle errors with security in mind
 * RULE 1: All inputs → Zod validation
 * RULE 2: crypto.randomBytes for requestId (NO Math.random)
 *
 * @param error - The error to handle (unknown type for safety)
 * @param context - Optional context information
 * @returns SafeError object with sanitized information
 */
export declare function handleError(error: unknown, context?: unknown): SafeError;
export {};
