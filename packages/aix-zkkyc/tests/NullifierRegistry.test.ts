import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NullifierRegistry, ProofReplayError } from '../src/NullifierRegistry';

// Mock fetch for Upstash Redis
global.fetch = vi.fn();

describe('NullifierRegistry', () => {
    let registry: NullifierRegistry;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        // Clear process.env for these tests
        process.env.UPSTASH_REDIS_REST_URL = '';
        process.env.UPSTASH_REDIS_REST_TOKEN = '';
        registry = new NullifierRegistry(1000); // 1 second TTL
    });

    afterEach(() => {
        registry.dispose();
        vi.useRealTimers();
    });

    it('should register and check nullifier in-memory', async () => {
        const hash = 'test-hash-1';
        await registry.registerNullifier(hash, 'agent-1', Date.now());
        const isNullified = await registry.isNullified(hash);
        expect(isNullified).toBe(true);
    });

    it('should expire nullifiers based on TTL (in-memory)', async () => {
        const hash = 'test-hash-2';
        await registry.registerNullifier(hash, 'agent-2', Date.now());

        // Advance time past TTL
        vi.advanceTimersByTime(1500);

        const isNullified = await registry.isNullified(hash);
        expect(isNullified).toBe(false);
    });

    it('should prune expired nullifiers', async () => {
        const hash = 'test-hash-3';
        await registry.registerNullifier(hash, 'agent-3', Date.now());

        // Advance time past TTL
        vi.advanceTimersByTime(1500);

        // Prune
        registry.pruneExpired();

        // Ensure it's not in store anymore
        const isNullified = await registry.isNullified(hash);
        expect(isNullified).toBe(false);
    });

    it('should use Redis if configured', async () => {
        process.env.UPSTASH_REDIS_REST_URL = 'http://redis-mock';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

        registry = new NullifierRegistry(1000); // Create a new one with env vars

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ result: "OK" })
        });

        await registry.registerNullifier('test-hash-redis', 'agent-redis', Date.now());

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/set/zkkyc:null:test-hash-redis'),
            expect.objectContaining({ method: 'POST' })
        );

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ result: '{"agentId":"agent-redis"}' })
        });

        // Fast forward so memory expires, triggering redis check
        vi.advanceTimersByTime(1500);

        const isNullified = await registry.isNullified('test-hash-redis');
        expect(isNullified).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/get/zkkyc:null:test-hash-redis'),
            expect.anything()
        );
    });

    it('should fallback to in-memory if Redis fetch fails', async () => {
        process.env.UPSTASH_REDIS_REST_URL = 'http://redis-mock';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

        registry = new NullifierRegistry(1000);

        // Mock Redis failure
        (global.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

        // This should still save to memory despite Redis failing
        await registry.registerNullifier('test-hash-fallback', 'agent-fallback', Date.now());

        // Memory check should succeed
        const isNullified = await registry.isNullified('test-hash-fallback');
        expect(isNullified).toBe(true);
    });
});
