import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPiEnv } from '../src/env.js';

describe('env', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return env when PI_API_KEY is present', () => {
    process.env.PI_API_KEY = 'test-key';
    process.env.PI_ENVIRONMENT = 'production';
    const env = getPiEnv();
    expect(env.PI_API_KEY).toBe('test-key');
    expect(env.PI_ENVIRONMENT).toBe('production');
  });

  it('should throw when PI_API_KEY is missing', () => {
    delete process.env.PI_API_KEY;
    expect(() => getPiEnv()).toThrow('PI_API_KEY is required');
  });

  it('should default PI_ENVIRONMENT to sandbox', () => {
    process.env.PI_API_KEY = 'test-key';
    delete process.env.PI_ENVIRONMENT;
    const env = getPiEnv();
    expect(env.PI_ENVIRONMENT).toBe('sandbox');
  });
});
